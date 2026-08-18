// Called right after a public applicant submits the /apply form. Matches
// what the old Google Form did automatically: every application lands in
// one running Sheet, and the video is copied into Drive so Ella can open
// and watch it straight from the Sheet row, no separate login needed.
// Public/unauthenticated by design (applicants aren't signed in) — it only
// ever appends, never returns or exposes any existing data, so the worst a
// bad actor gets from hitting it directly is one junk row.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets";

function b64url(bytes: Uint8Array | string) {
  const raw = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}
async function googleAccessToken(saJson: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: saJson.client_email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(saJson.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Google auth failed: " + JSON.stringify(data));
  return data.access_token as string;
}

async function findOrCreateFolder(token: string, parentId: string, name: string) {
  const q = encodeURIComponent(`name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.files?.length) return data.files[0].id as string;
  const create = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  const created = await create.json();
  if (!create.ok) throw new Error("Folder create failed: " + JSON.stringify(created));
  return created.id as string;
}

async function getOrCreateSheet(admin: ReturnType<typeof createClient>, token: string, rootFolderId: string) {
  const { data: existing } = await admin.from("app_settings").select("value").eq("key", "applicants_sheet_id").maybeSingle();
  if (existing?.value) return existing.value as string;

  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { title: "Creator Applicants" },
      sheets: [{ data: [{ rowData: [{ values: ["Submitted", "Full name", "Email", "WhatsApp number", "Has camera?", "Editing skills?", "Location", "Video"].map((v) => ({ userEnteredValue: { stringValue: v } })) }] }] }],
    }),
  });
  const sheet = await createRes.json();
  if (!createRes.ok) throw new Error("Sheet create failed: " + JSON.stringify(sheet));
  await fetch(`https://www.googleapis.com/drive/v3/files/${sheet.spreadsheetId}?addParents=${rootFolderId}&removeParents=root`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
  await admin.from("app_settings").upsert({ key: "applicants_sheet_id", value: sheet.spreadsheetId });
  return sheet.spreadsheetId as string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = await req.json();
    const { fullName, email, phone, hasCamera, hasEditingSkills, locationCity, videoStoragePath } = body || {};
    if (!fullName || !email) return new Response(JSON.stringify({ error: "fullName and email are required" }), { status: 400 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: saJsonText } = await admin.rpc("get_drive_service_account");
    const token = await googleAccessToken(JSON.parse(saJsonText as string));

    const { data: rootRow } = await admin.from("app_settings").select("value").eq("key", "tdt_root_folder_id").maybeSingle();
    const rootFolderId = rootRow?.value as string;

    let videoLink = "";
    if (videoStoragePath) {
      const { data: fileBlob, error: dlErr } = await admin.storage.from("applicant-videos").download(videoStoragePath);
      if (!dlErr && fileBlob) {
        const bytes = new Uint8Array(await fileBlob.arrayBuffer());
        const videosFolder = await findOrCreateFolder(token, rootFolderId, "Applicant Videos");
        const boundary = "smithstem-" + crypto.randomUUID();
        const meta = JSON.stringify({ name: `${fullName} - ${videoStoragePath.split("/").pop()}`, parents: [videosFolder] });
        const head = new TextEncoder().encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`);
        const tail = new TextEncoder().encode(`\r\n--${boundary}--`);
        const uploadBody = new Uint8Array(head.length + bytes.length + tail.length);
        uploadBody.set(head, 0); uploadBody.set(bytes, head.length); uploadBody.set(tail, head.length + bytes.length);
        const upRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
          method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body: uploadBody,
        });
        const upData = await upRes.json();
        if (upRes.ok) videoLink = `https://drive.google.com/file/d/${upData.id}/view`;
      }
    }

    const sheetId = await getOrCreateSheet(admin, token, rootFolderId);
    const row = [
      new Date().toISOString().slice(0, 16).replace("T", " "), fullName, email, phone || "",
      hasCamera ? "Yes" : "No", hasEditingSkills ? "Yes" : "No", locationCity || "", videoLink,
    ];
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:H:append?valueInputOption=RAW`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

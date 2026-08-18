// Called once, right after a creator finishes onboarding. Two jobs:
//   1. Copy their signed contract into the business's real SIGNED CONTRACTS
//      Drive folder (the one Smith and Ella already use — not a new one).
//   2. Append their details to the business's real "UGC/Creator DATABASE"
//      Google Doc, in the same numbered-entry format that doc already uses.
//
// Firm rule, per direct instruction: social-media login/passwords are sent
// straight through to Google Docs and are NEVER written to this app's own
// Postgres database — not logged, not stored, only relayed. If a business
// has no database doc yet (Aura, at launch), one is created in its DATABASE
// folder and the id is saved back onto the business row for next time.
import { createClient } from "jsr:@supabase/supabase-js@2";

const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents";
const BIZ_LABEL: Record<string, string> = { northquest: "NQ", cashdrive: "CashDrive", aura: "Aura" };

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

// Signs a service-account JWT and exchanges it for a Drive+Docs access
// token — the standard Google server-to-server flow, done by hand with
// Web Crypto so this function has zero external auth dependencies.
async function googleAccessToken(saJson: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: saJson.client_email, scope: DRIVE_SCOPES, aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToDer(saJson.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)));
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Google auth failed: " + JSON.stringify(data));
  return data.access_token as string;
}

async function uploadContractToDrive(token: string, folderId: string, fileName: string, bytes: Uint8Array, mimeType: string) {
  const boundary = "smithstem-" + crypto.randomUUID();
  const meta = JSON.stringify({ name: fileName, parents: [folderId] });
  const parts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ];
  const head = new TextEncoder().encode(parts.join(""));
  const tail = new TextEncoder().encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0); body.set(bytes, head.length); body.set(tail, head.length + bytes.length);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error("Drive upload failed: " + (await res.text()));
  return res.json();
}

async function createDatabaseDoc(token: string, title: string, folderId: string) {
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) throw new Error("Doc create failed: " + (await createRes.text()));
  const doc = await createRes.json();
  const moveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${doc.documentId}?addParents=${folderId}&removeParents=root`,
    { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!moveRes.ok) throw new Error("Doc move failed: " + (await moveRes.text()));
  return doc.documentId as string;
}

// Finds where to append (end of the document body) and what number the new
// entry should carry, by reading the highest "N." already used — matching
// the manual numbering convention already in every real database doc.
async function nextEntrySlot(token: string, docId: string) {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Doc read failed: " + (await res.text()));
  const doc = await res.json();
  const content = doc.body?.content || [];
  let text = "";
  for (const el of content) {
    for (const pe of el.paragraph?.elements || []) {
      if (pe.textRun?.content) text += pe.textRun.content;
    }
  }
  let maxNum = 0;
  for (const m of text.matchAll(/^(\d+)\./gm)) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  const endIndex = content.length ? content[content.length - 1].endIndex : 1;
  return { nextNum: maxNum + 1, insertAt: Math.max(1, endIndex - 1), hasContent: text.trim().length > 0 };
}

function buildEntryBlock(nextNum: number, label: string, d: Record<string, string>) {
  const lines = [
    `${nextNum}. ${d.fullName}`,
    "",
    `Full name: ${d.fullName}`,
    `Personal Email: ${d.email || ""}`,
    `Phone number: ${d.phone || ""}`,
  ];
  if (d.appEmail || d.appEmailPassword) {
    lines.push(`${label} Gmail: ${d.appEmail || ""}`, `${label} Gmail password: ${d.appEmailPassword || ""}`);
  }
  if (d.instagramHandle || d.instagramPassword) {
    lines.push(`${label} Instagram handle: ${d.instagramHandle || ""}`, `${label} Instagram password: ${d.instagramPassword || ""}`);
  }
  if (d.tiktokHandle || d.tiktokPassword) {
    lines.push(`${label} TikTok Handle: ${d.tiktokHandle || ""}`, `${label} TikTok password: ${d.tiktokPassword || ""}`);
  }
  lines.push(
    `Bank account name: ${d.acctName || ""}`,
    `Account number: ${d.acctNum || ""}`,
    `Bank name: ${d.bankName || ""}`,
    "━".repeat(50)
  );
  return lines.join("\n") + "\n";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    const { creatorId, contractStoragePath, appEmail, appEmailPassword, instagramHandle, instagramPassword, tiktokHandle, tiktokPassword } = body || {};
    if (!creatorId) return new Response(JSON.stringify({ error: "creatorId is required" }), { status: 400 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: creator, error: creatorErr } = await admin.from("creators")
      .select("id, profile_id, business_id, bank_name, acct_num, acct_name")
      .eq("id", creatorId).maybeSingle();
    if (creatorErr || !creator) return new Response(JSON.stringify({ error: "Creator not found" }), { status: 404 });
    if (creator.profile_id !== user.id) return new Response(JSON.stringify({ error: "Not your account" }), { status: 403 });

    const { data: profile } = await admin.from("profiles").select("full_name, phone, email").eq("id", creator.profile_id).maybeSingle();
    const { data: business } = await admin.from("businesses")
      .select("id, slug, name, drive_signed_contracts_folder_id, drive_database_doc_id, drive_database_folder_id")
      .eq("id", creator.business_id).maybeSingle();
    if (!business) return new Response(JSON.stringify({ error: "Business not found" }), { status: 404 });

    const { data: saJsonText, error: vaultErr } = await admin.rpc("get_drive_service_account");
    if (vaultErr || !saJsonText) throw new Error("Google Drive credentials are not configured");
    const saJson = JSON.parse(saJsonText);
    const token = await googleAccessToken(saJson);

    const results: Record<string, unknown> = {};

    if (contractStoragePath && business.drive_signed_contracts_folder_id) {
      const { data: fileBlob, error: dlErr } = await admin.storage.from("contracts").download(contractStoragePath);
      if (dlErr) throw new Error("Could not read the contract from storage: " + dlErr.message);
      const bytes = new Uint8Array(await fileBlob.arrayBuffer());
      const fileName = `${profile?.full_name || "Creator"} - Signed Contract.png`;
      results.contract = await uploadContractToDrive(token, business.drive_signed_contracts_folder_id, fileName, bytes, "image/png");
    }

    const hasSocials = appEmail || appEmailPassword || instagramHandle || instagramPassword || tiktokHandle || tiktokPassword;
    if (hasSocials || profile) {
      let docId = business.drive_database_doc_id as string | null;
      if (!docId) {
        if (!business.drive_database_folder_id) throw new Error("No DATABASE folder configured for this business yet");
        docId = await createDatabaseDoc(token, `${business.name} UGC/Creator DATABASE`, business.drive_database_folder_id);
        await admin.from("businesses").update({ drive_database_doc_id: docId }).eq("id", business.id);
      }
      const slot = await nextEntrySlot(token, docId);
      const label = BIZ_LABEL[business.slug] || business.name;
      const block = buildEntryBlock(slot.nextNum, label, {
        fullName: profile?.full_name || "", email: profile?.email || "", phone: profile?.phone || "",
        appEmail, appEmailPassword, instagramHandle, instagramPassword, tiktokHandle, tiktokPassword,
        bankName: creator.bank_name, acctNum: creator.acct_num, acctName: creator.acct_name,
      });
      const text = slot.hasContent ? "\n" + block : block;
      const bu = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [{ insertText: { location: { index: slot.insertAt }, text } }] }),
      });
      if (!bu.ok) throw new Error("Doc append failed: " + (await bu.text()));
      results.database = { docId, entryNumber: slot.nextNum };
    }

    return new Response(JSON.stringify({ ok: true, ...results }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

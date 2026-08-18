// Runs once per business, right after that business's weekly check-in gate
// closes (northquest/cashdrive: 1st/8th/15th/22nd/29th of the month; aura:
// every Monday — see businesses.gate_anchor). Collates the self-reported
// view numbers creators already logged that week and drops one Sheet into
// ANALYTICS/<Month Year>/ in the business's real Drive folder.
//
// Invoked by pg_cron, not a signed-in user — checked with a shared secret
// (kept in Vault) instead of a user JWT, so this is deployed with
// verify_jwt off.
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

// Mirrors lib/domain.js gateBoundary — the block that just closed, as of
// "yesterday" relative to when this runs (crons fire the morning after).
function periodFor(anchor: string, now: Date) {
  const y = new Date(now); y.setUTCDate(now.getUTCDate() - 1);
  if (anchor === "weekly_monday") {
    const isoDay = y.getUTCDay() === 0 ? 7 : y.getUTCDay();
    const start = new Date(y); start.setUTCDate(y.getUTCDate() - (isoDay - 1));
    const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6);
    return { start, end };
  }
  const dom = y.getUTCDate();
  const blockStartDay = Math.floor((dom - 1) / 7) * 7 + 1;
  const start = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), blockStartDay));
  const lastOfMonth = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth() + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), Math.min(blockStartDay + 6, lastOfMonth)));
  return { start, end };
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const humanRange = (start: Date, end: Date) =>
  `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}–${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

async function findOrCreateMonthFolder(token: string, parentId: string, monthLabel: string) {
  const q = encodeURIComponent(`name='${monthLabel}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.files?.length) return data.files[0].id as string;
  const create = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: monthLabel, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  const created = await create.json();
  if (!create.ok) throw new Error("Month folder create failed: " + JSON.stringify(created));
  return created.id as string;
}

async function writeSheet(token: string, title: string, folderId: string, rows: string[][]) {
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties: { title } }),
  });
  const sheet = await createRes.json();
  if (!createRes.ok) throw new Error("Sheet create failed: " + JSON.stringify(sheet));
  const moveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${sheet.spreadsheetId}?addParents=${folderId}&removeParents=root`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}` },
  });
  if (!moveRes.ok) throw new Error("Sheet move failed: " + (await moveRes.text()));
  const putRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/A1?valueInputOption=RAW`, {
    method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
  });
  if (!putRes.ok) throw new Error("Sheet write failed: " + (await putRes.text()));
  return sheet.spreadsheetId as string;
}

async function collateBusiness(admin: ReturnType<typeof createClient>, token: string, business: Record<string, unknown>) {
  const anchor = (business.gate_anchor as string) || "calendar_month";
  const { start, end } = periodFor(anchor, new Date());
  const periodStart = iso(start), periodEnd = iso(end);

  const { data: existing } = await admin.from("analytics_runs").select("id").eq("business_id", business.id).eq("kind", "weekly").eq("period_start", periodStart).maybeSingle();
  if (existing) return { skipped: true, periodStart };

  const { data: run } = await admin.from("analytics_runs").insert({ business_id: business.id, kind: "weekly", period_start: periodStart, period_end: periodEnd }).select().single();

  try {
    const { data: vids } = await admin.from("video_logs")
      .select("*, creators!inner(id, status, profiles(full_name))")
      .eq("business_id", business.id).eq("creators.status", "active")
      .gte("log_date", periodStart).lte("log_date", periodEnd);
    const videoIds = (vids || []).map((v: Record<string, unknown>) => v.id);
    let platformByVideo: Record<string, Record<string, number>> = {};
    if (videoIds.length) {
      const { data: reports } = await admin.from("video_view_reports").select("*").in("video_log_id", videoIds);
      (reports || []).forEach((r: Record<string, unknown>) => {
        const entry = (platformByVideo[r.video_log_id as string] ||= {});
        entry[r.platform as string] = Math.max(entry[r.platform as string] || 0, Number(r.views));
      });
    }
    const byCreator: Record<string, { name: string; videos: number; tiktok: number; insta: number; facebook: number }> = {};
    (vids || []).forEach((v: Record<string, unknown>) => {
      const creator = v.creators as Record<string, unknown>;
      const cid = creator.id as string;
      const entry = (byCreator[cid] ||= { name: (creator.profiles as Record<string, unknown>)?.full_name as string || "—", videos: 0, tiktok: 0, insta: 0, facebook: 0 });
      entry.videos += 1;
      const rep = platformByVideo[v.id as string];
      if (rep) { entry.tiktok += rep.tiktok || 0; entry.insta += rep.instagram || 0; entry.facebook += rep.facebook || 0; }
    });

    const rows: string[][] = [
      [`Week of ${humanRange(start, end)} — ${business.name}`],
      ["Creator", "Videos logged", "TikTok views (self-reported)", "Instagram views", "Facebook views", "Combined"],
      ...Object.values(byCreator).map((c) => [c.name, String(c.videos), String(c.tiktok), String(c.insta), String(c.facebook), String(c.tiktok + c.insta + c.facebook)]),
    ];

    const monthLabel = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const monthFolder = await findOrCreateMonthFolder(token, business.drive_analytics_folder_id as string, monthLabel);
    const sheetId = await writeSheet(token, `Week of ${humanRange(start, end)} — ${business.name}`, monthFolder, rows);

    await admin.from("analytics_runs").update({ status: "done", drive_file_id: sheetId, completed_at: new Date().toISOString() }).eq("id", run!.id);
    return { periodStart, sheetId };
  } catch (err) {
    await admin.from("analytics_runs").update({ status: "failed", error: (err as Error).message, completed_at: new Date().toISOString() }).eq("id", run!.id);
    throw err;
  }
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: expected } = await admin.rpc("get_cron_secret");
    if (!expected || req.headers.get("x-cron-secret") !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const url = new URL(req.url);
    const onlySlug = url.searchParams.get("business");
    let query = admin.from("businesses").select("id, slug, name, gate_anchor, drive_analytics_folder_id").not("drive_analytics_folder_id", "is", null);
    if (onlySlug) query = query.eq("slug", onlySlug);
    const { data: businesses } = await query;
    if (!businesses?.length) return new Response(JSON.stringify({ error: "No matching business with a Drive folder configured" }), { status: 404 });

    const { data: saJsonText } = await admin.rpc("get_drive_service_account");
    const token = await googleAccessToken(JSON.parse(saJsonText as string));

    const results = [];
    for (const business of businesses) results.push({ business: business.slug, ...(await collateBusiness(admin, token, business)) });

    return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

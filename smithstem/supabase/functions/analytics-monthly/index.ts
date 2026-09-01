// Runs once a month for every business (Apify scrapes cost real money, so
// this stays monthly regardless of each business's own weekly gate). Two
// phases, called by two separate cron schedules roughly an hour apart,
// since Apify runs take longer than an Edge Function is allowed to run:
//   ?phase=start   — kicks off one Apify run per creator per platform that
//                    has a profile link on file, records the run ids, returns
//                    immediately.
//   ?phase=collect — checks those runs; once every run for a business's
//                    pending month has finished, sums the view counts and
//                    drops the monthly report into ANALYTICS/<Month Year>/.
//                    Safe to call repeatedly — runs not yet finished are
//                    just left pending for the next tick.
//
// NOTE for whoever reads this before it's been live a full month: the actor
// ids and input/output field names below (clockworks/tiktok-scraper,
// apify/instagram-scraper) are the standard Apify Store actors for this,
// picked from documentation rather than a live test run — deliberately, so
// as not to spend real Apify credits on an unreviewed test. Worth a manual
// spot-check against one real run before trusting the first month's numbers.
import { createClient } from "jsr:@supabase/supabase-js@2";

const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets";
const TIKTOK_ACTOR = "clockworks~tiktok-scraper";
const INSTAGRAM_ACTOR = "apify~instagram-scraper";

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
  const claims = b64url(JSON.stringify({ iss: saJson.client_email, scope: DRIVE_SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
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
  await fetch(`https://www.googleapis.com/drive/v3/files/${sheet.spreadsheetId}?addParents=${folderId}&removeParents=root`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/A1?valueInputOption=RAW`, {
    method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
  });
  return sheet.spreadsheetId as string;
}

function monthJustEnded(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return { start, label };
}

async function startForBusiness(admin: ReturnType<typeof createClient>, apifyToken: string, business: Record<string, unknown>) {
  const { start } = monthJustEnded(new Date());
  const periodStart = start.toISOString().slice(0, 10);
  const { data: existing } = await admin.from("analytics_runs").select("id").eq("business_id", business.id).eq("kind", "monthly").eq("period_start", periodStart).maybeSingle();
  if (existing) return { skipped: true };

  const { data: creators } = await admin.from("creators").select("id, tiktok_profile_url, insta_profile_url, profiles(full_name)").eq("business_id", business.id).eq("status", "active");
  const runs: Record<string, unknown>[] = [];
  for (const c of creators || []) {
    const name = (c.profiles as Record<string, unknown>)?.full_name as string || "—";
    if (c.tiktok_profile_url) runs.push({ creatorId: c.id, name, platform: "tiktok", runId: await startApifyRun(apifyToken, TIKTOK_ACTOR, { profiles: [c.tiktok_profile_url], resultsPerPage: 30 }) });
    if (c.insta_profile_url) runs.push({ creatorId: c.id, name, platform: "instagram", runId: await startApifyRun(apifyToken, INSTAGRAM_ACTOR, { directUrls: [c.insta_profile_url], resultsType: "posts", resultsLimit: 30 }) });
  }
  await admin.from("analytics_runs").insert({
    business_id: business.id, kind: "monthly", period_start: periodStart,
    period_end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).toISOString().slice(0, 10),
    apify_run_ids: runs,
  });
  return { started: runs.length };
}

async function startApifyRun(token: string, actor: string, input: Record<string, unknown>) {
  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${token}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Apify run start failed: " + JSON.stringify(data));
  return data.data.id as string;
}
async function runStatus(token: string, runId: string) {
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
  const data = await res.json();
  return data.data as { status: string; defaultDatasetId: string };
}
async function datasetViews(token: string, datasetId: string) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
  const items = await res.json();
  return (items as Record<string, unknown>[]).reduce((sum, it) => sum + Number(it.playCount ?? it.videoPlayCount ?? it.videoViewCount ?? 0), 0);
}

async function collectForRun(admin: ReturnType<typeof createClient>, apifyToken: string, driveToken: string, run: Record<string, unknown>, business: Record<string, unknown>) {
  const entries = (run.apify_run_ids as Record<string, unknown>[]) || [];
  const statuses = await Promise.all(entries.map((e) => runStatus(apifyToken, e.runId as string)));
  if (!statuses.every((s) => ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(s.status))) {
    return { stillRunning: true };
  }
  const viewsByCreator: Record<string, { name: string; tiktok: number; instagram: number }> = {};
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]; const s = statuses[i];
    const key = e.creatorId as string;
    const entry = (viewsByCreator[key] ||= { name: e.name as string, tiktok: 0, instagram: 0 });
    if (s.status === "SUCCEEDED") {
      const views = await datasetViews(apifyToken, s.defaultDatasetId);
      if (e.platform === "tiktok") entry.tiktok += views; else entry.instagram += views;
    }
  }
  const rows: string[][] = [
    [`Monthly report — ${business.name}`],
    ["Creator", "TikTok views (recent posts)", "Instagram views (recent posts)", "Combined"],
    ...Object.values(viewsByCreator).map((c) => [c.name, String(c.tiktok), String(c.instagram), String(c.tiktok + c.instagram)]),
  ];
  const start = new Date((run.period_start as string) + "T00:00:00Z");
  const monthLabel = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const monthFolder = await findOrCreateMonthFolder(driveToken, business.drive_analytics_folder_id as string, monthLabel);
  const sheetId = await writeSheet(driveToken, `Monthly report — ${monthLabel} — ${business.name}`, monthFolder, rows);
  await admin.from("analytics_runs").update({ status: "done", drive_file_id: sheetId, completed_at: new Date().toISOString() }).eq("id", run.id);
  return { sheetId };
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

    const phase = new URL(req.url).searchParams.get("phase") || "start";

    const { data: businesses } = await admin.from("businesses").select("id, slug, name, drive_analytics_folder_id").not("drive_analytics_folder_id", "is", null);

    // Each brand scrapes with its own Apify account (get_business_apify_token).
    // A brand with no account configured yet returns null and is skipped
    // outright — no run started, no error. Today that is only NorthQuest;
    // Aura and CashDrive stay silent until Smith loads their tokens.
    async function tokenFor(businessId: string) {
      const { data } = await admin.rpc("get_business_apify_token", { p_business_id: businessId });
      return (data as string) || null;
    }

    if (phase === "start") {
      const results = [];
      for (const b of businesses || []) {
        const apifyToken = await tokenFor(b.id as string);
        if (!apifyToken) { results.push({ business: b.slug, skipped: true, reason: "no_apify_account" }); continue; }
        results.push({ business: b.slug, ...(await startForBusiness(admin, apifyToken, b)) });
      }
      return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
    }

    const { data: saJsonText } = await admin.rpc("get_drive_service_account");
    const driveToken = await googleAccessToken(JSON.parse(saJsonText as string));
    const { data: pending } = await admin.from("analytics_runs").select("*").eq("kind", "monthly").eq("status", "pending");
    const results = [];
    for (const run of pending || []) {
      const business = (businesses || []).find((b) => b.id === run.business_id);
      if (!business) continue;
      const apifyToken = await tokenFor(business.id as string);
      if (!apifyToken) { results.push({ business: business.slug, skipped: true, reason: "no_apify_account" }); continue; }
      results.push({ business: business.slug, ...(await collectForRun(admin, apifyToken, driveToken, run, business)) });
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

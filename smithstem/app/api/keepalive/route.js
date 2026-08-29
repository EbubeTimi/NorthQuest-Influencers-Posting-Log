import { createClient } from "@supabase/supabase-js";

// Vercel Cron hits this on a schedule (see vercel.json). Supabase's free tier
// pauses a project after roughly a week without activity, which would take the
// whole platform offline silently — creators unable to log in, admins unable to
// approve. A cron inside the database can't fix that (a paused database can't
// run its own scheduler), so the wake-up call has to come from outside.
export const dynamic = "force-dynamic";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "zuuhlowjqniadtcpdypv";

// Task #15's actual gap: the ping above only prevents a pause, it can't undo
// one that already happened — a paused project rejects ordinary REST/RPC
// calls, ping included. Recovering from that needs Supabase's separate
// Management API (a personal access token, not the anon/service key) and an
// alert sent directly through Resend's HTTP API rather than the in-database
// send_email() RPC, since that RPC is exactly as unreachable as everything
// else while the project is down. Both SUPABASE_ACCESS_TOKEN and
// RESEND_ALERT_KEY are optional here on purpose: without them this function
// quietly no-ops and the route behaves exactly as it did before, so shipping
// this code doesn't require adding the keys in the same breath.
async function checkAndRecoverFromPause() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) return { checked: false, reason: "SUPABASE_ACCESS_TOKEN not set" };

  const projectRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!projectRes.ok) {
    return { checked: true, error: `status check failed: ${projectRes.status}` };
  }
  const project = await projectRes.json();
  if (project.status === "ACTIVE_HEALTHY") {
    return { checked: true, status: project.status, restored: false };
  }

  const restoreRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const restoreOk = restoreRes.ok;

  const resendKey = process.env.RESEND_ALERT_KEY;
  const alertTo = process.env.ALERT_EMAIL_TO;
  if (resendKey && alertTo) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_ALERT_FROM || "Smithstem <alerts@smithstem.app>",
        to: alertTo,
        subject: restoreOk ? "Smithstem's database had paused — restore triggered" : "Smithstem's database is paused and restore failed",
        html: `<p>Supabase reported status <strong>${project.status}</strong> for the Smithstem project.</p>` +
          `<p>${restoreOk ? "A restore was just triggered — it should be back within a few minutes." : "The restore call itself failed — this needs a manual look at the Supabase dashboard."}</p>`,
      }),
    }).catch(() => {});
  }

  return { checked: true, status: project.status, restored: restoreOk };
}

export async function GET(request) {
  // Vercel signs cron invocations. Reject anything else so this can't be used
  // as a free ping endpoint by strangers.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return Response.json({ ok: false, error: "service_role_not_configured" }, { status: 503 });
  }

  const recovery = await checkAndRecoverFromPause().catch((e) => ({ checked: true, error: e.message }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zuuhlowjqniadtcpdypv.supabase.co",
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // ping_external also records the run in system_heartbeat, so this defence is
  // visible in the same log as the in-database one. Without that there is no
  // way to tell whether the Vercel cron is actually firing. Skipped, not
  // failed, if the project just got restored above — it needs a moment to
  // come back up before it can accept ordinary API calls again.
  if (recovery.restored) {
    return Response.json({ ok: true, recovery, ping: "skipped — project was just restored" });
  }

  const { data, error } = await supabase.rpc("ping_external");

  if (error) {
    return Response.json({ ok: false, error: error.message, recovery }, { status: 500 });
  }
  return Response.json({ ok: true, pingedAt: data, recovery });
}

import { createClient } from "@supabase/supabase-js";

// Vercel Cron hits this on a schedule (see vercel.json). Supabase's free tier
// pauses a project after roughly a week without activity, which would take the
// whole platform offline silently — creators unable to log in, admins unable to
// approve. A cron inside the database can't fix that (a paused database can't
// run its own scheduler), so the wake-up call has to come from outside.
export const dynamic = "force-dynamic";

export async function GET(request) {
  // Vercel signs cron invocations. Reject anything else so this can't be used
  // as a free ping endpoint by strangers.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zuuhlowjqniadtcpdypv.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dWhsb3dqcW5pYWR0Y3BkeXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Nzc4MTUsImV4cCI6MjEwMTM1MzgxNX0.jVwib7vyA0rL-Ra7BfIOG97b6zOSkNzk4MaJjux0_uo"
  );

  const { data, error } = await supabase.rpc("ping");

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, pingedAt: data });
}

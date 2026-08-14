"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { rate, bonusForViews, tiersOn, today, monthBoundsLocal } from "../../lib/domain";
import Header from "../../components/Header";

function monthBounds() {
  const { start, end } = monthBoundsLocal();
  const label = new Date(start + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return { start, end, label };
}
const STATUS_STYLE = { pending: "badge-waiting", approved: "badge-ok", rejected: "badge-no" };
// What a creator is waiting on, rather than what the column is called.
const STATUS_WORD = { pending: "Waiting on Smith", approved: "Approved", rejected: "Not approved" };
const PAY_STATUS_STYLE = { paid: "badge-ok", pending: "badge-waiting", processing: "badge-waiting" };
const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
function monthName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
function dayName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

// A figure with the naira sign set smaller and lighter, because the number is
// the part being read.
function Money({ value, className = "" }) {
  return <p className={`figure-money ${className}`}><span className="naira">₦</span>{Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</p>;
}

// What a creator is owed for a month once an admin has worked it out.
// total_payable is an override; without it the figure is built from the parts,
// so the total always agrees with the breakdown printed underneath.
function payTotal(p) {
  if (p.total_payable !== null && p.total_payable !== undefined) return Number(p.total_payable);
  return Number(p.base_amount || 0) + Number(p.perf_bonus || 0) + Number(p.referral_bonus || 0) + Number(p.special_bonus || 0) - Number(p.oop_expense || 0);
}

// The headline card: what this month is worth so far, built from what has
// actually been logged and approved rather than waiting on month end. This is
// the number a creator opens the app to see, so it is the biggest thing on it.
function EarnedSoFar({ videos, claims, tiers, basePay }) {
  const perVideo = rate(basePay);
  const baseEarned = Math.round(videos.length * perVideo);
  const approved = claims.filter((c) => c.status === "approved");
  const waiting = claims.filter((c) => c.status === "pending");
  const bonusEarned = approved.reduce((sum, c) => sum + bonusForViews(c.views, tiersOn(tiers, c.claim_date)), 0);
  const bonusWaiting = waiting.reduce((sum, c) => sum + bonusForViews(c.views, tiersOn(tiers, c.claim_date)), 0);

  return (
    <section className="card mb-4">
      <p className="kicker">Earned so far this month</p>
      <Money value={baseEarned + bonusEarned} className="mt-1" />

      <div className="mt-4 space-y-2 border-t border-line pt-3">
        <div className="flex items-baseline justify-between text-base">
          <span className="text-muted">Base pay · {videos.length} {videos.length === 1 ? "video" : "videos"}</span>
          <span className="tnum font-medium">{naira(baseEarned)}</span>
        </div>
        <div className="flex items-baseline justify-between text-base">
          <span className="text-muted">Bonuses approved</span>
          <span className="tnum font-medium">{naira(bonusEarned)}</span>
        </div>
        {bonusWaiting > 0 && (
          <div className="flex items-baseline justify-between text-tiny text-faint">
            <span>{naira(bonusWaiting)} more waiting on approval</span>
            <span>not counted yet</span>
          </div>
        )}
      </div>

      <p className="mt-3 text-tiny text-faint">
        Each video is worth {naira(Math.round(perVideo))}. Smith confirms the final amount at the end of the month.
      </p>
    </section>
  );
}

function PaymentsSection({ payments }) {
  if (!payments.length) {
    return (
      <section className="card mb-4">
        <h2 className="text-lead font-semibold">Your payments</h2>
        <p className="mt-1 text-base text-faint">Nothing paid out yet. Once Smith works out a month, it appears here with the date it was paid.</p>
      </section>
    );
  }
  return (
    <section className="card mb-4">
      <h2 className="mb-3 text-lead font-semibold">Your payments</h2>
      <div className="space-y-3">
        {payments.map((p) => {
          const total = payTotal(p);
          const status = String(p.payment_status || "Pending");
          const style = PAY_STATUS_STYLE[status.toLowerCase()] || "badge-waiting";
          // A month with a bonus but no base pay has not been worked out yet.
          // Saying so beats showing a total that is about to change.
          const provisional = Number(p.base_amount || 0) === 0 && status.toLowerCase() !== "paid";
          const rows = [
            ["Base pay", p.base_amount],
            ["Performance bonus", p.perf_bonus],
            ["Referral bonus", p.referral_bonus],
            ["Special bonus", p.special_bonus],
          ].filter(([, v]) => Number(v || 0) !== 0);
          return (
            <div key={p.id} className="rounded-xl border border-line p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{monthName(p.month)}</span>
                <span className="flex items-center gap-2">
                  <span className="tnum text-lead font-semibold text-accent">{naira(total)}</span>
                  <span className={`badge ${style}`}>{status}</span>
                </span>
              </div>
              <div className="mt-2 space-y-1 text-tiny text-muted">
                {rows.map(([label, v]) => (
                  <div key={label} className="flex justify-between"><span>{label}</span><span className="tnum">{naira(v)}</span></div>
                ))}
                {Number(p.oop_expense || 0) !== 0 && (
                  <div className="flex justify-between"><span>Out of pocket</span><span className="tnum">−{naira(p.oop_expense)}</span></div>
                )}
                {p.payment_date && <div className="flex justify-between"><span>Paid on</span><span>{p.payment_date}</span></div>}
              </div>
              {p.remarks && <p className="mt-2 rounded-lg bg-ground px-3 py-2 text-tiny text-muted">{p.remarks}</p>}
              {provisional && <p className="mt-2 text-tiny text-waitingInk">Still being worked out — your base pay for this month is not final yet.</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function CreatorDashboard() {
  const router = useRouter();
  const [creator, setCreator] = useState(null);
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [claims, setClaims] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [videoForm, setVideoForm] = useState({ date: today(), post: "1", tiktok: "", insta: "" });
  const [bonusForm, setBonusForm] = useState({ date: today(), videoUrl: "", views: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const { start, end, label } = monthBounds();

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.replace("/"); return; }
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.user.id).single();
    setProfile(prof);
    const { data: cr } = await supabase.from("creators").select("*").eq("profile_id", user.user.id).single();
    setCreator(cr);
    if (!cr) return;
    const [{ data: v }, { data: b }, { data: pay }, { data: t }] = await Promise.all([
      supabase.from("video_logs").select("*").eq("creator_id", cr.id).gte("log_date", start).lte("log_date", end).order("log_date", { ascending: false }),
      supabase.from("bonus_claims").select("*").eq("creator_id", cr.id).gte("claim_date", start).lte("claim_date", end).order("created_at", { ascending: false }),
      // Every month, not just this one — creators ask about past months most.
      supabase.from("payments").select("*").eq("creator_id", cr.id).order("month", { ascending: false }),
      supabase.from("bonus_tiers").select("*").eq("business_id", cr.business_id),
    ]);
    setVideos(v || []); setClaims(b || []); setPayments(pay || []); setTiers(t || []);
  }, [router, start, end]);

  useEffect(() => { load(); }, [load]);
  async function signOut() { await supabaseBrowser().auth.signOut(); router.replace("/"); }

  async function logVideo(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("video_logs").insert({ business_id: creator.business_id, creator_id: creator.id, log_date: videoForm.date, post_number: Number(videoForm.post), tiktok_url: videoForm.tiktok || null, insta_url: videoForm.insta || null, logged_by: "creator" });
    setBusy(false);
    if (error) {
      // The database refuses a second video with the same date and post number.
      const dupe = error.message?.includes("duplicate") || error.code === "23505";
      setMsg(dupe ? "You have already logged that post for that day." : "Could not save: " + error.message);
      return;
    }
    setMsg("Video logged."); setVideoForm((f) => ({ ...f, tiktok: "", insta: "" })); load();
  }

  async function submitBonus(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("bonus_claims").insert({ business_id: creator.business_id, creator_id: creator.id, claim_date: bonusForm.date, video_url: bonusForm.videoUrl || null, views: Number(bonusForm.views), submitted_by: "creator", status: "pending" });
    setBusy(false); if (error) { setMsg("Could not submit: " + error.message); return; }
    setMsg("Bonus claim sent to Smith."); setBonusForm({ date: today(), videoUrl: "", views: "" }); load();
  }

  if (!profile) return null;
  if (profile && !creator) return (<main className="flex min-h-screen items-center justify-center px-4 text-center"><p className="text-base text-muted">Setting up your creator profile…</p></main>);

  const waitingCount = claims.filter((c) => c.status === "pending").length;
  // Read the entry threshold from the tiers rather than repeating it in copy,
  // so it follows Smith whenever she changes the structure.
  const currentTiers = tiersOn(tiers, new Date());
  const lowestTier = currentTiers.length ? Math.min(...currentTiers.map((t) => t.min_views)) : null;
  // What this claim is worth, so a creator can see the value of what they sent
  // rather than just a view count.
  const claimValue = (c) => bonusForViews(c.views, tiersOn(tiers, c.claim_date));

  return (
    <div>
      <Header onSignOut={signOut} />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-5">
          <p className="kicker">{label}</p>
          <h1 className="font-display text-title font-semibold">Hi, {profile.full_name?.split(" ")[0]}</h1>
        </div>

        <EarnedSoFar videos={videos} claims={claims} tiers={tiers} basePay={creator.base_pay} />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="card">
            <p className="kicker">Videos</p>
            <p className="figure mt-1">{videos.length}</p>
            <p className="mt-1 text-tiny text-faint">this month</p>
          </div>
          <div className="card">
            <p className="kicker">Bonus claims</p>
            <p className="figure mt-1">{claims.length}</p>
            <p className="mt-1 text-tiny text-faint">{waitingCount > 0 ? `${waitingCount} waiting on Smith` : "none waiting"}</p>
          </div>
        </div>

        {msg && <p className="mb-4 rounded-xl bg-accentSoft px-4 py-3 text-base text-accent">{msg}</p>}

        <section className="card mb-4">
          <h2 className="mb-3 text-lead font-semibold">Log a video</h2>
          <form onSubmit={logVideo} className="grid grid-cols-2 gap-3">
            <input className="input" type="date" value={videoForm.date} onChange={(e) => setVideoForm((f) => ({ ...f, date: e.target.value }))} required />
            <select className="input" value={videoForm.post} onChange={(e) => setVideoForm((f) => ({ ...f, post: e.target.value }))}>
              <option value="1">Post 1</option>
              <option value="2">Post 2</option>
            </select>
            <input className="input col-span-2" placeholder="TikTok link" value={videoForm.tiktok} onChange={(e) => setVideoForm((f) => ({ ...f, tiktok: e.target.value }))} />
            <input className="input col-span-2" placeholder="Instagram link" value={videoForm.insta} onChange={(e) => setVideoForm((f) => ({ ...f, insta: e.target.value }))} />
            <button className="btn-primary col-span-2" disabled={busy}>{busy ? "Saving…" : "Log video"}</button>
          </form>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-lead font-semibold">Videos you posted this month</h2>
          {videos.length === 0 ? (
            <p className="text-base text-faint">Nothing logged yet. Log your first video above and it will show here.</p>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <div key={v.id} className="rounded-xl border border-line px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-medium">{dayName(v.log_date)} · Post {v.post_number}</span>
                    {v.logged_by === "admin"
                      ? <span className="badge bg-accentSoft text-accent">Logged by Smith</span>
                      : <span className="badge bg-ground text-muted">You logged this</span>}
                  </div>
                  {/* The links they submitted, so this reads like the posting log
                      rather than a bare count. */}
                  {(v.tiktok_url || v.insta_url) && (
                    <div className="mt-1.5 flex flex-wrap gap-3">
                      {v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">TikTok</a>}
                      {v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">Instagram</a>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card mb-4">
          <h2 className="text-lead font-semibold">Claim a bonus</h2>
          <p className="mb-3 mt-1 text-tiny text-muted">
            Paste the link to the video and how many views it has now. Bonuses start at {lowestTier ? Number(lowestTier).toLocaleString() : "—"} views.
          </p>
          <form onSubmit={submitBonus} className="grid grid-cols-2 gap-3">
            <input className="input" type="date" value={bonusForm.date} onChange={(e) => setBonusForm((f) => ({ ...f, date: e.target.value }))} required />
            <input className="input tnum" type="number" placeholder="Views" value={bonusForm.views} onChange={(e) => setBonusForm((f) => ({ ...f, views: e.target.value }))} required />
            <input className="input col-span-2" placeholder="Video link (TikTok or Instagram)" value={bonusForm.videoUrl} onChange={(e) => setBonusForm((f) => ({ ...f, videoUrl: e.target.value }))} required />
            {/* Show what the claim is worth before it is sent, so nobody submits
                blind and nobody is surprised by the amount later. */}
            {Number(bonusForm.views) > 0 && (
              <p className="col-span-2 -mt-1 text-tiny text-muted">
                {bonusForViews(Number(bonusForm.views), tiersOn(tiers, bonusForm.date)) > 0
                  ? <>That is worth <span className="font-semibold text-ink">{naira(bonusForViews(Number(bonusForm.views), tiersOn(tiers, bonusForm.date)))}</span> if approved.</>
                  : <>Under {Number(lowestTier || 0).toLocaleString()} views, so there is no bonus for this one yet.</>}
              </p>
            )}
            <button className="btn-primary col-span-2" disabled={busy}>{busy ? "Sending…" : "Send to Smith"}</button>
          </form>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-lead font-semibold">Your bonus claims</h2>
          {claims.length === 0 ? (
            <p className="text-base text-faint">No claims yet. When a video passes {lowestTier ? Number(lowestTier).toLocaleString() : "the first"} views, claim it above.</p>
          ) : (
            <div className="space-y-2">
              {claims.map((c) => (
                <div key={c.id} className="rounded-xl border border-line px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tnum text-base font-medium">{Number(c.views).toLocaleString()} views</span>
                    <span className={`badge ${STATUS_STYLE[c.status]}`}>
                      <span className="badge-dot" />{STATUS_WORD[c.status] || c.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-tiny text-muted">
                    <span>{dayName(c.claim_date)}{claimValue(c) > 0 && <> · worth {naira(claimValue(c))}</>}</span>
                    {c.video_url && <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">See the video</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <PaymentsSection payments={payments} />
      </main>
    </div>
  );
}

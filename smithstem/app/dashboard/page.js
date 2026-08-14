"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { today, postingDay, monthBoundsLocal } from "../../lib/domain";
import Header from "../../components/Header";

const STATUS_STYLE = { pending: "badge-waiting", approved: "badge-ok", rejected: "badge-no" };
// What a creator is waiting on, rather than what the column is called.
const STATUS_WORD = { pending: "Waiting on Smith", approved: "Approved", rejected: "Not approved" };
const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
function monthName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
function dayName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

// What a creator is owed for a month, used only once a payment has actually
// been paid — never shown as a running figure before Smith has confirmed it.
function payTotal(p) {
  if (p.total_payable !== null && p.total_payable !== undefined) return Number(p.total_payable);
  return Number(p.base_amount || 0) + Number(p.perf_bonus || 0) + Number(p.referral_bonus || 0) + Number(p.special_bonus || 0) - Number(p.oop_expense || 0);
}

// A creator sees money only once it has been paid: the amount and the date,
// nothing else. No running total, no breakdown, no calculation to argue with
// before Smith has confirmed it. Their videos and claims stay fully visible
// elsewhere on this page — this section is money, and only settled money.
function PaymentsSection({ payments }) {
  const paid = payments.filter((p) => String(p.payment_status || "").toLowerCase() === "paid");
  if (!paid.length) {
    return (
      <section className="card mb-4">
        <h2 className="text-lead font-semibold">Your payments</h2>
        <p className="mt-1 text-base text-faint">Nothing paid out yet. Once Smith pays a month, it appears here with the date.</p>
      </section>
    );
  }
  return (
    <section className="card mb-4">
      <h2 className="mb-3 text-lead font-semibold">Your payments</h2>
      <div className="space-y-2">
        {paid.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
            <span className="font-medium">{monthName(p.month)}</span>
            <span className="flex items-center gap-3">
              <span className="tnum text-lead font-semibold text-accent">{naira(payTotal(p))}</span>
              <span className="text-tiny text-faint">{p.payment_date ? `Paid ${p.payment_date}` : "Paid"}</span>
            </span>
          </div>
        ))}
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
  const [videoForm, setVideoForm] = useState({ date: postingDay(), post: "1", tiktok: "", insta: "" });
  const [bonusForm, setBonusForm] = useState({ date: today(), videoUrl: "", views: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [growthOpenFor, setGrowthOpenFor] = useState(null);
  const [growthViews, setGrowthViews] = useState("");
  const [growthError, setGrowthError] = useState("");
  const { start, end, label } = (() => { const b = monthBoundsLocal(); return { ...b, label: new Date(b.start + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }; })();

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.replace("/"); return; }
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.user.id).single();
    setProfile(prof);
    const { data: cr } = await supabase.from("creators").select("*").eq("profile_id", user.user.id).single();
    setCreator(cr);
    if (!cr) return;
    const [{ data: v }, { data: b }, { data: pay }] = await Promise.all([
      supabase.from("video_logs").select("*").eq("creator_id", cr.id).gte("log_date", start).lte("log_date", end).order("log_date", { ascending: false }),
      supabase.from("bonus_claims").select("*").eq("creator_id", cr.id).gte("claim_date", start).lte("claim_date", end).order("created_at", { ascending: false }),
      // Every month, not just this one — creators ask about past months most.
      supabase.from("payments").select("*").eq("creator_id", cr.id).order("month", { ascending: false }),
    ]);
    setVideos(v || []); setClaims(b || []); setPayments(pay || []);
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

  // Growth is reported on the same claim, not a new one — the video already
  // has an approved bonus, and this asks Smith to re-check it at its new view
  // count. Approving it moves the same row to the new figure, so the old
  // amount is replaced rather than a second bonus stacking on top of it.
  async function reportGrowth(claim) {
    setGrowthError("");
    const views = Number(growthViews);
    if (!views || views <= claim.views) { setGrowthError("Enter a view count higher than what was already approved."); return; }
    const { error } = await supabaseBrowser().rpc("request_bonus_revision", { p_claim_id: claim.id, p_new_views: views });
    if (error) { setGrowthError(error.message.replace(/^.*?: /, "")); return; }
    setGrowthOpenFor(null); setGrowthViews(""); setMsg("Update sent to Smith."); load();
  }

  if (!profile) return null;
  if (profile && !creator) return (<main className="flex min-h-screen items-center justify-center px-4 text-center"><p className="text-base text-muted">Setting up your creator profile…</p></main>);

  const waitingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div>
      <Header profile={profile} onSignOut={signOut} />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-5">
          <p className="kicker">{label}</p>
          <h1 className="font-display text-title font-semibold">Hi, {profile.full_name?.split(" ")[0]}</h1>
        </div>

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
            Paste the link to the video and how many views it has now. Smith reviews every claim.
          </p>
          <form onSubmit={submitBonus} className="grid grid-cols-2 gap-3">
            <input className="input" type="date" value={bonusForm.date} onChange={(e) => setBonusForm((f) => ({ ...f, date: e.target.value }))} required />
            <input className="input tnum" type="number" placeholder="Views" value={bonusForm.views} onChange={(e) => setBonusForm((f) => ({ ...f, views: e.target.value }))} required />
            <input className="input col-span-2" placeholder="Video link (TikTok or Instagram)" value={bonusForm.videoUrl} onChange={(e) => setBonusForm((f) => ({ ...f, videoUrl: e.target.value }))} required />
            <button className="btn-primary col-span-2" disabled={busy}>{busy ? "Sending…" : "Send to Smith"}</button>
          </form>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-lead font-semibold">Your bonus claims</h2>
          {claims.length === 0 ? (
            <p className="text-base text-faint">No claims yet. Claim a video above once it has picked up views.</p>
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
                    <span>{dayName(c.claim_date)}</span>
                    {c.video_url && <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">See the video</a>}
                  </div>

                  {c.status === "approved" && c.revision_status === "pending" && (
                    <p className="mt-2 rounded-lg bg-waitingBg px-3 py-2 text-tiny text-waitingInk">
                      Growth to {Number(c.revised_views).toLocaleString()} views sent — waiting on Smith.
                    </p>
                  )}

                  {c.status === "approved" && c.revision_status !== "pending" && (
                    growthOpenFor === c.id ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          className="input tnum w-32 py-2"
                          type="number"
                          autoFocus
                          placeholder="New views"
                          value={growthViews}
                          onChange={(e) => setGrowthViews(e.target.value)}
                        />
                        <button className="btn-primary py-2 text-tiny" onClick={() => reportGrowth(c)}>Send to Smith</button>
                        <button className="btn-quiet" onClick={() => { setGrowthOpenFor(null); setGrowthViews(""); setGrowthError(""); }}>Cancel</button>
                        {growthError && <p className="w-full text-tiny text-noInk">{growthError}</p>}
                      </div>
                    ) : (
                      <button className="btn-quiet mt-1 px-0" onClick={() => { setGrowthOpenFor(c.id); setGrowthViews(""); setGrowthError(""); }}>
                        This video grew — report new views
                      </button>
                    )
                  )}
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

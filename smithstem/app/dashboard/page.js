"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, withTimeout } from "../../lib/supabaseClient";
import { today, postingDay, monthBoundsLocal } from "../../lib/domain";
import Header from "../../components/Header";
import LoadingScreen from "../../components/LoadingScreen";

const STATUS_STYLE = { pending: "badge-waiting", approved: "badge-ok", rejected: "badge-no" };
// What a creator is waiting on, rather than what the column is called.
const STATUS_WORD = { pending: "Waiting on Smith", approved: "Approved", rejected: "Not approved" };
const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
function monthName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }
function dayName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

// Strips protocol, www, query string, and trailing slash so a link a creator
// re-pastes today still matches the one logged weeks ago even if TikTok or
// Instagram appended different tracking params in between.
function normalizeLink(u) {
  if (!u) return "";
  let s = String(u).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return s;
}

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
  // All-time (not just this month) so an older video can still be claimed —
  // matched by pasted link or picked from a list, never typed free-hand.
  const [myVideos, setMyVideos] = useState([]);
  const [claimByVideoId, setClaimByVideoId] = useState({});
  const [bonusView, setBonusView] = useState("link-entry");
  const [pastedLink, setPastedLink] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [claimViews, setClaimViews] = useState("");
  const [claimScreenshot, setClaimScreenshot] = useState(null);
  const [claimError, setClaimError] = useState("");
  const [growthViews2, setGrowthViews2] = useState("");
  const [growthError2, setGrowthError2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [growthOpenFor, setGrowthOpenFor] = useState(null);
  const [growthViews, setGrowthViews] = useState("");
  const [growthError, setGrowthError] = useState("");
  const [loadError, setLoadError] = useState("");
  // The highest view count self-reported so far on each video, split by
  // platform since a video posted to both can earn a bonus on each
  // independently — { tiktok, instagram } per video_log_id.
  const [platformReportsByVideo, setPlatformReportsByVideo] = useState({});
  const [reportOpenFor, setReportOpenFor] = useState(null);
  const [reportTiktokInput, setReportTiktokInput] = useState("");
  const [reportInstaInput, setReportInstaInput] = useState("");
  const [reportError, setReportError] = useState("");
  const [trialThreshold, setTrialThreshold] = useState(10000);
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const { start, end, label } = (() => { const b = monthBoundsLocal(); return { ...b, label: new Date(b.start + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }; })();

  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    // This part decides whether the loading screen ever clears, so it must
    // never hang silently — everything after setProfile only fills in cards
    // on a screen that is already showing.
    let user, prof;
    try {
      const res = await withTimeout(supabase.auth.getUser());
      user = res.data;
      if (!user.user) { router.replace("/"); return; }
      const profRes = await withTimeout(supabase.from("profiles").select("*").eq("id", user.user.id).maybeSingle());
      if (profRes.error) throw profRes.error;
      prof = profRes.data;
    } catch (err) {
      setLoadError(err.message || "Something went wrong loading your dashboard.");
      return;
    }
    setLoadError("");
    setProfile(prof);
    const { data: cr } = await supabase.from("creators").select("*").eq("profile_id", user.user.id).maybeSingle();
    setCreator(cr);
    if (!cr) return;
    const [{ data: v }, { data: b }, { data: pay }, { data: mv }, { data: mc }, { data: vr }, { data: bizSettings }] = await Promise.all([
      supabase.from("video_logs").select("*").eq("creator_id", cr.id).gte("log_date", start).lte("log_date", end).order("log_date", { ascending: false }),
      supabase.from("bonus_claims").select("*").eq("creator_id", cr.id).gte("claim_date", start).lte("claim_date", end).order("created_at", { ascending: false }),
      // Every month, not just this one — creators ask about past months most.
      supabase.from("payments").select("*").eq("creator_id", cr.id).order("month", { ascending: false }),
      // All-time video/claim pool for the claim-a-bonus link matcher below —
      // a video from two months ago can still cross a tier and get claimed.
      supabase.from("video_logs").select("*").eq("creator_id", cr.id).order("log_date", { ascending: false }).limit(200),
      supabase.from("bonus_claims").select("*").eq("creator_id", cr.id).order("created_at", { ascending: false }).limit(400),
      // Self-reported view counts — trial creators use this to show their own
      // progress toward the crossing threshold.
      supabase.from("video_view_reports").select("*").eq("creator_id", cr.id),
      // Live setting, not fixed — the same figure Smith's crossing queue uses,
      // read fresh each time rather than assumed.
      supabase.from("businesses").select("trial_view_threshold, bonus_enabled").eq("id", cr.business_id).maybeSingle(),
    ]);
    setVideos(v || []); setClaims(b || []); setPayments(pay || []);
    setTrialThreshold(bizSettings?.trial_view_threshold || 10000);
    setBonusEnabled(bizSettings?.bonus_enabled !== false);
    setMyVideos(mv || []);
    const claimMap = {};
    (mc || []).forEach((c) => { if (c.video_log_id && !claimMap[c.video_log_id]) claimMap[c.video_log_id] = c; });
    setClaimByVideoId(claimMap);
    const reportMap = {};
    (vr || []).forEach((r) => {
      const entry = (reportMap[r.video_log_id] ||= { tiktok: 0, instagram: 0 });
      entry[r.platform] = Math.max(entry[r.platform] || 0, Number(r.views));
    });
    setPlatformReportsByVideo(reportMap);
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

  // No evidence, no approval — just what the creator says the count is right
  // now, per platform, since TikTok and Instagram are tracked (and can earn
  // a bonus) independently even on the same video.
  async function reportViews(video) {
    setReportError("");
    const rows = [];
    if (video.tiktok_url && reportTiktokInput.trim()) {
      const n = Number(reportTiktokInput);
      if (!n || n <= 0) { setReportError("Enter a valid TikTok view count."); return; }
      rows.push({ business_id: creator.business_id, creator_id: creator.id, video_log_id: video.id, views: n, platform: "tiktok" });
    }
    if (video.insta_url && reportInstaInput.trim()) {
      const n = Number(reportInstaInput);
      if (!n || n <= 0) { setReportError("Enter a valid Instagram view count."); return; }
      rows.push({ business_id: creator.business_id, creator_id: creator.id, video_log_id: video.id, views: n, platform: "instagram" });
    }
    if (!rows.length) { setReportError("Enter at least one view count."); return; }
    const { error } = await supabaseBrowser().from("video_view_reports").insert(rows);
    if (error) { setReportError(error.message); return; }
    setReportOpenFor(null); setReportTiktokInput(""); setReportInstaInput(""); setMsg("Views reported."); load();
  }

  // A claim is now made against one specific logged video, found by pasting
  // its link (matched against what's already logged) or picked from a list —
  // never typed free-hand. This is what makes a duplicate claim on the same
  // video structurally impossible rather than just discouraged: the video is
  // resolved first, and the database refuses a second active claim on it.
  function videoClaimBadge(video) {
    const c = claimByVideoId[video.id];
    if (!c) return { cls: "bg-ground text-faint", text: "Not yet claimed" };
    return { cls: STATUS_STYLE[c.status], text: STATUS_WORD[c.status] || c.status };
  }

  function resetClaimFlow() {
    setBonusView("link-entry"); setPastedLink(""); setActiveVideo(null);
    setClaimViews(""); setClaimScreenshot(null); setClaimError("");
    setGrowthViews2(""); setGrowthError2("");
  }

  function openVideoForClaim(video) {
    setActiveVideo(video);
    setClaimViews(""); setClaimScreenshot(null); setClaimError("");
    const claim = claimByVideoId[video.id];
    if (!claim) { setBonusView("claim-form"); return; }
    if (claim.status === "pending") { setBonusView("already-waiting"); return; }
    if (claim.status === "approved") { setGrowthViews2(""); setGrowthError2(""); setBonusView("already-approved"); return; }
    setBonusView("claim-form"); // rejected — resubmitting against the same video is allowed
  }

  function findMyVideo() {
    setClaimError("");
    const needle = normalizeLink(pastedLink);
    if (!needle) return;
    const match = myVideos.find((v) => (v.tiktok_url && normalizeLink(v.tiktok_url) === needle) || (v.insta_url && normalizeLink(v.insta_url) === needle));
    if (!match) { setBonusView("link-notfound"); return; }
    setActiveVideo(match);
    setBonusView("link-matched");
  }

  async function submitClaim() {
    setClaimError("");
    const viewsNum = Number(claimViews);
    if (!claimViews.trim() || !viewsNum || viewsNum <= 0) { setClaimError("Enter the view count."); return; }
    if (!claimScreenshot) { setClaimError("Add a screenshot so Smith can check it."); return; }
    setBusy(true); setMsg("");
    const supabase = supabaseBrowser();
    const path = `${creator.id}/${Date.now()}-${claimScreenshot.name}`;
    const { error: upErr } = await supabase.storage.from("bonus-evidence").upload(path, claimScreenshot);
    if (upErr) { setBusy(false); setClaimError("Could not upload the screenshot: " + upErr.message); return; }
    const link = activeVideo.tiktok_url || activeVideo.insta_url || null;
    const { error } = await supabase.from("bonus_claims").insert({
      business_id: creator.business_id, creator_id: creator.id, claim_date: today(),
      video_log_id: activeVideo.id, video_url: link, screenshot_url: path,
      views: viewsNum, submitted_by: "creator", status: "pending",
    });
    setBusy(false);
    if (error) { setClaimError("Could not submit: " + error.message); return; }
    setMsg("Bonus claim sent to Smith."); resetClaimFlow(); load();
  }

  // Growth is reported on the video's existing approved claim, not a new
  // one — same mechanism as the list below, just reached from the claim flow
  // when the matched or picked video turns out to already be approved.
  async function submitGrowthForActiveClaim() {
    setGrowthError2("");
    const claim = claimByVideoId[activeVideo.id];
    const v = Number(growthViews2);
    if (!v || v <= claim.views) { setGrowthError2("Enter a view count higher than what was already approved."); return; }
    const { error } = await supabaseBrowser().rpc("request_bonus_revision", { p_claim_id: claim.id, p_new_views: v });
    if (error) { setGrowthError2(error.message.replace(/^.*?: /, "")); return; }
    setMsg("Update sent to Smith."); resetClaimFlow(); load();
  }

  async function viewEvidence(path) {
    const { data, error } = await supabaseBrowser().storage.from("bonus-evidence").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) { setMsg("Could not open that screenshot: " + (error?.message || "not found")); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-sm space-y-3 text-center">
          <p className="text-base text-ink">{loadError}</p>
          <button className="btn-primary w-full" onClick={load}>Try again</button>
        </div>
      </main>
    );
  }
  if (!profile) return <LoadingScreen label="Loading your dashboard…" />;
  if (profile && !creator) return <LoadingScreen label="Setting up your creator profile…" />;

  if (creator.status === "inactive") {
    return (
      <div>
        <Header profile={profile} onSignOut={signOut} />
        <main className="mx-auto max-w-md px-4 py-10 text-center">
          <h1 className="font-display text-title font-semibold">Account inactive</h1>
          <p className="mt-2 text-base text-muted">Your Smithstem account is currently marked inactive. Message Smith if you think that's wrong.</p>
          <a
            href={`https://wa.me/2349076217386?text=${encodeURIComponent("Hi Smith, my Smithstem account shows as inactive.")}`}
            className="btn-primary mt-5 inline-flex"
          >
            Message Smith
          </a>
        </main>
      </div>
    );
  }

  // Shared between the trial and active video lists: shows whatever's been
  // reported per platform so far, and — when open — one input per platform
  // the video actually has a link for.
  function reportSummaryAndControls(v) {
    const rep = platformReportsByVideo[v.id];
    const combined = (rep?.tiktok || 0) + (rep?.instagram || 0);
    return (
      <>
        {rep && (
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-tiny text-faint">
            {v.tiktok_url && <span>TikTok: <span className="tnum font-medium text-ink">{rep.tiktok.toLocaleString()}</span></span>}
            {v.insta_url && <span>Instagram: <span className="tnum font-medium text-ink">{rep.instagram.toLocaleString()}</span></span>}
            {v.tiktok_url && v.insta_url && <span>Combined: <span className="tnum font-medium text-ink">{combined.toLocaleString()}</span></span>}
          </p>
        )}
        {reportOpenFor === v.id ? (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            {v.tiktok_url && (
              <label className="text-tiny text-faint">
                TikTok views
                <input className="input tnum mt-0.5 w-28 py-2" type="number" placeholder="e.g. 12,000" value={reportTiktokInput} onChange={(e) => setReportTiktokInput(e.target.value)} />
              </label>
            )}
            {v.insta_url && (
              <label className="text-tiny text-faint">
                Instagram views
                <input className="input tnum mt-0.5 w-28 py-2" type="number" placeholder="e.g. 3,000" value={reportInstaInput} onChange={(e) => setReportInstaInput(e.target.value)} />
              </label>
            )}
            <button className="btn-primary py-2 text-tiny" onClick={() => reportViews(v)}>Save</button>
            <button className="btn-quiet" onClick={() => { setReportOpenFor(null); setReportTiktokInput(""); setReportInstaInput(""); setReportError(""); }}>Cancel</button>
            {reportError && <p className="w-full text-tiny text-noInk">{reportError}</p>}
          </div>
        ) : (
          <button className="btn-quiet mt-1 px-0" onClick={() => { setReportOpenFor(v.id); setReportTiktokInput(""); setReportInstaInput(""); setReportError(""); }}>
            Report views
          </button>
        )}
      </>
    );
  }

  if (creator.status === "trial" || creator.status === "trial_approved") {
    const approved = creator.status === "trial_approved";
    return (
      <div>
        <Header profile={profile} onSignOut={signOut} />
        <main className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-5">
            <p className="kicker">Trial</p>
            <h1 className="font-display text-title font-semibold">Hi, {profile.full_name?.split(" ")[0]}</h1>
          </div>

          {msg && <p className="mb-4 rounded-xl bg-accentSoft px-4 py-3 text-base text-accent">{msg}</p>}

          {approved ? (
            <section className="card mb-4 border-2 border-accent">
              <h2 className="text-lead font-semibold text-accent">One of your videos crossed the mark</h2>
              <p className="mt-1 text-base text-muted">Smith reviewed it and you're clear to join properly. Complete your onboarding to add your bank details and sign your contract — that video carries forward as part of your real posting history, nothing is re-entered.</p>
              <a href="/onboarding" className="btn-primary mt-3 inline-flex">Complete your onboarding</a>
            </section>
          ) : (
            <section className="card mb-4">
              <h2 className="text-lead font-semibold">How the trial works</h2>
              <p className="mt-1 text-base text-muted">Your TikTok and Instagram stay yours — nothing is handed over yet. Post, log each video below, and report the views on it every so often. Once one single video crosses {trialThreshold.toLocaleString()} views, Smith reviews it, and you'll be able to complete your onboarding here.</p>
            </section>
          )}

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
            <h2 className="mb-3 text-lead font-semibold">Your videos</h2>
            {myVideos.length === 0 ? (
              <p className="text-base text-faint">Nothing logged yet. Log your first video above and it will show here.</p>
            ) : (
              <div className="space-y-2">
                {myVideos.map((v) => {
                  const rep = platformReportsByVideo[v.id];
                  const combined = (rep?.tiktok || 0) + (rep?.instagram || 0);
                  return (
                    <div key={v.id} className="rounded-xl border border-line px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-medium">{dayName(v.log_date)} · Post {v.post_number}</span>
                        {rep && (
                          <span className={`badge ${combined >= trialThreshold ? "badge-ok" : "bg-ground text-faint"}`}>{combined.toLocaleString()} views</span>
                        )}
                      </div>
                      {(v.tiktok_url || v.insta_url) && (
                        <div className="mt-1.5 flex flex-wrap gap-3">
                          {v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">TikTok</a>}
                          {v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">Instagram</a>}
                        </div>
                      )}
                      {reportSummaryAndControls(v)}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

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
                  {reportSummaryAndControls(v)}
                </div>
              ))}
            </div>
          )}
        </section>

        {bonusEnabled && (<>
        <section className="card mb-4">
          <h2 className="text-lead font-semibold">Claim a bonus</h2>

          {(bonusView === "link-entry" || bonusView === "link-matched" || bonusView === "link-notfound") && (
            <>
              <p className="mb-3 mt-1 text-tiny text-muted">Paste the TikTok or Instagram link — we'll find it in what you've already logged, so you don't have to go hunting for the date.</p>
              <input
                className="input"
                placeholder="Paste the video link here"
                value={pastedLink}
                onChange={(e) => { setPastedLink(e.target.value); if (bonusView !== "link-entry") setBonusView("link-entry"); }}
              />
              {bonusView === "link-matched" && activeVideo && (
                <div className="mt-3 rounded-xl bg-ground p-3">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-muted">Found it</span>
                    <span className="font-semibold">{dayName(activeVideo.log_date)} · Post {activeVideo.post_number}</span>
                  </div>
                  <span className={`badge mt-2 inline-flex ${videoClaimBadge(activeVideo).cls}`}>{videoClaimBadge(activeVideo).text}</span>
                  <button className="btn-primary mt-3 w-full" onClick={() => openVideoForClaim(activeVideo)}>
                    {claimByVideoId[activeVideo.id] ? "View this video" : "Continue with this video"}
                  </button>
                </div>
              )}
              {bonusView === "link-notfound" && (
                <div className="mt-3 rounded-xl border border-dashed border-line p-3 text-tiny text-muted">
                  Couldn't find that link in what you've logged. Check it's the right one, or pick from your videos instead.
                </div>
              )}
              {bonusView === "link-entry" && (
                <button className="btn-primary mt-3 w-full" onClick={findMyVideo} disabled={!pastedLink.trim()}>Find my video</button>
              )}
              <button className="btn-quiet mt-2 w-full" onClick={() => setBonusView("list")}>Or choose from your logged videos</button>
            </>
          )}

          {bonusView === "list" && (
            <>
              <p className="mb-3 mt-1 text-tiny text-muted">Pick the exact video — already-claimed ones show where they stand, so a second claim can't happen by accident.</p>
              {myVideos.length === 0 ? (
                <p className="text-base text-faint">No videos logged yet. Log one above first, then come back here.</p>
              ) : (
                <div className="space-y-2">
                  {myVideos.map((v) => {
                    const badge = videoClaimBadge(v);
                    const c = claimByVideoId[v.id];
                    const disabled = c && c.status === "pending";
                    return (
                      <button
                        key={v.id}
                        className="w-full rounded-xl border border-line px-3 py-2.5 text-left disabled:opacity-60"
                        disabled={disabled}
                        onClick={() => openVideoForClaim(v)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{dayName(v.log_date)} · Post {v.post_number}</span>
                          <span className={`badge ${badge.cls}`}>{badge.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <button className="btn-quiet mt-2 w-full" onClick={() => setBonusView("link-entry")}>Back to paste a link</button>
            </>
          )}

          {bonusView === "claim-form" && activeVideo && (
            <>
              <p className="mb-1 mt-1 text-base font-medium">{dayName(activeVideo.log_date)} · Post {activeVideo.post_number}</p>
              <p className="mb-3 text-tiny text-muted">Views right now, and a screenshot so Smith can check it.</p>
              <input className="input tnum" type="number" placeholder="Views" value={claimViews} onChange={(e) => setClaimViews(e.target.value)} />
              <label className="input mt-3 flex cursor-pointer items-center justify-between text-muted">
                <span>{claimScreenshot ? claimScreenshot.name : "Screenshot of the views"}</span>
                <span className="text-tiny font-semibold text-accent">{claimScreenshot ? "Change" : "Choose"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setClaimScreenshot(e.target.files?.[0] || null)} />
              </label>
              {claimError && <p className="mt-2 text-base text-red-600">{claimError}</p>}
              <div className="mt-3 flex gap-3">
                <button className="btn-secondary flex-1" onClick={resetClaimFlow}>Cancel</button>
                <button className="btn-primary flex-1" onClick={submitClaim} disabled={busy}>{busy ? "Sending…" : "Send to Smith"}</button>
              </div>
            </>
          )}

          {bonusView === "already-waiting" && activeVideo && (
            <>
              <p className="mb-1 mt-1 text-base font-medium">{dayName(activeVideo.log_date)} · Post {activeVideo.post_number}</p>
              <p className="mt-2 rounded-lg bg-waitingBg px-3 py-2 text-tiny text-waitingInk">You already sent a claim for this video — it's waiting on Smith. Nothing else to do until she reviews it.</p>
              <button className="btn-quiet mt-2" onClick={resetClaimFlow}>Back</button>
            </>
          )}

          {bonusView === "already-approved" && activeVideo && (
            <>
              <p className="mb-1 mt-1 text-base font-medium">{dayName(activeVideo.log_date)} · Post {activeVideo.post_number}</p>
              <p className="mb-3 text-tiny text-muted">This one's already approved. If it kept growing past its tier, report the new views instead of sending a new claim.</p>
              <input className="input tnum" type="number" placeholder="New views" value={growthViews2} onChange={(e) => setGrowthViews2(e.target.value)} />
              {growthError2 && <p className="mt-2 text-base text-red-600">{growthError2}</p>}
              <div className="mt-3 flex gap-3">
                <button className="btn-secondary flex-1" onClick={resetClaimFlow}>Back</button>
                <button className="btn-primary flex-1" onClick={submitGrowthForActiveClaim}>Send to Smith</button>
              </div>
            </>
          )}
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
                    <span className="flex gap-3">
                      {c.video_url && <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">See the video</a>}
                      {c.screenshot_url && <button type="button" onClick={() => viewEvidence(c.screenshot_url)} className="font-medium text-accent underline">See the screenshot</button>}
                    </span>
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
        </>)}

        <PaymentsSection payments={payments} />
      </main>
    </div>
  );
}

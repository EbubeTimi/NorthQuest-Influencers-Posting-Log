"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, withTimeout } from "../../lib/supabaseClient";
import { today, postingDay, monthBoundsLocal, mostRecentMonthWeekBoundary, daysBetween, dayBefore, isBeforeNoon } from "../../lib/domain";
import { contentGuideFor } from "../../lib/contentGuide";
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
  const [videoForm, setVideoForm] = useState({ date: postingDay(), post: "1", tiktok: "", insta: "", facebook: "" });
  const [checkinAnswers, setCheckinAnswers] = useState({});
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [checkinError, setCheckinError] = useState("");
  const [checkinJustDone, setCheckinJustDone] = useState(false);
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
  const [reportFacebookInput, setReportFacebookInput] = useState("");
  const [reportError, setReportError] = useState("");
  const [trialThreshold, setTrialThreshold] = useState(10000);
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const [bizSlug, setBizSlug] = useState("");
  const [contentGuideOpen, setContentGuideOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [logsOpen, setLogsOpen] = useState(false);
  // Consumed once: /trial/[slug] sets this right before sending someone here
  // for the first time. Read and cleared on mount, so a refresh or a later
  // visit never sees the full trial-explainer again — only that first load
  // does. Not in sessionStorage's absence (SSR) — defaults to false there.
  const [justOnboarded] = useState(() => {
    if (typeof window === "undefined") return false;
    const flag = sessionStorage.getItem("smithstem_just_onboarded") === "1";
    if (flag) sessionStorage.removeItem("smithstem_just_onboarded");
    return flag;
  });
  const [issueNote, setIssueNote] = useState("");
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
      supabase.from("businesses").select("trial_view_threshold, bonus_enabled, slug").eq("id", cr.business_id).maybeSingle(),
    ]);
    setVideos(v || []); setClaims(b || []); setPayments(pay || []);
    setTrialThreshold(bizSettings?.trial_view_threshold || 10000);
    setBonusEnabled(bizSettings?.bonus_enabled !== false);
    setBizSlug(bizSettings?.slug || "");
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
  // Once real logs are in, land the picker on whichever slot is actually
  // still open for the selected date, rather than always assuming Video 1.
  useEffect(() => {
    const slotOneDone = myVideos.some((v) => v.log_date === videoForm.date && v.post_number === 1);
    setVideoForm((f) => (f.date === videoForm.date ? { ...f, post: slotOneDone ? "2" : "1" } : f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myVideos, videoForm.date]);
  async function signOut() { await supabaseBrowser().auth.signOut(); router.replace("/"); }

  async function logVideo(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("video_logs").insert({ business_id: creator.business_id, creator_id: creator.id, log_date: videoForm.date, post_number: Number(videoForm.post), tiktok_url: videoForm.tiktok || null, insta_url: videoForm.insta || null, facebook_url: videoForm.facebook || null, issue_note: issueNote.trim() || null, logged_by: "creator" });
    setBusy(false);
    if (error) {
      // The database refuses a second video with the same date and post number.
      const dupe = error.message?.includes("duplicate") || error.code === "23505";
      setMsg(dupe ? "You have already logged that post for that day." : "Could not save: " + error.message);
      return;
    }
    setMsg("Video logged."); setVideoForm((f) => ({ ...f, tiktok: "", insta: "", facebook: "" })); setIssueNote(""); load();
  }
  // What's already logged for a given date, by post number — this is what
  // makes the Video 1/Video 2 tiles date-aware rather than only ever
  // reflecting today, and what locks a slot once it's actually submitted.
  function loggedSlotsForDate(dateStr) {
    const slots = { 1: false, 2: false };
    myVideos.forEach((v) => { if (v.log_date === dateStr) slots[v.post_number] = true; });
    return slots;
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
    if (video.facebook_url && reportFacebookInput.trim()) {
      const n = Number(reportFacebookInput);
      if (!n || n <= 0) { setReportError("Enter a valid Facebook view count."); return; }
      rows.push({ business_id: creator.business_id, creator_id: creator.id, video_log_id: video.id, views: n, platform: "facebook" });
    }
    if (!rows.length) { setReportError("Enter at least one view count."); return; }
    const { error } = await supabaseBrowser().from("video_view_reports").insert(rows);
    if (error) { setReportError(error.message); return; }
    setReportOpenFor(null); setReportTiktokInput(""); setReportInstaInput(""); setReportFacebookInput(""); setMsg("Views reported."); load();
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
    const match = myVideos.find((v) => (v.tiktok_url && normalizeLink(v.tiktok_url) === needle) || (v.insta_url && normalizeLink(v.insta_url) === needle) || (v.facebook_url && normalizeLink(v.facebook_url) === needle));
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
    const link = activeVideo.tiktok_url || activeVideo.insta_url || activeVideo.facebook_url || null;
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
    const platformCount = [v.tiktok_url, v.insta_url, v.facebook_url].filter(Boolean).length;
    const combined = (rep?.tiktok || 0) + (rep?.instagram || 0) + (rep?.facebook || 0);
    return (
      <>
        {rep && (
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-tiny text-faint">
            {v.tiktok_url && <span>TikTok: <span className="tnum font-medium text-ink">{rep.tiktok.toLocaleString()}</span></span>}
            {v.insta_url && <span>Instagram: <span className="tnum font-medium text-ink">{rep.instagram.toLocaleString()}</span></span>}
            {v.facebook_url && <span>Facebook: <span className="tnum font-medium text-ink">{rep.facebook.toLocaleString()}</span></span>}
            {platformCount > 1 && <span>Combined: <span className="tnum font-medium text-ink">{combined.toLocaleString()}</span></span>}
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
            {v.facebook_url && (
              <label className="text-tiny text-faint">
                Facebook views
                <input className="input tnum mt-0.5 w-28 py-2" type="number" placeholder="e.g. 3,000" value={reportFacebookInput} onChange={(e) => setReportFacebookInput(e.target.value)} />
              </label>
            )}
            <button className="btn-primary py-2 text-tiny" onClick={() => reportViews(v)}>Save</button>
            <button className="btn-quiet" onClick={() => { setReportOpenFor(null); setReportTiktokInput(""); setReportInstaInput(""); setReportFacebookInput(""); setReportError(""); }}>Cancel</button>
            {reportError && <p className="w-full text-tiny text-noInk">{reportError}</p>}
          </div>
        ) : (
          <button className="btn-quiet mt-1 px-0" onClick={() => { setReportOpenFor(v.id); setReportTiktokInput(""); setReportInstaInput(""); setReportFacebookInput(""); setReportError(""); }}>
            Report views
          </button>
        )}
      </>
    );
  }

  // Every video logged before this week's boundary needs every platform it
  // was posted to reported before a new video can be logged — universal
  // Sunday check-in, not a personal clock per creator, and never applied
  // before someone's had a full week on the platform to actually catch up.
  function isFullyReported(v) {
    const rep = platformReportsByVideo[v.id] || {};
    if (v.tiktok_url && !rep.tiktok) return false;
    if (v.insta_url && !rep.instagram) return false;
    if (v.facebook_url && !rep.facebook) return false;
    return true;
  }
  const weekBoundary = mostRecentMonthWeekBoundary(today());
  const joinedDaysAgo = daysBetween(creator.joined_at, today());
  const unreportedOldVideos = myVideos.filter((v) => v.log_date < weekBoundary && !isFullyReported(v));
  const weeklyGateActive = joinedDaysAgo >= 7 && unreportedOldVideos.length > 0;
  const graceAvailable = isBeforeNoon();
  const yesterday = dayBefore(today());

  function updateCheckinAnswer(videoId, platform, value) {
    setCheckinAnswers((a) => ({ ...a, [videoId]: { ...(a[videoId] || {}), [platform]: value } }));
  }
  function checkinRowDone(v) {
    const a = checkinAnswers[v.id] || {};
    if (v.tiktok_url && !(v.tiktok_url && (platformReportsByVideo[v.id]?.tiktok || a.tiktok))) return false;
    if (v.insta_url && !(platformReportsByVideo[v.id]?.instagram || a.instagram)) return false;
    if (v.facebook_url && !(platformReportsByVideo[v.id]?.facebook || a.facebook)) return false;
    return true;
  }
  async function submitWeeklyCheckin() {
    setCheckinError(""); setCheckinBusy(true);
    const rows = [];
    for (const v of unreportedOldVideos) {
      const a = checkinAnswers[v.id] || {};
      if (v.tiktok_url && !platformReportsByVideo[v.id]?.tiktok) {
        const n = Number(a.tiktok);
        if (!n || n <= 0) { setCheckinBusy(false); setCheckinError("Enter every view count before continuing."); return; }
        rows.push({ business_id: creator.business_id, creator_id: creator.id, video_log_id: v.id, views: n, platform: "tiktok" });
      }
      if (v.insta_url && !platformReportsByVideo[v.id]?.instagram) {
        const n = Number(a.instagram);
        if (!n || n <= 0) { setCheckinBusy(false); setCheckinError("Enter every view count before continuing."); return; }
        rows.push({ business_id: creator.business_id, creator_id: creator.id, video_log_id: v.id, views: n, platform: "instagram" });
      }
      if (v.facebook_url && !platformReportsByVideo[v.id]?.facebook) {
        const n = Number(a.facebook);
        if (!n || n <= 0) { setCheckinBusy(false); setCheckinError("Enter every view count before continuing."); return; }
        rows.push({ business_id: creator.business_id, creator_id: creator.id, video_log_id: v.id, views: n, platform: "facebook" });
      }
    }
    const { error } = await supabaseBrowser().from("video_view_reports").insert(rows);
    setCheckinBusy(false);
    if (error) { setCheckinError(error.message); return; }
    setCheckinAnswers({}); setCheckinJustDone(true); load();
  }

  // Picking a slot to submit into — whichever is the first not-yet-logged
  // slot for that date, so a date change (Today ↔ Yesterday) always lands
  // on the right tile without the creator having to think about it.
  function pickDate(dateStr) {
    const slots = loggedSlotsForDate(dateStr);
    setVideoForm((f) => ({ ...f, date: dateStr, post: !slots[1] ? "1" : "2" }));
  }
  function logVideoDateChips() {
    if (!graceAvailable) {
      return (
        <div className="col-span-2 mb-1 flex items-center justify-between rounded-xl border border-line bg-ground px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-tiny font-semibold">
            <span className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-faint" />
            {new Date(today() + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="text-tiny text-faint">Today only</span>
        </div>
      );
    }
    return (
      <div className="col-span-2 mb-1 flex gap-2">
        <button type="button" className={`flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-center text-tiny font-semibold ${videoForm.date === today() ? "border-accent bg-accentSoft text-accent" : "border-line text-muted"}`} onClick={() => pickDate(today())}>
          Today
        </button>
        <button type="button" className={`flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-center text-tiny font-semibold ${videoForm.date === yesterday ? "border-[#2A4E8C] bg-[#E3EBF9] text-[#2A4E8C]" : "border-[#B7C9E6] bg-[#EEF3FB] text-[#2A4E8C]"}`} onClick={() => pickDate(yesterday)}>
          Yesterday
          <span className="block text-[10px] font-medium opacity-80">until 12pm today</span>
        </button>
      </div>
    );
  }
  // The Video 1 / Video 2 tiles — date-aware (switching Today ↔ Yesterday
  // reflects that date's own progress, not today's), and a submitted slot
  // shows as done and locked rather than just "unavailable."
  function videoTilePicker() {
    const slots = loggedSlotsForDate(videoForm.date);
    return (
      <div className="col-span-2 mb-1 flex gap-2.5">
        {[1, 2].map((n) => {
          const done = slots[n];
          const locked = n === 2 && !slots[1];
          const selected = !done && !locked && String(videoForm.post) === String(n);
          return (
            <button
              type="button"
              key={n}
              disabled={locked || done}
              onClick={() => setVideoForm((f) => ({ ...f, post: String(n) }))}
              className={`relative flex-1 rounded-2xl border-[1.5px] px-3 py-4 text-center ${
                done ? "border-okBg bg-[#F7FCF9] cursor-default" : locked ? "cursor-not-allowed border-line opacity-50" : selected ? "border-accent bg-accentSoft" : "border-line"
              }`}
            >
              {done && <span className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-okInk text-[11px] font-bold text-white">✓</span>}
              <p className={`font-display text-title font-bold ${done ? "text-okInk" : selected ? "text-accent" : "text-faint"}`}>{n}</p>
              <p className={`mt-0.5 text-[11px] font-bold uppercase tracking-wide ${done ? "text-okInk" : selected ? "text-accent" : "text-faint"}`}>{n === 1 ? "First video" : "Second video"}</p>
              <p className="mt-1.5 text-[11.5px] leading-tight text-faint">
                {done ? "Already logged — can't be changed here" : locked ? "Submit Video 1 first — then this unlocks" : "This is the video you're submitting now"}
              </p>
            </button>
          );
        })}
      </div>
    );
  }

  function weeklyCheckinCard() {
    const doneCount = unreportedOldVideos.filter(checkinRowDone).length;
    return (
      <section className="card mb-4">
        <h2 className="mb-1 text-lead font-semibold">Report this week's views first</h2>
        <p className="mt-1 text-base text-muted">It's Sunday check-in day. Report views for everything you posted before this week before logging your next video — only the platforms you actually posted to show below.</p>
        <p className="mt-1 text-tiny font-medium text-accent">You're not locked out — this takes a minute, then you're straight back to logging normally.</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accentSoft">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round((doneCount / unreportedOldVideos.length) * 100)}%` }} />
        </div>
        <p className="mt-1 text-tiny text-faint">{doneCount} of {unreportedOldVideos.length} reported</p>
        <div className="mt-3 space-y-2">
          {unreportedOldVideos.map((v) => {
            const done = checkinRowDone(v);
            return (
              <div key={v.id} className={`rounded-xl border px-3 py-2.5 ${done ? "border-okBg bg-accentSoft/30" : "border-line"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-tiny font-semibold">{dayName(v.log_date)} · Post {v.post_number}</span>
                  {done && <span className="badge badge-ok">✓ Reported</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-end gap-2">
                  {v.tiktok_url && !platformReportsByVideo[v.id]?.tiktok && (
                    <label className="text-tiny text-faint">TikTok views
                      <input className="input tnum mt-0.5 w-24 py-1.5" type="number" value={checkinAnswers[v.id]?.tiktok || ""} onChange={(e) => updateCheckinAnswer(v.id, "tiktok", e.target.value)} />
                    </label>
                  )}
                  {v.insta_url && !platformReportsByVideo[v.id]?.instagram && (
                    <label className="text-tiny text-faint">Instagram views
                      <input className="input tnum mt-0.5 w-24 py-1.5" type="number" value={checkinAnswers[v.id]?.instagram || ""} onChange={(e) => updateCheckinAnswer(v.id, "instagram", e.target.value)} />
                    </label>
                  )}
                  {v.facebook_url && !platformReportsByVideo[v.id]?.facebook && (
                    <label className="text-tiny text-faint">Facebook views
                      <input className="input tnum mt-0.5 w-24 py-1.5" type="number" value={checkinAnswers[v.id]?.facebook || ""} onChange={(e) => updateCheckinAnswer(v.id, "facebook", e.target.value)} />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {checkinError && <p className="mt-2 text-base text-red-600">{checkinError}</p>}
        <button className="btn-primary mt-3 w-full" disabled={checkinBusy || doneCount < unreportedOldVideos.length} onClick={submitWeeklyCheckin}>
          {checkinBusy ? "Saving…" : "Continue to log your next video"}
        </button>
      </section>
    );
  }

  function contentIdeasCard() {
    const guide = contentGuideFor(bizSlug);
    if (!guide) return null;
    return (
      <section className="card mb-4">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setContentGuideOpen((o) => !o)}>
          <h2 className="text-lead font-semibold">Content ideas</h2>
          <span className="text-tiny text-faint">{contentGuideOpen ? "Hide" : "Show"}</span>
        </button>
        {contentGuideOpen && (
          <div className="mt-2">
            <p className="text-tiny text-muted">{guide.styleLine}</p>
            <div className="mt-3 space-y-2">
              {guide.formats.map((f) => (
                <div key={f.name} className="rounded-xl border border-line px-3 py-2">
                  <p className="text-tiny font-semibold text-accent">{f.name}</p>
                  <p className="mt-0.5 text-tiny text-muted">{f.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-tiny text-faint">
              Every video goes through Ella before it's posted. Follow her on TikTok — <a href="https://www.tiktok.com/@ellaikipo" target="_blank" rel="noopener noreferrer" className="text-accent underline">@ellaikipo</a> — to stay in the loop.
            </p>
          </div>
        )}
      </section>
    );
  }

  if (creator.status === "trial" || creator.status === "trial_approved") {
    const approved = creator.status === "trial_approved";
    const videosThisMonth = videos.length;
    const loggedDates = new Set(videos.map((v) => v.log_date));
    const fullDays = new Set();
    const dayHasPost = {};
    videos.forEach((v) => { (dayHasPost[v.log_date] ||= new Set()).add(v.post_number); });
    Object.entries(dayHasPost).forEach(([d, posts]) => { if (posts.has(1) && posts.has(2)) fullDays.add(d); });
    let daysMissed = 0;
    const monthCursor = new Date(start + "T00:00:00");
    const todayStr = today();
    while (monthCursor.toISOString().slice(0, 10) <= todayStr && monthCursor.toISOString().slice(0, 10) <= end) {
      const d = monthCursor.toISOString().slice(0, 10);
      if (!loggedDates.has(d)) daysMissed += 1;
      monthCursor.setDate(monthCursor.getDate() + 1);
    }
    const illustrativeBasePay = creator.base_pay || 0;
    const recentDates = [...new Set(myVideos.map((v) => v.log_date))].sort((a, b) => (a < b ? 1 : -1)).slice(0, 7);
    const dayLoggedToday = loggedSlotsForDate(videoForm.date);
    const doneToday = (dayLoggedToday[1] ? 1 : 0) + (dayLoggedToday[2] ? 1 : 0);

    return (
      <div>
        <Header profile={profile} onSignOut={signOut} />
        <main className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-5">
            <p className="kicker">Trial</p>
            <h1 className="font-display text-title font-semibold">Hi, {profile.full_name?.split(" ")[0]}</h1>
          </div>

          {msg && <p className="mb-4 rounded-xl bg-accentSoft px-4 py-3 text-base text-accent">{msg}</p>}

          {screen === "home" && (
            <>
              {approved && (
                <section className="card mb-4 border-2 border-accent">
                  <h2 className="text-lead font-semibold text-accent">One of your videos crossed the mark</h2>
                  <p className="mt-1 text-base text-muted">Smith reviewed it and you're clear to join properly. Complete your onboarding to add your bank details and sign your contract — that video carries forward as part of your real posting history, nothing is re-entered.</p>
                  <a href="/onboarding" className="btn-primary mt-3 inline-flex">Complete your onboarding</a>
                </section>
              )}

              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="card px-2 py-3 text-center">
                  <p className="tnum font-display text-title font-semibold text-accent">{videosThisMonth}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">Videos this month</p>
                </div>
                <div className="card px-2 py-3 text-center">
                  <p className="tnum font-display text-title font-semibold text-accent">{fullDays.size}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">Days fully done</p>
                </div>
                <div className="card px-2 py-3 text-center">
                  <p className="tnum font-display text-title font-semibold text-accent">{daysMissed}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">Days missed</p>
                </div>
              </div>

              {illustrativeBasePay > 0 && (
                <p className="mb-4 rounded-lg border border-dashed border-gold bg-[#FFFBF0] px-3 py-2 text-tiny">
                  If you were an active creator right now: <span className="tnum font-semibold">{naira(illustrativeBasePay)}</span>/month base pay, at your current posting pace — this is what to expect once approved, not a payment you're owed while on trial.
                </p>
              )}

              <button type="button" className="mb-3 flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-4 text-left shadow-card" onClick={() => setScreen("log")}>
                <span>
                  <span className="block font-semibold">Log your videos</span>
                  <span className="mt-0.5 block text-tiny text-muted">{doneToday === 0 ? "Nothing logged yet today" : doneToday === 1 ? "Video 1 done — Video 2 next" : "Both done for today"}</span>
                </span>
                <span className="text-lead text-accent">→</span>
              </button>

              {justOnboarded ? (
                <section className="card mb-4">
                  <h2 className="text-lead font-semibold">How the trial works</h2>
                  <p className="mt-1 text-base text-muted">Your accounts stay yours — nothing is handed over yet. Post the same video to TikTok, Instagram, and Facebook (Facebook posts go out automatically once it's linked to Instagram), and report the views on it every so often. Once one single video crosses {trialThreshold.toLocaleString()} views on any platform, Smith reviews it, and you'll be able to complete your onboarding here. Every video goes through Ella for quality review first.</p>
                </section>
              ) : null}
            </>
          )}

          {screen === "log" && (
            <>
              <button type="button" className="btn-quiet mb-3 px-0" onClick={() => setScreen("home")}>← Back to dashboard</button>

              {weeklyGateActive ? weeklyCheckinCard() : (
                <section className="card mb-4">
                  {checkinJustDone && (
                    <p className="mb-3 flex items-center gap-2 rounded-lg bg-accentSoft px-3 py-2 text-tiny text-accent">
                      <span className="badge badge-ok">✓ Caught up</span> Thanks — you can log normally again.
                    </p>
                  )}
                  <h2 className="mb-2 text-lead font-semibold">Log a video</h2>
                  <div className={`mb-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-tiny ${doneToday === 2 ? "bg-okBg text-okInk" : "bg-ground"}`}>
                    <span className={`h-2 w-2 rounded-full ${doneToday === 2 ? "bg-okInk" : "bg-faint"}`} />
                    {doneToday === 0 ? `Nothing logged yet for ${videoForm.date === today() ? "today" : "yesterday"}. Submit the first one below.` : doneToday === 1 ? "Video 1 is in — submit Video 2 next." : "Both videos are in. Nice work."}
                  </div>

                  <button type="button" className="mb-3 flex w-full items-center justify-between rounded-xl bg-accentSoft px-3.5 py-3 text-left text-tiny font-semibold text-accent" onClick={() => setLogsOpen((o) => !o)}>
                    <span>View my logs for this month</span>
                    <span className={`transition-transform ${logsOpen ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {logsOpen && (
                    <div className="mb-3 space-y-1 rounded-xl border border-line px-3 py-2">
                      {recentDates.length === 0 && <p className="py-2 text-tiny text-faint">Nothing logged yet.</p>}
                      {recentDates.map((d) => {
                        const dayVideos = myVideos.filter((v) => v.log_date === d).sort((a, b) => a.post_number - b.post_number);
                        return (
                          <div key={d} className="flex items-start gap-3 border-b border-line py-2 last:border-0">
                            <div className="w-14 shrink-0">
                              <p className="tnum text-tiny font-bold">{dayName(d)}</p>
                              {d === today() && <p className="text-[10px] font-bold text-accent">Today</p>}
                            </div>
                            <div className="flex-1 space-y-1">
                              {[1, 2].map((postNum) => {
                                const v = dayVideos.find((x) => x.post_number === postNum);
                                if (!v) return <p key={postNum} className="text-tiny text-faint">Video {postNum} — not logged</p>;
                                const rep = platformReportsByVideo[v.id];
                                const fullyReported = isFullyReported(v);
                                return (
                                  <div key={postNum} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-tiny">
                                    <span className={fullyReported ? "font-bold text-okInk" : ""}>{fullyReported ? "✓" : "◦"}</span>
                                    <span>Video {postNum}</span>
                                    {v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">TikTok ↗</a>}
                                    {v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">Instagram ↗</a>}
                                    {v.facebook_url && <a href={v.facebook_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">Facebook ↗</a>}
                                    {fullyReported ? (
                                      <span className="tnum text-muted">{((rep?.tiktok || 0) + (rep?.instagram || 0) + (rep?.facebook || 0)).toLocaleString()} views</span>
                                    ) : (
                                      <span className="text-waitingInk">views not reported yet</span>
                                    )}
                                    {reportSummaryAndControls(v)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {doneToday < 2 && (
                    <form onSubmit={logVideo} className="grid grid-cols-2 gap-3">
                      {logVideoDateChips()}
                      {graceAvailable && <p className="col-span-2 -mt-1 mb-1 text-tiny text-faint">Switching dates shows what's already logged for that day too.</p>}
                      {videoTilePicker()}
                      <input className="input col-span-2" placeholder="TikTok link" value={videoForm.tiktok} onChange={(e) => setVideoForm((f) => ({ ...f, tiktok: e.target.value }))} />
                      <input className="input col-span-2" placeholder="Instagram link" value={videoForm.insta} onChange={(e) => setVideoForm((f) => ({ ...f, insta: e.target.value }))} />
                      <input className="input col-span-2" placeholder="Facebook link (optional)" value={videoForm.facebook} onChange={(e) => setVideoForm((f) => ({ ...f, facebook: e.target.value }))} />
                      <p className="col-span-2 -mt-1.5 text-tiny text-faint">If a platform is unavailable or your account is restricted, paste the other link only.</p>
                      <input className="input col-span-2" placeholder="Any issues today? (optional)" value={issueNote} onChange={(e) => setIssueNote(e.target.value)} />
                      <button className="btn-primary col-span-2" disabled={busy}>{busy ? "Saving…" : "Submit video"}</button>
                    </form>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  const waitingCount = claims.filter((c) => c.status === "pending").length;
  const dayLoggedActive = loggedSlotsForDate(videoForm.date);
  const doneTodayActive = (dayLoggedActive[1] ? 1 : 0) + (dayLoggedActive[2] ? 1 : 0);

  return (
    <div>
      <Header profile={profile} onSignOut={signOut} />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-5">
          <p className="kicker">{label}</p>
          <h1 className="font-display text-title font-semibold">Hi, {profile.full_name?.split(" ")[0]}</h1>
        </div>

        {msg && <p className="mb-4 rounded-xl bg-accentSoft px-4 py-3 text-base text-accent">{msg}</p>}

        {screen === "home" && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="card px-3 py-3.5 text-center">
                <p className="tnum font-display text-title font-semibold text-accent">{naira(creator.base_pay)}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">Base pay</p>
              </div>
              <div className="card px-3 py-3.5 text-center">
                <p className="tnum font-display text-title font-semibold text-accent">{videos.length}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">Videos this month</p>
              </div>
              <div className="card px-3 py-3.5 text-center">
                <p className="tnum font-display text-title font-semibold text-gold">{myVideos.length}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">Videos overall</p>
              </div>
              <div className="card px-3 py-3.5 text-center">
                <p className="tnum font-display text-title font-semibold text-accent">{claims.length}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">{waitingCount > 0 ? `${waitingCount} waiting on Smith` : "Bonus claims"}</p>
              </div>
            </div>

            <button type="button" className="mb-2.5 flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-4 text-left shadow-card" onClick={() => setScreen("log")}>
              <span>
                <span className="block font-semibold">Log your videos</span>
                <span className="mt-0.5 block text-tiny text-muted">{doneTodayActive === 0 ? "Nothing logged yet today" : doneTodayActive === 1 ? "Video 1 done — Video 2 next" : "Both done for today"}</span>
              </span>
              <span className="text-lead text-accent">→</span>
            </button>

            {bonusEnabled && (
              <button type="button" className="mb-2.5 flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-4 text-left shadow-card" onClick={() => setScreen("bonus")}>
                <span>
                  <span className="block font-semibold">Claim a bonus</span>
                  <span className="mt-0.5 block text-tiny text-muted">Once a video crosses a milestone</span>
                </span>
                <span className="text-lead text-accent">→</span>
              </button>
            )}

            <button type="button" className="mb-4 flex w-full items-center justify-between rounded-2xl border border-line bg-white px-4 py-4 text-left shadow-card" onClick={() => setScreen("payments")}>
              <span>
                <span className="block font-semibold">Your payments</span>
                <span className="mt-0.5 block text-tiny text-muted">{payments.some((p) => String(p.payment_status).toLowerCase() === "paid") ? "See what's been paid" : "Nothing paid out yet"}</span>
              </span>
              <span className="text-lead text-accent">→</span>
            </button>

            {contentIdeasCard()}
          </>
        )}

        {screen === "log" && (
          <>
            <button type="button" className="btn-quiet mb-3 px-0" onClick={() => setScreen("home")}>← Back to dashboard</button>

            <section className="card mb-4">
              <h2 className="mb-2 text-lead font-semibold">Log a video</h2>
              <div className={`mb-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-tiny ${doneTodayActive === 2 ? "bg-okBg text-okInk" : "bg-ground"}`}>
                <span className={`h-2 w-2 rounded-full ${doneTodayActive === 2 ? "bg-okInk" : "bg-faint"}`} />
                {doneTodayActive === 0 ? `Nothing logged yet for ${videoForm.date === today() ? "today" : "yesterday"}. Submit the first one below.` : doneTodayActive === 1 ? "Video 1 is in — submit Video 2 next." : "Both videos are in. Nice work."}
              </div>

              <button type="button" className="mb-3 flex w-full items-center justify-between rounded-xl bg-accentSoft px-3.5 py-3 text-left text-tiny font-semibold text-accent" onClick={() => setLogsOpen((o) => !o)}>
                <span>View my logs for this month</span>
                <span className={`transition-transform ${logsOpen ? "rotate-180" : ""}`}>⌄</span>
              </button>
              {logsOpen && (
                <div className="mb-3 space-y-2">
                  {videos.length === 0 && <p className="py-2 text-tiny text-faint">Nothing logged yet.</p>}
                  {videos.map((v) => (
                    <div key={v.id} className="rounded-xl border border-line px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-tiny font-medium">{dayName(v.log_date)} · Post {v.post_number}</span>
                        {v.logged_by === "admin"
                          ? <span className="badge bg-accentSoft text-accent">Logged by Smith</span>
                          : <span className="badge bg-ground text-muted">You logged this</span>}
                      </div>
                      {(v.tiktok_url || v.insta_url || v.facebook_url) && (
                        <div className="mt-1.5 flex flex-wrap gap-3">
                          {v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">TikTok</a>}
                          {v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">Instagram</a>}
                          {v.facebook_url && <a href={v.facebook_url} target="_blank" rel="noopener noreferrer" className="text-tiny font-medium text-accent underline">Facebook</a>}
                        </div>
                      )}
                      {reportSummaryAndControls(v)}
                    </div>
                  ))}
                </div>
              )}

              {doneTodayActive < 2 && (
                <form onSubmit={logVideo} className="grid grid-cols-2 gap-3">
                  {logVideoDateChips()}
                  {graceAvailable && <p className="col-span-2 -mt-1 mb-1 text-tiny text-faint">Switching dates shows what's already logged for that day too.</p>}
                  {videoTilePicker()}
                  <input className="input col-span-2" placeholder="TikTok link" value={videoForm.tiktok} onChange={(e) => setVideoForm((f) => ({ ...f, tiktok: e.target.value }))} />
                  <input className="input col-span-2" placeholder="Instagram link" value={videoForm.insta} onChange={(e) => setVideoForm((f) => ({ ...f, insta: e.target.value }))} />
                  <input className="input col-span-2" placeholder="Facebook link (optional)" value={videoForm.facebook} onChange={(e) => setVideoForm((f) => ({ ...f, facebook: e.target.value }))} />
                  <p className="col-span-2 -mt-1.5 text-tiny text-faint">If a platform is unavailable or your account is restricted, paste the other link only.</p>
                  <input className="input col-span-2" placeholder="Any issues today? (optional)" value={issueNote} onChange={(e) => setIssueNote(e.target.value)} />
                  <button className="btn-primary col-span-2" disabled={busy}>{busy ? "Saving…" : "Submit video"}</button>
                </form>
              )}
            </section>
          </>
        )}

        {screen === "bonus" && bonusEnabled && (<>
        <button type="button" className="btn-quiet mb-3 px-0" onClick={() => setScreen("home")}>← Back to dashboard</button>
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

        {screen === "payments" && (<>
        <button type="button" className="btn-quiet mb-3 px-0" onClick={() => setScreen("home")}>← Back to dashboard</button>
        <PaymentsSection payments={payments} />
        </>)}
      </main>
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, withTimeout } from "../../lib/supabaseClient";
import { rate, fmtNaira, bonusForViews, tiersOn, today, monthBoundsLocal, postsExpectedIn } from "../../lib/domain";
import Header from "../../components/Header";
import LoadingScreen from "../../components/LoadingScreen";
function firstOfMonth(ym) { return `${ym}-01`; }
function todayYm() { return monthBoundsLocal().month; }
function monthEndOf(ym) { const start = new Date(firstOfMonth(ym)); return new Date(start.getFullYear(), start.getMonth() + 1, 0).toISOString().slice(0, 10); }
// Excel, Numbers, and Sheets all open CSV natively — no spreadsheet library
// needed for a flat table with no formulas or formatting. (The one JS
// library for real .xlsx generation, SheetJS's "xlsx" package, currently
// ships with an unpatched prototype-pollution/ReDoS advisory on npm; not
// worth pulling in for something CSV already covers.)
function downloadCsv(filename, headers, rows) {
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// Defined once here and in globals.css, so no screen invents its own amber.
const STATUS_STYLE = { pending: "bg-waitingBg text-waitingInk", approved: "bg-okBg text-okInk", rejected: "bg-noBg text-noInk" };
export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [thresholdInput, setThresholdInput] = useState("");
  const [thresholdMsg, setThresholdMsg] = useState("");
  const [tab, setTab] = useState("approvals");
  const [creators, setCreators] = useState([]);
  const [trialVideos, setTrialVideos] = useState([]);
  const [viewReportsByVideo, setViewReportsByVideo] = useState({});
  const [viewsRegister, setViewsRegister] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [pending, setPending] = useState([]);
  const [growthUpdates, setGrowthUpdates] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteLabel, setInviteLabel] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [lastInvite, setLastInvite] = useState(null);
  const [ym, setYm] = useState(todayYm());
  const [payments, setPayments] = useState([]);
  const [videoCountByCreator, setVideoCountByCreator] = useState({});
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedCreatorVideos, setSelectedCreatorVideos] = useState([]);
  const [selectedCreatorClaims, setSelectedCreatorClaims] = useState([])
  const [selectedCreatorPayments, setSelectedCreatorPayments] = useState([]);
  const [paymentsByCreator, setPaymentsByCreator] = useState({});
  const [contractError, setContractError] = useState("")

  // The contracts bucket is private, so a stored link cannot be opened
  // directly. Sign it on demand instead, and only for as long as it takes to
  // open. Rows written before this stored a full public URL that never worked;
  // the path is recovered from them rather than leaving those creators broken.
  async function openContract(c) {
    setContractError("");
    const raw = c.contract_file_url || "";
    const path = raw.includes("/contracts/") ? raw.split("/contracts/")[1].split("?")[0] : raw;
    const { data, error } = await supabaseBrowser().storage.from("contracts").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) { setContractError("Could not open that contract: " + (error?.message || "the file is missing")); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
;
  const [msg, setMsg] = useState("");
  const [loadError, setLoadError] = useState("");
  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    // Everything below this point only fills in cards on a screen that is
    // already showing — this is the part that decides whether the loading
    // screen ever clears, so it is the part that must never hang silently.
    let user, prof;
    try {
      const res = await withTimeout(supabase.auth.getUser());
      user = res.data;
      if (!user.user) { router.replace("/"); return; }
      const profRes = await withTimeout(supabase.from("profiles").select("*").eq("id", user.user.id).maybeSingle());
      if (profRes.error) throw profRes.error;
      prof = profRes.data;
    } catch (err) {
      setLoadError(err.message || "Something went wrong loading the admin dashboard.");
      return;
    }
    if (!prof || prof.role !== "admin") { router.replace("/dashboard"); return; }
    setLoadError("");
    setProfile(prof);
    const { data: biz } = await supabase.from("businesses").select("id, slug, name, trial_view_threshold").eq("id", prof.business_id).maybeSingle();
    setBusiness(biz || null);
    if (biz) setThresholdInput(String(biz.trial_view_threshold));
    const { data: cr } = await supabase.from("creators").select("*, profiles(full_name, email, phone)").eq("business_id", prof.business_id).order("status");
    setCreators(cr || []);
    // Crossing candidates only ever come from trial creators' own videos —
    // scoped at the query rather than filtered after, so this never has to
    // touch an active creator's rows.
    const { data: tv } = await supabase.from("video_logs").select("*, creators!inner(id, status, tiktok_profile_url, insta_profile_url, profiles(full_name))").eq("business_id", prof.business_id).eq("creators.status", "trial").is("trial_review_dismissed_at", null);
    setTrialVideos(tv || []);
    // Every self-reported view count, business-wide — this is what both the
    // trial crossing queue and the Views register below read from, so a
    // creator reporting once is visible in both places without a second entry.
    const { data: vr } = await supabase.from("video_view_reports")
      .select("*, video_logs(log_date, post_number, tiktok_url, insta_url), creators(profiles(full_name))")
      .eq("business_id", prof.business_id).order("reported_at", { ascending: false });
    const maxByVideo = {}; (vr || []).forEach((r) => { maxByVideo[r.video_log_id] = Math.max(maxByVideo[r.video_log_id] || 0, Number(r.views)); });
    setViewReportsByVideo(maxByVideo);
    const registerMap = {};
    (vr || []).forEach((r) => {
      const row = registerMap[r.video_log_id] || {
        videoLogId: r.video_log_id, creatorName: r.creators?.profiles?.full_name,
        logDate: r.video_logs?.log_date, postNumber: r.video_logs?.post_number,
        tiktokUrl: r.video_logs?.tiktok_url, instaUrl: r.video_logs?.insta_url,
        lastViews: Number(r.views), lastReportedAt: r.reported_at, maxViews: Number(r.views),
      };
      row.maxViews = Math.max(row.maxViews, Number(r.views));
      registerMap[r.video_log_id] = row;
    });
    setViewsRegister(Object.values(registerMap).sort((a, b) => new Date(b.lastReportedAt) - new Date(a.lastReportedAt)));
    const { data: t } = await supabase.from("bonus_tiers").select("*").eq("business_id", prof.business_id).order("min_views", { ascending: false });
    setTiers(t || []);
    const { data: p } = await supabase.from("bonus_claims").select("*, creators(id, profiles(full_name))").eq("business_id", prof.business_id).eq("status", "pending").order("created_at");
    setPending(p || []);
    // A growth report is a re-check on an already-approved claim, not a new
    // submission — status stays 'approved' throughout, so it needs its own
    // query rather than living inside the pending list above.
    const { data: gr } = await supabase.from("bonus_claims").select("*, creators(id, profiles(full_name))").eq("business_id", prof.business_id).eq("revision_status", "pending").order("revision_requested_at");
    setGrowthUpdates(gr || []);
    const { data: inv } = await supabase.from("creator_invites").select("id, label, expires_at, used_at, revoked_at, created_at").eq("business_id", prof.business_id).order("created_at", { ascending: false }).limit(50);
    setInvites(inv || []);
    const monthStart = firstOfMonth(ym); const monthEnd = monthEndOf(ym);
    const { data: pay } = await supabase.from("payments").select("*, creators(id, base_pay, profiles(full_name))").eq("business_id", prof.business_id).eq("month", monthStart);
    setPayments(pay || []);
    // Bonus figures shown on the creator list come from here, never
    // recomputed in the browser — the database is the only thing that knows
    // which bonus_tiers schedule was in force on each claim's date.
    const payByCreator = {}; (pay || []).forEach((p) => { payByCreator[p.creator_id] = p; }); setPaymentsByCreator(payByCreator);
    const { data: allVids } = await supabase.from("video_logs").select("creator_id").eq("business_id", prof.business_id).gte("log_date", monthStart).lte("log_date", monthEnd);
    const vcounts = {}; (allVids || []).forEach((v) => { vcounts[v.creator_id] = (vcounts[v.creator_id] || 0) + 1; }); setVideoCountByCreator(vcounts);
  }, [router, ym]);
  useEffect(() => { load(); }, [load]);
  async function openCreator(c) {
    if (!c) return; setSelectedCreator(c); setTab("creators");
    const supabase = supabaseBrowser();
    const [{ data: v }, { data: cl }, { data: pm }] = await Promise.all([
      supabase.from("video_logs").select("*").eq("creator_id", c.id).order("log_date", { ascending: false }).limit(200),
      supabase.from("bonus_claims").select("*").eq("creator_id", c.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("payments").select("*").eq("creator_id", c.id).order("month", { ascending: false }),
    ]);
    setSelectedCreatorVideos(v || []); setSelectedCreatorClaims(cl || []); setSelectedCreatorPayments(pm || []);
  }
  // Deactivating is reversible and keeps every video, claim, and payment on
  // record — the right choice for someone who's left. Deleting is not:
  // it removes the creator row and everything tied to it (cascading), so it
  // stays a deliberate, clearly-worded, separate action from deactivating.
  async function toggleCreatorStatus(c) {
    const next = c.status === "active" ? "inactive" : "active";
    const question = next === "inactive"
      ? `Deactivate ${c.profiles?.full_name}? They'll stop showing in active totals and payment runs, but every past video, claim, and payment stays on record. You can reactivate any time.`
      : `Reactivate ${c.profiles?.full_name}? They'll count as active again.`;
    if (!confirm(question)) return;
    const { error } = await supabaseBrowser().from("creators").update({ status: next, left_at: next === "inactive" ? today() : null }).eq("id", c.id);
    if (error) { setMsg("Failed: " + error.message); return; }
    setMsg(next === "inactive" ? "Deactivated." : "Reactivated.");
    if (selectedCreator?.id === c.id) setSelectedCreator({ ...c, status: next });
    load();
  }
  // A live gate, not effective-dated — changing it re-evaluates every
  // trial video against the new figure immediately, nothing is locked to
  // whatever the threshold was when a video was originally logged.
  async function saveThreshold() {
    setThresholdMsg("");
    const n = Number(thresholdInput);
    if (!n || n <= 0) { setThresholdMsg("Enter a number above zero."); return; }
    const { error } = await supabaseBrowser().from("businesses").update({ trial_view_threshold: n }).eq("id", business.id);
    if (error) { setThresholdMsg("Failed: " + error.message); return; }
    setThresholdMsg("Saved."); load();
  }
  // Approving a crossing does not promote the creator by itself — it just
  // unlocks the "Complete your onboarding" button on their own dashboard.
  // The qualifying video is recorded so it carries forward as their real
  // first/Nth video once onboarding finishes, rather than being re-entered.
  async function approveCrossing(video) {
    const name = video.creators?.profiles?.full_name || "this creator";
    if (!confirm(`Approve ${name}'s crossing? This unlocks their "Complete your onboarding" step — it doesn't move them to active by itself.`)) return;
    const { error } = await supabaseBrowser().from("creators").update({
      status: "trial_approved", trial_qualifying_video_id: video.id, trial_approved_at: new Date().toISOString(),
    }).eq("id", video.creators.id);
    if (error) { setMsg("Failed: " + error.message); return; }
    setMsg("Crossing approved — they can now complete onboarding."); load();
  }
  async function dismissCrossing(video) {
    if (!confirm("Dismiss this crossing? It stops showing here, but a different video from the same creator can still cross and surface on its own.")) return;
    const { error } = await supabaseBrowser().from("video_logs").update({ trial_review_dismissed_at: new Date().toISOString() }).eq("id", video.id);
    if (error) { setMsg("Failed: " + error.message); return; }
    setMsg("Dismissed."); load();
  }
  async function deleteCreator(c) {
    const ok = confirm(
      `Delete ${c.profiles?.full_name} permanently? This removes their creator record and every video, claim, and payment tied to it. This cannot be undone — for someone who's just left, Deactivate is almost always the right choice instead.`
    );
    if (!ok) return;
    const { error } = await supabaseBrowser().from("creators").delete().eq("id", c.id);
    if (error) { setMsg("Failed: " + error.message); return; }
    setMsg("Deleted.");
    if (selectedCreator?.id === c.id) setSelectedCreator(null);
    load();
  }
  async function signOut() { await supabaseBrowser().auth.signOut(); router.replace("/"); }
  async function reviewClaim(claim, decision) {
    const supabase = supabaseBrowser(); const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("bonus_claims").update({ status: decision, reviewed_by: user.user.id, reviewed_at: new Date().toISOString() }).eq("id", claim.id);
    if (error) { setMsg("Failed: " + error.message); return; }
    if (decision === "approved") await recalcPaymentForMonth(claim.creator_id, claim.claim_date.slice(0, 7));
    setMsg(`Claim ${decision}.`); load();
  }
  async function reviewGrowth(claim, approve) {
    const { error } = await supabaseBrowser().rpc("review_bonus_revision", { p_claim_id: claim.id, p_approve: approve });
    if (error) { setMsg("Failed: " + error.message); return; }
    // Approving moves the same row to its new view count, which the database
    // trigger already recalculates into the month's bonus — nothing to add
    // here, unlike a fresh approval where this page computes the base pay.
    setMsg(approve ? "Growth approved — payment updated." : "Growth update rejected."); load();
  }
  // Bringing someone who already has a Smithstem account, in another business,
  // into this one — the real case where a creator works for both NorthQuest
  // and CashDrive. They are found by email, since one account can hold
  // several business identities; no separate signup is needed.
  async function addExistingCreator() {
    const email = prompt("Email of the creator to add to this business?");
    if (!email) return;
    const pay = prompt("Their base pay for this business (naira)?", "150000");
    if (!pay) return;
    const { error } = await supabaseBrowser().rpc("add_creator_to_current_business", { p_email: email.trim(), p_base_pay: Number(pay) });
    if (error) { setMsg("Failed: " + error.message); return; }
    setMsg("Added. Ask them to switch into this business next time they sign in."); load();
  }
  // The invite is the credential, so the raw token only ever exists here —
  // once in this response, shown once, then it is only a hash in the
  // database from then on.
  async function createInvite(e) {
    e.preventDefault();
    if (!inviteLabel.trim()) return;
    const { data, error } = await supabaseBrowser().rpc("create_creator_invite", {
      p_label: inviteLabel.trim(),
      p_phone_last4: invitePhone.trim() || null,
      p_creator_id: null,
    });
    if (error) { setMsg("Failed: " + error.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    const link = `${window.location.origin}/join/${row.token}`;
    setLastInvite({ label: inviteLabel.trim(), link });
    setInviteLabel(""); setInvitePhone(""); load();
  }
  async function viewEvidence(path) {
    const { data, error } = await supabaseBrowser().storage.from("bonus-evidence").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) { setMsg("Could not open that screenshot: " + (error?.message || "not found")); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  function contractStatus(c) {
    return c.contract_signed_at ? { text: "Signed", cls: "badge-ok" } : { text: "Awaiting signature", cls: "badge-waiting" };
  }
  function inviteStatus(inv) {
    if (inv.revoked_at) return { text: "Cancelled", cls: "badge-no" };
    if (inv.used_at) return { text: "Used", cls: "badge-ok" };
    if (new Date(inv.expires_at) < new Date()) return { text: "Expired", cls: "bg-ground text-faint" };
    return { text: "Not used yet", cls: "badge-waiting" };
  }
  async function recalcPaymentForMonth(creatorId, ymForClaim) {
    const supabase = supabaseBrowser(); const monthStart = firstOfMonth(ymForClaim); const monthEnd = monthEndOf(ymForClaim);
    const { data: cr } = await supabase.from("creators").select("*").eq("id", creatorId).single();
    const { data: vids } = await supabase.from("video_logs").select("id").eq("creator_id", creatorId).gte("log_date", monthStart).lte("log_date", monthEnd);
    const base = Math.round((vids?.length || 0) * rate(cr.base_pay, monthStart));
    // Only base pay is written here. The bonus total is owned by the database,
    // which values each claim at the tiers in force on its own date — writing a
    // figure from here would overwrite that with one computed from whichever
    // tiers the browser happened to load.
    await supabase.from("payments").upsert({ business_id: cr.business_id, creator_id: creatorId, month: monthStart, base_amount: base }, { onConflict: "creator_id,month" });
  }
  async function logForCreator(c) {
    const supabase = supabaseBrowser();
    const date = prompt(`Date for ${c.profiles?.full_name}'s video (YYYY-MM-DD)?`, today()); if (!date) return;
    const post = prompt("Post number (1 or 2)?", "1"); if (!post) return;
    const { error } = await supabase.from("video_logs").insert({ business_id: c.business_id, creator_id: c.id, log_date: date, post_number: Number(post), logged_by: "admin" });
    if (error) { setMsg("Failed: " + error.message); return; }
    await recalcPaymentForMonth(c.id, date.slice(0, 7)); setMsg("Logged for creator."); load();
    if (selectedCreator?.id === c.id) openCreator(c);
  }
  async function deleteClaim(id, creatorId, claimYm) {
    if (!confirm("Delete this bonus entry?")) return;
    const supabase = supabaseBrowser(); await supabase.from("bonus_claims").delete().eq("id", id);
    await recalcPaymentForMonth(creatorId, claimYm); setMsg("Entry deleted."); load();
    if (selectedCreator?.id === creatorId) openCreator(selectedCreator);
  }
  async function savePaymentField(paymentRow, field, value) {
    const supabase = supabaseBrowser();
    await supabase.from("payments").update({ [field]: field === "payment_status" ? value : (Number(value) || 0) }).eq("id", paymentRow.id);
    load();
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
  const trialThreshold = business?.trial_view_threshold || 10000;
  const crossingCandidates = trialVideos.filter((v) => (viewReportsByVideo[v.id] || 0) >= trialThreshold);
  const trialRoster = creators.filter((c) => c.status === "trial" || c.status === "trial_approved");
  const trialLink = business ? `${typeof window !== "undefined" ? window.location.origin : ""}/trial/${business.slug}` : "";
  return (<div><Header role="admin" profile={profile} onSignOut={signOut} /><main className="mx-auto max-w-5xl px-4 py-4"><nav className="mb-6 flex gap-2">{[["approvals", `Bonus approvals${pending.length ? ` (${pending.length})` : ""}`], ["creators", "Manage creators"], ["trial", `Trial${crossingCandidates.length ? ` (${crossingCandidates.length})` : ""}`], ["invites", "Invites"], ["views", "Views register"], ["payments", "Payments register"]].map(([key, label]) => (<button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-base font-semibold ${tab === key ? "bg-accent text-white" : "bg-white text-muted border border-line"}`}>{label}</button>))}</nav>{msg && <p className="mb-4 text-base text-accent">{msg}</p>}{tab === "approvals" && (<><section className="card"><h2 className="mb-3 font-semibold">Pending bonus claims ({pending.length})</h2><div className="space-y-2">{pending.length === 0 && <p className="text-base text-faint">Nothing waiting on you.</p>}{pending.map((c) => (<div key={c.id} className="rounded-xl border border-line px-4 py-3"><div className="flex items-center justify-between"><div><p className="font-medium">{c.creators?.profiles?.full_name}</p><p className="text-base text-muted">{c.claim_date} · {Number(c.views).toLocaleString()} views · +{fmtNaira(bonusForViews(c.views, tiersOn(tiers, c.claim_date)))}</p></div><div className="flex gap-2"><button className="btn-secondary text-tiny" onClick={() => reviewClaim(c, "rejected")}>Reject</button><button className="btn-primary text-tiny" onClick={() => reviewClaim(c, "approved")}>Approve</button></div></div>{(c.video_url || c.screenshot_url) && (<div className="mt-1 flex gap-3">{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="text-tiny text-accent underline">Open submitted video</a>)}{c.screenshot_url && (<button type="button" onClick={() => viewEvidence(c.screenshot_url)} className="text-tiny text-accent underline">View screenshot</button>)}</div>)}</div>))}</div></section>{growthUpdates.length > 0 && (<section className="card mt-4"><h2 className="mb-1 font-semibold">Growth updates ({growthUpdates.length})</h2><p className="mb-3 text-tiny text-muted">A video that already has an approved bonus has grown into a bigger tier. Approving replaces the old amount — nothing is added on top.</p><div className="space-y-2">{growthUpdates.map((c) => { const oldAmt = bonusForViews(c.views, tiersOn(tiers, c.claim_date)); const newAmt = bonusForViews(c.revised_views, tiersOn(tiers, c.claim_date)); return (<div key={c.id} className="rounded-xl border border-line px-4 py-3"><div className="flex items-center justify-between"><div><p className="font-medium">{c.creators?.profiles?.full_name}</p><p className="text-base text-muted">{c.claim_date} · {Number(c.views).toLocaleString()} → {Number(c.revised_views).toLocaleString()} views</p><p className="text-tiny text-faint">{fmtNaira(oldAmt)} → {fmtNaira(newAmt)}</p></div><div className="flex gap-2"><button className="btn-secondary text-tiny" onClick={() => reviewGrowth(c, false)}>Reject</button><button className="btn-primary text-tiny" onClick={() => reviewGrowth(c, true)}>Approve</button></div></div>{(c.video_url || c.screenshot_url) && (<div className="mt-1 flex gap-3">{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="text-tiny text-accent underline">Open submitted video</a>)}{c.screenshot_url && (<button type="button" onClick={() => viewEvidence(c.screenshot_url)} className="text-tiny text-accent underline">View screenshot</button>)}</div>)}</div>); })}</div></section>)}</>)}{tab === "creators" && !selectedCreator && (
  <section>
    {(() => {
      // Trial and trial_approved creators live on the Trial tab — nothing
      // here to pay or sign yet, so a base-pay/contract row for them would
      // just be noise.
      const managedCreators = creators.filter((c) => c.status === "active" || c.status === "inactive");
      const activeCount = managedCreators.filter((c) => c.status === "active").length;
      const postsThisMonth = Object.values(videoCountByCreator).reduce((s, n) => s + n, 0);
      return (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card"><p className="kicker">Total creators</p><p className="figure mt-1 tnum">{managedCreators.length}</p></div>
          <div className="card"><p className="kicker">Active</p><p className="figure mt-1 tnum text-accent">{activeCount}</p></div>
          <div className="card"><p className="kicker">Posts this month</p><p className="figure mt-1 tnum">{postsThisMonth}</p></div>
          <div className="card"><p className="kicker">Pending claims</p><p className="figure mt-1 tnum text-gold">{pending.length}</p></div>
        </div>
      );
    })()}
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <label className="text-base font-medium text-muted">Editing month:</label>
        <input className="input w-auto" type="month" value={ym} onChange={(e) => setYm(e.target.value)} />
      </div>
      <button className="btn-secondary text-tiny" onClick={addExistingCreator}>+ Add existing creator</button>
    </div>
    <div className="card overflow-x-auto">
      {(() => {
        const managedCreators = creators.filter((c) => c.status === "active" || c.status === "inactive");
        if (managedCreators.length === 0) return <p className="text-base text-faint">No creators yet.</p>;
        return (
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-line text-left text-tiny uppercase text-faint">
              <th className="py-2 pr-3">Creator</th><th className="pr-3">Contract</th><th className="pr-3">Base pay</th>
              <th className="pr-3">Bonus (mo.)</th><th className="pr-3">Joined</th><th className="pr-3">Left</th>
              <th className="pr-3">Posts (mo.)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {managedCreators.map((c) => {
              const vidCount = videoCountByCreator[c.id] || 0;
              const bonus = paymentsByCreator[c.id]?.perf_bonus;
              const cs = contractStatus(c);
              return (
                <tr key={c.id} className={`border-b border-line ${c.status === "inactive" ? "opacity-60" : ""}`}>
                  <td className="py-2.5 pr-3">
                    <button className="text-left" onClick={() => openCreator(c)}>
                      <span className="font-semibold text-accent underline decoration-dotted">{c.profiles?.full_name}</span>
                      <span className={`badge ${c.status === "active" ? "badge-ok" : "bg-ground text-faint"} ml-2`}>{c.status === "active" ? "Active" : "Inactive"}</span>
                    </button>
                  </td>
                  <td className="pr-3"><span className={`badge ${cs.cls}`}>{cs.text}</span></td>
                  <td className="pr-3 tnum">{fmtNaira(c.base_pay)}</td>
                  <td className="pr-3 tnum">{bonus ? fmtNaira(bonus) : <span className="text-faint">—</span>}</td>
                  <td className="pr-3">{c.joined_at}</td>
                  <td className="pr-3">{c.left_at || <span className="text-faint">—</span>}</td>
                  <td className="pr-3 tnum">{vidCount}</td>
                  <td className="pr-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-quiet" onClick={() => toggleCreatorStatus(c)}>{c.status === "active" ? "Deactivate" : "Reactivate"}</button>
                      <button className="btn-quiet text-noInk" onClick={() => deleteCreator(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        );
      })()}
    </div>
  </section>
)}
{tab === "creators" && selectedCreator && (() => {
  const c = selectedCreator;
  const cs = contractStatus(c);
  const vidCount = videoCountByCreator[c.id] || 0;
  const earned = paymentsByCreator[c.id]?.total_payable;
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="mb-1 text-tiny text-muted hover:text-accent" onClick={() => setSelectedCreator(null)}>← Back to Manage creators</button>
          <h2 className="font-display text-xl font-bold">{c.profiles?.full_name}</h2>
          <p className="text-tiny text-faint">{c.profiles?.email} · {c.profiles?.phone || "—"} · Joined {c.joined_at}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-tiny" onClick={() => toggleCreatorStatus(c)}>{c.status === "active" ? "Deactivate" : "Reactivate"}</button>
          <button className="btn-secondary text-tiny text-noInk" onClick={() => deleteCreator(c)}>Delete</button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card"><p className="kicker">Status</p><p className="mt-1"><span className={`badge ${c.status === "active" ? "badge-ok" : "bg-ground text-faint"}`}>{c.status === "active" ? "Active" : "Inactive"}</span></p></div>
        <div className="card"><p className="kicker">Base pay</p><p className="figure mt-1 tnum text-accent">{fmtNaira(c.base_pay)}</p></div>
        <div className="card"><p className="kicker">Posts this month</p><p className="figure mt-1 tnum">{vidCount}</p></div>
        <div className="card"><p className="kicker">Earned this month</p><p className="figure mt-1 tnum text-gold">{earned !== undefined ? fmtNaira(earned) : "—"}</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Videos logged ({selectedCreatorVideos.length})</h3>
              <button className="btn-quiet" onClick={() => logForCreator(c)}>+ Log video</button>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {selectedCreatorVideos.length === 0 && <p className="text-tiny text-faint">None logged.</p>}
              {selectedCreatorVideos.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-tiny">
                  <span>{v.log_date} · Post {v.post_number} · <span className="text-faint">by {v.logged_by}</span></span>
                  <div className="flex gap-2">
                    {v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">TT</a>}
                    {v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">IG</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold">Bonus claims ({selectedCreatorClaims.length})</h3>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {selectedCreatorClaims.length === 0 && <p className="text-tiny text-faint">None submitted.</p>}
              {selectedCreatorClaims.map((claim) => (
                <div key={claim.id} className="rounded-lg border border-line px-3 py-1.5 text-tiny">
                  <div className="flex items-center justify-between">
                    <span>{claim.claim_date} · {Number(claim.views).toLocaleString()} views · <span className={`badge ${STATUS_STYLE[claim.status]}`}>{claim.status}</span></span>
                    <button className="text-red-500 underline" onClick={() => deleteClaim(claim.id, c.id, claim.claim_date.slice(0, 7))}>Delete</button>
                  </div>
                  {claim.video_url && <a href={claim.video_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">Open video</a>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-2 font-semibold">Payment history</h3>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {selectedCreatorPayments.length === 0 && <p className="text-tiny text-faint">Nothing paid yet.</p>}
              {selectedCreatorPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-tiny">
                  <span>{p.month}</span>
                  <span className="flex items-center gap-2">
                    <span className="tnum">{fmtNaira(p.total_payable)}</span>
                    <span className={`badge ${p.payment_status === "Paid" ? "badge-ok" : "badge-waiting"}`}>{p.payment_status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold">Bank details</h3>
            <div className="space-y-1 text-tiny">
              <div className="flex justify-between border-b border-ground py-1"><span className="text-faint">Bank</span><span>{c.bank_name || "—"}</span></div>
              <div className="flex justify-between border-b border-ground py-1"><span className="text-faint">Account no.</span><span className="tnum">{c.acct_num || "—"}</span></div>
              <div className="flex justify-between py-1"><span className="text-faint">Account name</span><span>{c.acct_name || "—"}</span></div>
            </div>
            {c.contract_file_url ? (
              <button type="button" onClick={() => openContract(c)} className="btn-secondary mt-3 w-full text-tiny">Open signed contract →</button>
            ) : (
              <p className="mt-3 text-tiny"><span className={`badge ${cs.cls}`}>{cs.text}</span></p>
            )}
            {contractError && <p className="mt-2 text-tiny text-red-600">{contractError}</p>}
          </div>
        </div>
      </div>
    </section>
  );
})()}{tab === "trial" && (
  <section>
    <div className="card mb-4">
      <h2 className="mb-1 font-semibold">Trial sign-up link</h2>
      <p className="mb-2 text-tiny text-muted">Anyone who opens this starts a trial for {business?.name || "this business"} — no admin action needed per person.</p>
      {trialLink && (
        <div className="flex items-center gap-2">
          <p className="flex-1 break-all rounded-lg bg-ground px-3 py-2 font-mono text-tiny text-ink">{trialLink}</p>
          <button className="btn-secondary text-tiny" onClick={() => navigator.clipboard.writeText(trialLink)}>Copy</button>
        </div>
      )}
      <div className="mt-4 border-t border-line pt-3">
        <label className="mb-1 block text-tiny font-semibold uppercase text-faint">Views needed to trigger a review</label>
        <p className="mb-2 text-tiny text-muted">Applies right away — raising or lowering it changes who shows up below immediately, not just for videos logged from now on.</p>
        <div className="flex items-center gap-2">
          <input className="input tnum w-40" type="number" min="1" value={thresholdInput} onChange={(e) => setThresholdInput(e.target.value)} />
          <button className="btn-secondary text-tiny" onClick={saveThreshold}>Save</button>
          {thresholdMsg && <span className="text-tiny text-muted">{thresholdMsg}</span>}
        </div>
      </div>
    </div>

    <section className="card mb-4">
      <h2 className="mb-1 font-semibold">Crossing requests ({crossingCandidates.length})</h2>
      <p className="mb-3 text-tiny text-muted">A trial creator's video crossed {trialThreshold.toLocaleString()} views. Approving unlocks their own "Complete your onboarding" step — it doesn't move them to active by itself.</p>
      <div className="space-y-2">
        {crossingCandidates.length === 0 && <p className="text-base text-faint">Nothing waiting on you.</p>}
        {crossingCandidates.map((v) => (
          <div key={v.id} className="rounded-xl border border-line px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{v.creators?.profiles?.full_name}</p>
                <p className="text-base text-muted">{v.log_date} · Post {v.post_number} · {Number(viewReportsByVideo[v.id]).toLocaleString()} views</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-tiny" onClick={() => dismissCrossing(v)}>Dismiss</button>
                <button className="btn-primary text-tiny" onClick={() => approveCrossing(v)}>Approve</button>
              </div>
            </div>
            <div className="mt-1 flex gap-3">
              {v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-tiny text-accent underline">TikTok</a>}
              {v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-tiny text-accent underline">Instagram</a>}
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="card">
      <h2 className="mb-3 font-semibold">Trial roster ({trialRoster.length})</h2>
      <div className="space-y-2">
        {trialRoster.length === 0 && <p className="text-base text-faint">No one on trial right now.</p>}
        {trialRoster.map((c) => (
          <div key={c.id} className="rounded-xl border border-line px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.profiles?.full_name}</p>
                <div className="mt-0.5 flex gap-3 text-tiny">
                  {c.tiktok_profile_url && <a href={c.tiktok_profile_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">TikTok</a>}
                  {c.insta_profile_url && <a href={c.insta_profile_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">Instagram</a>}
                </div>
              </div>
              <span className={`badge ${c.status === "trial_approved" ? "badge-ok" : "bg-ground text-faint"}`}>{c.status === "trial_approved" ? "Approved — awaiting onboarding" : "On trial"}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  </section>
)}
{tab === "invites" && (<section><div className="card mb-4"><h2 className="mb-1 font-semibold">Invite a creator</h2><p className="mb-3 text-tiny text-muted">No email needed to get in — send this on WhatsApp. Works once and lasts 3 days.</p><form onSubmit={createInvite} className="grid grid-cols-2 gap-3"><input className="input" placeholder="Name (just for you to tell it apart)" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} required /><input className="input" placeholder="Last 4 of their phone (optional)" maxLength={4} value={invitePhone} onChange={(e) => setInvitePhone(e.target.value.replace(/\D/g, ""))} /><button className="btn-primary col-span-2">Create invite link</button></form>{lastInvite && (<div className="mt-4 rounded-xl border border-line bg-ground p-3"><p className="text-tiny font-semibold uppercase text-faint">Ready for {lastInvite.label}</p><p className="mt-1 break-all font-mono text-tiny text-ink">{lastInvite.link}</p><div className="mt-2 flex gap-2"><a className="btn-primary text-tiny" style={{ background: "#25D366" }} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(lastInvite.link)}`}>Send on WhatsApp</a><button type="button" className="btn-secondary text-tiny" onClick={() => navigator.clipboard.writeText(lastInvite.link)}>Copy link</button></div><p className="mt-2 text-tiny text-waitingInk">Send this to {lastInvite.label} only — whoever opens it first joins as them.</p></div>)}</div><div className="card"><h2 className="mb-3 font-semibold">Invites ({invites.length})</h2><div className="space-y-2">{invites.length === 0 && <p className="text-base text-faint">No invites yet.</p>}{invites.map((inv) => { const s = inviteStatus(inv); return (<div key={inv.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5"><div><p className="font-medium">{inv.label}</p><p className="text-tiny text-faint">Sent {new Date(inv.created_at).toLocaleDateString("en-GB")}</p></div><span className={`badge ${s.cls}`}>{s.text}</span></div>); })}</div></div></section>)}{tab === "views" && (
  <section>
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-base text-muted">Every self-reported view count, whoever logged it — trial or active.</p>
      <button
        className="btn-secondary text-tiny"
        disabled={viewsRegister.length === 0}
        onClick={() => downloadCsv(
          `${business?.slug || "smithstem"}-views-register-${today()}.csv`,
          ["Creator", "Video date", "Post", "TikTok", "Instagram", "Latest report", "Highest reported", "Last reported"],
          viewsRegister.map((r) => [r.creatorName, r.logDate, r.postNumber, r.tiktokUrl || "", r.instaUrl || "", r.lastViews, r.maxViews, r.lastReportedAt ? new Date(r.lastReportedAt).toLocaleDateString("en-GB") : ""])
        )}
      >
        Export to Excel
      </button>
    </div>
    <div className="card overflow-x-auto">
      {viewsRegister.length === 0 ? (
        <p className="text-base text-faint">No views reported yet.</p>
      ) : (
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-line text-left text-tiny uppercase text-faint">
              <th className="py-2 pr-3">Creator</th><th className="pr-3">Video</th><th className="pr-3">Latest report</th>
              <th className="pr-3">Highest reported</th><th className="pr-3">Last reported</th>
            </tr>
          </thead>
          <tbody>
            {viewsRegister.map((r) => (
              <tr key={r.videoLogId} className="border-b border-line">
                <td className="py-2.5 pr-3 font-medium">{r.creatorName}</td>
                <td className="pr-3">
                  {r.logDate} · Post {r.postNumber}
                  <div className="mt-0.5 flex gap-2 text-tiny">
                    {r.tiktokUrl && <a href={r.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">TikTok</a>}
                    {r.instaUrl && <a href={r.instaUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">Instagram</a>}
                  </div>
                </td>
                <td className="pr-3 tnum">{Number(r.lastViews).toLocaleString()}</td>
                <td className="pr-3 tnum font-semibold">{Number(r.maxViews).toLocaleString()}</td>
                <td className="pr-3">{new Date(r.lastReportedAt).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>
)}
{tab === "payments" && (<section><div className="mb-4 flex items-center gap-3"><label className="text-base font-medium text-muted">Month:</label><input className="input w-auto" type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div><div className="card overflow-x-auto"><table className="w-full text-base"><thead><tr className="border-b border-line text-left text-tiny uppercase text-faint"><th className="py-2 pr-3">Creator</th><th className="pr-3">Base pay</th><th className="pr-3">Videos</th><th className="pr-3">Rate/post</th><th className="pr-3">Earned base</th><th className="pr-3">Perf. bonus</th><th className="pr-3">Referral</th><th className="pr-3">OOP</th><th className="pr-3">Total</th><th className="pr-3">Status</th></tr></thead><tbody>{payments.map((p) => { const basePay = p.creators?.base_pay || 0; const expected = postsExpectedIn(p.month); const perPost = Math.round(rate(basePay, p.month)); const vids = videoCountByCreator[p.creator_id] || Math.round(p.base_amount / (perPost || 1)); return (<tr key={p.id} className="border-b border-line"><td className="py-2 pr-3"><button className="text-accent underline decoration-dotted" onClick={() => openCreator(creators.find((c) => c.id === p.creator_id))}>{p.creators?.profiles?.full_name}</button></td><td className="pr-3">{fmtNaira(basePay)}</td><td className="pr-3">{vids} / {expected}</td><td className="pr-3">{fmtNaira(perPost)}</td><td className="pr-3">{fmtNaira(p.base_amount)}</td><td className="pr-3">{fmtNaira(p.perf_bonus)}</td><td className="pr-3"><input className="input w-20" defaultValue={p.referral_bonus} onBlur={(e) => savePaymentField(p, "referral_bonus", e.target.value)} /></td><td className="pr-3"><input className="input w-20" defaultValue={p.oop_expense} onBlur={(e) => savePaymentField(p, "oop_expense", e.target.value)} /></td><td className="pr-3 font-semibold">{fmtNaira(p.total_payable)}</td><td className="pr-3"><select className="input w-28" defaultValue={p.payment_status} onChange={(e) => savePaymentField(p, "payment_status", e.target.value)}><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Held">Held</option></select></td></tr>); })}{payments.length === 0 && (<tr><td colSpan={10} className="py-4 text-center text-faint">No payment rows for {ym} yet — created as videos and bonuses are logged and approved.</td></tr>)}</tbody></table></div></section>)}</main></div>);
}

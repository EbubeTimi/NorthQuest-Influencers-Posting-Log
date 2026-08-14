"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { rate, fmtNaira, bonusForViews, tiersOn, today, monthBoundsLocal, postsExpectedIn } from "../../lib/domain";
import Header from "../../components/Header";
function firstOfMonth(ym) { return `${ym}-01`; }
function todayYm() { return monthBoundsLocal().month; }
function monthEndOf(ym) { const start = new Date(firstOfMonth(ym)); return new Date(start.getFullYear(), start.getMonth() + 1, 0).toISOString().slice(0, 10); }
// Defined once here and in globals.css, so no screen invents its own amber.
const STATUS_STYLE = { pending: "bg-waitingBg text-waitingInk", approved: "bg-okBg text-okInk", rejected: "bg-noBg text-noInk" };
export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("approvals");
  const [creators, setCreators] = useState([]);
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
  const [claimsByCreator, setClaimsByCreator] = useState({});
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedCreatorVideos, setSelectedCreatorVideos] = useState([]);
  const [selectedCreatorClaims, setSelectedCreatorClaims] = useState([])
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
  const load = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.replace("/"); return; }
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.user.id).single();
    if (!prof || prof.role !== "admin") { router.replace("/dashboard"); return; }
    setProfile(prof);
    const { data: cr } = await supabase.from("creators").select("*, profiles(full_name, email, phone)").eq("business_id", prof.business_id).order("status");
    setCreators(cr || []);
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
    const { data: allClaims } = await supabase.from("bonus_claims").select("*").eq("business_id", prof.business_id).gte("claim_date", monthStart).lte("claim_date", monthEnd);
    const grouped = {}; (allClaims || []).forEach((c) => { (grouped[c.creator_id] ||= []).push(c); }); setClaimsByCreator(grouped);
    const { data: allVids } = await supabase.from("video_logs").select("creator_id").eq("business_id", prof.business_id).gte("log_date", monthStart).lte("log_date", monthEnd);
    const vcounts = {}; (allVids || []).forEach((v) => { vcounts[v.creator_id] = (vcounts[v.creator_id] || 0) + 1; }); setVideoCountByCreator(vcounts);
  }, [router, ym]);
  useEffect(() => { load(); }, [load]);
  async function openCreator(c) {
    if (!c) return; setSelectedCreator(c);
    const supabase = supabaseBrowser();
    const [{ data: v }, { data: cl }] = await Promise.all([
      supabase.from("video_logs").select("*").eq("creator_id", c.id).order("log_date", { ascending: false }).limit(200),
      supabase.from("bonus_claims").select("*").eq("creator_id", c.id).order("created_at", { ascending: false }).limit(200),
    ]);
    setSelectedCreatorVideos(v || []); setSelectedCreatorClaims(cl || []);
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
  }
  async function deleteClaim(id, creatorId, claimYm) {
    if (!confirm("Delete this bonus entry?")) return;
    const supabase = supabaseBrowser(); await supabase.from("bonus_claims").delete().eq("id", id);
    await recalcPaymentForMonth(creatorId, claimYm); setMsg("Entry deleted."); load();
  }
  async function savePaymentField(paymentRow, field, value) {
    const supabase = supabaseBrowser();
    await supabase.from("payments").update({ [field]: field === "payment_status" ? value : (Number(value) || 0) }).eq("id", paymentRow.id);
    load();
  }
  if (!profile) return null;
  return (<div><Header role="admin" profile={profile} onSignOut={signOut} /><main className="mx-auto max-w-5xl px-4 py-4"><nav className="mb-6 flex gap-2">{[["approvals", `Bonus approvals${pending.length ? ` (${pending.length})` : ""}`], ["creators", "Manage creators"], ["invites", "Invites"], ["payments", "Payments register"]].map(([key, label]) => (<button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-base font-semibold ${tab === key ? "bg-accent text-white" : "bg-white text-muted border border-line"}`}>{label}</button>))}</nav>{msg && <p className="mb-4 text-base text-accent">{msg}</p>}{tab === "approvals" && (<><section className="card"><h2 className="mb-3 font-semibold">Pending bonus claims ({pending.length})</h2><div className="space-y-2">{pending.length === 0 && <p className="text-base text-faint">Nothing waiting on you.</p>}{pending.map((c) => (<div key={c.id} className="rounded-xl border border-line px-4 py-3"><div className="flex items-center justify-between"><div><p className="font-medium">{c.creators?.profiles?.full_name}</p><p className="text-base text-muted">{c.claim_date} · {Number(c.views).toLocaleString()} views · +{fmtNaira(bonusForViews(c.views, tiersOn(tiers, c.claim_date)))}</p></div><div className="flex gap-2"><button className="btn-secondary text-tiny" onClick={() => reviewClaim(c, "rejected")}>Reject</button><button className="btn-primary text-tiny" onClick={() => reviewClaim(c, "approved")}>Approve</button></div></div>{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-tiny text-accent underline">Open submitted video</a>)}</div>))}</div></section>{growthUpdates.length > 0 && (<section className="card mt-4"><h2 className="mb-1 font-semibold">Growth updates ({growthUpdates.length})</h2><p className="mb-3 text-tiny text-muted">A video that already has an approved bonus has grown into a bigger tier. Approving replaces the old amount — nothing is added on top.</p><div className="space-y-2">{growthUpdates.map((c) => { const oldAmt = bonusForViews(c.views, tiersOn(tiers, c.claim_date)); const newAmt = bonusForViews(c.revised_views, tiersOn(tiers, c.claim_date)); return (<div key={c.id} className="rounded-xl border border-line px-4 py-3"><div className="flex items-center justify-between"><div><p className="font-medium">{c.creators?.profiles?.full_name}</p><p className="text-base text-muted">{c.claim_date} · {Number(c.views).toLocaleString()} → {Number(c.revised_views).toLocaleString()} views</p><p className="text-tiny text-faint">{fmtNaira(oldAmt)} → {fmtNaira(newAmt)}</p></div><div className="flex gap-2"><button className="btn-secondary text-tiny" onClick={() => reviewGrowth(c, false)}>Reject</button><button className="btn-primary text-tiny" onClick={() => reviewGrowth(c, true)}>Approve</button></div></div>{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-tiny text-accent underline">Open submitted video</a>)}</div>); })}</div></section>)}</>)}{tab === "creators" && (<section><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><label className="text-base font-medium text-muted">Editing month:</label><input className="input w-auto" type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div><button className="btn-secondary text-tiny" onClick={addExistingCreator}>+ Add existing creator</button></div><div className="card divide-y divide-slate-100">{creators.length === 0 && <p className="text-base text-faint">No creators yet.</p>}{creators.map((c) => { const claims = claimsByCreator[c.id] || []; const vidCount = videoCountByCreator[c.id] || 0; return (<div key={c.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-center justify-between"><button className="text-left" onClick={() => openCreator(c)}><p className="font-semibold text-accent underline decoration-dotted">{c.profiles?.full_name}</p><p className="text-tiny text-faint">Base pay ₦{Number(c.base_pay).toLocaleString()}/mo · {vidCount} video{vidCount !== 1 ? "s" : ""} in {ym} · {c.status}</p></button><button className="btn-secondary text-tiny" onClick={() => logForCreator(c)}>+ Log video</button></div>{claims.length > 0 && (<div className="mt-2 space-y-1">{claims.map((claim) => (<div key={claim.id} className="flex items-center justify-between rounded-lg bg-ground px-3 py-1.5 text-tiny"><span>{claim.claim_date} · {Number(claim.views).toLocaleString()} views · <span className={`badge ${STATUS_STYLE[claim.status]}`}>{claim.status}</span></span><button className="text-red-500 underline" onClick={() => deleteClaim(claim.id, c.id, ym)}>Delete</button></div>))}</div>)}</div>); })}</div></section>)}{tab === "invites" && (<section><div className="card mb-4"><h2 className="mb-1 font-semibold">Invite a creator</h2><p className="mb-3 text-tiny text-muted">No email needed to get in — send this on WhatsApp. Works once and lasts 3 days.</p><form onSubmit={createInvite} className="grid grid-cols-2 gap-3"><input className="input" placeholder="Name (just for you to tell it apart)" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} required /><input className="input" placeholder="Last 4 of their phone (optional)" maxLength={4} value={invitePhone} onChange={(e) => setInvitePhone(e.target.value.replace(/\D/g, ""))} /><button className="btn-primary col-span-2">Create invite link</button></form>{lastInvite && (<div className="mt-4 rounded-xl border border-line bg-ground p-3"><p className="text-tiny font-semibold uppercase text-faint">Ready for {lastInvite.label}</p><p className="mt-1 break-all font-mono text-tiny text-ink">{lastInvite.link}</p><div className="mt-2 flex gap-2"><a className="btn-primary text-tiny" style={{ background: "#25D366" }} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(lastInvite.link)}`}>Send on WhatsApp</a><button type="button" className="btn-secondary text-tiny" onClick={() => navigator.clipboard.writeText(lastInvite.link)}>Copy link</button></div><p className="mt-2 text-tiny text-waitingInk">Send this to {lastInvite.label} only — whoever opens it first joins as them.</p></div>)}</div><div className="card"><h2 className="mb-3 font-semibold">Invites ({invites.length})</h2><div className="space-y-2">{invites.length === 0 && <p className="text-base text-faint">No invites yet.</p>}{invites.map((inv) => { const s = inviteStatus(inv); return (<div key={inv.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5"><div><p className="font-medium">{inv.label}</p><p className="text-tiny text-faint">Sent {new Date(inv.created_at).toLocaleDateString("en-GB")}</p></div><span className={`badge ${s.cls}`}>{s.text}</span></div>); })}</div></div></section>)}{tab === "payments" && (<section><div className="mb-4 flex items-center gap-3"><label className="text-base font-medium text-muted">Month:</label><input className="input w-auto" type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div><div className="card overflow-x-auto"><table className="w-full text-base"><thead><tr className="border-b border-line text-left text-tiny uppercase text-faint"><th className="py-2 pr-3">Creator</th><th className="pr-3">Base pay</th><th className="pr-3">Videos</th><th className="pr-3">Rate/post</th><th className="pr-3">Earned base</th><th className="pr-3">Perf. bonus</th><th className="pr-3">Referral</th><th className="pr-3">OOP</th><th className="pr-3">Total</th><th className="pr-3">Status</th></tr></thead><tbody>{payments.map((p) => { const basePay = p.creators?.base_pay || 0; const expected = postsExpectedIn(p.month); const perPost = Math.round(rate(basePay, p.month)); const vids = videoCountByCreator[p.creator_id] || Math.round(p.base_amount / (perPost || 1)); return (<tr key={p.id} className="border-b border-line"><td className="py-2 pr-3"><button className="text-accent underline decoration-dotted" onClick={() => openCreator(creators.find((c) => c.id === p.creator_id))}>{p.creators?.profiles?.full_name}</button></td><td className="pr-3">{fmtNaira(basePay)}</td><td className="pr-3">{vids} / {expected}</td><td className="pr-3">{fmtNaira(perPost)}</td><td className="pr-3">{fmtNaira(p.base_amount)}</td><td className="pr-3">{fmtNaira(p.perf_bonus)}</td><td className="pr-3"><input className="input w-20" defaultValue={p.referral_bonus} onBlur={(e) => savePaymentField(p, "referral_bonus", e.target.value)} /></td><td className="pr-3"><input className="input w-20" defaultValue={p.oop_expense} onBlur={(e) => savePaymentField(p, "oop_expense", e.target.value)} /></td><td className="pr-3 font-semibold">{fmtNaira(p.total_payable)}</td><td className="pr-3"><select className="input w-28" defaultValue={p.payment_status} onChange={(e) => savePaymentField(p, "payment_status", e.target.value)}><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Held">Held</option></select></td></tr>); })}{payments.length === 0 && (<tr><td colSpan={10} className="py-4 text-center text-faint">No payment rows for {ym} yet — created as videos and bonuses are logged and approved.</td></tr>)}</tbody></table></div></section>)}{selectedCreator && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectedCreator(null)}><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}><div className="mb-4 flex items-start justify-between"><div><h3 className="font-display text-xl font-bold">{selectedCreator.profiles?.full_name}</h3><p className="text-base text-muted">{selectedCreator.profiles?.email} · {selectedCreator.profiles?.phone || "—"}</p></div><button className="text-faint hover:text-ink" onClick={() => setSelectedCreator(null)}>✕</button></div><div className="mb-4 grid grid-cols-2 gap-3 text-base"><div className="rounded-xl bg-ground p-3"><p className="text-tiny font-semibold uppercase text-faint">Base pay</p><p className="font-semibold">{fmtNaira(selectedCreator.base_pay)}/mo</p></div><div className="rounded-xl bg-ground p-3"><p className="text-tiny font-semibold uppercase text-faint">Status</p><p className="font-semibold capitalize">{selectedCreator.status}</p></div></div><div className="mb-4 rounded-xl bg-ground p-3 text-base"><p className="mb-1 text-tiny font-semibold uppercase text-faint">Bank</p><p>{selectedCreator.bank_name || "—"} · {selectedCreator.acct_num || "—"} · {selectedCreator.acct_name || "—"}</p></div>{selectedCreator.contract_file_url && (<button type="button" onClick={() => openContract(selectedCreator)} className="mb-4 inline-block text-base text-accent underline">Open signed contract</button>)}{contractError && <p className="mb-4 text-base text-red-600">{contractError}</p>}<div className="mb-4"><p className="mb-2 text-tiny font-semibold uppercase text-faint">All videos ({selectedCreatorVideos.length})</p><div className="max-h-48 space-y-1 overflow-y-auto">{selectedCreatorVideos.length === 0 && <p className="text-tiny text-faint">None logged.</p>}{selectedCreatorVideos.map((v) => (<div key={v.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-tiny"><span>{v.log_date} · Post {v.post_number} · <span className="text-faint">by {v.logged_by}</span></span><div className="flex gap-2">{v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">TT</a>}{v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">IG</a>}</div></div>))}</div></div><div><p className="mb-2 text-tiny font-semibold uppercase text-faint">All bonus claims ({selectedCreatorClaims.length})</p><div className="max-h-48 space-y-1 overflow-y-auto">{selectedCreatorClaims.length === 0 && <p className="text-tiny text-faint">None submitted.</p>}{selectedCreatorClaims.map((c) => (<div key={c.id} className="rounded-lg border border-line px-3 py-1.5 text-tiny"><div className="flex items-center justify-between"><span>{c.claim_date} · {Number(c.views).toLocaleString()} views · <span className={`badge ${STATUS_STYLE[c.status]}`}>{c.status}</span></span></div>{c.video_url && <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">Open video</a>}</div>))}</div></div></div></div>)}</main></div>);
}

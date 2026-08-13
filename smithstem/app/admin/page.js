"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { rate, bonusForViews, fmtNaira } from "../../lib/domain";
import Header from "../../components/Header";
function firstOfMonth(ym) { return `${ym}-01`; }
function todayYm() { return new Date().toISOString().slice(0, 7); }
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
  async function recalcPaymentForMonth(creatorId, ymForClaim) {
    const supabase = supabaseBrowser(); const monthStart = firstOfMonth(ymForClaim); const monthEnd = monthEndOf(ymForClaim);
    const { data: cr } = await supabase.from("creators").select("*").eq("id", creatorId).single();
    const { data: vids } = await supabase.from("video_logs").select("id").eq("creator_id", creatorId).gte("log_date", monthStart).lte("log_date", monthEnd);
    const { data: approvedClaims } = await supabase.from("bonus_claims").select("views").eq("creator_id", creatorId).eq("status", "approved").gte("claim_date", monthStart).lte("claim_date", monthEnd);
    const base = Math.round((vids?.length || 0) * rate(cr.base_pay));
    const perf = (approvedClaims || []).reduce((sum, c) => sum + bonusForViews(c.views, tiers), 0);
    await supabase.from("payments").upsert({ business_id: cr.business_id, creator_id: creatorId, month: monthStart, base_amount: base, perf_bonus: perf }, { onConflict: "creator_id,month" });
  }
  async function logForCreator(c) {
    const supabase = supabaseBrowser();
    const date = prompt(`Date for ${c.profiles?.full_name}'s video (YYYY-MM-DD)?`, new Date().toISOString().slice(0, 10)); if (!date) return;
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
  return (<div><Header role="admin" onSignOut={signOut} /><main className="mx-auto max-w-5xl px-4 py-4"><nav className="mb-6 flex gap-2">{[["approvals", `Bonus approvals${pending.length ? ` (${pending.length})` : ""}`], ["creators", "Manage creators"], ["payments", "Payments register"]].map(([key, label]) => (<button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-base font-semibold ${tab === key ? "bg-accent text-white" : "bg-white text-muted border border-line"}`}>{label}</button>))}</nav>{msg && <p className="mb-4 text-base text-accent">{msg}</p>}{tab === "approvals" && (<section className="card"><h2 className="mb-3 font-semibold">Pending bonus claims ({pending.length})</h2><div className="space-y-2">{pending.length === 0 && <p className="text-base text-faint">Nothing waiting on you.</p>}{pending.map((c) => (<div key={c.id} className="rounded-xl border border-line px-4 py-3"><div className="flex items-center justify-between"><div><p className="font-medium">{c.creators?.profiles?.full_name}</p><p className="text-base text-muted">{c.claim_date} · {Number(c.views).toLocaleString()} views · +{fmtNaira(bonusForViews(c.views, tiers))}</p></div><div className="flex gap-2"><button className="btn-secondary text-tiny" onClick={() => reviewClaim(c, "rejected")}>Reject</button><button className="btn-primary text-tiny" onClick={() => reviewClaim(c, "approved")}>Approve</button></div></div>{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-tiny text-accent underline">Open submitted video</a>)}</div>))}</div></section>)}{tab === "creators" && (<section><div className="mb-4 flex items-center gap-3"><label className="text-base font-medium text-muted">Editing month:</label><input className="input w-auto" type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div><div className="card divide-y divide-slate-100">{creators.length === 0 && <p className="text-base text-faint">No creators yet.</p>}{creators.map((c) => { const claims = claimsByCreator[c.id] || []; const vidCount = videoCountByCreator[c.id] || 0; return (<div key={c.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-center justify-between"><button className="text-left" onClick={() => openCreator(c)}><p className="font-semibold text-accent underline decoration-dotted">{c.profiles?.full_name}</p><p className="text-tiny text-faint">Base pay ₦{Number(c.base_pay).toLocaleString()}/mo · {vidCount} video{vidCount !== 1 ? "s" : ""} in {ym} · {c.status}</p></button><button className="btn-secondary text-tiny" onClick={() => logForCreator(c)}>+ Log video</button></div>{claims.length > 0 && (<div className="mt-2 space-y-1">{claims.map((claim) => (<div key={claim.id} className="flex items-center justify-between rounded-lg bg-ground px-3 py-1.5 text-tiny"><span>{claim.claim_date} · {Number(claim.views).toLocaleString()} views · <span className={`badge ${STATUS_STYLE[claim.status]}`}>{claim.status}</span></span><button className="text-red-500 underline" onClick={() => deleteClaim(claim.id, c.id, ym)}>Delete</button></div>))}</div>)}</div>); })}</div></section>)}{tab === "payments" && (<section><div className="mb-4 flex items-center gap-3"><label className="text-base font-medium text-muted">Month:</label><input className="input w-auto" type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div><div className="card overflow-x-auto"><table className="w-full text-base"><thead><tr className="border-b border-line text-left text-tiny uppercase text-faint"><th className="py-2 pr-3">Creator</th><th className="pr-3">Base pay</th><th className="pr-3">Videos</th><th className="pr-3">Rate/post</th><th className="pr-3">Earned base</th><th className="pr-3">Perf. bonus</th><th className="pr-3">Referral</th><th className="pr-3">OOP</th><th className="pr-3">Total</th><th className="pr-3">Status</th></tr></thead><tbody>{payments.map((p) => { const basePay = p.creators?.base_pay || 0; const perPost = Math.round(rate(basePay)); const vids = videoCountByCreator[p.creator_id] || Math.round(p.base_amount / (perPost || 1)); return (<tr key={p.id} className="border-b border-line"><td className="py-2 pr-3"><button className="text-accent underline decoration-dotted" onClick={() => openCreator(creators.find((c) => c.id === p.creator_id))}>{p.creators?.profiles?.full_name}</button></td><td className="pr-3">{fmtNaira(basePay)}</td><td className="pr-3">{vids} / 62</td><td className="pr-3">{fmtNaira(perPost)}</td><td className="pr-3">{fmtNaira(p.base_amount)}</td><td className="pr-3">{fmtNaira(p.perf_bonus)}</td><td className="pr-3"><input className="input w-20" defaultValue={p.referral_bonus} onBlur={(e) => savePaymentField(p, "referral_bonus", e.target.value)} /></td><td className="pr-3"><input className="input w-20" defaultValue={p.oop_expense} onBlur={(e) => savePaymentField(p, "oop_expense", e.target.value)} /></td><td className="pr-3 font-semibold">{fmtNaira(p.total_payable)}</td><td className="pr-3"><select className="input w-28" defaultValue={p.payment_status} onChange={(e) => savePaymentField(p, "payment_status", e.target.value)}><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Held">Held</option></select></td></tr>); })}{payments.length === 0 && (<tr><td colSpan={10} className="py-4 text-center text-faint">No payment rows for {ym} yet — created as videos and bonuses are logged and approved.</td></tr>)}</tbody></table></div></section>)}{selectedCreator && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectedCreator(null)}><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}><div className="mb-4 flex items-start justify-between"><div><h3 className="font-display text-xl font-bold">{selectedCreator.profiles?.full_name}</h3><p className="text-base text-muted">{selectedCreator.profiles?.email} · {selectedCreator.profiles?.phone || "—"}</p></div><button className="text-faint hover:text-ink" onClick={() => setSelectedCreator(null)}>✕</button></div><div className="mb-4 grid grid-cols-2 gap-3 text-base"><div className="rounded-xl bg-ground p-3"><p className="text-tiny font-semibold uppercase text-faint">Base pay</p><p className="font-semibold">{fmtNaira(selectedCreator.base_pay)}/mo</p></div><div className="rounded-xl bg-ground p-3"><p className="text-tiny font-semibold uppercase text-faint">Status</p><p className="font-semibold capitalize">{selectedCreator.status}</p></div></div><div className="mb-4 rounded-xl bg-ground p-3 text-base"><p className="mb-1 text-tiny font-semibold uppercase text-faint">Bank</p><p>{selectedCreator.bank_name || "—"} · {selectedCreator.acct_num || "—"} · {selectedCreator.acct_name || "—"}</p></div>{selectedCreator.contract_file_url && (<button type="button" onClick={() => openContract(selectedCreator)} className="mb-4 inline-block text-base text-accent underline">Open signed contract</button>)}{contractError && <p className="mb-4 text-base text-red-600">{contractError}</p>}<div className="mb-4"><p className="mb-2 text-tiny font-semibold uppercase text-faint">All videos ({selectedCreatorVideos.length})</p><div className="max-h-48 space-y-1 overflow-y-auto">{selectedCreatorVideos.length === 0 && <p className="text-tiny text-faint">None logged.</p>}{selectedCreatorVideos.map((v) => (<div key={v.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-tiny"><span>{v.log_date} · Post {v.post_number} · <span className="text-faint">by {v.logged_by}</span></span><div className="flex gap-2">{v.tiktok_url && <a href={v.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">TT</a>}{v.insta_url && <a href={v.insta_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">IG</a>}</div></div>))}</div></div><div><p className="mb-2 text-tiny font-semibold uppercase text-faint">All bonus claims ({selectedCreatorClaims.length})</p><div className="max-h-48 space-y-1 overflow-y-auto">{selectedCreatorClaims.length === 0 && <p className="text-tiny text-faint">None submitted.</p>}{selectedCreatorClaims.map((c) => (<div key={c.id} className="rounded-lg border border-line px-3 py-1.5 text-tiny"><div className="flex items-center justify-between"><span>{c.claim_date} · {Number(c.views).toLocaleString()} views · <span className={`badge ${STATUS_STYLE[c.status]}`}>{c.status}</span></span></div>{c.video_url && <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">Open video</a>}</div>))}</div></div></div></div>)}</main></div>);
}

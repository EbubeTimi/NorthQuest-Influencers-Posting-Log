"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import Header from "../../components/Header";
function monthBounds(d = new Date()) { const start = new Date(d.getFullYear(), d.getMonth(), 1); const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); const iso = (x) => x.toISOString().slice(0, 10); return { start: iso(start), end: iso(end), label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }; }
const STATUS_STYLE = { pending: "bg-waitingBg text-waitingInk", approved: "bg-okBg text-okInk", rejected: "bg-noBg text-noInk" };
const PAY_STATUS_STYLE = { paid: "bg-okBg text-okInk", pending: "bg-waitingBg text-waitingInk", processing: "bg-accentSoft text-accent" };
const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
function monthName(isoDate) { return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }

// What a creator is owed for a month. total_payable is an admin override; when
// it is not set the figure is built from the parts, so the row always agrees
// with the breakdown printed underneath it.
function payTotal(p) {
  if (p.total_payable !== null && p.total_payable !== undefined) return Number(p.total_payable);
  return Number(p.base_amount || 0) + Number(p.perf_bonus || 0) + Number(p.referral_bonus || 0) + Number(p.special_bonus || 0) - Number(p.oop_expense || 0);
}

function PaymentsSection({ payments }) {
  if (!payments.length) {
    return (
      <section className="card mb-6">
        <h2 className="mb-1 font-semibold">Your payments</h2>
        <p className="text-base text-faint">Nothing to show yet. Once a bonus is approved, or your first month is worked out, it will appear here.</p>
      </section>
    );
  }
  return (
    <section className="card mb-6">
      <h2 className="mb-3 font-semibold">Your payments</h2>
      <div className="space-y-3">
        {payments.map((p) => {
          const total = payTotal(p);
          const status = String(p.payment_status || "Pending");
          const style = PAY_STATUS_STYLE[status.toLowerCase()] || "bg-accentSoft text-muted";
          // A month with a bonus but no base pay yet has not been worked out by
          // an admin. Saying so beats showing a total that will change.
          const provisional = Number(p.base_amount || 0) === 0 && status.toLowerCase() !== "paid";
          const rows = [
            ["Base pay", p.base_amount],
            ["Performance bonus", p.perf_bonus],
            ["Referral bonus", p.referral_bonus],
            ["Special bonus", p.special_bonus],
          ].filter(([, v]) => Number(v || 0) !== 0);
          return (
            <div key={p.id} className="rounded-xl border border-line p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{monthName(p.month)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-lg font-bold text-accent">{naira(total)}</span>
                  <span className={`badge ${style}`}>{status}</span>
                </span>
              </div>
              <div className="mt-2 space-y-1 text-tiny text-muted">
                {rows.map(([label, v]) => (
                  <div key={label} className="flex justify-between"><span>{label}</span><span>{naira(v)}</span></div>
                ))}
                {Number(p.oop_expense || 0) !== 0 && (
                  <div className="flex justify-between"><span>Out of pocket</span><span>−{naira(p.oop_expense)}</span></div>
                )}
                {p.payment_date && <div className="flex justify-between"><span>Paid on</span><span>{p.payment_date}</span></div>}
              </div>
              {p.remarks && <p className="mt-2 rounded-lg bg-ground px-3 py-2 text-tiny text-muted">{p.remarks}</p>}
              {provisional && <p className="mt-2 text-tiny text-amber-600">Still being worked out — your base pay for this month has not been finalised yet.</p>}
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
  const [videoForm, setVideoForm] = useState({ date: new Date().toISOString().slice(0, 10), post: "1", tiktok: "", insta: "" });
  const [bonusForm, setBonusForm] = useState({ date: new Date().toISOString().slice(0, 10), videoUrl: "", views: "" });
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
    const { data: v } = await supabase.from("video_logs").select("*").eq("creator_id", cr.id).gte("log_date", start).lte("log_date", end).order("log_date", { ascending: false });
    setVideos(v || []);
    const { data: b } = await supabase.from("bonus_claims").select("*").eq("creator_id", cr.id).gte("claim_date", start).lte("claim_date", end).order("created_at", { ascending: false });
    setClaims(b || []);
    // Every month, not just this one — creators ask about past months most.
    const { data: pay } = await supabase.from("payments").select("*").eq("creator_id", cr.id).order("month", { ascending: false });
    setPayments(pay || []);
  }, [router, start, end]);
  useEffect(() => { load(); }, [load]);
  async function signOut() { await supabaseBrowser().auth.signOut(); router.replace("/"); }
  async function logVideo(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("video_logs").insert({ business_id: creator.business_id, creator_id: creator.id, log_date: videoForm.date, post_number: Number(videoForm.post), tiktok_url: videoForm.tiktok || null, insta_url: videoForm.insta || null, logged_by: "creator" });
    setBusy(false); if (error) { setMsg("Could not save: " + error.message); return; }
    setMsg("Video logged."); setVideoForm((f) => ({ ...f, tiktok: "", insta: "" })); load();
  }
  async function submitBonus(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("bonus_claims").insert({ business_id: creator.business_id, creator_id: creator.id, claim_date: bonusForm.date, video_url: bonusForm.videoUrl || null, views: Number(bonusForm.views), submitted_by: "creator", status: "pending" });
    setBusy(false); if (error) { setMsg("Could not submit: " + error.message); return; }
    setMsg("Bonus claim sent for review."); setBonusForm({ date: new Date().toISOString().slice(0, 10), videoUrl: "", views: "" }); load();
  }
  if (!profile) return null;
  if (profile && !creator) return (<main className="flex min-h-screen items-center justify-center px-4 text-center"><p className="text-base text-muted">Setting up your creator profile…</p></main>);
  const totalVideos = videos.length; const adminLogged = videos.filter((v) => v.logged_by === "admin").length;
  return (<div><Header onSignOut={signOut} /><main className="mx-auto max-w-2xl px-4 py-4"><div className="mb-6"><p className="text-tiny font-semibold uppercase tracking-wide text-faint">{label}</p><h1 className="font-display text-2xl font-bold">Hi, {profile.full_name?.split(" ")[0]}</h1></div><div className="mb-6 grid grid-cols-2 gap-4"><div className="card"><p className="text-tiny font-semibold uppercase text-faint">Videos this month</p><p className="mt-1 text-3xl font-bold text-accent">{totalVideos}</p>{adminLogged > 0 && <p className="mt-1 text-tiny text-faint">{adminLogged} logged by admin</p>}</div><div className="card"><p className="text-tiny font-semibold uppercase text-faint">Bonus claims</p><p className="mt-1 text-3xl font-bold text-accent">{claims.length}</p><p className="mt-1 text-tiny text-faint">{claims.filter((c) => c.status === "pending").length} awaiting review</p></div></div>{msg && <p className="mb-4 text-base text-accent">{msg}</p>}<PaymentsSection payments={payments} /><section className="card mb-6"><h2 className="mb-3 font-semibold">Log a video</h2><form onSubmit={logVideo} className="grid grid-cols-2 gap-3"><input className="input" type="date" value={videoForm.date} onChange={(e) => setVideoForm((f) => ({ ...f, date: e.target.value }))} required /><select className="input" value={videoForm.post} onChange={(e) => setVideoForm((f) => ({ ...f, post: e.target.value }))}><option value="1">Post 1</option><option value="2">Post 2</option></select><input className="input col-span-2" placeholder="TikTok link" value={videoForm.tiktok} onChange={(e) => setVideoForm((f) => ({ ...f, tiktok: e.target.value }))} /><input className="input col-span-2" placeholder="Instagram link" value={videoForm.insta} onChange={(e) => setVideoForm((f) => ({ ...f, insta: e.target.value }))} /><button className="btn-primary col-span-2" disabled={busy}>Log video</button></form></section><section className="card mb-6"><h2 className="mb-3 font-semibold">This month's videos</h2><div className="space-y-2">{videos.length === 0 && <p className="text-base text-faint">Nothing logged yet.</p>}{videos.map((v) => (<div key={v.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-base"><span>{v.log_date} · Post {v.post_number}</span>{v.logged_by === "admin" ? (<span className="badge bg-violet-100 text-violet-700">Logged by admin</span>) : (<span className="badge bg-accentSoft text-muted">Self-logged</span>)}</div>))}</div></section><section className="card mb-6"><h2 className="mb-3 font-semibold">Submit a bonus claim</h2><p className="mb-3 text-tiny text-muted">Paste the link to the specific video and how many views it has now. Admin will approve or reject.</p><form onSubmit={submitBonus} className="grid grid-cols-2 gap-3"><input className="input" type="date" value={bonusForm.date} onChange={(e) => setBonusForm((f) => ({ ...f, date: e.target.value }))} required /><input className="input" type="number" placeholder="Views" value={bonusForm.views} onChange={(e) => setBonusForm((f) => ({ ...f, views: e.target.value }))} required /><input className="input col-span-2" placeholder="Video link (TikTok or Instagram)" value={bonusForm.videoUrl} onChange={(e) => setBonusForm((f) => ({ ...f, videoUrl: e.target.value }))} required /><button className="btn-primary col-span-2" disabled={busy}>Send for review</button></form></section><section className="card"><h2 className="mb-3 font-semibold">Bonus history</h2><div className="space-y-2">{claims.length === 0 && <p className="text-base text-faint">No bonus claims yet.</p>}{claims.map((c) => (<div key={c.id} className="rounded-xl border border-line px-3 py-2 text-base"><div className="flex items-center justify-between"><span>{c.claim_date} · {Number(c.views).toLocaleString()} views</span><span className={`badge ${STATUS_STYLE[c.status]}`}>{c.status}</span></div>{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-tiny text-accent underline">View submitted video</a>)}</div>))}</div></section></main></div>);
}

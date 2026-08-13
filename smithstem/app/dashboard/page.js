"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import Header from "../../components/Header";
function monthBounds(d = new Date()) { const start = new Date(d.getFullYear(), d.getMonth(), 1); const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); const iso = (x) => x.toISOString().slice(0, 10); return { start: iso(start), end: iso(end), label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }; }
const STATUS_STYLE = { pending: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700" };
export default function CreatorDashboard() {
  const router = useRouter();
  const [creator, setCreator] = useState(null);
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [claims, setClaims] = useState([]);
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
  if (profile && !creator) return (<main className="flex min-h-screen items-center justify-center px-4 text-center"><p className="text-sm text-slate-500">Setting up your creator profile…</p></main>);
  const totalVideos = videos.length; const adminLogged = videos.filter((v) => v.logged_by === "admin").length;
  return (<div><Header onSignOut={signOut} /><main className="mx-auto max-w-2xl px-4 py-4"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><h1 className="font-display text-2xl font-bold">Hi, {profile.full_name?.split(" ")[0]}</h1></div><div className="mb-6 grid grid-cols-2 gap-4"><div className="card"><p className="text-xs font-semibold uppercase text-slate-400">Videos this month</p><p className="mt-1 text-3xl font-bold text-accent">{totalVideos}</p>{adminLogged > 0 && <p className="mt-1 text-xs text-slate-400">{adminLogged} logged by admin</p>}</div><div className="card"><p className="text-xs font-semibold uppercase text-slate-400">Bonus claims</p><p className="mt-1 text-3xl font-bold text-accent">{claims.length}</p><p className="mt-1 text-xs text-slate-400">{claims.filter((c) => c.status === "pending").length} awaiting review</p></div></div>{msg && <p className="mb-4 text-sm text-accent">{msg}</p>}<section className="card mb-6"><h2 className="mb-3 font-semibold">Log a video</h2><form onSubmit={logVideo} className="grid grid-cols-2 gap-3"><input className="input" type="date" value={videoForm.date} onChange={(e) => setVideoForm((f) => ({ ...f, date: e.target.value }))} required /><select className="input" value={videoForm.post} onChange={(e) => setVideoForm((f) => ({ ...f, post: e.target.value }))}><option value="1">Post 1</option><option value="2">Post 2</option></select><input className="input col-span-2" placeholder="TikTok link" value={videoForm.tiktok} onChange={(e) => setVideoForm((f) => ({ ...f, tiktok: e.target.value }))} /><input className="input col-span-2" placeholder="Instagram link" value={videoForm.insta} onChange={(e) => setVideoForm((f) => ({ ...f, insta: e.target.value }))} /><button className="btn-primary col-span-2" disabled={busy}>Log video</button></form></section><section className="card mb-6"><h2 className="mb-3 font-semibold">This month's videos</h2><div className="space-y-2">{videos.length === 0 && <p className="text-sm text-slate-400">Nothing logged yet.</p>}{videos.map((v) => (<div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm"><span>{v.log_date} · Post {v.post_number}</span>{v.logged_by === "admin" ? (<span className="badge bg-violet-100 text-violet-700">Logged by admin</span>) : (<span className="badge bg-slate-100 text-slate-600">Self-logged</span>)}</div>))}</div></section><section className="card mb-6"><h2 className="mb-3 font-semibold">Submit a bonus claim</h2><p className="mb-3 text-xs text-slate-500">Paste the link to the specific video and how many views it has now. Admin will approve or reject.</p><form onSubmit={submitBonus} className="grid grid-cols-2 gap-3"><input className="input" type="date" value={bonusForm.date} onChange={(e) => setBonusForm((f) => ({ ...f, date: e.target.value }))} required /><input className="input" type="number" placeholder="Views" value={bonusForm.views} onChange={(e) => setBonusForm((f) => ({ ...f, views: e.target.value }))} required /><input className="input col-span-2" placeholder="Video link (TikTok or Instagram)" value={bonusForm.videoUrl} onChange={(e) => setBonusForm((f) => ({ ...f, videoUrl: e.target.value }))} required /><button className="btn-primary col-span-2" disabled={busy}>Send for review</button></form></section><section className="card"><h2 className="mb-3 font-semibold">Bonus history</h2><div className="space-y-2">{claims.length === 0 && <p className="text-sm text-slate-400">No bonus claims yet.</p>}{claims.map((c) => (<div key={c.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm"><div className="flex items-center justify-between"><span>{c.claim_date} · {Number(c.views).toLocaleString()} views</span><span className={`badge ${STATUS_STYLE[c.status]}`}>{c.status}</span></div>{c.video_url && (<a href={c.video_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-accent underline">View submitted video</a>)}</div>))}</div></section></main></div>);
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, withTimeout } from "../../lib/supabaseClient";
const OTP_TTL_SECONDS = 3600;
export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
  const router = useRouter();
  useEffect(() => { const pending = sessionStorage.getItem("smithstem_pending_email"); if (!pending) router.replace("/"); else setEmail(pending); }, [router]);
  useEffect(() => { if (secondsLeft <= 0) return; const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [secondsLeft]);
  async function verify(e) {
    e.preventDefault(); setStatus("verifying"); setError("");
    const supabase = supabaseBrowser();
    let data;
    try { const result = await withTimeout(supabase.auth.verifyOtp({ email, token: code, type: "email" })); if (result.error) throw result.error; data = result.data; } catch (err) { setStatus("error"); setError(err.message); return; }
    sessionStorage.removeItem("smithstem_pending_email");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (!profile) router.replace("/onboarding"); else if (profile.role === "admin") router.replace("/admin"); else router.replace("/dashboard");
  }
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0;
  return (<main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-sm"><div className="mb-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</div><h1 className="font-display text-2xl font-bold">Check your email</h1><p className="mt-1 text-sm text-slate-500">We sent an 8-digit code to <span className="font-medium text-ink">{email}</span></p></div><form onSubmit={verify} className="card space-y-4"><input className="input text-center text-xl tracking-widest font-mono" inputMode="numeric" maxLength={8} placeholder="••••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required /><p className={`text-center text-xs font-medium ${expired ? "text-red-600" : "text-slate-500"}`}>{expired ? "Code expired — request a new one" : `Code expires in ${mm}:${ss}`}</p>{error && <p className="text-sm text-red-600">{error}</p>}<button className="btn-primary w-full" disabled={status === "verifying" || expired}>{status === "verifying" ? "Verifying…" : "Verify & continue"}</button><button type="button" className="w-full text-center text-xs text-slate-400 underline" onClick={() => router.replace("/")}>{expired ? "Request a new code" : "Use a different email"}</button></form></div></main>);
}

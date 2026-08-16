"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, withTimeout } from "../../lib/supabaseClient";
const OTP_TTL_SECONDS = 3600;
// Smith set this system up, so a creator who cannot get in reaches Smith
// directly rather than being passed around. Swap in a WhatsApp number here and
// the link below becomes a chat instead of an email.
const SUPPORT_NAME = "Smith";
const SUPPORT_EMAIL = "smithonyekwereh1@gmail.com";
const SUPPORT_WHATSAPP = "2349076217386";
function supportHref(email) {
  if (SUPPORT_WHATSAPP) {
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi ${SUPPORT_NAME}, I'm not getting my Smithstem sign-in code. My email is ${email}`)}`;
  }
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Smithstem sign-in code not arriving")}&body=${encodeURIComponent(`Hi ${SUPPORT_NAME}, I'm not getting my Smithstem sign-in code. My email is ${email}`)}`;
}
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
  return (<main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-sm"><div className="mb-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</div><h1 className="font-display text-2xl font-bold">Check your email</h1><p className="mt-1 text-base text-muted">We sent an 8-digit code to <span className="font-medium text-ink">{email}</span></p><p className="mt-2 text-tiny text-muted">Not in your inbox? Check your <span className="font-medium text-ink">spam</span> or <span className="font-medium text-ink">promotions</span> folder — it often lands there.</p></div><form onSubmit={verify} className="card space-y-4"><input className="input text-center text-xl tracking-widest font-mono" inputMode="numeric" maxLength={8} placeholder="••••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required /><p className={`text-center text-tiny font-medium ${expired ? "text-red-600" : "text-muted"}`}>{expired ? "Code expired — request a new one" : `Code expires in ${mm}:${ss}`}</p>{error && <p className="text-base text-red-600">{error}</p>}<button className="btn-primary w-full" disabled={status === "verifying" || expired}>{status === "verifying" ? "Verifying…" : "Verify & continue"}</button><button type="button" className="w-full text-center text-tiny text-faint underline" onClick={() => router.replace("/")}>{expired ? "Request a new code" : "Use a different email"}</button></form><p className="mt-4 text-center text-tiny text-muted">Still nothing after a few minutes? <a href={supportHref(email)} className="font-medium text-accent underline">Message {SUPPORT_NAME}</a> and you'll be let in another way.</p></div></main>);
}

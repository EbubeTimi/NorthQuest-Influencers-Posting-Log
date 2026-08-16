"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, backendConfigured, withTimeout } from "../lib/supabaseClient";
import { suggestEmail, looksLikeEmail } from "../lib/emailHint";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const router = useRouter();
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    setStatus("exchanging");
    const supabase = supabaseBrowser();
    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: exErr }) => {
      if (exErr) { setStatus("error"); setError(exErr.message); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (!profile) router.replace("/onboarding"); else if (profile.role === "admin") router.replace("/admin"); else router.replace("/dashboard");
    });
  }, [router]);
  async function sendCode(e) {
    e.preventDefault(); setError("");
    if (!backendConfigured) { setStatus("error"); setError("The database isn't connected yet."); return; }
    if (!looksLikeEmail(email)) { setStatus("error"); setError("That doesn't look like an email address. Check it and try again."); return; }
    // Offer the correction once. Pressing Continue again sends anyway, because
    // the guess can be wrong and nobody should be locked out by it.
    const maybe = suggestEmail(email);
    if (maybe && maybe !== suggestion) { setSuggestion(maybe); setStatus("idle"); return; }
    setStatus("sending");
    const supabase = supabaseBrowser();
    try {
      const { error } = await withTimeout(supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }));
      if (error) throw error;
    } catch (err) {
      setStatus("error");
      // Supabase refuses a second code for the same address inside a minute.
      // Its own wording is "For security purposes, you can only request this
      // after 38 seconds", which reads like an accusation. Found this by
      // asking for two codes in a row while testing.
      const rateLimited = err.message?.includes("rate limit") || /after \d+ seconds/.test(err.message || "");
      setError(
        rateLimited
          ? "A code was just sent to that address. Check your inbox and spam — if it really has not arrived, try again in a minute."
          : err.message
      );
      return;
    }
    setStatus("sent"); sessionStorage.setItem("smithstem_pending_email", email); router.push("/verify");
  }
  if (status === "exchanging") return (<main className="flex min-h-screen items-center justify-center px-4"><p className="text-base text-muted">Signing you in…</p></main>);
  return (<main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-sm"><div className="mb-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</div><h1 className="font-display text-2xl font-bold">Smithstem</h1><p className="mt-1 text-base text-muted">Creator operations, one platform.</p></div><form onSubmit={sendCode} className="card space-y-4"><div><label className="mb-1.5 block text-tiny font-semibold uppercase tracking-wide text-muted">Your email</label><input className="input" type="email" required placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setSuggestion(""); }} /><p className="mt-2 text-tiny text-faint">We'll email you an 8-digit code. New here or returning, it's the same step.</p></div>{suggestion && (<div className="rounded-xl bg-amber-50 px-3 py-2.5 text-tiny text-amber-800">Did you mean <button type="button" className="font-semibold underline" onClick={() => { setEmail(suggestion); setSuggestion(""); }}>{suggestion}</button>? If <span className="font-medium">{email}</span> is right, press Continue again.</div>)}{error && <p className="text-base text-red-600">{error}</p>}<button className="btn-primary w-full" disabled={status === "sending"}>{status === "sending" ? "Sending code…" : "Continue"}</button></form></div></main>);
}

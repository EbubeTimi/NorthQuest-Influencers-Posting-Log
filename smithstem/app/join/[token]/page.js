"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabaseClient";

const SUPPORT_WHATSAPP = "2349076217386";
function supportHref(text) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// The password here is never seen or typed by the creator — signUp() with it
// off is the mechanism that gets them a working session without an email
// round-trip at all. It is unrelated to how they sign back in later, which is
// still the persistent-session model every other Smithstem screen uses.
function throwawayPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const DEAD_END_COPY = {
  invalid: "This link isn't one we recognise. Check you copied the whole thing.",
  revoked: "This link was cancelled.",
  used: "This link has already been used. If that was you, sign in with your email instead.",
  expired: "This link has expired.",
};

export default function JoinPage() {
  const { token } = useParams();
  const router = useRouter();
  const [state, setState] = useState({ phase: "loading" });
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check(digits) {
    const { data, error: rpcErr } = await supabaseBrowser().rpc("peek_creator_invite", { p_token: token, p_phone_last4: digits || null });
    const row = Array.isArray(data) ? data[0] : data;
    if (rpcErr || !row) { setState({ phase: "dead-end", reason: "invalid" }); return; }
    if (!row.valid) {
      if (row.reason === "needs_phone") { setState({ phase: "needs-phone" }); return; }
      setState({ phase: "dead-end", reason: row.reason });
      return;
    }
    if (row.kind === "recovery") { setState({ phase: "recovery-unsupported", businessName: row.business_name }); return; }
    setState({ phase: "ready", businessName: row.business_name });
  }

  useEffect(() => { if (token) check(null); }, [token]);

  function submitPhone(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(phoneDigits)) { setPhoneError("Enter the last 4 digits."); return; }
    setPhoneError("");
    check(phoneDigits);
  }

  async function join(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const supabase = supabaseBrowser();
    const { error: signUpErr } = await supabase.auth.signUp({ email: form.email, password: throwawayPassword() });
    if (signUpErr) {
      setBusy(false);
      setError(
        signUpErr.message?.toLowerCase().includes("already registered")
          ? "That email already has a Smithstem account. Sign in normally instead of using this link."
          : signUpErr.message
      );
      return;
    }
    const { error: redeemErr } = await supabase.rpc("redeem_creator_invite", {
      p_token: token,
      p_phone_last4: phoneDigits || null,
      p_full_name: form.fullName,
      p_phone: form.phone,
    });
    setBusy(false);
    if (redeemErr) { setError(redeemErr.message); return; }
    router.replace("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</div>
          <h1 className="font-display text-2xl font-bold">Smithstem</h1>
        </div>

        {state.phase === "loading" && <p className="text-center text-base text-muted">Checking your link…</p>}

        {state.phase === "dead-end" && (
          <div className="card space-y-3 text-center">
            <p className="text-base text-ink">{DEAD_END_COPY[state.reason] || "That link didn't work."}</p>
            <a href={supportHref("Hi Smith, my Smithstem invite link isn't working.")} className="btn-primary w-full">Message Smith</a>
          </div>
        )}

        {state.phase === "recovery-unsupported" && (
          <div className="card space-y-3 text-center">
            <p className="text-base text-ink">This is a sign-in link for an existing account, not a new invite.</p>
            <p className="text-tiny text-muted">Go to the Smithstem homepage and sign in with your email instead — it's still the fastest way in.</p>
            <a href="/" className="btn-primary w-full">Go to sign in</a>
          </div>
        )}

        {state.phase === "needs-phone" && (
          <form onSubmit={submitPhone} className="card space-y-4">
            <p className="text-base text-ink">This invite is for a specific person. Enter the last 4 digits of the phone number Smith has for you.</p>
            <input
              className="input text-center text-xl tracking-widest font-mono"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={phoneDigits}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
            />
            {phoneError && <p className="text-base text-red-600">{phoneError}</p>}
            <button className="btn-primary w-full">Continue</button>
            <p className="text-center text-tiny text-muted">
              Not sure? <a href={supportHref("Hi Smith, I'm stuck on the phone check for my Smithstem invite.")} className="font-medium text-accent underline">Message Smith</a>
            </p>
          </form>
        )}

        {state.phase === "ready" && (
          <form onSubmit={join} className="card space-y-4">
            <div className="text-center">
              <p className="text-base text-ink">Smith invited you to join <strong>{state.businessName}</strong> on Smithstem.</p>
              <p className="mt-1 text-tiny text-muted">Takes about two minutes. No code to wait for — you're straight in.</p>
            </div>
            <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            <input className="input" placeholder="Phone (WhatsApp)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            <div>
              <input className="input" type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              <p className="mt-2 text-tiny text-faint">Use one you actually check — this is how you'd sign in on another phone later, and how bonus approvals reach you.</p>
            </div>
            {error && <p className="text-base text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Setting you up…" : "Get started"}</button>
          </form>
        )}
      </div>
    </main>
  );
}

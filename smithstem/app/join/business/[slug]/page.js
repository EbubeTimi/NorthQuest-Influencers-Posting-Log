"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../../lib/supabaseClient";
import LoadingScreen from "../../../../components/LoadingScreen";

const SUPPORT_WHATSAPP = "2349076217386";
function supportHref(text) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function throwawayPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const DEAD_END_COPY = {
  invalid: "That name isn't on the list anymore, or was already claimed.",
  revoked: "That invite was cancelled.",
  used: "That name has already been claimed. If that was you, sign in with your email instead.",
  expired: "That invite has expired — message Smith to get it renewed.",
};

// One shared link per business — a creator picks their own name from the
// still-pending migration roster instead of Smith messaging out one link
// per person. Everything past name-selection is the same account-creation
// flow as an individual /join/[token] link.
export default function BusinessJoinPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [names, setNames] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState("pick");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error: rpcErr } = await supabaseBrowser().rpc("list_pending_migration_invites", { p_business_slug: slug });
      if (rpcErr) { setLoadError(rpcErr.message); return; }
      setNames(data || []);
    })();
  }, [slug]);

  async function choose(row) {
    setPicked(row);
    setForm((f) => ({ ...f, fullName: row.label }));
    if (row.needs_phone) { setPhase("needs-phone"); return; }
    await peek(row.label, null);
  }

  async function peek(label, digits) {
    const { data, error: rpcErr } = await supabaseBrowser().rpc("peek_migration_invite", { p_business_slug: slug, p_label: label, p_phone_last4: digits || null });
    const row = Array.isArray(data) ? data[0] : data;
    if (rpcErr || !row) { setPhase("dead-end"); setError(""); return; }
    if (!row.valid) {
      if (row.reason === "needs_phone") { setPhase("needs-phone"); return; }
      setPhase("dead-end");
      setForm((f) => ({ ...f, deadReason: row.reason }));
      return;
    }
    setBusinessName(row.business_name);
    setPhase("ready");
  }

  function submitPhone(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(phoneDigits)) { setPhoneError("Enter the last 4 digits."); return; }
    setPhoneError("");
    peek(picked.label, phoneDigits);
  }

  async function join(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const supabase = supabaseBrowser();
    const { error: signUpErr } = await supabase.auth.signUp({ email: form.email, password: throwawayPassword() });
    if (signUpErr) {
      setBusy(false);
      if (signUpErr.message?.toLowerCase().includes("already registered")) { setPhase("already-registered"); return; }
      setError(signUpErr.message);
      return;
    }
    await redeem();
  }

  async function redeem() {
    const supabase = supabaseBrowser();
    const { error: redeemErr } = await supabase.rpc("redeem_migration_invite", {
      p_business_slug: slug, p_label: picked.label, p_phone_last4: phoneDigits || null,
      p_full_name: form.fullName, p_phone: form.phone,
    });
    setBusy(false);
    if (redeemErr) { setError(redeemErr.message); return; }
    router.replace("/onboarding");
  }

  async function sendExistingAccountCode() {
    setBusy(true); setError("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({ email: form.email, options: { shouldCreateUser: false } });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setPhase("code-entry");
  }

  async function verifyAndRedeem(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const supabase = supabaseBrowser();
    const { error: verifyErr } = await supabase.auth.verifyOtp({ email: form.email, token: code, type: "email" });
    if (verifyErr) { setBusy(false); setError(verifyErr.message); return; }
    await redeem();
  }

  if (names === null && !loadError) return <LoadingScreen label="Loading the roster…" />;

  const filtered = (names || []).filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</div>
          <h1 className="font-display text-2xl font-bold">Smithstem</h1>
        </div>

        {loadError && (
          <div className="card space-y-3 text-center">
            <p className="text-base text-ink">Could not load the roster: {loadError}</p>
            <a href={supportHref("Hi Smith, the join page isn't loading the roster.")} className="btn-primary w-full">Message Smith</a>
          </div>
        )}

        {!loadError && phase === "pick" && (
          <div className="card space-y-4">
            <div className="text-center">
              <p className="text-base text-ink">Find your name below to move onto the new Smithstem system.</p>
            </div>
            <input className="input" placeholder="Type your name…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="py-3 text-center text-tiny text-faint">
                  {names.length === 0 ? "Everyone has already moved over." : "No match — check the spelling, or message Smith."}
                </p>
              )}
              {filtered.map((n) => (
                <button key={n.label} type="button" onClick={() => choose(n)} className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-left text-base text-ink hover:border-accent hover:bg-accentSoft">
                  {n.label}
                  <span className="text-lead text-accent">→</span>
                </button>
              ))}
            </div>
            <p className="text-center text-tiny text-muted">
              Not on the list? <a href={supportHref("Hi Smith, I couldn't find my name on the Smithstem join page.")} className="font-medium text-accent underline">Message Smith</a>
            </p>
          </div>
        )}

        {phase === "dead-end" && (
          <div className="card space-y-3 text-center">
            <p className="text-base text-ink">{DEAD_END_COPY[form.deadReason] || "That didn't work."}</p>
            <button className="btn-secondary w-full" onClick={() => setPhase("pick")}>Back to the list</button>
            <a href={supportHref("Hi Smith, I'm stuck joining Smithstem.")} className="btn-primary w-full">Message Smith</a>
          </div>
        )}

        {phase === "needs-phone" && (
          <form onSubmit={submitPhone} className="card space-y-4">
            <p className="text-base text-ink">Hi <strong>{picked?.label}</strong> — enter the last 4 digits of the phone number Smith has for you, to confirm it's really you.</p>
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
            <button type="button" className="btn-secondary w-full" onClick={() => setPhase("pick")}>Back to the list</button>
          </form>
        )}

        {phase === "ready" && (
          <form onSubmit={join} className="card space-y-4">
            <div className="text-center">
              <p className="text-base text-ink">Hi <strong>{picked.label}</strong> — welcome to <strong>{businessName}</strong> on Smithstem.</p>
              <p className="mt-1 text-tiny text-muted">Your base pay and profile links are already carried over. Just confirm your phone and email.</p>
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

        {phase === "already-registered" && (
          <div className="card space-y-4 text-center">
            <p className="text-base text-ink"><span className="font-medium">{form.email}</span> already has a Smithstem account.</p>
            <p className="text-tiny text-muted">That's fine — this just adds <strong>{businessName}</strong> to it. We'll send a code to confirm it's really you.</p>
            {error && <p className="text-base text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy} onClick={sendExistingAccountCode}>{busy ? "Sending…" : "Send me a code"}</button>
          </div>
        )}

        {phase === "code-entry" && (
          <form onSubmit={verifyAndRedeem} className="card space-y-4">
            <div className="text-center">
              <p className="text-base text-ink">Enter the code sent to <span className="font-medium">{form.email}</span></p>
              <p className="mt-1 text-tiny text-muted">Confirms it's really you before adding {businessName} to your account.</p>
            </div>
            <input
              className="input text-center text-xl tracking-widest font-mono"
              inputMode="numeric"
              maxLength={8}
              placeholder="••••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
            {error && <p className="text-base text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Verifying…" : "Verify & join"}</button>
          </form>
        )}
      </div>
    </main>
  );
}

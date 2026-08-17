"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabaseClient";
import { contentGuideFor } from "../../../lib/contentGuide";

const SUPPORT_WHATSAPP = "2349076217386";
function supportHref(text) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// Same trick as the invite flow: signUp() with a password nobody ever sees
// or types gets a working session with no email round-trip. It has nothing
// to do with how they sign back in later — that's still the ordinary
// persistent-session model every other Smithstem screen uses.
function throwawayPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function TrialEntryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [state, setState] = useState({ phase: "loading" });
  const [form, setForm] = useState({ fullName: "", tiktok: "", insta: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: rpcErr } = await supabaseBrowser().rpc("peek_business_by_slug", { p_slug: slug });
      const row = Array.isArray(data) ? data[0] : data;
      if (rpcErr || !row) { setState({ phase: "not-found" }); return; }
      if (!row.trial_enabled) { setState({ phase: "trial-closed", businessName: row.business_name }); return; }
      setState({
        phase: "ready",
        businessName: row.business_name,
        trialViews: row.trial_view_threshold || 10000,
      });
    })();
  }, [slug]);

  async function start(e) {
    e.preventDefault();
    if (!form.tiktok.trim() && !form.insta.trim()) {
      setError("Add at least one profile link — TikTok or Instagram.");
      return;
    }
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
    const { error: startErr } = await supabase.rpc("start_trial", {
      p_business_slug: slug,
      p_full_name: form.fullName,
      p_tiktok_url: form.tiktok.trim() || null,
      p_insta_url: form.insta.trim() || null,
    });
    setBusy(false);
    if (startErr) { setError(startErr.message); return; }
    // One-shot flag: the dashboard reads this exactly once to show the full
    // "how the trial works" explanation, then never shows it again on later
    // visits — this link itself is never reused after today.
    try { sessionStorage.setItem("smithstem_just_onboarded", "1"); } catch {}
    router.replace("/dashboard");
  }

  const guide = state.businessName ? contentGuideFor(slug) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</div>
          <h1 className="font-display text-2xl font-bold">Smithstem</h1>
        </div>

        {state.phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accentSoft border-t-accent" />
            <p className="text-center text-base text-muted">Checking this link…</p>
          </div>
        )}

        {state.phase === "not-found" && (
          <div className="card space-y-3 text-center">
            <p className="text-base text-ink">This link isn't one we recognise. Check you copied the whole thing.</p>
            <a href={supportHref("Hi Smith, the trial sign-up link isn't working for me.")} className="btn-primary w-full">Message Smith</a>
          </div>
        )}

        {state.phase === "trial-closed" && (
          <div className="card space-y-3 text-center">
            <p className="text-base text-ink">{state.businessName} isn't taking trial sign-ups right now.</p>
            <p className="text-tiny text-muted">If you were told to use this link, check with Smith — she may have something else set up for you.</p>
            <a href={supportHref(`Hi Smith, I tried the trial link for ${state.businessName} but it says trial isn't open right now.`)} className="btn-primary w-full">Message Smith</a>
          </div>
        )}

        {state.phase === "ready" && (
          <div className="space-y-4">
            {guide && (
              <div className="card space-y-3">
                <p className="kicker text-accent">Before you start</p>
                <ol className="space-y-2 pl-4 text-tiny text-muted">
                  {guide.beforeSteps.map((step, i) => (
                    <li key={i} className="list-decimal pl-1 leading-relaxed">{step}</li>
                  ))}
                </ol>

                <div className="border-t border-line pt-3">
                  <p className="text-tiny font-semibold uppercase tracking-wide text-faint">How much to post</p>
                  <p className="mt-1 text-tiny text-muted">{guide.posting}</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-tiny font-semibold uppercase tracking-wide text-faint">Review</p>
                  <p className="mt-1 text-tiny text-muted">{guide.reviewNote}</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-tiny font-semibold uppercase tracking-wide text-faint">Style</p>
                  <p className="mt-1 text-tiny text-muted">{guide.styleLine}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {guide.formats.map((f) => (
                      <span key={f.name} className="badge bg-accentSoft text-accent">{f.name}</span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-tiny font-semibold uppercase tracking-wide text-faint">Once you're hired</p>
                  <p className="mt-1 text-tiny text-muted">{guide.afterHire}</p>
                </div>
              </div>
            )}

            <form onSubmit={start} className="card space-y-4">
              <div className="text-center">
                <p className="text-base text-ink">You have one week. Post, log it, and once one single video crosses {state.trialViews.toLocaleString()} views on TikTok or Instagram, it's reviewed and you move on to full onboarding.</p>
              </div>
              <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
              <input className="input" placeholder="Your TikTok profile link" value={form.tiktok} onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))} />
              <input className="input" placeholder="Your Instagram profile link" value={form.insta} onChange={(e) => setForm((f) => ({ ...f, insta: e.target.value }))} />
              <div>
                <input className="input" type="email" placeholder="Your personal email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                <p className="mt-2 text-tiny text-faint">Not your {state.businessName} one — you don't have that yet. This also creates your Smithstem sign-in, so use one you actually check.</p>
              </div>
              {error && <p className="text-base text-red-600">{error}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Setting you up…" : "Start my trial"}</button>
            </form>

            <p className="text-center text-tiny">
              <a href={supportHref(`Hi Smith, I was approved to be a ${state.businessName} creator and I'm having trouble getting set up.`)} className="text-muted underline">
                Trouble setting this up? Message Smith
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

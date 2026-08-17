"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabaseClient";
import { contentGuideFor } from "../../../lib/contentGuide";
import { fmtNaira, tiersOn, today } from "../../../lib/domain";

const SUPPORT_WHATSAPP = "2349076217386";
function supportHref(text) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export default function ApplyPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ phase: "loading" });
  const [form, setForm] = useState({ name: "", email: "", phone: "", mode: "link", link: "", question: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data, error: rpcErr } = await supabase.rpc("peek_business_by_slug", { p_slug: slug });
      const row = Array.isArray(data) ? data[0] : data;
      if (rpcErr || !row) { setState({ phase: "not-found" }); return; }
      const { data: tiers } = await supabase.from("bonus_tiers").select("*").eq("business_id", row.business_id).order("min_views", { ascending: false });
      const { data: biz } = await supabase.from("businesses").select("default_base_pay, bonus_enabled").eq("id", row.business_id).maybeSingle();
      setState({
        phase: "ready",
        businessId: row.business_id,
        businessName: row.business_name,
        defaultBasePay: biz?.default_base_pay || 0,
        bonusEnabled: biz?.bonus_enabled !== false,
        tiers: tiersOn(tiers || [], today()),
      });
    })();
  }, [slug]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your name.";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Enter a valid email.";
    if (!form.phone.trim()) e.phone = "Enter your WhatsApp phone number.";
    if (form.mode === "link" && !form.link.trim()) e.link = "Paste a link to a video.";
    if (form.mode === "upload" && !file) e.file = "Choose a video file.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true); setSubmitError("");
    const supabase = supabaseBrowser();
    let contentFilePath = null;
    if (form.mode === "upload" && file) {
      contentFilePath = `${state.businessId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("applicant-videos").upload(contentFilePath, file);
      if (upErr) { setBusy(false); setSubmitError("Could not upload your video: " + upErr.message); return; }
    }
    const { error } = await supabase.from("applicants").insert({
      business_id: state.businessId,
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      content_mode: form.mode,
      content_link: form.mode === "link" ? form.link.trim() : null,
      content_file_path: contentFilePath,
      question: form.question.trim() || null,
    });
    setBusy(false);
    if (error) { setSubmitError("Could not submit: " + error.message); return; }
    setState((s) => ({ ...s, phase: "confirm" }));
  }

  const guide = state.businessName ? contentGuideFor(slug) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
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
            <a href={supportHref("Hi Smith, the application link isn't working for me.")} className="btn-primary w-full">Message Smith</a>
          </div>
        )}

        {state.phase === "confirm" && (
          <div className="card space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-okBg text-2xl font-bold text-okInk">✓</div>
            <h2 className="font-display text-title font-semibold">Application received</h2>
            <p className="text-base text-muted">Keep an eye on your email — we'll write either way, whether you're approved or not. If you're approved, your trial link comes straight there.</p>
          </div>
        )}

        {state.phase === "ready" && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <p className="kicker">{state.businessName}</p>
              <h2 className="font-display text-title font-semibold">Create content for {state.businessName}</h2>
              <p className="text-base text-muted">Post short-form video, your face and your style. No experience needed, just a phone camera and consistency.</p>

              {guide && (
                <div className="border-t border-line pt-3">
                  <p className="text-tiny font-semibold uppercase tracking-wide text-faint">What we're looking for</p>
                  <p className="mt-1 text-tiny text-muted">{guide.styleLine}</p>
                </div>
              )}

              <div className="border-t border-line pt-3">
                <p className="text-tiny font-semibold uppercase tracking-wide text-faint">The bar</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-tiny text-muted">
                  <li>Good lighting and a stable shot</li>
                  <li>Clear audio — no wind noise or mumbling</li>
                  <li>Phone camera is fine. Blurry, dark, or shaky footage won't be considered</li>
                </ul>
              </div>

              {(state.defaultBasePay > 0 || (state.bonusEnabled && state.tiers.length > 0)) && (
                <div className="border-t border-line pt-3">
                  <p className="text-tiny font-semibold uppercase tracking-wide text-faint">What it pays</p>
                  {state.defaultBasePay > 0 && <p className="mt-1 text-tiny text-muted">{fmtNaira(state.defaultBasePay)} a month base pay to start.</p>}
                  {state.bonusEnabled && state.tiers.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {state.tiers.slice().sort((a, b) => a.min_views - b.min_views).map((t) => (
                        <span key={t.id} className="badge bg-accentSoft text-accent">{Number(t.min_views).toLocaleString()} views → {fmtNaira(t.amount)}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={submit} className="card space-y-3">
              <h2 className="font-semibold">Apply to {state.businessName}</h2>
              <div>
                <input className={`input ${errors.name ? "border-noInk" : ""}`} placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                {errors.name && <p className="mt-1 text-tiny text-noInk">{errors.name}</p>}
              </div>
              <div>
                <input className={`input ${errors.email ? "border-noInk" : ""}`} type="email" placeholder="Email — this is how we'll reach you" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                {errors.email && <p className="mt-1 text-tiny text-noInk">{errors.email}</p>}
              </div>
              <div>
                <input className={`input ${errors.phone ? "border-noInk" : ""}`} type="tel" placeholder="WhatsApp phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                {errors.phone && <p className="mt-1 text-tiny text-noInk">{errors.phone}</p>}
              </div>

              <div>
                <p className="mb-1.5 text-tiny font-semibold text-ink">Show us your content</p>
                <div className="flex gap-2">
                  <button type="button" className={`flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-tiny font-semibold ${form.mode === "link" ? "border-accent bg-accentSoft text-accent" : "border-line text-muted"}`} onClick={() => setForm((f) => ({ ...f, mode: "link" }))}>Link a video</button>
                  <button type="button" className={`flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-tiny font-semibold ${form.mode === "upload" ? "border-accent bg-accentSoft text-accent" : "border-line text-muted"}`} onClick={() => setForm((f) => ({ ...f, mode: "upload" }))}>Upload a video</button>
                </div>
              </div>

              {form.mode === "link" ? (
                <div>
                  <input className={`input ${errors.link ? "border-noInk" : ""}`} placeholder="TikTok or Instagram link" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                  {errors.link && <p className="mt-1 text-tiny text-noInk">{errors.link}</p>}
                </div>
              ) : (
                <div>
                  <input className={`input ${errors.file ? "border-noInk" : ""}`} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {errors.file && <p className="mt-1 text-tiny text-noInk">{errors.file}</p>}
                </div>
              )}

              <textarea className="input" rows={3} placeholder="Anything you'd like to ask? (optional)" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />

              {submitError && <p className="text-base text-red-600">{submitError}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Submit application"}</button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

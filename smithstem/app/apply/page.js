"use client";
import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function UnifiedApplyPage() {
  const [phase, setPhase] = useState("ready");
  const [form, setForm] = useState({ name: "", email: "", phone: "", mode: "link", link: "", question: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
      contentFilePath = `unassigned/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("applicant-videos").upload(contentFilePath, file);
      if (upErr) { setBusy(false); setSubmitError("Could not upload your video: " + upErr.message); return; }
    }
    const { error } = await supabase.from("applicants").insert({
      business_id: null,
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      content_mode: form.mode,
      content_link: form.mode === "link" ? form.link.trim() : null,
      content_file_path: contentFilePath,
      question: form.question.trim() || null,
    });
    setBusy(false);
    if (error) { setSubmitError("Could not submit: " + error.message); return; }
    setPhase("confirm");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {phase === "confirm" ? (
          <div className="card space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-okBg text-2xl font-bold text-okInk">✓</div>
            <h2 className="font-display text-title font-semibold">Application received</h2>
            <p className="text-base text-muted">Keep an eye on your email — we'll write either way, whether you're taken on or not. If you're in, everything you need to get started lands right there too.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-2 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lead font-bold text-gold">TDT</div>
              <p className="kicker">TDT Technologies</p>
              <h1 className="font-display text-2xl font-bold">Create content, get paid</h1>
            </div>

            <div className="card space-y-3">
              <p className="text-base text-muted">TDT Technologies works with top Nigerian brands, and we're looking for creators to make content for them — your face, your style, real pay every month. No experience needed, just a phone camera and consistency.</p>
              <p className="text-base text-muted">Drop a sample of what you can do below — if it's a fit, someone from our team will reach out personally to walk you through the rest.</p>
            </div>

            <form onSubmit={submit} className="card space-y-3">
              <h2 className="font-semibold">Apply to TDT Technologies</h2>
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

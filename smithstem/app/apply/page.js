"use client";
import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function UnifiedApplyPage() {
  const [phase, setPhase] = useState("ready");
  const [form, setForm] = useState({ name: "", email: "", phone: "", hasCamera: "", hasEditingSkills: "", city: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your full name.";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Enter a valid email.";
    if (!form.phone.trim()) e.phone = "Enter your WhatsApp number.";
    if (!form.hasCamera) e.hasCamera = "Choose one.";
    if (!form.hasEditingSkills) e.hasEditingSkills = "Choose one.";
    if (!file) e.file = "Upload a short video of yourself.";
    if (!form.city.trim()) e.city = "Enter your city.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true); setSubmitError("");
    const supabase = supabaseBrowser();
    const videoStoragePath = `unassigned/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("applicant-videos").upload(videoStoragePath, file);
    if (upErr) { setBusy(false); setSubmitError("Could not upload your video: " + upErr.message); return; }

    const { error } = await supabase.from("applicants").insert({
      business_id: null,
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      content_mode: "upload",
      content_file_path: videoStoragePath,
      has_camera: form.hasCamera === "yes",
      has_editing_skills: form.hasEditingSkills === "yes",
      location_city: form.city.trim(),
    });
    if (error) { setBusy(false); setSubmitError("Could not submit: " + error.message); return; }

    // Best-effort — matches what the old Google Form did automatically:
    // one running Sheet, with the video copied into Drive so it can be
    // reviewed from there. The application above is already saved either way.
    try {
      await supabase.functions.invoke("apply-sync", {
        body: {
          fullName: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
          hasCamera: form.hasCamera === "yes", hasEditingSkills: form.hasEditingSkills === "yes",
          locationCity: form.city.trim(), videoStoragePath,
        },
      });
    } catch (_) { /* best-effort */ }

    setBusy(false);
    setPhase("confirm");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {phase === "confirm" ? (
          <div className="card space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-okBg text-2xl font-bold text-okInk">✓</div>
            <h2 className="font-display text-title font-semibold">Application received</h2>
            <p className="text-base text-muted">We'll reach out to you on WhatsApp, whether you're taken on or not — keep an eye on the number you gave us.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-2 text-center">
              <h1 className="font-display text-2xl font-bold">Creator Application</h1>
            </div>

            <div className="card space-y-3">
              <p className="text-base text-muted">Apply to join our creator community. Provide your details and a short video of yourself — you can earn up to <strong>₦1,000,000</strong> a month if your videos perform well.</p>
              <div>
                <p className="mb-1.5 text-tiny font-semibold text-ink">These are the requirements:</p>
                <ul className="list-disc space-y-1 pl-5 text-tiny text-muted">
                  <li>Age requirement: 18 to 30 years</li>
                  <li>Base payment per month: ₦100,000 to ₦300,000</li>
                  <li>Videos per day: 1 to 2</li>
                  <li>Good phone quality</li>
                  <li>Basic editing skills</li>
                </ul>
              </div>
            </div>

            <form onSubmit={submit} className="card space-y-4">
              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">Full name</label>
                <input className={`input ${errors.name ? "border-noInk" : ""}`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                {errors.name && <p className="mt-1 text-tiny text-noInk">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">Email address</label>
                <input className={`input ${errors.email ? "border-noInk" : ""}`} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                {errors.email && <p className="mt-1 text-tiny text-noInk">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">WhatsApp number</label>
                <input className={`input ${errors.phone ? "border-noInk" : ""}`} type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                {errors.phone && <p className="mt-1 text-tiny text-noInk">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">Do you have access to a smartphone with a high-quality camera for content creation?</label>
                <div className="flex gap-2">
                  {["yes", "no"].map((v) => (
                    <button key={v} type="button" className={`flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-tiny font-semibold capitalize ${form.hasCamera === v ? "border-accent bg-accentSoft text-accent" : "border-line text-muted"}`} onClick={() => setForm((f) => ({ ...f, hasCamera: v }))}>{v}</button>
                  ))}
                </div>
                {errors.hasCamera && <p className="mt-1 text-tiny text-noInk">{errors.hasCamera}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">Do you possess basic video editing skills?</label>
                <div className="flex gap-2">
                  {["yes", "no"].map((v) => (
                    <button key={v} type="button" className={`flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-tiny font-semibold capitalize ${form.hasEditingSkills === v ? "border-accent bg-accentSoft text-accent" : "border-line text-muted"}`} onClick={() => setForm((f) => ({ ...f, hasEditingSkills: v }))}>{v}</button>
                  ))}
                </div>
                {errors.hasEditingSkills && <p className="mt-1 text-tiny text-noInk">{errors.hasEditingSkills}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">Upload a 30-second video of yourself talking about any topic of your choice</label>
                <p className="mb-1.5 text-tiny text-faint">Pick any topic — it can be an old or new video.</p>
                <input className={`input ${errors.file ? "border-noInk" : ""}`} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {errors.file && <p className="mt-1 text-tiny text-noInk">{errors.file}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-tiny font-semibold text-ink">Location (City)</label>
                <input className={`input ${errors.city ? "border-noInk" : ""}`} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                {errors.city && <p className="mt-1 text-tiny text-noInk">{errors.city}</p>}
              </div>

              {submitError && <p className="text-base text-red-600">{submitError}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Submit"}</button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

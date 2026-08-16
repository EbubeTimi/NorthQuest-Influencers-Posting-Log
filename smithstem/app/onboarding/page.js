"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import SignaturePad from "../../components/SignaturePad";
import Header from "../../components/Header";
import { contractFor, contractSections } from "../../lib/contract";
import { today as todayLagos } from "../../lib/domain";

export default function OnboardingPage() {
  const router = useRouter();
  const sigRef = useRef(null);
  const [user, setUser] = useState(null);
  // Set once loading resolves: whether a creator row already exists for this
  // account (arrived via an invite, which already created a bare one) or not
  // (arrived via the plain email code, which creates everything here).
  const [existingCreator, setExistingCreator] = useState(undefined);
  const [business, setBusiness] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState({ fullName: "", phone: "", bankName: "", acctNum: "", acctName: "" });
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/"); return; }
      setUser(data.user);

      const { data: prof } = await supabase.from("profiles").select("business_id, full_name, phone").eq("id", data.user.id).maybeSingle();
      let businessId = prof?.business_id;

      if (!businessId) {
        // Arrived via the plain email code, no invite. Same default this app
        // has always used.
        const slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG || "northquest";
        const { data: biz } = await supabase.from("businesses").select("id, slug, name").eq("slug", slug).single();
        businessId = biz?.id;
        setBusiness(biz);
      } else {
        const { data: biz } = await supabase.from("businesses").select("id, slug, name").eq("id", businessId).single();
        setBusiness(biz);
      }

      const { data: cr } = await supabase.from("creators").select("id, bank_name").eq("profile_id", data.user.id).eq("business_id", businessId).maybeSingle();
      setExistingCreator(cr || null);
      if (prof) setForm((f) => ({ ...f, fullName: prof.full_name || f.fullName, phone: prof.phone || f.phone }));

      const { data: t } = await supabase.from("bonus_tiers").select("min_views, amount, effective_from").eq("business_id", businessId);
      setTiers(t || []);
    });
  }, [router]);

  function update(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function submit() {
    if (!agreed) { setError("Please tick the agreement box first."); return; }
    if (sigRef.current.isEmpty()) { setError("Please sign in the box below before finishing."); return; }
    setStatus("submitting"); setError("");
    const supabase = supabaseBrowser();
    let creatorId;

    if (existingCreator) {
      // The invite already created the profile and a bare creator row — this
      // just fills in the bank details and countersigns it.
      const { error: upErr } = await supabase.from("creators")
        .update({ bank_name: form.bankName, acct_num: form.acctNum, acct_name: form.acctName, contract_signed_at: new Date().toISOString() })
        .eq("id", existingCreator.id);
      if (upErr) { setStatus("error"); setError(upErr.message); return; }
      await supabase.from("profiles").update({ phone: form.phone }).eq("id", user.id);
      creatorId = existingCreator.id;
    } else {
      const { error: profileErr } = await supabase.from("profiles").insert({ id: user.id, business_id: business.id, role: "creator", full_name: form.fullName, email: user.email, phone: form.phone });
      if (profileErr) { setStatus("error"); setError(profileErr.message); return; }
      const { data: creator, error: creatorErr } = await supabase.from("creators").insert({ profile_id: user.id, business_id: business.id, bank_name: form.bankName, acct_num: form.acctNum, acct_name: form.acctName, contract_signed_at: new Date().toISOString() }).select().single();
      if (creatorErr) { setStatus("error"); setError(creatorErr.message); return; }
      creatorId = creator.id;
    }

    const dataUrl = sigRef.current.toDataURL();
    const bytes = await (await fetch(dataUrl)).blob();
    const path = `${creatorId}/signature.png`;
    const { error: upErr } = await supabase.storage.from("contracts").upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) { setStatus("error"); setError("Signed up, but the signature upload failed: " + upErr.message); return; }
    // The bucket is private, so a public URL would never load. Store the path
    // and sign it at the moment someone actually opens the contract.
    await supabase.from("creators").update({ contract_file_url: path }).eq("id", creatorId);
    router.replace("/dashboard");
  }

  if (!user || existingCreator === undefined || !business) return null;

  const party = contractFor(business.slug);
  if (!party) {
    // A real legal document needs a real contracting party — inventing one
    // for a business nobody has configured yet would be worse than stopping
    // here. This is the honest state until Smith gives those details.
    return (
      <div>
        <Header />
        <main className="mx-auto max-w-md px-4 py-10 text-center">
          <h1 className="font-display text-title font-semibold">Almost there</h1>
          <p className="mt-2 text-base text-muted">
            {business.name} doesn't have a contract set up yet. Message Smith and she'll get you sorted.
          </p>
          <a
            href={`https://wa.me/2349076217386?text=${encodeURIComponent(`Hi Smith, I'm trying to join ${business.name} on Smithstem but there's no contract set up yet.`)}`}
            className="btn-primary mt-5 inline-flex"
          >
            Message Smith
          </a>
        </main>
      </div>
    );
  }

  const today = todayLagos();
  const sections = contractSections({ fullName: form.fullName, email: user.email, phone: form.phone }, today, tiers, party);
  return (<div><Header /><main className="mx-auto max-w-2xl px-4 py-6"><div className="mb-6 text-center"><h1 className="font-display text-2xl font-bold">Welcome to Smithstem</h1><p className="mt-1 text-base text-muted">A few quick steps and you're set up with {business.name}.</p></div><div className="mb-6 flex items-center justify-center gap-2">{[1, 2, 3, 4].map((n) => (<div key={n} className={`h-1.5 w-14 rounded-full ${n <= step ? "bg-accent" : "bg-line"}`} />))}</div><div className="card space-y-4">{step === 1 && (<><h2 className="font-semibold">Your details</h2><input className="input" placeholder="Full name" value={form.fullName} onChange={update("fullName")} /><input className="input" placeholder="Phone (WhatsApp)" value={form.phone} onChange={update("phone")} /><button className="btn-primary w-full" onClick={() => setStep(2)} disabled={!form.fullName || !form.phone}>Continue</button></>)}{step === 2 && (<><h2 className="font-semibold">Where we pay you</h2><input className="input" placeholder="Bank name" value={form.bankName} onChange={update("bankName")} /><input className="input" placeholder="Account number" value={form.acctNum} onChange={update("acctNum")} /><input className="input" placeholder="Account name" value={form.acctName} onChange={update("acctName")} /><div className="flex gap-3"><button className="btn-secondary flex-1" onClick={() => setStep(1)}>Back</button><button className="btn-primary flex-1" onClick={() => setStep(3)} disabled={!form.bankName || !form.acctNum || !form.acctName}>Continue</button></div></>)}{step === 3 && (<><h2 className="font-semibold">Read your contract</h2><p className="text-base text-muted">This is your full agreement with {party.partyName}. Scroll through it before continuing.</p><div className="max-h-[420px] overflow-y-auto rounded-xl border border-line bg-ground p-4 text-base text-ink">{sections.map((s, i) => (<div key={i} className="mb-4"><h3 className="mb-1 font-semibold text-ink">{s.heading}</h3>{s.body.map((line, j) => (<p key={j} className="mb-1.5 text-ink">{line}</p>))}</div>))}<div className="mt-6 border-t border-line pt-4"><p className="mb-1 text-tiny font-semibold uppercase text-faint">{party.partyName} (Contracting Party)</p><img src={party.signatureUrl} alt={`${party.partyName}'s signature`} className="h-12" /><p className="mt-1 text-tiny text-muted">Signed by {party.partyName}</p></div></div><div className="flex gap-3"><button className="btn-secondary flex-1" onClick={() => setStep(2)}>Back</button><button className="btn-primary flex-1" onClick={() => setStep(4)}>I've read it — continue</button></div></>)}{step === 4 && (<><h2 className="font-semibold">Sign to finish</h2><p className="text-base text-muted">By signing below you agree to the terms of the UGC Content Creator Agreement you just reviewed.</p><label className="flex items-start gap-2 rounded-xl bg-ground p-3 text-base text-ink"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" /><span>I, <strong>{form.fullName}</strong>, confirm that I have read the full contract and agree to be bound by it.</span></label><div><p className="mb-1 text-tiny font-semibold uppercase text-faint">Your signature</p><SignaturePad ref={sigRef} /><button type="button" className="mt-1 text-tiny text-faint underline" onClick={() => sigRef.current.clear()}>Clear signature</button></div>{error && <p className="text-base text-red-600">{error}</p>}<div className="flex gap-3"><button className="btn-secondary flex-1" onClick={() => setStep(3)}>Back</button><button className="btn-primary flex-1" onClick={submit} disabled={status === "submitting"}>{status === "submitting" ? "Submitting…" : "Sign & finish"}</button></div></>)}</div></main></div>);
}

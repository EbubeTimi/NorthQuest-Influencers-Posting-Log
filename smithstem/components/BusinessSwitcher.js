"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";

// One account, several businesses. Whichever business is "active" lives on
// the profile row, so switching is just moving that pointer — the database
// only allows moving into a business this profile actually has a membership
// in, which is what makes this safe to expose as a plain dropdown rather than
// a guarded flow. Every other screen re-queries fresh after a switch, because
// a different business means genuinely different data underneath, the same
// way changing Slack workspaces does.
export default function BusinessSwitcher({ profile }) {
  const [open, setOpen] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!profile?.id) return;
    supabaseBrowser()
      .from("business_memberships")
      .select("business_id, role, businesses(id, name, slug)")
      .eq("profile_id", profile.id)
      .then(({ data }) => setMemberships(data || []));
  }, [profile?.id]);

  useEffect(() => {
    function onOutside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const current = memberships.find((m) => m.business_id === profile?.business_id);

  async function switchTo(businessId) {
    if (businessId === profile.business_id) { setOpen(false); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().from("profiles").update({ business_id: businessId }).eq("id", profile.id);
    if (error) { setBusy(false); alert("Could not switch: " + error.message); return; }
    // A different business is different data everywhere on the page, so a
    // full reload is the honest way to reflect it — nothing is left over
    // from the business just left.
    window.location.reload();
  }

  async function addBusiness() {
    const name = prompt("Name of the new business?");
    if (!name) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setBusy(true);
    const { error } = await supabaseBrowser().rpc("create_business", { p_name: name.trim(), p_slug: slug });
    if (error) { setBusy(false); alert("Could not create: " + error.message); return; }
    window.location.reload();
  }

  // Admins always get the switcher, even with one business, so they can add
  // more. A creator only sees it once they actually have a second business —
  // otherwise this would be a control with nothing to control.
  const isAdmin = profile?.role === "admin";
  if (!profile || (!isAdmin && memberships.length < 2)) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-base font-semibold text-ink transition hover:border-accent disabled:opacity-60"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-tiny font-bold text-white">
          {current?.businesses?.name?.[0] || "…"}
        </span>
        {current?.businesses?.name || "Choose business"}
        <span className="text-faint">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          {memberships.map((m) => (
            <button
              key={m.business_id}
              onClick={() => switchTo(m.business_id)}
              className={`flex w-full items-center gap-2 border-b border-line px-3 py-2.5 text-left text-base last:border-0 hover:bg-ground ${m.business_id === profile.business_id ? "bg-accentSoft font-semibold" : ""}`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-tiny font-bold text-white">
                {m.businesses?.name?.[0]}
              </span>
              {m.businesses?.name}
            </button>
          ))}
          {isAdmin && (
            <button onClick={addBusiness} className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-base text-accent hover:bg-ground">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-dashed border-accent text-tiny font-bold">+</span>
              Add a business
            </button>
          )}
        </div>
      )}
    </div>
  );
}

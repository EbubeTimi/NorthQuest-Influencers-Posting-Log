"use client";
import { useEffect, useRef, useState } from "react";

// Signing out throws away the session that keeps a creator signed in, and
// getting back in means waiting on an emailed code. One stray tap in the header
// can lock someone out of their own pay, so the decision is made deliberately:
// once to say what will happen, again to be sure it was meant.
export default function SignOutConfirm({ open, onCancel, onConfirm }) {
  const [step, setStep] = useState(1);
  const dialogRef = useRef(null);
  const firstButtonRef = useRef(null);

  useEffect(() => {
    if (open) { setStep(1); firstButtonRef.current?.focus(); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") { onCancel(); return; }
      if (e.key !== "Tab") return;
      // Keep focus inside the dialog while it is blocking the page.
      const focusable = dialogRef.current?.querySelectorAll("button");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const copy = step === 1
    ? {
        title: "Sign out of Smithstem?",
        body: "You do not need to sign out to close the app — it remembers you on this phone. If you sign out, getting back in means waiting for a new code by email.",
        confirm: "Sign out",
        cancel: "Stay signed in",
      }
    : {
        title: "Are you sure?",
        body: "The code can take a few minutes to arrive, and you will not be able to log videos or see your payments until it does. Only sign out if this is a shared phone.",
        confirm: "Yes, sign me out",
        cancel: "No, keep me signed in",
      };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        aria-describedby="signout-body"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="signout-title" className="font-display text-lg font-bold">{copy.title}</h2>
        <p id="signout-body" className="mt-2 text-base text-muted">{copy.body}</p>
        <div className="mt-5 flex flex-col gap-2">
          {/* The safe choice is first and styled as the primary action. */}
          <button ref={firstButtonRef} className="btn-primary w-full" onClick={onCancel}>{copy.cancel}</button>
          <button
            className="w-full rounded-xl px-5 py-3 text-base font-semibold text-red-600 transition hover:bg-red-50"
            onClick={() => (step === 1 ? setStep(2) : onConfirm())}
          >
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

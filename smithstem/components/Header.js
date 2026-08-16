"use client";
import { useState } from "react";
import SignOutConfirm from "./SignOutConfirm";
import BusinessSwitcher from "./BusinessSwitcher";

export default function Header({ role, profile, onSignOut, right }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">Ω</span>
        <div className="flex flex-col">
          <span className="font-display text-lg font-bold leading-none">Smithstem</span>
          {(profile?.email || role === "admin") && (
            <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
              {profile?.email && <span className="text-faint normal-case tracking-normal">{profile.email}</span>}
              {role === "admin" && <span className="text-accent">Admin</span>}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {profile && <BusinessSwitcher profile={profile} />}
        {right}
        {onSignOut && (
          <button className="btn-secondary text-base" onClick={() => setConfirming(true)}>Sign out</button>
        )}
      </div>
      <SignOutConfirm open={confirming} onCancel={() => setConfirming(false)} onConfirm={onSignOut} />
    </header>
  );
}

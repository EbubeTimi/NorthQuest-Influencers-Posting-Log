"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabaseClient";
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) { router.replace("/"); return; }
    const supabase = supabaseBrowser();
    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: exErr }) => {
      if (exErr) { setError(exErr.message); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (!profile) router.replace("/onboarding"); else if (profile.role === "admin") router.replace("/admin"); else router.replace("/dashboard");
    });
  }, [router]);
  return (<main className="flex min-h-screen items-center justify-center px-4"><div className="w-full max-w-sm text-center">{error ? (<><p className="text-sm text-red-600">{error}</p><button className="btn-secondary mt-4" onClick={() => router.replace("/")}>Back to sign in</button></>) : (<p className="text-sm text-slate-500">Signing you in…</p>)}</div></main>);
}

import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);

export function supabaseBrowser() {
  if (!backendConfigured) {
    throw new Error("Supabase browser configuration is missing.");
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
}

export function withTimeout(promise, ms = 10000, message = "That's taking too long — check your connection and try again.") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

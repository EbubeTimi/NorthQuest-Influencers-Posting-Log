import { createBrowserClient } from "@supabase/ssr";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zuuhlowjqniadtcpdypv.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dWhsb3dqcW5pYWR0Y3BkeXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Nzc4MTUsImV4cCI6MjEwMTM1MzgxNX0.jVwib7vyA0rL-Ra7BfIOG97b6zOSkNzk4MaJjux0_uo";
export const backendConfigured = true;
export function supabaseBrowser() { return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
export function withTimeout(promise, ms = 10000, message = "That's taking too long — check your connection and try again.") { return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))]); }

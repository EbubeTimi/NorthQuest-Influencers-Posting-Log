const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const migrationPath = path.join(
  __dirname,
  "..",
  "smithstem",
  "supabase",
  "migrations",
  "20260829010000_harden_public_scrape_jobs_and_routines.sql",
);
const keepalivePath = path.join(__dirname, "..", "smithstem", "app", "api", "keepalive", "route.js");
const browserClientPath = path.join(__dirname, "..", "smithstem", "lib", "supabaseClient.js");
const legacyJoinPath = path.join(
  __dirname,
  "..",
  "smithstem",
  "app",
  "join",
  "business",
  "[slug]",
  "page.js",
);

const sql = fs.readFileSync(migrationPath, "utf8").toLowerCase();
const keepalive = fs.readFileSync(keepalivePath, "utf8");
const browserClient = fs.readFileSync(browserClientPath, "utf8");
const legacyJoin = fs.readFileSync(legacyJoinPath, "utf8");

test("scrape-job tables are denied to app-facing roles", () => {
  for (const table of ["_nq_scrape_jobs", "_cd_scrape_jobs", "_aura_scrape_jobs", "app_settings"]) {
    assert.match(sql, new RegExp(table));
  }
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all privileges on table/);
  assert.match(sql, /from public, anon, authenticated/);
  assert.match(sql, /grant all privileges on table/);
  assert.match(sql, /to service_role/);
});

test("keepalive route fails closed and uses only the server-side service role", () => {
  assert.match(keepalive, /if \(!secret\)/);
  assert.match(keepalive, /SUPABASE_SECRET_KEY/);
  assert.match(keepalive, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(keepalive, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.ok(sql.includes("revoke all on function public.ping_external() from public, anon, authenticated"));
  assert.ok(sql.includes("grant execute on function public.ping_external() to service_role"));
  assert.ok(sql.includes("alter function public.ping() security invoker"));
});

test("browser database configuration has no compiled project fallback", () => {
  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(browserClient, /backendConfigured = Boolean/);
  assert.doesNotMatch(browserClient, /zuuhlowjqniadtcpdypv/);
  assert.doesNotMatch(browserClient, /eyJhbGciOiJIUzI1Ni/);
});

test("fresh-start product disables legacy migration-roster RPCs", () => {
  for (const signature of [
    "list_pending_migration_invites(text)",
    "peek_migration_invite(text, text, text)",
    "redeem_migration_invite(text, text, text, text, text)",
  ]) {
    assert.ok(sql.includes(`revoke all on function public.${signature} from public, anon, authenticated`));
    assert.ok(sql.includes(`grant execute on function public.${signature} to service_role`));
  }
  assert.match(legacyJoin, /notFound\(\)/);
  assert.doesNotMatch(legacyJoin, /list_pending_migration_invites|peek_migration_invite|redeem_migration_invite/);
});

test("creator onboarding RPCs require an authenticated caller", () => {
  for (const signature of [
    "set_new_creator_contract_file(uuid, text)",
    "complete_creator_onboarding(uuid, text, text, text, text)",
  ]) {
    assert.ok(sql.includes(`revoke all on function public.${signature} from public, anon`));
    assert.ok(sql.includes(`grant execute on function public.${signature} to authenticated, service_role`));
  }
});

test("tenant identity helpers are unavailable to anonymous callers", () => {
  for (const signature of ["auth_role()", "auth_business_id()", "auth_creator_id()"] ) {
    assert.ok(sql.includes(`revoke all on function public.${signature} from public, anon`));
    assert.ok(sql.includes(`grant execute on function public.${signature} to authenticated, service_role`));
  }
});

test("trigger-only and payment helper functions are not directly callable by app roles", () => {
  for (const signature of [
    "bonus_claim_touch_payments()",
    "guard_profile_privileges()",
    "notify_new_applicant()",
    "notify_trial_crossing()",
    "profile_creates_membership()",
    "bonus_amount_for(uuid, bigint)",
    "bonus_amount_for(uuid, bigint, date)",
    "recalc_perf_bonus(uuid, date)",
  ]) {
    assert.ok(sql.includes(`revoke all on function public.${signature} from public, anon, authenticated`));
  }
});

test("email renderer receives a fixed search path and is not a public RPC", () => {
  assert.ok(sql.includes("alter function public.email_shell(text, text, text, text) set search_path = pg_catalog, public"));
  assert.ok(sql.includes("revoke all on function public.email_shell(text, text, text, text) from public, anon, authenticated"));
});

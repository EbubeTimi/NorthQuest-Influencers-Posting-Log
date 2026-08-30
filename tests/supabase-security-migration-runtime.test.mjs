import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const requireFromApp = createRequire(path.join(here, "..", "smithstem", "package.json"));
const pgliteEntry = requireFromApp.resolve("@electric-sql/pglite");
const { PGlite } = await import(pathToFileURL(pgliteEntry).href);
const migration = fs.readFileSync(
  path.join(
    here,
    "..",
    "smithstem",
    "supabase",
    "migrations",
    "20260829010000_harden_public_scrape_jobs_and_routines.sql",
  ),
  "utf8",
);

const bootstrap = String.raw`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create table public._nq_scrape_jobs (
    id bigint generated always as identity primary key,
    status text not null default 'queued'
  );
  create table public._cd_scrape_jobs (
    id bigint generated always as identity primary key,
    status text not null default 'queued'
  );
  create table public._aura_scrape_jobs (
    id bigint generated always as identity primary key,
    status text not null default 'queued'
  );
  create table public.app_settings (
    id bigint generated always as identity primary key,
    setting_key text not null
  );
  create table public.system_heartbeat (
    id bigint generated always as identity primary key,
    source text not null
  );
  create table public.trigger_probe (
    id bigint generated always as identity primary key,
    touched boolean not null default false
  );

  grant all privileges on table
    public._nq_scrape_jobs,
    public._cd_scrape_jobs,
    public._aura_scrape_jobs,
    public.app_settings
  to public, anon, authenticated, service_role;
  grant insert, select on public.trigger_probe to authenticated, service_role;
  grant select on public.system_heartbeat to service_role;
  grant usage, select on all sequences in schema public to anon, authenticated, service_role;

  create function public.auth_role() returns text language sql security definer as $$ select current_user::text $$;
  create function public.auth_business_id() returns uuid language sql security definer as $$ select null::uuid $$;
  create function public.auth_creator_id() returns uuid language sql security definer as $$ select null::uuid $$;
  create function public.set_new_creator_contract_file(uuid, text) returns boolean language sql security definer as $$ select true $$;
  create function public.complete_creator_onboarding(uuid, text, text, text, text) returns boolean language sql security definer as $$ select true $$;

  create function public.bonus_claim_touch_payments() returns trigger language plpgsql security definer as $$ begin return new; end $$;
  create function public.guard_profile_privileges() returns trigger language plpgsql security definer as $$ begin new.touched := true; return new; end $$;
  create function public.notify_new_applicant() returns trigger language plpgsql security definer as $$ begin return new; end $$;
  create function public.notify_trial_crossing() returns trigger language plpgsql security definer as $$ begin return new; end $$;
  create function public.profile_creates_membership() returns trigger language plpgsql security definer as $$ begin return new; end $$;
  create trigger trigger_probe_guard before insert on public.trigger_probe for each row execute function public.guard_profile_privileges();

  create function public.bonus_amount_for(uuid, bigint) returns bigint language sql security definer as $$ select 0::bigint $$;
  create function public.bonus_amount_for(uuid, bigint, date) returns bigint language sql security definer as $$ select 0::bigint $$;
  create function public.recalc_perf_bonus(uuid, date) returns bigint language sql security definer as $$ select 0::bigint $$;
  create function public.email_shell(text, text, text, text) returns text language sql security definer as $$ select 'ok'::text $$;

  create function public.ping_external() returns boolean language plpgsql security definer as $$
  begin
    insert into public.system_heartbeat(source) values ('external');
    return true;
  end
  $$;
  create function public.ping() returns text language sql security definer as $$ select current_user::text $$;

  create function public.list_pending_migration_invites(text) returns boolean language sql security definer as $$ select true $$;
  create function public.peek_migration_invite(text, text, text) returns boolean language sql security definer as $$ select true $$;
  create function public.redeem_migration_invite(text, text, text, text, text) returns boolean language sql security definer as $$ select true $$;

  grant execute on all functions in schema public to public, anon, authenticated, service_role;
`;

async function withRole(db, role, operation) {
  await db.exec(`set role ${role}`);
  try {
    return await operation();
  } finally {
    await db.exec("reset role");
  }
}

async function functionPrivilege(db, role, signature) {
  const result = await db.query(
    "select has_function_privilege($1, $2, 'execute') as allowed",
    [role, signature],
  );
  return result.rows[0].allowed;
}

test("security migration replays twice and enforces real PostgreSQL role boundaries", async (t) => {
  const db = new PGlite();
  t.after(async () => db.close());
  await db.waitReady;
  await db.exec(bootstrap);

  await db.exec(migration);
  await db.exec(migration);

  const protectedTables = ["_nq_scrape_jobs", "_cd_scrape_jobs", "_aura_scrape_jobs", "app_settings"];
  for (const table of protectedTables) {
    const rls = await db.query(
      "select relrowsecurity from pg_class where oid = $1::regclass",
      [`public.${table}`],
    );
    assert.equal(rls.rows[0].relrowsecurity, true, `${table} must have RLS enabled`);

    for (const role of ["anon", "authenticated"]) {
      const privilege = await db.query(
        "select has_table_privilege($1, $2, 'select,insert,update,delete') as allowed",
        [role, `public.${table}`],
      );
      assert.equal(privilege.rows[0].allowed, false, `${role} must not access ${table}`);
      await assert.rejects(
        withRole(db, role, () => db.query(`select * from public.${table}`)),
        /permission denied/,
      );
    }

    const serviceAccess = await db.query(
      "select has_table_privilege('service_role', $1, 'select,insert,update,delete') as allowed",
      [`public.${table}`],
    );
    assert.equal(serviceAccess.rows[0].allowed, true, `service_role must retain ${table}`);
  }

  await withRole(db, "service_role", () =>
    db.exec("insert into public._nq_scrape_jobs(status) values ('runtime-proof')"),
  );

  for (const signature of [
    "public.ping_external()",
    "public.list_pending_migration_invites(text)",
    "public.peek_migration_invite(text,text,text)",
    "public.redeem_migration_invite(text,text,text,text,text)",
    "public.guard_profile_privileges()",
  ]) {
    assert.equal(await functionPrivilege(db, "anon", signature), false, `${signature} must deny anon`);
  }

  for (const signature of [
    "public.auth_role()",
    "public.auth_business_id()",
    "public.auth_creator_id()",
    "public.set_new_creator_contract_file(uuid,text)",
    "public.complete_creator_onboarding(uuid,text,text,text,text)",
  ]) {
    assert.equal(await functionPrivilege(db, "anon", signature), false, `${signature} must deny anon`);
    assert.equal(await functionPrivilege(db, "authenticated", signature), true, `${signature} must allow authenticated`);
  }

  await assert.rejects(
    withRole(db, "anon", () => db.query("select public.ping_external()")),
    /permission denied/,
  );
  await withRole(db, "service_role", () => db.query("select public.ping_external()"));
  const heartbeat = await db.query("select count(*)::int as count from public.system_heartbeat");
  assert.equal(heartbeat.rows[0].count, 1);

  const ping = await withRole(db, "anon", () => db.query("select public.ping() as caller"));
  assert.equal(ping.rows[0].caller, "anon", "ping must run with the caller's privileges");

  await withRole(db, "authenticated", () => db.exec("insert into public.trigger_probe default values"));
  const triggerProof = await db.query("select touched from public.trigger_probe");
  assert.equal(triggerProof.rows[0].touched, true, "revoking direct execute must not break the trigger");

  const emailShell = await db.query(`
    select p.prosecdef, p.proconfig
    from pg_proc p
    where p.oid = 'public.email_shell(text,text,text,text)'::regprocedure
  `);
  assert.deepEqual(emailShell.rows[0].proconfig, ["search_path=pg_catalog, public"]);
});

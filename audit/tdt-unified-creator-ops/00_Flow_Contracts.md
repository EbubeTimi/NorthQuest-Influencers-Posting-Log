# Shared flow contracts

## Identity and tenant contract

```text
auth_user 1 — 1 profile
profile 1 — many business_memberships
business_membership 1 — 0..1 creator identity in that business
active_business must reference an enabled membership owned by auth_user
```

Tenant rules:

- Every creator, video, report, opening balance, notification, enquiry, inventory record, and audit event carries `business_id`.
- Authorization derives `profile_id` from the authenticated caller and validates membership server-side.
- Deactivation is membership/creator scoped, not identity deletion.
- Cross-tenant identifiers must return the same denial shape as missing objects where disclosure matters.

## Shared-cycle contract

- One platform cycle definition applies to NorthQuest, CashDrive, and Aura; no Aura-specific weekday branch.
- Production must store an explicit, auditable cycle anchor/timezone rather than infer it differently in clients.
- A due report key is `(business_id, creator_id, cycle_id, video_log_id, platform)`.
- A creator owes only videos logged after their membership joined and inside the completed cycle.
- A prior cycle’s report never satisfies the next cycle.
- Logging permission is computed server-side and checked atomically with insert.

## Trial qualification contract

- Constant threshold: 10,000 for all businesses.
- Qualification is per one video; reports from different videos are never added together.
- First qualifying transition wins and records `qualifying_video_id` and `qualified_at`.
- Retrying the same report cannot send a second notification or repeat the transition.
- Management receives notification and can deactivate/reactivate, but cannot approve, reject, or manually force qualification.

## Migration contract

- Opening count is not a set of fabricated video rows.
- Historical URLs remain in Google Sheets.
- Import rows are admin-entered, attributable, idempotent, and reversible by a correcting entry rather than history deletion.

## Automation contract

- Delivery: at-least-once trigger with effectively-once report/run creation.
- Idempotency: `(business_id, kind, period_start, period_end, attempt_generation)` with a unique active result per window.
- Retryable: network, rate limit, temporary Drive/Apify/Supabase failure.
- Terminal: invalid folder, revoked credential, invalid actor response schema after validation.
- Human review: partial platform results, cost limit reached, inconsistent creator mapping.
- Reconciliation checks external result IDs before repeating an effect after a crash.

## Audit contract

Minimum event fields: `id`, `business_id`, `actor_profile_id` or system actor, `action`, `object_type`, `object_id`, safe before/after summary, `reason`, `occurred_at`, `correlation_id`. Never log passwords, OTPs, tokens, bank numbers, private file URLs, or raw third-party credentials.

## Scale contract (>1,000 creators)

- Paginate admin lists and analytics inputs; no unbounded `.select("*")` for tenant-wide screens.
- Index cycle/report lookups on business, creator, cycle, video, and status.
- Batch Drive/Apify work with bounded concurrency and resumable leases.
- Materialize or incrementally aggregate admin totals; do not recompute every creator/video/report in one browser request.
- Use database constraints for duplicate prevention and concurrency, not UI state.

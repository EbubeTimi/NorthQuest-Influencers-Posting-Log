# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Creators** — UGC talent contracted by NorthQuest (a UGC/talent management agency) to produce sponsored TikTok and Instagram content for NorthQuest's clients. They log posts from their phones, typically at night right after posting, and check their own pay progress on a personal dashboard.
- **Admin (Smith)** — the sole admin. Manages the creator roster month to month, sets base pay per creator, records performance/special bonuses, reconciles missed or wrong logs by crediting posts manually, runs the monthly payment register, and handles contract onboarding/e-signing. Confirmed: no other staff currently use the admin side.

## Product Purpose

Replace informal, error-prone manual tracking of a growing paid-creator roster with a system that (1) creators can trust to honestly reflect what they've logged and what they're owed, and (2) lets a single admin compute accurate monthly pay — tiered base pay plus view-based performance bonuses — without chasing people down at collation time.

## Positioning

Internal operations tool, not a market-facing product. No competitor-facing claim applies here.

## Operating Context

- Creators log up to 2 videos/day, each needing a TikTok and/or Instagram link. A grace window lets a creator who missed a day backfill it the next day until 2 PM Africa/Lagos, enforced server-side (not by the creator's device clock) — this is a deliberate, narrow exception to an otherwise strict "server date only" anti-backdating rule.
- Backend is Google Apps Script + Google Sheets (Posting Log / Creators / Payment Manual sheets); frontend is static HTML/CSS/JS, single-page-app style with client-side page routing. No build step, no framework.
- Admin runs a monthly Payment register per creator, sourced from the Posting Log plus manual admin credits/overrides recorded directly in the Payment Manual sheet.
- Contract onboarding requires the creator to read and sign a PDF (pencil/annotation tool, not a paid e-signature product) and upload it, alongside setting up WhatsApp, Instagram, and TikTok.

## Capabilities and Constraints

- Base pay tiers currently in use: ₦100,000 (WhatsApp/picture content), ₦150,000 (video content), ₦200,000 (admin-discretionary bump, not shown in the onboarding picker). Per-video rate = monthly base pay ÷ 62 (31 days × 2 slots/day). A creator's base pay can change from one month to the next without altering pay already computed for past months.
- Performance bonuses: a 6-tier table keyed to total video views (100k views → ₦50k, up to 10M → ₦2M), entered per creator per month by admin.
- Per-month roster: a creator appears only under the month(s) they were actually active. A deactivated creator is filed under the month they left and never spills into later months. Late joiners can be added mid-month with zero prior posts.
- Admin can credit or override a creator's post count for a month (e.g., proof sent outside the app). The dashboard must show this distinctly as "logged by admin," never presented as if the app itself logged it.
- The Payment sheet, not the raw Posting Log, is the source of truth for what a creator is actually owed — admin corrections there must be reflected back to the creator.
- The app must never tell a creator contradictory things about today's logged status (e.g., "nothing logged" immediately followed by "already logged"); an unconfirmed state must display as unknown, never guessed.

## Brand Commitments

Shown brand name in the app: "Northquest Finance." No other brand guideline has been made binding; the current purple/lavender palette is the existing implementation, not a stated requirement — a calmer, green-accented direction is under active review as of this session.

## Evidence on Hand

Real, current production data exists in the live Google Sheet (real creator names, real posting history, real pay tiers). No external testimonials, case studies, or marketing evidence exist for this internal tool, and none should be fabricated.

## Product Principles

1. The Payment sheet is the ledger of record; the Posting Log is a convenience layer that feeds it, not the other way around.
2. Never guess at a creator's logged status — an unknown state is shown as unknown, never collapsed into "none" or "done."
3. A creator's past-month pay is never retroactively changed by a later change to their current rate or roster status.
4. Surface gaps (missed logs, unresolved contracts, unpaid creators) before monthly collation day, not after — the admin should never have to chase people down manually to close the books.

## Accessibility & Inclusion

No formal accessibility standard has been mandated. Confirmed gap: an `/impeccable audit` pass this session found real WCAG AA contrast failures on the current UI (muted gray body text, several instances) — recorded here as a known, unresolved issue, not yet a requirement.

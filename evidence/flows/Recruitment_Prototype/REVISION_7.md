# Recruitment revision 7 — accepted flow and next-phase review

28 August 2026. Same isolated prototype branch/draft PR; production code, data, source Forms/Sheets and deployment unchanged by this work.

The user accepted recruitment for now, deferred final UI/colour polish, and explicitly kept History for an audit trail. This is not production implementation or storage authorization. Business headings now sit below Back; phone screenshots at 320/390 confirm the hierarchy.

## Continue without restarting

`http://127.0.0.1:4173/recruitment.html#trial-onboarding` and the review-only **Next: trial & onboarding (example)** button reset local example data and open Noah's CashDrive invitation. They prepare a single example through existing contact/start guards, not a second flow implementation. This is not a real shareable invitation. The default recruitment URL remains available for the latest edits.

Invitation → mock Google/profile → mandatory walkthrough → trial dashboard → logged video → 10,000+ views and screenshot → manager correction or verification → creator brand setup → manager check → one local membership. The active dashboard is an explicit next-prototype boundary; it is not silently implemented here.

## Fresh evidence

- 23 PASS current Browser checks in `tests/recruitment-onboarding-runtime.test.js`: business layout, setup/tour, exact video selection, mandatory screenshot, failed-save retention/retry, correction/resubmission, management checks, History, setup validation, and exactly one local membership. Repeated after the link repair.
- 2 PASS deep-link checks in the same runner: full page load and switching from the already-open recruitment page. Initial same-document navigation did not initialize the phase; a hash-change handler fixed it, and both paths were retested.
- 40 PASS recruitment regression Browser checks in `tests/recruitment-simplify-runtime.test.js`, including queues, contact, trial start, rename/cancel/retry, application required marks/drafts and 320/390/768 layouts.
- 63 PASS recruitment core checks across simplify (7), contact (5), distribution (8), original (24), revision-2 (13), settings/date (6); 33 PASS unchanged trial-contract checks.
- Runtime-test syntax and whitespace checks pass. Screenshots: `revision7-business-320/390.png`, `invitation`, `trial-dashboard`, `evidence-retry`, `manager-history`, `onboarding-ready`, `brand-setup`, `membership-ready`. Business, onboarding-ready and setup images visually inspected. Setup screenshot deliberately includes the retained incomplete-setup validation state.

Browser results are recorded in `revision7-runtime-proof.json`. Runtime runners use the Browser skill; they are not standalone Node browser launchers.

## Limits and next decisions

All people, Google sign-in, evidence images, saved records, messaging and memberships are local examples. No actual file upload/playback, Google OAuth, network save, cross-device retention, live tenant isolation or real invitation delivery was verified. Weekly/bonus production integrations, complete keyboard/screen-reader traversal, physical devices, active dashboard integration and launch readiness remain unverified. This was not a fresh Next.js build or production security test.

Both flow skills informed the approval boundary and transition/recovery checks. TypeUI returned setup guidance; the already installed fundamentals and existing phone-first visual system were reused, not a remotely generated redesign. No new dependency. The user explicitly deferred final visual polish.

Storage is a decision, not a completed feature. Legacy Supabase/Drive code exists but has upload-limit, policy and source-Sheets side-effect concerns. See `../../../audit/tdt-unified-creator-ops/RECRUITMENT_STORAGE_ASSESSMENT.md`. Provider/retention need agreement before implementation; do not delete introduction videos on first play or apply their temporary policy to qualification evidence.

Next user review: trial invitation through brand onboarding, then the preserved active-creator dashboard draft. No restart of Applications and no production permission inferred.

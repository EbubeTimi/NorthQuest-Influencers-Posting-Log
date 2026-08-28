# GrowthCooks recruitment prototype verification — August 28, 2026

**Historical revision-1 evidence below.** The current revision-3 proof and limitations are in [REVISION_3.md](REVISION_3.md). Do not treat this older runner's labels or full-flow results as a fresh verification of the revised recruitment UI.

Approval status: awaiting user review. Production implementation, data migration and deployment are not approved by this report.

## Reproduce

From the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory prototypes
node tests/recruitment-prototype.test.js
node tests/prototype-contract.test.js
node --check tests/recruitment-runtime.test.js
```

Open `http://127.0.0.1:4173/recruitment.html`. Browser checks are project-owned exports in `tests/recruitment-runtime.test.js`: `application`, `happy`, `branches`, `layouts`, `recovery`. Run them through the Browser skill with its page, viewport and screenshot callbacks. They are not standalone Node browser tests.

## Proof, separated by kind

- PASS — 24 recruitment core checks: validation, immutable snapshots, replay/idempotency, separate screening/outreach outcomes, trial eligibility, explicit brand sharing, canonical duplicate identities, evidence, verification, onboarding and cancellation. These prove local logic only.
- PASS — 33 existing trial contract checks. Approved trial HTML was not changed by this recruitment slice.
- PASS — complete recruitment inline-script syntax, browser-test script syntax and `git diff --check`.
- PASS — 42 in-app browser assertions in `runtime-proof.json`: application fields/receipt/inbox, failed save/no row, acceptance/outreach/trial, proof validation and exact link, mandatory manager verification, creator setup, one active membership, rejection/decline, brand/other-agency boundaries, expired/denied screens, end-trial, correction/resubmission history and onboarding cancellation.
- PASS — inbox overflow/control-height checks at 320, 390, 768 and 1280 px; evidence form overflow and 16px numeric inputs at 320 and 390 px. Phone screenshots of applicant, evidence and management paths were inspected. This is not every state at every width or a physical-device test.
- PASS — reduced-motion toggle applies and page changes focus the heading. Native form labels and inline alerts are present. Full keyboard-only, screen-reader traversal and focus restoration across every route remain UNVERIFIED.
- PASS — independent static/core review, followed by corrections: brand recommendation no longer grants access; sharing is explicit and brand detail excludes application answers/internal notes; duplicate applications cannot create duplicate trials; identity chains use a resolved canonical person. The final duplicate selector also excludes unresolved candidates. Proper profile URLs and bounded trial-end outcomes are enforced.

Actual screenshots in this directory are generated example data, not source applicant information. Demo screenshots are visibly labelled, not real social-platform evidence.

## Failures encountered and resolved

1. Local preview server stopped; browser reported connection refused. Restarted the loopback-only server and verified the page opened. No files were lost.
2. First happy-path assertion read the result before simulated saving finished. Browser test now waits for the visible Saving status to disappear; full rerun passed.
3. An existing-regression invocation used a nonexistent filename. Corrected to `tests/prototype-contract.test.js`; 33/33 passed.
4. Browser font measurement did not support `parseFloat` in its restricted evaluator. Changed to an exact computed `16px` check; recovery rerun passed.
5. Final diff check flagged trailing whitespace in a newly edited documentation date. Removed it and reran the check before commit.

No unresolved automated failure is hidden by this report. A standalone invocation of `prototype-design.test.js` only loads its exported runner; it is not counted as a new design test run.

## Prototype limits and remaining gates

Everything is local and memory-only. Refresh/reset loses demonstration records, files and decisions. Application and evidence entries survive simulated offline/failed saves; management drafts are not promised across role or preview switches. Google, invitation redemption, upload storage, notifications and database writes are mocked. Local image-decoding/file-picker and actual introduction playback were not runtime-verified; browser paths used labelled demo assets.

Real caller RLS/tenant isolation, database append-only enforcement, concurrent identity/invitation transactions, durable uploads and scanning, Google OAuth, notifications, Sheets, Apify, backups, rollback and >1,000-creator load are UNVERIFIED here. Existing production blockers are not repaired by this prototype. Production build/dependency audit were not rerun because this slice changes no production UI, dependency or schema. Historical production build results must not be treated as fresh launch evidence.

Foundation execution and build-state gates are not applicable to this isolated throwaway UI prototype; they remain required for the later persistent implementation. Flow skills are both version 2.0.1. TypeUI MCP returned setup guidance, so the already installed/read fundamentals and approved trial visual system were applied; no remote-generated design is claimed. Plain-language writing fallback was used.

Pending approval choices: exact source brief-comfort labels, onboarding checklist and real contract/employment boundary, evidence retention duration and the proposed owner-only sensitive permissions. The new recruitment import is planning-only; no source Form/Sheet or production record was edited, imported or deleted.

# Recruitment revision 6 — simple people, outcomes and application

August 28, 2026. Existing isolated prototype/branch/draft PR. Production application code, dependencies, migrations, data and source Forms/Sheets unchanged; no main merge or production deployment. Fictional seed records only.

## Current flow and trace

| User action | Implementation | Proof |
| --- | --- | --- |
| Open applicant/person | personHeading, contactCard, details | Vertical name below back; business above name in Pipeline; spaced contact lines; screenshot review/person widths |
| Save accept/reject | screening, managementTask, bind | Existing validation and immutable decisions preserved; shorter Save action, compact width |
| Filter five stages | pipelineStage/pipelineView | Core exact counts + browser exact select values; uncontacted only under All, blank initial Outcome |
| Save Declined | contact, distributionList, declineSummary | Separate list and confirmation; reason/recorder; not team Rejected or Accepted summary; original person retained |
| Text person after Outcome | formatMessage/invitationPage | First-name greeting, editable links, correctly encoded recipient text, mock-only composer |
| Start accepted trial | startTrial/trialForm | Explicit consent then start; current Lagos date, null scheduled end, no End trial control; original one-trial/evidence guards |
| Rename brand / cancel / retry | renameBrand/brandLabel/brandEditor | Stable internal key, recipients, invitation URL, policy and snapshots; duplicate/role checks, cancel discard and failed-save retention |
| Complete application | application/bindRevision | Agency branding, required stars/native requirements, optional final message, visible required video field, automatic in-tab drafts through navigation |

The five filters are Contacted, Cannot be reached, Unresponsive, Declined and Trial started, plus All stages. Consent to trial is not activation. Later internal evidence/onboarding statuses remain available within the person's workflow, not as extra recruitment filters. Counts need not sum to All because uncontacted people have no status yet. Previous contact reasons/recorder remain in history after recontact.

New trials have no planned end date; evidence/bonus/logging no longer fail after a fabricated seven-day trial limit. Existing dated fixtures remain supported. A mock invitation retains an independent seven-day redemption expiry, not a trial termination deadline. Production revocation/firing workflow is not implemented by this change.

## Fresh verification

- PASS: 63 recruitment core checks: simplify 7, contact 5, distribution 8, original recruitment 24, revision-2 13, settings/date helper 6. The date helper checks are legacy-compatible, not the current trial UI policy.
- PASS: 33 unchanged approved-trial contract checks.
- PASS: 40 current Browser checks in `tests/recruitment-simplify-runtime.test.js`, recorded in `revision6-runtime-proof.json`. They cover review/accept → business → WhatsApp → decline → distinct queues, consent → trial start, brand rename/collision/cancel/failure/recipient, required fields and draft navigation.
- PASS: person layouts and compact 44px Save at 320/390/768; phone screenshots of review, outcome, decline, brands, application and video step visually checked. Not every route at every width or physical hardware.
- PASS: inline-script parse, runtime-test syntax and whitespace check. Existing core fixtures updated only for the requested first-name greeting and Contacted label.
- Independent read-only reviewer passed simplify 7/7 and checked stable brand keys, no-end guards and decline→recontact retention. They found cancel-rename restoring old unsaved text; it was fixed and browser-tested.

## Failures and corrections

Failing-first test confirmed renameBrand did not exist. Old tests expected the old full-name greeting and Awaiting response key; expectations were updated to the user's changed contract and rerun. The first browser spacing check used unsupported parseFloat in the restricted DOM evaluator; replaced with exact computed-style comparison. A browser-result variable was not initialized after an earlier exception; corrected and the complete suite rerun. None were production failures.

Visual/state review found an uncontacted person's dropdown silently selected the first Contacted option. The generic placeholder now remains selected when the stored state isn't an allowed choice; a browser assertion verifies blank unsaved Outcome. Required age marker now stays with its label text. All 40 checks/screenshots rerun after these corrections.

## Honest boundaries

The introduction file is attached to its applicant record and opened above the vibe decision, not in Settings. The prototype holds a File/object URL in the open tab only. Refresh/reset loses it. Private authorized server media storage, upload recovery/scanning/retention and real playback still need implementation and verification. The runtime uses labelled demo metadata, not an actual uploaded video.

Typing already saves draft answers automatically in local in-memory application state; navigation retention is tested. This is not durable autosave after refresh, phone loss, browser closure or across devices. Real Google login, WhatsApp delivery, database isolation, native file selection/playback, keyboard-only/screen-reader traversal, physical phones, complete updated trial→weekly/bonus/evidence→onboarding→active-dashboard browser flow, and launch readiness remain UNVERIFIED. No Next.js production build is claimed for a prototype-only change.

Both flow skills guided the conflict/transition map and mock approval boundary. TypeUI MCP returned setup guidance; already-installed fundamentals informed hierarchy, compact controls, spacing and required indicators. No remote-generated UI, new dependency or native haptic behavior is claimed. Plain language is the portable writing fallback.

Next: review revision 6 at the same local recruitment URL, then continue the existing recipient trial → evidence → brand onboarding → active dashboard handoff. No restart of Applications and no inferred production approval.

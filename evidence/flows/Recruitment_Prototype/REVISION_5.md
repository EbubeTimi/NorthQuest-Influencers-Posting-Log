# Recruitment revision 5 — person-level WhatsApp and lighter phone UI

August 28, 2026. Same approval prototype, isolated feature branch and draft PR. Production application code, dependencies, data, source Google Forms/Sheets and approved trial page are untouched. No merge or production deployment.

## What changed

- Settings now contains application questions and brands only. One heading and a 44px door-arrow Back button; no large Back tab or message controls. Exit restores the prior workspace, never logs out.
- The person's business Pipeline owns WhatsApp messaging. The draft includes recipient, current operator, business and paragraph breaks. Open WhatsApp has the correctly encoded recipient/message URL but is intercepted by the explicitly labelled local-only preview; no message or contact outcome is sent/recorded by opening it.
- Default message editing is collapsed inside that same contact page, fixed to the person's business and outreach/invitation stage. No redundant type tabs or business selectors. Individual drafts are operator/person/stage scoped; saved defaults stay business/type scoped.
- Named business pages have name search, compact counted stage choices, status labels/colour, and retained name/stage on return. Stage counts are full business totals independent of the name query. Applicants remains distribution-only without search.
- The application editor explicitly shows the fixed required 30-second introduction question. Full applicants upload on their final application step; the accepted UGC-No early-ending exception remains. Management sees the associated filename and player/labelled demo placeholder on that applicant's review page. It is not stored inside Settings.
- Secondary actions, inner panels and question groups lose surrounding borders; input boundaries, separators and accessible control sizing remain. No extra UI package or production dependency.

## Where videos live

The existing prototype uses a browser File/object URL in memory. It is attached to the submitted example application and rendered on that record's introduction section within the same open tab. Reset/refresh loses prototype records/previews. This is NOT a server upload or shared storage. Planned production media storage must be private, authorized and linked to the application; file validation/scanning, upload recovery, access expiry, retention and genuine playback need implementation and end-to-end verification after approval. No storage bucket is created or changed here.

## Fresh verification

- PASS: 56 recruitment core checks: contact 5, settings 6, distribution 8, recruitment 24, revision-2 13.
- PASS: 33 unchanged approved-trial contract checks; design static script also exits successfully.
- PASS: 34 current in-app Browser assertions in `tests/recruitment-contact-runtime.test.js`, recorded in `revision5-runtime-proof.json`. Includes form editor/save, visible upload question, borderless groups, scoped search/counts, current operator message, URL encoding, mock send boundary, failure/retry, cross-business default isolation, invitation context, manager return and example file metadata attached to the correct review record.
- PASS: Pipeline width and click-based back at 320/390/768px, compact stage width, 44px icon target. Screenshots `revision5-*.png` were visually inspected (Settings, contact, business list, question editor and example review).
- PASS: inline script and new test syntax, whitespace check. Independent read-only reviewer reran contact 5/5 and distribution 8/8 and found no blocker in the bounded changes.

## Failures and limits

The initial new contact test failed against the old implementation, then passed after changes. A first Browser keyboard assertion failed: locator Enter/Space did not activate the new native back button; Enter also failed to activate unchanged Applicants navigation. Cause was not established. No workaround handlers were added to native buttons. **Keyboard activation remains unverified**; the recorded click assertions are not keyboard proof. Full keyboard-only and screen-reader traversal still need checking.

Visual inspection found an older later CSS rule restoring question-card borders. It was corrected, the browser border assertion strengthened, and all 34 checks/screenshots rerun. A package lookup in the repository root found no package.json (the production app is under smithstem); no install/build was attempted there. Other setup/tool failures occurred before writes and were corrected. No source data was affected.

Actual native file selection, video decoding/playback and server upload were not verified; this runner uses visibly labelled example metadata, not a real introduction recording. Real Google auth, WhatsApp delivery, durable drafts/storage, database tenant enforcement, physical phones, full revised trial → weekly/bonus/evidence → onboarding → active dashboard browser traversal, and September 1 launch readiness remain unverified. No Next.js production build is claimed for this prototype-only revision. Seven elapsed days remains a review-only trial-duration example, not approved policy.

## Design/workflow influence and next review

Both flow-by-flow and flow-prototype were used to keep entry/back paths, scoped drafts, mock boundaries and proof explicit. TypeUI MCP again returned setup guidance; the existing project-local TypeUI fundamentals informed compact hierarchy, focus and touch sizes, not a remotely generated design. User density preferences override generic large spacing. Meta's historical [New Page Experience](https://about.fb.com/news/2021/01/introducing-the-new-page-experience/) was consulted for cleaner navigation/task placement, not copied as a current UI or implementation specification.

Review the same local `recruitment.html` URL. After this slice is accepted, continue the same person's invitation → trial dashboard → evidence verification → brand onboarding → active-creator handoff. Do not restart Applications or interpret prototype feedback as production authorization.

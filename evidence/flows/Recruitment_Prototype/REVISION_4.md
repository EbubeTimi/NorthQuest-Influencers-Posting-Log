# Recruitment revision 4 — settings, business context and invitation handoff

August 28, 2026. Same isolated approval prototype, feature branch and draft PR. No production application, dependencies, database, source Forms/Sheets or deployment changes.

## User-visible changes

Settings holds editable application questions/options, business names and business-specific WhatsApp templates. Each option has its own labelled multiline field with an Add option control; Add a question is visible before the question list and focuses the new question. Removing an option does not shift stale drafts into another answer. The mandatory UGC Yes/No branch is protected; question wording and other questions remain editable.

Outreach/Invitation are two tabs with selected state, arrow/Home/End keyboard support and separate retained drafts. A named business pipeline has only that business's people, coloured/text status chips and a stage filter. Back to pipelines returns to the business index. Accepted business summaries open the same scoped list. WhatsApp action uses the recipient's first name.

Start trial now shows automatic read-only start and end dates. Start comes from the preview clock in Africa/Lagos; reset starts the clock at the current time. **Trial duration remains unconfirmed.** The prior September 6 → 13 example is preserved as seven elapsed days, clearly labelled review-only. This is eight inclusive calendar dates and must not be silently interpreted as the weekly reporting duration. The user was asked to confirm the real duration.

Invitation URL contains the assigned business slug and the existing recipient-bound mock token. It is an example.test link, not a working public production invitation. Review controls traverse its simulated recipient journey and return to the manager's saved place. Actual delivery and Google authentication are not claimed.

## Fresh proof

- PASS: 6 settings/date core checks in `tests/recruitment-settings.test.js`.
- PASS: 8 distribution, 24 original recruitment and 13 revision-2 core checks. The last two revision-2 tests cover evidence/bonus acceptance and future-date rejection at UTC23:15 / Lagos00:15.
- PASS: 33 unchanged approved-trial contract checks. Separate approved trial HTML is untouched.
- PASS: 24 settings browser checks in `tests/recruitment-settings-runtime.test.js`: tabs/drafts/keyboard; separate option add/remove/save/error recovery; required new question in application; business-only page; conditional decline; automatic dates; CashDrive-specific invitation → Google mock → profile setup → walkthrough → Noah's dashboard → return to original invitation and pipeline.
- PASS: 31 updated distribution browser regression checks in `tests/recruitment-distribution-runtime.test.js`. Selectors follow the new business index and tabs; underlying assertions remain queue/permission/recovery/layout checks.
- PASS: browser JavaScript loaded and ran; test syntax, inline-script parse and git diff whitespace check.
- Phone Settings, tabs and business-only list screenshots were visually inspected. Open question-editor layout checked at 320/390/768; Applicants regression covers 320/390/768/1280. Not every state/width combination or physical device.

Runtime runners export `run(page,{viewport,capture})` and are executed only through the Browser skill, not by launching an independent browser. Results are in `revision4-runtime-proof.json`; screenshots are `revision4-*.png`, generated from synthetic examples only.

## Failures and corrections

The first new test failed against the old newline-choice editor as expected. Independent review found two defects: evidence/bonus used UTC dates after the clock change, and adding a third UGC answer produced an unhandled application branch. Both were reproduced with failing tests, fixed and rerun successfully. The example-trial helper now uses the same derived dates as normal setup.

Some initial local tool invocations were malformed, and an edit preparation used the wrong function boundary. They failed before changing files; corrected calls completed. A first responsive screenshot accidentally captured a collapsed question editor; the runner now ensures it is expanded before checking/capturing. No source or production data was affected.

## Limits and next review

Independent static/core review supplements browser evidence gathered by the main agent. Both flow skills and TypeUI were used: the flow contracts preserve recipient/business context and recovery; TypeUI fundamentals informed segmented controls, labelled groups, compact spacing and focus. The MCP returned setup guidance, not a remotely generated design. Existing system font/green/neutral design was retained; user-requested density overrides generic larger spacing. No native haptics.

Full keyboard-only/screen-reader traversal, physical phones, actual file decoding/playback, full revised trial logging → evidence → brand onboarding browser rerun, durable storage/draft recovery, database tenant policies, real OAuth/WhatsApp and launch readiness remain unverified. A Next.js production build is not rerun or claimed here because no production app/dependency was changed.

Next review: same person's trial dashboard → qualifying evidence → management verification → brand onboarding → active-creator dashboard. Existing active-dashboard drafts are preserved. The exact trial duration needs a user decision before the automatic end date becomes production policy. Production UI and deployment still require explicit approval.

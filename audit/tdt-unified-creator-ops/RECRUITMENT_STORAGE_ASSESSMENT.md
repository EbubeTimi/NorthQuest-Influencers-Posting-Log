# Recruitment media — read-only assessment, 28 August 2026

User asks whether introduction videos can be kept temporarily in their Google Drive because the team expects to review each once. No storage provider, retention duration, production data change or deletion is approved by this question. Prototype uploads remain open-tab File/object URLs, shown with the applicant's introduction video; reset/refresh loses them.

## Existing repository evidence (not live configuration)

- `smithstem/app/apply/page.js` and `app/apply/[slug]/page.js` already upload to `applicant-videos`; the generic form uses an `unassigned/timestamp-filename` path before saving the application. This is legacy code, not the new approved flow.
- `smithstem/app/admin/page.js` creates a 120-second signed URL and provides View uploaded video. It is not proof the current production bucket/policies are correctly configured.
- `smithstem/supabase/migrations/20260817132524_recruitment_funnel.sql` defines a private, 100 MiB video bucket. Its anonymous/authenticated insert policy checks bucket identity only. That does not provide the desired agency/application-scoped upload authorization.
- `20260817204900_tdt_unified_recruitment_funnel.sql` expands storage reads to any admin. That tracked definition must be reconciled with intended agency isolation before reuse.
- `smithstem/supabase/functions/apply-sync/index.ts` downloads the stored video, builds a whole multipart body for a Drive upload, and appends a Sheet row. This is a legacy copy/sync path, not a tested resumable upload workflow. Do not invoke it during this prototype task: it can mutate external Sheets.
- The prototype/spec's 1 GB maximum conflicts with the tracked 100 MiB bucket. Choose an actual supported limit and enforce it consistently before production integration; do not silently advertise 1 GB.

No current Google Drive/Supabase MCP capability was callable in this turn. No bucket, live policy, Drive folder, credential, upload, Sheet, deletion or quota was changed or verified. This is a scoped code inspection, not a complete security audit of the legacy functions.

## Feasible choices — decision pending

Private Supabase Storage is the proposed default because it fits the application's identity/access model and existing upload/playback hooks. Google Drive is a viable alternative if the user prefers their Drive, but requires a real authenticated upload service, private folder/file access, stable application-to-file references and authorized playback. A shared public folder link is not that integration. Existing Drive quota, account ownership and operating cost are unverified.

Both need resumable uploads for mobile interruption, server-side authorization, size/type checks and content validation/scanning, per-application object keys, retry/idempotency and orphan recovery, short-lived playback authorization, and tested cross-agency denial. Do not load an entire large video into a request body as the new upload strategy.

Intro-video deletion must follow a recorded completed review and an agreed retention/recovery policy, not the first playback event (which may be interrupted). Keep who reviewed it, when, the decision and later media-deletion metadata. Trial qualification and bonus screenshots have different evidence requirements; this temporary-introduction suggestion does not authorize deleting them. History stays. No retention duration is invented here.

## Required before implementation

1. Confirm provider, approved upload limit and retention/recovery rules.
2. Verify the actual project/account and policies through authorized read access; define narrowly scoped writes separately.
3. Build in an isolated test environment after production-implementation authorization, not against source Forms/Sheets.
4. Test upload → interrupted upload/resume → applicant attachment → authorized manager playback → wrong-user/agency denial → approved cleanup with preserved audit metadata. Test failure/orphan handling and restore where promised.

## Official reference material checked

- [Google Drive uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads): resumable uploads support interrupted/larger transfers.
- [Google Drive sharing](https://developers.google.com/workspace/drive/api/guides/manage-sharing): access must be controlled through permissions.
- [Supabase bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals): private buckets enforce access policies and support signed playback URLs.
- [Supabase resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads): designed for large files and unreliable networks.
- [Supabase downloads](https://supabase.com/docs/guides/storage/serving/downloads): signed URL expiry must be considered separately from session revocation.

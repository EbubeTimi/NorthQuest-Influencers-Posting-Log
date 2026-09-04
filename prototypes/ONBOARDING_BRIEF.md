# Brand onboarding — prototype brief

Approval: Behavior accepted by Smith on 4 September 2026; final TypeUI/visual refinement remains deferred and production implementation is still separately gated.

Goal: A management-approved trial creator completes one brand onboarding and reaches an active dashboard only after management confirms the submitted setup.
Human and feel: Creator and agency manager on phones; calm, private, short steps with one clear action.
Entry and exit: Approved dashboard action → creator setup → awaiting management → manager check/correction or completion → active membership/dashboard.
System: Reuse the approved green/neutral system, compact fields, 48px primary actions, plain dates and minimal explanatory copy.
Signature: The same person, verified trial and assigned brand remain visible throughout; no second trial or public business choice.
Feedback: Automatic local draft, durable-submit mock, preserved retry, explicit private-data labels and append-only History.
Rejecting: Password collection inside Smithstem, instant self-activation, upload-only contract acceptance, editable legal terms, cross-business access or claimed real persistence.
Variants: Missing profile, invalid bank/account, unread contract, failed generation/save, section-specific correction, cancellation, wrong identity/business, paused operational access with read-only records, and phone keyboard.

## State and transition map

| State | Actor action | Guard | Result / recovery |
| --- | --- | --- | --- |
| Ready | Begin | Verified trial decision; assigned enabled brand; matching Google identity | Open the same onboarding case exactly once; concise left-aligned entry says “Your onboarding is ready” and reminds the creator to use the same Google account |
| Your details | Confirm name, WhatsApp and address | Required, server-normalized; applicant values prefilled without silently overwriting history | Save draft; invalid field focuses in place |
| Creator profiles | Add TikTok and Instagram username plus public profile link | Required username/link pairs; examples are placeholders; never accept a password in the onboarding application | Save draft; invalid pair focuses in place |
| Payment details | Type or search bank/financial institution, enter ten-digit account number and account name | Private field handling; exact ten-digit prototype validation; production account verification remains separate | Save encrypted/private record only after confirmation |
| Contract | Read the fixed version in-app, complete marked name/address/date fields, acknowledge and draw a signature | Approved immutable contract version/party present; required fields and signature present; legal terms cannot be edited | Show the signature on the exact agreement preview; generate the complete signed PDF server-side and store its immutable hash/version; failure preserves draft |
| Review | Read every entered field, including the complete account number, and open the signed-agreement preview | No folded summaries; creator sees only their own record; signature present | Submit once; management review is the only next step |
| Awaiting management | Wait | Creator tasks durably complete | Show only “Submitted”, review status and dashboard-button expectation; no success tick; correction reopens only the exact named fields |
| Management review | Confirm identity, profiles, payment details and complete contract | Authorized agency operator; use Select all for the common four-check approval path or change any check individually | Complete once, or select exact fields and request correction with a specific reason |
| Contract templates (management) | Select brand, create a new draft from the current version, edit and preview | Contract-editor permission; never edit a published/signed version | Save a versioned draft with change note |
| Contract approval (management) | Approve and publish a reviewed draft | Designated owner/legal approver; complete preview/hash/effective date | Make it the brand's future-onboarding version; existing signatures stay bound to their original version |
| Completed | Open dashboard | One idempotent active brand membership exists | Same login enters assigned dashboard; History retained |
| Cancelled/paused | View plain status or read-only financial/history records | Authorized reason and actor recorded | Operational writes disabled; existing person/trial/evidence, payment statements, video history and bonus history retained |

## Data and security boundaries

- Never collect or export Gmail, Instagram or TikTok passwords.
- Automatic draft recovery is required. The prototype uses local browser storage only to demonstrate reload/back recovery with mock data; production drafts must be authenticated, encrypted server-side and tenant-isolated, and must not put bank or credential data in browser local storage.
- Public usernames and profile links are creator-provided references, not account credentials. Business-owned account access is delegated using the platform's role/permission controls, or an approved credential-vault handover if a platform cannot delegate; Smithstem never stores the secret.
- NorthQuest, CashDrive and Aura keep separate platform administration boundaries. Management controls recovery and MFA; creators receive removable least-privilege roles only for their assigned brand. Smithstem records account ID, assigned role, invitation/removal status and audit events, not platform passwords.
- Bank details are private and excluded from ordinary audit before/after payloads.
- Store the complete approved contract version, completed fields, consent evidence, generated signed PDF, file hash, signing time and audit event; a detached signature image alone is insufficient.
- Contract templates are brand-specific and versioned. Management edits a draft, a designated owner/legal approver publishes it, and previously published or signed versions are never overwritten. Material changes require a new version and, when applicable, an explicit amendment/re-signing flow.
- Management explicitly selects every field needing correction and writes the reason. The creator sees and edits only those fields; a signature correction reopens the agreement and drawing box together. Accepted fields remain locked and the original submission remains immutable.
- A creator can read/update only their own incomplete onboarding case. Management sees only cases within the authorized agency/brand engagement.
- Submission, correction, decision and membership creation use idempotency keys and append-only audit events.
- Prototype files remain in memory and are labelled as simulations. Production storage/upload/scan/retention remains a separate implementation gate.

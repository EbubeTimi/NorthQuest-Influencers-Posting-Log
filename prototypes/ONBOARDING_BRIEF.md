# Brand onboarding — prototype brief

Goal: A management-approved trial creator completes one brand onboarding and reaches an active dashboard only after management confirms the submitted setup.
Human and feel: Creator and agency manager on phones; calm, private, short steps with one clear action.
Entry and exit: Approved dashboard action → creator setup → awaiting management → manager check/correction or completion → active membership/dashboard.
System: Reuse the approved green/neutral system, compact fields, 48px primary actions, plain dates and minimal explanatory copy.
Signature: The same person, verified trial and assigned brand remain visible throughout; no second trial or public business choice.
Feedback: Automatic local draft, durable-submit mock, preserved retry, explicit private-data labels and append-only History.
Rejecting: Any password collection, instant self-activation, signature-image-only contract, editable legal text, cross-business access or claimed real persistence.
Variants: Missing profile, invalid bank/account, unread contract, failed upload/save, correction, cancellation, wrong identity/business, paused access and phone keyboard.

## State and transition map

| State | Actor action | Guard | Result / recovery |
| --- | --- | --- | --- |
| Ready | Start onboarding | Verified trial decision; assigned enabled brand; matching Google identity | Open the same onboarding case exactly once |
| Your details | Confirm name, WhatsApp and address | Required, server-normalized; applicant values prefilled without silently overwriting history | Save draft; invalid field focuses in place |
| Creator profiles | Add public TikTok and/or Instagram profile | At least one valid public profile URL; no usernames/passwords for account access | Save draft; unavailable platform remains blank |
| Payment details | Add bank, account number and account name | Private field handling; exact validation remains Nigeria/payment-provider dependent | Save encrypted/private record only after confirmation |
| Contract | Read the fixed version, accept and submit a complete signed PDF | Contract version/party present; PDF type/size; acknowledgement; no mutable master | Immutable contract asset + consent snapshot; failure preserves file/draft |
| Awaiting management | Wait | Creator tasks durably complete | No active membership yet; correction reopens only named fields |
| Management review | Confirm identity, profiles, payment details and complete contract | Authorized agency operator; explicit checked items | Complete once, or request correction with reason |
| Completed | Open dashboard | One idempotent active brand membership exists | Same login enters assigned dashboard; History retained |
| Cancelled/paused | View plain status | Authorized reason and actor recorded | No membership creation; existing person/trial/evidence retained |

## Data and security boundaries

- Never collect or export Gmail, Instagram or TikTok passwords.
- Public profile links are creator-provided references, not account credentials.
- Bank details are private and excluded from ordinary audit before/after payloads.
- Store the complete contract version and signed PDF; a drawn signature image alone is insufficient.
- A creator can read/update only their own incomplete onboarding case. Management sees only cases within the authorized agency/brand engagement.
- Submission, correction, decision and membership creation use idempotency keys and append-only audit events.
- Prototype files remain in memory and are labelled as simulations. Production storage/upload/scan/retention remains a separate implementation gate.

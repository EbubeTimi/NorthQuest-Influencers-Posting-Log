# Contract management prototype brief

Status: revision 2 for user review. Prototype only.

## Compact design brief

Goal: Smith replaces one business contract and, when needed, asks existing creators to sign again.
Human and feel: busy mobile manager; quiet, direct and space-efficient.
Entry and exit: Management Business Contracts -> business -> contract action -> return to the business.
System: phone-first, restrained typography, line-separated records, very few containers.
Signature: one clear Manage action at the right of every business.
Feedback: immediate inline status, short page transition, no routine haptics.
Rejecting: oversized cards and repeated labels; hidden actions and approval theatre.
Variants: Aura may have no contract; unauthorized staff see a restricted state.

## Source truth

- `NQ UGC AGREEMENT.docx` is the inspected NorthQuest source.
- `Cashdrive Creator Contract.docx` is the inspected CashDrive source.
- No correct distinct Aura agreement has been supplied. Aura therefore shows “No contract added” and can accept the correct upload later.
- Contract wording is prepared in Microsoft Word and uploaded as a complete DOCX or PDF. There is no in-app clause editor.
- This prototype does not rewrite, approve, upload or publish legal language.

## Current authority decision

- Smith is presently the sole contract authority.
- After Smith reviews the uploaded file and chooses “Make live,” it becomes the contract for new onboarding immediately. There is no second approver, publisher queue or waiting state in the current interface.
- The permission model remains role-based so a separate authorized person can be added later without redesigning storage or audit rules.

## Flow and transitions

| From | Trigger | To | Result |
| --- | --- | --- | --- |
| Businesses | Manage | Current contract | Shows current file and signed count, or Aura’s empty state |
| Current contract | Replace/Upload | Upload | Accepts one complete DOCX or PDF locally in the prototype |
| Upload | Review contract | Review | Shows the selected file and consequence |
| Review | Make live | Updated | New onboarding uses the new contract; existing signatures remain bound to their originals |
| Updated | Choose who needs to sign again | Re-signing | Smith selects all or individual creators |
| Re-signing | Send request | Request sent | Selected creators get a dashboard prompt |
| Current contract | View history | Private history | Shows a quiet audit record, not a public archive/version browser |
| Upload | Network failure | Upload failed | Keeps the selected file and offers retry or cancel |
| Any management entry | Wrong role | Restricted | No contract data or action is exposed |

## Storage and legal integrity

- Contract metadata, current pointer and audit events: Supabase/PostgreSQL.
- Uploaded sources and immutable signed PDFs: private object storage.
- Optional managed Google Drive copies are outputs, not the source of truth.
- Replacing the current contract removes the old one from the normal interface but does not delete signed legal evidence. Previous sources and signed PDFs remain privately retained for authorized history and disputes.
- Every creator signature remains bound to the exact contract bytes/hash they accepted.
- No passwords or raw secrets enter contracts, database tables, Drive, Sheets, logs or audit events.

## Prototype boundary

All upload, publish, notification and storage behavior is deterministic and local. No external write occurs. Production UI and deployment remain blocked until explicit approval.

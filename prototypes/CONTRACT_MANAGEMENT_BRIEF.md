# Contract management prototype brief

Status: revision 1 for user review. Prototype only.

## Goal

Authorized GrowthCooks management can maintain a separate agreement for NorthQuest, CashDrive and Aura without altering anything a creator already signed.

## Source truth

- `NQ UGC AGREEMENT.docx` is the current NorthQuest source inspected for this prototype.
- `Cashdrive Creator Contract.docx` is the current CashDrive source inspected for this prototype.
- `UGC Agreement (2).docx` and `UGC Agreement (3).docx` both contain NorthQuest terms and are not valid Aura sources.
- Aura therefore remains blocked as “Source needed” until the correct agreement is identified.
- The prototype summarizes sections. It does not rewrite, approve, or publish legal language.

## Flow

Business agreements -> one business -> immutable history -> create draft -> edit segmented sections -> phone/PDF preview -> submit for approval -> authorized approval -> publish -> amendment or targeted re-signing.

## Contract rules

- Editors may create and update drafts.
- Only an authorized publisher may publish. The named publisher remains a product decision, so the prototype uses the role label rather than inventing a person.
- Published versions are frozen. Signed copies are never overwritten.
- Every draft starts from an identified source or a published version.
- Every publish records actor, time, source, summary of changes and version.
- A material change creates a new version and may require selected creators to sign again.
- The creator signs the exact published version shown on their phone. The final PDF contains the complete agreement, completed fields, signature, signing timestamp, version ID and tamper-evident hash.

## File and database destination

- Contract metadata, versions, states and audit history: Supabase/PostgreSQL.
- Draft/source and immutable signed PDFs: private object storage.
- Optional Google Drive copy: managed output only, never the sole record.
- No passwords or raw secrets in contracts, database tables, Drive, Sheets, logs or audit entries.

## Required states

- Agreement list
- NorthQuest version history
- CashDrive version history
- Aura source missing
- Editable draft
- Exact preview
- Awaiting approval
- Publisher review
- Published
- Amendment and re-signing selection
- Save failure with retained draft
- Permission denied for non-publisher publish attempt

## Exits and recovery

- Back always returns to the previous meaningful state.
- Draft edits autosave in the prototype tab only; production uses authenticated server drafts.
- Failure keeps all edits and provides retry.
- Duplicate publish attempts return the existing version rather than creating another.
- Cancelling an amendment does not affect the published version or signed copies.

## Visual system

Use the shared TypeUI fundamentals: phone-first, compact hierarchy, limited borders, 44px minimum controls, clear focus, no color-only meaning, no excessive cards, and a desktop review panel beside the phone preview. Final visual polish remains a later explicit pass.

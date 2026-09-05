# Unified management dashboard prototype brief

Status: revision 2 for user review. Prototype only.

## Compact design brief

Goal: Smith or an authorized GrowthCooks operator sees what needs attention, opens the correct business/person, completes a review, and returns to one management home.
Human and feel: PC-first management operators; dense, clear and calm under a large creator count, with full phone reflow for urgent work away from a laptop.
Entry and exit: management home -> work/business/creator -> exact task -> result -> meaningful prior page.
System: persistent desktop sidebar, wide two-column work/review surfaces, shared TypeUI tokens, line-separated records, few borders and 44px touch-safe controls.
Signature: one “Needs attention” queue connects every operational flow without copying records between sections.
Feedback: 150ms page transition, focus moves to the heading, polite status announcements; native haptics remain unverified.
Rejecting: a wall of decorative cards; hiding business scope or high-impact access actions.
Variants: desktop is the primary management workspace; phone collapses to one column and bottom navigation. Agency staff see assigned work; Smith alone sees whole-person suspension and contract authority.

## Connected flow

```text
Management home
  -> Needs attention
     -> trial evidence review
     -> onboarding review/correction
     -> bonus review
     -> payment preparation
  -> Businesses
     -> NorthQuest / CashDrive / Aura
     -> scoped creator directory and records
  -> Creator record
     -> videos, view reports, bonuses, payments
     -> one-business pause or whole-person suspension
     -> append-only history
```

## State map

| From | Trigger | Guard | To | Result/recovery |
| --- | --- | --- | --- | --- |
| Home | Open work count | authorized operator | Work queue | Business-scoped pending items |
| Work queue | Open trial evidence | assigned business | Evidence review | Approve onboarding or keep in trial |
| Work queue | Open onboarding | assigned business | Onboarding review | Complete or request exact corrections |
| Work queue | Open bonus | assigned business | Bonus review | Approve/reject; approved value feeds payment ledger |
| Home/business | Open creator | readable membership | Creator record | One joined record with operational and financial links |
| Creator record | Manage access | manager | Access | Pause one membership; higher authority required for whole person |
| Any load | unavailable | retained context | Error | Retry or return |
| Any read | wrong role/business | authorization denied | Restricted | No counts, names or records exposed |

## Data and permission contract

- The dashboard is a projection over existing application, trial, onboarding, membership, video, view, bonus, payment and audit records; it does not duplicate them into a separate management database.
- Every count, queue item and creator record is agency/business scoped server-side. Search and filtering do not reveal inaccessible records.
- Trial evidence approval creates one onboarding case. Onboarding completion creates one active membership. Bonus approval creates one payment-ledger item. Each operation is idempotent and audited.
- Pausing one business membership does not erase creator history or affect another business. Whole-person suspension is a separate Smith-only action.
- Full bank numbers and private evidence appear only in the exact authorized review. Lists, notifications and audit payloads remain masked.
- Prototype buttons are local simulations. No approval, payment, message, export, access change, upload or database write occurs.

## Next proof after approval

Production work still requires the target schema/RLS, private uploads, signed-PDF generation, notifications, payment ledger, audit events, per-business Apify configuration and end-to-end staging proof.

# Affected flow map

## F01/F02 — Receive an invitation and sign in

- Management sends a business-specific, expiring invitation to the creator's personal Gmail address.
- The creator opens the link and continues with Google. The verified Google email must match the invitation.
- Claiming a later invitation adds another business membership to the same person/login.
- Failure states: expired, already used, wrong email, deactivated invite, offline, and retry.

## F03/F04 — Choose and switch assigned work

- A creator with one enabled membership goes directly to that dashboard.
- A creator with several enabled memberships chooses after sign-in and can switch later.
- The chooser shows assigned memberships only; it never lists unrelated businesses.
- Server authorization validates the selected membership on every scoped request.

## F05 — Learn the dashboard

- A short, optional first-use walkthrough points to today's date, the video form, and the views reminder.
- Creator-facing copy uses plain dates and tasks. It does not explain internal concepts such as shared cycles, tenant isolation, or creator operations.
- The creator may skip and reopen help later.

## F06/F07 — Log videos, use the noon grace, and clear views

- The dashboard emphasizes today's date and one stacked phone-friendly video form.
- Aura follows Monday–Sunday; other business date blocks come from their configured rules.
- New creators enter the current business period immediately and owe only videos logged after joining.
- Yesterday's missed video remains available until 12:00 PM the next day.
- At midnight after a period ends, required view entry blocks the next normal video submission until all due video/platform views are saved.
- Period-specific report keys prevent an older report from satisfying a later check.
- Validation, offline retry, duplicate submission, and wrong-business denial preserve data and focus recovery.

## F08/F09 — Review a 10,000-view video and unlock onboarding

- One video at 10,000 self-reported views creates one management notification and review item.
- The creator sees “Under review” and remains a trial creator.
- Management sees the creator photo, business, join date, video links, self-reported value, and audit context; management checks the actual platform.
- Management approval unlocks onboarding. Keeping the creator in trial does not erase the report.
- Different videos are never summed. Retries never duplicate the notification or decision.

## F10 — Deactivate access

- Management may deactivate one business membership without deleting the person, other memberships, or history.
- A whole-person suspension is a separate, higher-impact action.
- Joined, deactivated, reactivated dates, reason, and acting manager are audited.

## F11 — Applications

- Applicants submit one TDT-wide application, separate from any business membership.
- Initial fields from the supplied form: personal email, full name, phone, suitable smartphone, basic editing ability, 30-second introduction video, and city.
- Management reviews structured records in an Applications area rather than relying on Google Forms summary charts.

## F12/F13 — CashDrive inventory and enquiries

- Inventory is a separate CashDrive administration area for vehicle identity, availability, price, media, publication, and change history.
- Creators submit enquiries using referrer, buyer name/contact, requested vehicle, inquiry date, source, budget, urgency, lead status, and notes.
- CashDrive management filters and updates structured enquiry records; every record remains CashDrive-scoped.

## F14 — Existing creator opening position

- Management imports one admin-entered opening August video count per creator/business.
- This number is a starting total only. Historical video links remain in Google Sheets.
- Imports are validated, attributable, idempotent, and corrected through audit history rather than deletion.

## F15/F16 — Sheets and Apify automation

- Accepted self-reported views collate to each business's designated Sheet/Drive location.
- Across every business, Apify runs three cumulative windows: 1–14, 1–21, and 1–month-end.
- Jobs use configuration, idempotency, leases, bounded retries, reconciliation, cost guards, and one-business failure isolation.

## Regression impact map

Retest Google sign-in and callback, invitation redemption, existing email-code users/migration, chooser, switcher, creator and trial dashboards, Aura Monday–Sunday boundaries, NorthQuest/CashDrive calendar blocks, join dates, noon grace, midnight gate, period-specific reports, management review/approval, onboarding, deactivation, applicants, private uploads, CashDrive enquiry/inventory, RLS helpers and policies, Sheets, Apify schedules, notifications, payments/bonuses, offline/retry, phone keyboard behavior, and 1,000+ creator administration.

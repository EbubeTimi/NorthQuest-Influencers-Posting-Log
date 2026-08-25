# TDT creator prototype brief — revision 3

Portable writing fallback: `humanizing-writing` is unavailable, so creator copy uses short, direct language.

## Compact design brief

Goal: Use a personal Google login, open only assigned work, log today's video, enter required views, and continue after management approval.
Human and feel: A creator using one hand on a phone should understand the next task without learning internal operations language.
Entry and exit: Business invitation or sign-in → assigned workspace → dashboard → views → management review → onboarding.
System: Standalone read-only prototype; phone-first one-column layout; system sans type; restrained TDT green; 48px controls.
Signature: A locked Today/conditional Yesterday control and a mandatory spotlight walkthrough replace technical cycle explanations.
Feedback: Immediate inline status, short opacity transitions, focus recovery, and no browser vibration claim.
Rejecting: Desktop columns squeezed onto phones, ornamental metric cards, technical terminology, and long explanatory paragraphs.
Variants: Invite/new login, one/multiple memberships, Aura weekday rule, calendar-date businesses, trial/review/approved/deactivated, phone/tablet/desktop.

## State and transition map

| From | Trigger | Guard/input | To | Feedback/recovery |
| --- | --- | --- | --- | --- |
| Invitation | Continue with Google | Verified email matches unused invite | Walkthrough/dashboard | Wrong email or expired invite explains recovery |
| Sign-in | Continue with Google | Verified personal account | Assigned chooser or dashboard | Retry/sign out |
| Chooser | Select | Enabled assigned membership only | Dashboard | Disabled membership is not selectable |
| First dashboard | Continue | First visit | Three-step spotlight walkthrough over the dashboard | Cannot skip; may reopen Help |
| Dashboard | Submit video | Today or eligible Yesterday; at least one valid link | Confirmed logged record | Show saving state; success only after mock backend confirmation |
| Dashboard | Period closes | Required views missing | Views page | Clear one task and due dates |
| Views | Save | Every required platform has a non-negative count | Dashboard or review pending | Focus first invalid input; retry preserves entries |
| Views | One video is at least 10,000 | Trial | Review pending | Notify management once; do not unlock |
| Management review | Approve | Manager verified real platform result | Onboarding ready | Keep in trial remains available and audited |
| Any creator page | Switch | Another enabled membership | Other dashboard | Mobile sheet; focus returns on close |
| Management action | Deactivate membership | Reason confirmed | Inactive page | Other memberships still work |

## Prototype-only boundary

- Google login, invitation claim, drafts, database authorization, notifications, management identity, uploads, Sheets, Apify, and audit persistence are simulated.
- The persistence confirmation is also simulated and is labelled as prototype confirmation; it specifies the production requirement but does not claim a real database write.
- The visible creator product contains no developer language. Review controls remain outside the proposed phone UI.
- TDT Applications and the full CashDrive admin dashboard need their own focused prototype after the creator flow is accepted.

# Unified creator-operations prototype brief

Portable writing fallback: `humanizing-writing` is unavailable, so copy is direct, concrete, and audience-appropriate.

## Compact design brief

Goal: Sign in once, choose a business, work through a trial week, clear the gate, and understand automatic onboarding.
Human and feel: A non-technical creator should feel oriented, protected, and never trapped.
Entry and exit: Email-code sign-in → business chooser/dashboard → switcher, sign out, or onboarding.
System: Standalone read-only web prototype using Smithstem’s Naira Green, gold, quiet depth, and compact mobile-first density.
Signature: A shared seven-day cycle rail shows exactly when logging is open, gated, or cleared.
Feedback: 180–240ms state transitions; meaningful success/warning intent annotations; no browser vibration claim.
Rejecting: Generic metric-card grids and urgency language that pressures creators.
Variants: Trial/active/deactivated roles; one/multiple businesses; phone/tablet/desktop; reduced motion.

## State and transition map

| From | Trigger | Guard/input | To | Container | Feedback | Recovery/exit |
| --- | --- | --- | --- | --- | --- | --- |
| Sign-in | Continue | Valid email | Code sent | Page | Inline progress, focus code | Change email |
| Code sent | Verify | 8 digits | Business chooser | Page | Success announcement | Expired/error → retry |
| Business chooser | Choose | Enabled membership | Trial dashboard | Page | Selection intent | Sign out |
| Dashboard | Log video | Gate open + URL | Logged success | Inline form | Success intent | Validation/retry/cancel |
| Dashboard | Cycle closes | Reports missing | Weekly gate | Page region | Warning intent, live announcement | Complete all due reports |
| Weekly gate | Save all | Positive values | Logging reopened | Inline → dashboard | Success intent | Offline/error preserves draft |
| Weekly gate | One video reaches 10,000 | Trial + not previously qualified | Onboarding unlocked | Banner + dashboard state | Success intent | Open onboarding later |
| Any business | Open switcher | Another enabled membership | Business chooser/switch | Popover desktop, sheet note mobile | Selection intent | Escape restores focus |
| Trial dashboard | Management deactivates | Membership target | Deactivated | Full-page access state | Warning intent | Switch business/sign out |
| Deactivated | Switch business | Other enabled membership | Other dashboard | Page | Selection intent | Sign out |
| Loading | Timeout/unavailable | — | Error/offline | Inline/page | Polite live announcement | Retry/cancel |
| Any transient state | Background/resume | Local mock state | Same state | No new container | No haptic | Continue |

## N/A states

- Payment, file upload, camera/microphone permission, destructive deletion, and native haptics are outside this prototype.
- Backend authorization, RLS, email delivery, management notification, Sheets, Apify, and persistence are mocked and explicitly unverified.

# Intake-only self-PIN flow

Goal: after successfully finishing intake, a new creator creates a private six-digit PIN and enters the existing creator login without being asked to sign the renewed existing-roster contract.

Human and feel: a new creator finishing a long onboarding process; the ending should feel short, secure, and conclusive.

Entry and exit: begins at confirmed intake completion and exits to the existing Creator Posting Tracker login, then the creator workspace.

System: responsive web flow using the established Growthcooks cream, black, lime, orange, and green language.

Signature: intake completion hands directly into a three-step account-access finish: create PIN, save PIN, sign in.

Feedback: immediate validation, a brief saving state, one success confirmation, no decorative delay or browser haptics.

Rejecting: admin-generated PINs for new intake creators; forcing the renewed-contract gate after intake already captured a contract.

Variants: existing creators do not see this flow and continue receiving PINs from the administrator.

| From | Trigger | Guard | To | Feedback | Recovery |
| --- | --- | --- | --- | --- | --- |
| Intake complete | Create my PIN | Intake saved successfully | Create PIN | Progress advances | Back to completion receipt |
| Create PIN | Save | Six digits, confirmation matches, saved privately acknowledged | Saving | Button state and live text | Inline validation, retry |
| Saving | Mock success | Account access record created | PIN saved | Success confirmation | Retry in production on failure |
| PIN saved | Continue | PIN available once | Creator login | PIN can be copied | Remain on receipt |
| Creator login | Sign in | Correct PIN | Workspace | Normal login feedback | Existing forgotten-PIN path |
| Workspace | Enter | Intake contract already completed | Account profile or posting flow | No renewed-contract prompt | Sign out |

Prototype boundary: all persistence, PIN hashing, copying, login, and network delays are local simulations. The preview does not change production data.

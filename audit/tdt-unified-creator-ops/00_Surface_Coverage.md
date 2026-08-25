# Surface coverage

Each surface has one primary actor-goal owner. “Current” means present in the repository; “prototype” means represented in the local approval model; “planned” means production work remains blocked by approval.

| Surface | Primary flow | Current | Prototype | Classification |
| --- | --- | ---: | ---: | --- |
| `/` email-code sign-in | F01 sign in | Yes | Yes | Extend |
| `/verify` | F01 sign in | Yes | Simulated state | Preserve |
| post-sign-in business chooser | F02 choose business | No | Yes | New |
| header business switcher | F03 switch business | Yes | Yes | Extend |
| `/trial/[slug]` | F04 enter trial | Yes | Entry assumed | Extend |
| creator trial dashboard | F05 operate limited trial account | Partial | Yes | Extend |
| creator video log | F06 log video | Yes | Yes | Extend |
| weekly view gate | F07 complete shared-cycle reporting | Conflicting | Yes | Replace rule |
| automatic 10,000-view transition | F08 unlock onboarding | No | Yes | New transition |
| `/onboarding` | F09 complete onboarding | Yes, manual-unlock dependency | Exit shown | Extend |
| creator deactivation | F10 restrict one membership | Active creators only | Yes | Extend |
| existing-creator migration | F11 import opening position | Partial | Not UI-prototyped | Extend data/admin flow |
| weekly Google Sheets collation | F12 collate reports | Partial/conflicting schedule | Annotation only | Repair automation |
| Apify cumulative analytics | F13 verify analytics | Monthly-only conflict | Annotation only | Replace automation |
| CashDrive inventory | F14 manage inventory | No | Out of prototype scope | New |
| CashDrive enquiry submission | F15 submit/manage enquiry | No | Out of prototype scope | New |
| admin applicant management | Existing recruitment flow | Yes | No | Preserve |
| root legacy Apps Script tracker | Historical tracker | Yes | No | Isolate/retire deliberately |

## Route-by-role summary

| Role | Public | Authenticated creator | Management |
| --- | --- | --- | --- |
| Applicant | `/apply`, legacy intake | — | applicants tab |
| Trial creator | sign-in, `/trial/[slug]` | chooser, trial dashboard, gate, onboarding-unlocked | trial roster, deactivate, notification |
| Active creator | sign-in | chooser, dashboard, log, gate, payments, switch | roster and payment operations |
| CashDrive customer/lead | planned enquiry entry | planned tracking if required | planned enquiry + inventory workspace |
| Automation | — | — | weekly Sheets and staged Apify jobs |

## Prototype boundary

The standalone prototype owns only F01, F02, F03, F05, F06, F07, F08, and F10. It performs no authentication, database writes, notifications, Sheets writes, Apify runs, deployment, or production navigation.

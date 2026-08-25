# Surface coverage

“Current” means present in the repository. “Prototype” means represented in the read-only approval model. Production implementation remains blocked.

| Surface | Primary flow | Current | Revised prototype | Classification |
| --- | --- | ---: | ---: | --- |
| business invitation | F01 accept invitation | Partial legacy invite | Yes | Replace/harden |
| personal Google sign-in | F02 sign in | No; email code exists | Yes | New auth direction |
| assigned-business chooser | F03 choose | No | Yes | New |
| business switcher | F04 switch | Yes | Yes | Simplify |
| first-use walkthrough | F05 learn | No | Yes | New |
| phone-first video form | F06 log | Yes | Yes | Repair layout/copy |
| yesterday-until-noon grace | F06 backdate | No | Yes | New |
| reporting gate | F07 enter views | Conflicting | Yes | Replace rule |
| 10,000 review pending | F08 notify manager | Partial/5,000 conflict | Yes | Replace rule |
| management verification | F09 approve onboarding | Older mixed lifecycle | Yes | Rebuild/audit |
| onboarding | F09 continue | Yes | Exit shown | Extend |
| membership deactivation | F10 restrict | Partial | Yes | Extend |
| TDT Applications | F11 review applicants | Partial | Requirements only | Separate admin prototype needed |
| CashDrive Inventory | F12 manage vehicles | No | Requirements only | New |
| CashDrive Enquiries | F13 manage leads | No | Requirements only | New |
| opening August count | F14 import starting total | No | Not UI-prototyped | New admin/data flow |
| Sheets collation | F15 export reports | Partial | Annotation only | Repair |
| Apify cumulative runs | F16 analytics | Monthly-only | Annotation only | Replace |

## Role summary

| Role | Sees |
| --- | --- |
| Applicant | TDT application and its status only |
| Trial creator | Assigned businesses, today's video task, required views, review status, help |
| Active creator | Assigned businesses and active creator work |
| Manager | Applications, businesses, creators, reviews, lifecycle dates/photos, audit |
| CashDrive manager | CashDrive creators, inventory, enquiries, analytics |
| Automation | Explicit per-business Sheet and Apify jobs only |

## Prototype boundary

The revised standalone prototype covers invitation, personal Google sign-in, assigned-business choice/switch, walkthrough, dashboard, date/grace/gate behavior, 10,000 review pending, management approval, onboarding ready, and deactivation. It performs no authentication, writes, notifications, uploads, scraping, deployment, or production navigation.

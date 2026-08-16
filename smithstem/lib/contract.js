// Daniel's countersignature is inlined rather than served from /public so the
// contract can never render with a missing signature, and so the whole app
// stays as plain text in git.
export const DANIEL_SIGNATURE_URL =
  "data:image/png;base64,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";

// The bonus figures in section 4.6 used to be typed in by hand, and went
// stale the day the tiers changed — a signed contract stating the wrong
// bonus structure for whoever read it that month. Built from whatever tiers
// are live for the business right now instead, so it can't happen again.
function performanceIncentiveLine(tiers) {
  if (!tiers?.length) return "Performance Incentive: as set out in the current bonus schedule, available on request.";
  const naira = (n) => "NGN " + Number(n).toLocaleString("en-NG");
  const views = (n) => (n >= 1000000 ? `${n / 1000000}M` : `${Math.round(n / 1000)}k`);
  const parts = [...tiers].sort((a, b) => a.min_views - b.min_views).map((t) => `${views(t.min_views)} views to ${naira(t.amount)}`);
  return `Performance Incentive: ${parts.join("; ")}.`;
}

// Only businesses listed here have real contract details behind them. A new
// business needs its own contracting party, terms and liability language
// decided deliberately — reusing another company's contract by default
// would be worse than showing nothing until the real one exists. Aura is
// not here yet for exactly that reason: no signed contract for it exists.
const BUSINESS_CONTRACTS = {
  northquest: {
    partyName: "Daniel Torkura",
    partyRole: "Head of Product at Northquest Finance",
    partyEmail: "torkuradaniel@gmail.com",
    partyAddress: "Carlton Gate Estate Ibadan, Oyo State",
    partyPhone: "09079135431",
    brandName: "Northquest Finance",
    signatureUrl: DANIEL_SIGNATURE_URL,
    termStart: "April 16, 2026",
    termEnd: "April 15, 2027",
    bonusModel: "performance",
  },
  // Real signed contract (Obiemeka Mmesoma Maryann, 6/8/2026) has no
  // views/likes-based bonus at all — Section 4.6 there explicitly rules it
  // out and replaces it with a discretionary, per-sale bonus Daniel confirms
  // in writing before it's owed. It also carries a non-compete clause
  // NorthQuest's contract doesn't have, since it's a car dealership.
  cashdrive: {
    partyName: "Daniel Torkura",
    partyRole: "Head of Product at Northquest Finance",
    partyEmail: "torkuradaniel@gmail.com",
    partyAddress: "Carlton Gate Estate Ibadan, Oyo State",
    partyPhone: "09079135431",
    brandName: "Cashdrive Cars",
    signatureUrl: DANIEL_SIGNATURE_URL,
    termStart: "July 15, 2026",
    termEnd: "July 14, 2027",
    bonusModel: "discretionary-sales",
    nonCompete: true,
  },
};

export function contractFor(businessSlug) {
  return BUSINESS_CONTRACTS[businessSlug] || null;
}

export function contractSections(creator, todayIsoDate, tiers, party = BUSINESS_CONTRACTS.northquest) {
  return [
    { heading: "UGC CONTENT CREATOR AGREEMENT", body: ["This Agreement is entered into as of the date signed below."] },
    { heading: "IMPORTANT LEGAL NOTICE", body: [`THIS IS A PERSONAL CONTRACT between ${party.partyName} and the Creator named below. ${party.partyName} is PERSONALLY and SOLELY LIABLE for all payments, obligations, and liabilities under this Agreement.`, `${party.brandName.toUpperCase()} IS NOT a party to this contract and has NO LIABILITY, NO OBLIGATIONS, and NO RESPONSIBILITIES whatsoever under this Agreement.`] },
    { heading: "1. PARTIES", body: [`Contracting Party: ${party.partyName}, ${party.partyRole}.`, `Email: ${party.partyEmail}`, `Address: ${party.partyAddress}`, `Phone: ${party.partyPhone}`, "AND", `Creator: ${creator.fullName || "____________________"}`, `Creator Email: ${creator.email || "____________________"}`, `Creator Phone: ${creator.phone || "____________________"}`] },
    { heading: "2. DEFINITIONS", body: ['"Content" means all User-Generated Content created by the Creator under this Agreement.', '"Platforms" means TikTok and Instagram, or any other platforms agreed in writing.', `"Brand" means ${party.brandName}. ${party.brandName} is NOT a party to this Agreement.`, '"Administrative Manager" means Smith Onyekwereh (smithonyekwereh1@gmail.com).', '"Monthly Quota" means two (2) pieces of Content per day, 14 per week, 60 in 30-day months, 62 in 31-day months.', '"Monthly Fee" means the base pay agreed for the individual Creator, paid per-piece, or any amount deemed fit by management.', '"Qualifying Content" means Content posted before 11:30 PM WAT, cross-posted to both platforms, logged on the day of posting, and passing quality review.', '"Community Manager" means Ella.'] },
    { heading: "3. SCOPE OF WORK", body: ["3.1 Two pieces of Content per day (second no later than 11:30 PM WAT), 14 per week, cross-posted to both TikTok AND Instagram. The same Content to BOTH platforms each day.", `Content Quality: authentic, aligned with ${party.brandName} brand values.`, "Brand Representation: accurate, no false or misleading claims.", "Content Logging: every piece must be logged on Smithstem the same day it is posted."] },
    { heading: "3.2 CONTENT OWNERSHIP AND IP", body: [`Content mentioning or promoting ${party.brandName} is owned by ${party.partyName}. Content unrelated to ${party.brandName} remains the Creator's sole property.`, "Year One (months 1-12): EXCLUSIVE ownership; removal only for harmful usage under Section 6.", "Year Two (months 13-24): non-exclusive; removal may be requested for competing brand partnerships or harmful usage.", `3.2.2 Social accounts created under this Agreement are owned and operated under ${party.partyName}'s direction for the Agreement duration and the two-year ownership period. Creator provides login credentials, does not change passwords without written approval, forwards platform communications, and cooperates with platform support.`] },
    ...(party.nonCompete ? [{ heading: "3.3 NON-COMPETE DURING AGREEMENT TERM", body: [`While this Agreement is in effect, the Creator shall not create or post Content that promotes any business competing with ${party.brandName}, or any other brand in a way that undermines the ${party.brandName} messaging the Creator is currently representing.`, "This restriction applies only for the duration of this Agreement and is treated as a material breach under Section 8B.1 if broken."] }] : []),
    { heading: "3A. QUALITY CONTROL", body: [`3A.1 Quality Control Officer: Lawrence Emmanuella Iniikio. QCO assessments are final and binding unless overridden by ${party.partyName} in writing.`, "3A.2 Second piece each day no later than 11:30 PM WAT.", "3A.3 Qualifying Content must meet ALL: posted on time; cross-posted to both platforms; passes review; accurately represents the brand; logged on the day posted.", `3A.4 Review within 24 hours. Rejected Content may be reposted at ${party.partyName}'s discretion.`] },
    { heading: "4. COMPENSATION", body: [
      "4.1 Monthly Fee paid per piece of Qualifying Content, subject to meeting the Monthly Quota.",
      "4.2 Payment requires 14 Qualifying pieces per week, cross-posted and logged, meeting quality standards, with no unexcused absences.",
      "4.3 Paid monthly, on or before the 10th of the following month.",
      "4.4 Shortfalls not excused under Section 8A are paid pro-rata at the per-piece rate.",
      "4.5 Payment by bank transfer to the Creator's designated account.",
      ...(party.bonusModel === "discretionary-sales"
        ? [
            `4.6 Sales Incentive: This Agreement does not include any performance bonus tied to views, likes, or other engagement metrics. Where a piece of Content directly results in a customer purchase from ${party.brandName}, ${party.partyName} may, at his sole discretion, pay the Creator a bonus in recognition of that sale. Whether a sale is attributable to the Creator, and the amount, is determined by ${party.partyName} case-by-case and confirmed to the Creator in writing before it is treated as owing. No such bonus is presumed without that confirmation.`,
            "4.7 Metric disputes resolved via platform native analytics, which are the final arbiter.",
          ]
        : [
            performanceIncentiveLine(tiers),
            `4.6a The Performance Incentive schedule set out above is not fixed for the life of this Agreement and may be revised by ${party.partyName} from time to time, in the same way it has been revised before. The schedule in force on the date a bonus threshold is reached shall be the one that applies to that bonus.`,
            "4.7 Metric disputes resolved via platform native analytics, which are the final arbiter.",
          ]),
      `4.8 ${party.partyName} is personally and solely liable for all payments.`,
    ] },
    { heading: "5. OWNERSHIP DURATION", body: [`5.1 Rights to use, reproduce, modify, adapt, distribute and transmit the Content for ${party.brandName} marketing.`, "5.2 Two years from creation of each piece. Year One exclusive; Year Two non-exclusive.", "5.3 On the two-year anniversary, rights terminate; continued use requires written consent.", "5.4 Content shall NOT be used in pornographic, political, defamatory or illegal material, or anything objectively harmful to the Creator's reputation.", "5.5 Creator is prohibited from deleting or deactivating Content or the associated accounts during the Agreement and the two-year ownership period, except with written consent, an approved takedown, or platform-initiated removal notified within 24 hours. Breach is material."] },
    { heading: "6. TAKEDOWN RIGHTS", body: ["6.1 Year Two: competing brand partnership. Both Years: harmful usage per Section 5.4.", `6.2 Written notice to ${party.partyEmail} specifying Content, grounds and evidence.`, `6.2.2 Harmful Usage: ${party.partyName} MUST cease use within 24 hours.`, "Competing Brand (Year Two only): comply within 24 hours, or offer payment to retain usage; if declined, must comply.", "6.2.3 Non-compliance is material breach."] },
    { heading: "7. WARRANTIES", body: ["7.1 Creator warrants full authority, original non-infringing Content, all third-party permissions obtained, and compliance with laws and platform policies.", `7.1A Creator is solely liable for third-party IP infringement caused by the Creator and indemnifies ${party.partyName}.`, `7.2 ${party.partyName} warrants full authority, use within the Agreement terms, and personal liability for payments.`] },
    { heading: "8A. ILLNESS AND EMERGENCY", body: ["8A.1 Excused: medical illness or injury; personal or family emergency.", "8A.2 Notify within 24 hours via email, WhatsApp or phone. Documentation may be requested in good faith.", "8A.3 Up to 14 consecutive days per month without penalty. Beyond that, negotiated in good faith.", "8A.4 Excused days do not count against the quota; the Monthly Fee remains payable."] },
    { heading: "8B. BREACH", body: ["8B.1 Creator breach: quota failure without excuse, IP or legal violations, false representations. Daniel may suspend payment, terminate with notice, or seek remedies.", "8B.2 Daniel breach: failure to pay, prohibited use, failure to comply with takedown. Creator may revoke the licence within 14 days, terminate with notice, or seek remedies."] },
    { heading: "8C. PERFORMANCE MONITORING", body: ["8C.1 Consistent Default: two or more defaulting weeks in a calendar month.", "8C.2 Written notice starts a two-week Performance Watch stating shortfalls and expectations.", "8C.3 During the Watch: 14 Qualifying pieces per week expected; per-piece payment continues.", "8C.4 Satisfactory: Watch lifted. Unsatisfactory: immediate termination on written notice.", "8C.5 Final payment for Qualifying Content up to termination within 7 business days.", "8C.6 Repeat default within a rolling three months may lead to direct termination."] },
    { heading: "9. DISPUTE RESOLUTION", body: ["9.1 Good faith negotiation, meeting within 7 business days of notice.", "9.2 Unresolved within 14 business days: mediation, e.g. Lagos Multi-Door Courthouse, costs shared.", "9.3 Unresolved within 30 business days: litigation in the courts of Lagos, Nigeria.", "9.4 Governed by the laws of the Federal Republic of Nigeria."] },
    { heading: "10. TERM AND TERMINATION", body: [`10.1 Term: ${party.termStart} to ${party.termEnd} unless terminated earlier.`, "10.2 Creator may terminate on 21 days written notice; payment within 7 business days.", `10.3 ${party.partyName} may terminate with immediate effect on written notice; payment by the 10th of the following month.`, "10.4 Either party may terminate immediately for uncured material breach after 14 days notice.", "10.5 On termination, account control reverts to the Creator; the content licence continues for the two-year period."] },
    { heading: "11. GENERAL", body: ["11.1 Entire Agreement. 11.2 Amendments in writing signed by both parties. 11.3 Severability. 11.4 No assignment without written consent.", "11.5 Notices in writing via email, registered mail or courier.", "11.6 Independent contractor relationship.", `11.7 ${party.brandName} is NOT a party and has no obligations or liabilities. All claims solely against ${party.partyName}.`] },
    { heading: "SIGNATURES", body: ["IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.", `Contract signing date: ${todayIsoDate}`] }
  ];
}

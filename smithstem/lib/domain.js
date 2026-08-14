// Two posts a day, every day of that month — so the divisor is 62 in a 31-day
// month and 60 in a 30-day one, and February is shorter again. Dividing by a
// flat 62 underpaid every 30-day month: at the 150,000 band that is 2,419 a
// post instead of 2,500, which is 4,800 naira short over a full month.
export function postsExpectedIn(month) {
  const [y, m] = String(month).slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate() * 2;
}

export function rate(basePay, month) {
  // Callers that do not name a month are asking about the current one.
  const key = month || today();
  return Number(basePay) / postsExpectedIn(key);
}

// The bonus structure changes over time, so the table holds several sets, each
// with the date it came into force. A claim is always valued with the set that
// applied on the day it was made — otherwise changing the tiers would rewrite
// what somebody was already paid.
export function tiersOn(tiers, date) {
  if (!tiers?.length) return [];
  const on = typeof date === "string" ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
  const inForce = tiers.filter((t) => (t.effective_from || "2000-01-01") <= on);
  if (!inForce.length) return [];
  const latest = inForce.reduce((max, t) => (t.effective_from > max ? t.effective_from : max), inForce[0].effective_from);
  return inForce.filter((t) => t.effective_from === latest);
}

// Expects one set of tiers, already narrowed to the right date by tiersOn.
export function bonusForViews(views, tiers) {
  const sorted = [...tiers].sort((a, b) => b.min_views - a.min_views);
  for (const t of sorted) if (views >= t.min_views) return Number(t.amount);
  return 0;
}

export function monthKey(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }
export function fmtNaira(n) { return "₦" + Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// Dates are Nigerian, not UTC. Left to the browser's default, a creator logging
// at half past midnight in Lagos gets yesterday's date — and on the first of a
// month, a video lands in the previous month's pay. Checked: 00:30 on 1
// September was being recorded as 31 August.
export const BUSINESS_TZ = "Africa/Lagos";

export function today(tz = BUSINESS_TZ) {
  // en-CA formats as YYYY-MM-DD, which is what date inputs and Postgres want.
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// First and last day of the month a creator is actually living in.
export function monthBoundsLocal(tz = BUSINESS_TZ) {
  const t = today(tz);
  const [y, m] = t.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n) => String(n).padStart(2, "0");
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(last)}`, month: `${y}-${pad(m)}` };
}

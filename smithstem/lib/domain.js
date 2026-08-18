// Two posts a day, every day of that month — so the divisor is 62 in a 31-day
// month and 60 in a 30-day one, and February is shorter again. This is the
// rule Smith actually runs: 100,000 / 62 = 1,612.90 in August, 100,000 / 60 =
// 1,666.67 in September. A flat 62 would have been wrong for four months of
// the year, though no real payment was ever calculated with it — the payments
// table was still empty when this was caught.
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

// Same idea as tiersOn, one level down: a creator's own base pay changes
// over time (moving between pay tiers), so a past period is valued with
// whatever was in force on its own end date, not today's figure. Falls back
// to the creator's current base_pay when no history row exists yet — true
// for anyone who hasn't had a tier change recorded since this was built.
export function basePayOn(history, fallbackBasePay, creatorId, date) {
  const on = typeof date === "string" ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
  const rows = (history || []).filter((h) => h.creator_id === creatorId && (h.effective_from || "2000-01-01") <= on);
  if (!rows.length) return Number(fallbackBasePay);
  const latest = rows.reduce((max, h) => (h.effective_from > max.effective_from ? h : max), rows[0]);
  return Number(latest.base_pay);
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

// Smith's rule: a video posted at or after 11:30pm Lagos time counts as the
// next day's post, not the calendar day it was actually uploaded on. This is
// the date the video log form should default to — a creator can still pick a
// different date by hand, this only decides what the form opens with.
export function postingDay(at = new Date(), tz = BUSINESS_TZ) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(at);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const minutesNow = get("hour") * 60 + get("minute");
  const cutoff = 23 * 60 + 30;
  let day = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  if (minutesNow >= cutoff) day = new Date(day.getTime() + 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
}

// The start of the current 7-day check-in block, anchored to the 1st of the
// month rather than the calendar week — Smith's rule: 1-7, 8-14, 15-21,
// 22-28, then whatever's left (29-30/31) as a shorter trailing block. Blocks
// reset every month regardless of where the 1st falls, so a creator logging
// on the 9th sits in the 8-14 block whether or not they were even here for
// 1-7 — the gate only ever asks for videos they actually logged themselves.
export function mostRecentMonthWeekBoundary(date) {
  const d = new Date((date || today()) + "T00:00:00");
  const blockStartDay = Math.floor((d.getDate() - 1) / 7) * 7 + 1;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(blockStartDay)}`;
}

// Aura's rule instead: its cohort launched mid-month (Monday), so its gate
// runs a plain Monday-to-Sunday week off its own launch day rather than the
// 1st-of-the-month blocks above — this just finds the most recent Monday.
export function mostRecentMonday(date) {
  const d = new Date((date || today()) + "T00:00:00");
  const isoDay = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1 .. Sun=7
  d.setDate(d.getDate() - (isoDay - 1));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Picks the right gate boundary for a business's configured anchor —
// 'weekly_monday' (Aura) or the default 'calendar_month' (everyone else).
export function gateBoundary(anchor, date) {
  return anchor === "weekly_monday" ? mostRecentMonday(date) : mostRecentMonthWeekBoundary(date);
}

export function daysBetween(fromDate, toDate) {
  const a = new Date((fromDate || today()) + "T00:00:00");
  const b = new Date((toDate || today()) + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

// One day back from the given date, as a YYYY-MM-DD string.
export function dayBefore(date) {
  const d = new Date((date || today()) + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Whether it's still morning in Lagos — the grace window for logging
// yesterday's video closes at noon, same timezone rule as everything else
// date-related here, not whatever timezone the creator's browser happens
// to be set to.
export function isBeforeNoon(tz = BUSINESS_TZ) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()));
  return hour < 12;
}

// First and last day of the month a creator is actually living in.
export function monthBoundsLocal(tz = BUSINESS_TZ) {
  const t = today(tz);
  const [y, m] = t.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n) => String(n).padStart(2, "0");
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(last)}`, month: `${y}-${pad(m)}` };
}

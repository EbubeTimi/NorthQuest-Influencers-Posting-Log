export function rate(basePay) { return basePay / 62; }

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

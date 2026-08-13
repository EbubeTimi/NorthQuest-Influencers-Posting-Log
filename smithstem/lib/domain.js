export function rate(basePay) { return basePay / 62; }
export function bonusForViews(views, tiers) { const sorted = [...tiers].sort((a, b) => b.min_views - a.min_views); for (const t of sorted) if (views >= t.min_views) return t.amount; return 0; }
export function monthKey(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }
export function fmtNaira(n) { return "₦" + Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

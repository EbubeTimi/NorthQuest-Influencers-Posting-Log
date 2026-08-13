// A mistyped address is indistinguishable from a working one: the code is sent,
// nothing bounces back to the creator, and they sit on the waiting screen
// forever. Nothing can truly confirm an inbox exists before sending, but almost
// every real case is a slip in the domain, and those are catchable.

const COMMON_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.co.uk", "outlook.com", "hotmail.com",
  "icloud.com", "live.com", "protonmail.com", "aol.com", "gmx.com",
  "yandex.com", "mail.com", "zoho.com",
];

// Levenshtein, capped: we only care whether it is within a typo or two.
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

// Returns a corrected address to offer, or null when nothing looks wrong.
// Deliberately conservative: a wrong suggestion is worse than none, because it
// invites someone to "fix" an address that was already right.
export function suggestEmail(input) {
  const email = String(input || "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (COMMON_DOMAINS.includes(domain)) return null;

  let best = null;
  let bestDistance = 3;
  for (const candidate of COMMON_DOMAINS) {
    const d = distance(domain, candidate);
    if (d < bestDistance) { bestDistance = d; best = candidate; }
  }

  // A domain with no dot is always wrong, whatever it is close to.
  if (!best && !domain.includes(".")) return null;
  return best ? `${local}@${best}` : null;
}

// Catches the shapes that cannot be an address at all, before we waste a code
// on them. Full RFC validation is not the goal and would reject valid inboxes.
export function looksLikeEmail(input) {
  const email = String(input || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

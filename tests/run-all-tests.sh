#!/bin/bash
# Runs every browser check against the real index.html in one go.
#
#   ./tests/run-all-tests.sh
#
# First time only, from the repo root:  npm install
# (Playwright drives a real browser; these tests open index.html in it and
#  assert on what a creator would actually see.)

cd "$(dirname "$0")"

if ! node -e "require('playwright')" 2>/dev/null; then
  echo "Playwright is not installed."
  echo "From the repo root, run:  npm install"
  exit 2
fi

pass=0; fail=0
for t in test-quota.js verify-toggle.js verify-bonus-real.js verify-extra.js verify-extra-bonuses.js verify-creator-sees-pay.js; do
  name=$(basename "$t" .js)
  if out=$(node "$t" 2>&1); then
    n=$(echo "$out" | grep -c "✅")
    echo "✅ $name — $n checks passed"
    pass=$((pass+1))
  else
    echo "❌ $name FAILED:"
    echo "$out" | grep -A 2 "❌" | head -12 | sed 's/^/     /'
    fail=$((fail+1))
  fi
done

echo
echo "════════════════════════════════════"
echo "  $pass suites passed, $fail failed"
echo "════════════════════════════════════"
exit $fail

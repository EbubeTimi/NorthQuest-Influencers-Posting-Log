# NorthQuest Tracker — Security Upgrade Guide

The tracker pages are public by design (creators must reach them without
accounts), but the **Google Apps Script API behind them must not be**. This
guide locks it down. It takes about 10 minutes and nothing breaks while you
do it — the new `index.html` works with both the old and the patched backend.

## Why this matters

Right now anyone who reads the page source can find the Apps Script URL and
call it directly. Without this patch, that lets a stranger:

- read every creator's **bank account number** and intake details,
- read and **edit salaries, bonuses and payment statuses**,
- **delete creators** and their posts.

The admin password on the page only hides buttons — it does not protect the
data. This patch moves the real lock into the backend.

## Step 1 — Set the admin password as a Script Property

1. Open your Google Sheet → **Extensions → Apps Script**.
2. In the left sidebar click the gear icon (**Project Settings**).
3. Scroll to **Script Properties** → **Add script property**.
   - Property: `ADMIN_PASS`
   - Value: a NEW strong password (do not reuse `NQ2026dash` — it is public).
4. Save.

## Step 2 — Paste the patch code

In the Apps Script editor, open your code file and paste this **above** your
`doGet` function:

```javascript
// ═══════════ NQ SECURITY PATCH ═══════════
var NQ_ADMIN_ACTIONS = [
  'addCreator', 'toggleCreator', 'deleteCreator', 'setRate',
  'setCreatorBank', 'savePayment', 'deletePaymentRow', 'getPayments'
];

function nqAdminPass_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASS') || '';
}

// A key derived from the password. The page holds this key for the session
// instead of the password itself.
function nqAdminKey_() {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 'nq-key-' + nqAdminPass_());
  return Utilities.base64EncodeWebSafe(digest);
}

function nqIsAdmin_(e) {
  var k = e && e.parameter && e.parameter.adminKey;
  return !!k && nqAdminPass_() !== '' && k === nqAdminKey_();
}

// JSONP response helper (self-contained, matches what the pages expect)
function nqOut_(e, obj) {
  var cb = (e && e.parameter && e.parameter.callback) || 'callback';
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(obj) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
// ═══════════ END PATCH HELPERS ═══════════
```

## Step 3 — Wire it into `doGet`

Find the place in your `doGet(e)` where the `action` parameter is read
(something like `var action = e.parameter.action;`). Immediately **after**
that line, add:

```javascript
  // ── NQ security patch ──
  if (action === 'adminLogin') {
    var ok = nqAdminPass_() !== '' && e.parameter.pass === nqAdminPass_();
    return nqOut_(e, ok ? { status: 'success', adminKey: nqAdminKey_() }
                        : { status: 'denied' });
  }
  if (NQ_ADMIN_ACTIONS.indexOf(action) >= 0 && !nqIsAdmin_(e)) {
    return nqOut_(e, { status: 'denied', message: 'Admin only.' });
  }
  // ── end patch ──
```

## Step 4 — Hide bank details from the public creators list

Find where the `getCreators` action builds its list of creators (just before
it returns them). Right before the return, add:

```javascript
  // Public visitors get names and statuses only — bank details and pay
  // are for the admin key.
  if (!nqIsAdmin_(e)) {
    creators = creators.map(function(c) {
      return { name: c.name, status: c.status, added: c.added };
    });
  }
```

(If your variable is not called `creators`, use whatever name your code uses.)

## Step 5 — Redeploy WITHOUT changing the URL

1. Click **Deploy → Manage deployments**.
2. Click the pencil (edit) on the existing deployment.
3. Under Version choose **New version**, then **Deploy**.

Do NOT create a brand-new deployment — that would change the URL and break
the pages.

## Step 6 — Turn off the fallback in the page

The page still contains the old password as a temporary fallback so nothing
breaks before the patch is live. Once you have confirmed you can log in with
the NEW password:

1. Open `index.html` and find `const LEGACY_LOGIN_FALLBACK = true;`
2. Change it to `false`.
3. (Optional but tidy) change the `ADMIN_PASS` line to `const ADMIN_PASS = '';`
4. Upload the file to GitHub again.

From then on, no password appears anywhere in the page code.

## What this does and does not protect

Locked after the patch:
- Reading payment data, salaries, bonuses — admin only.
- Reading bank details from the creators list — admin only.
- Changing rates, payments, creators — admin only.
- The admin password lives only in Script Properties, checked server-side.

Still public on purpose (the system needs them to work without accounts):
- Submitting posts and reading the posting-log rows (video links).
- The intake form.

Remaining honest caveats — no system is unhackable:
- Anyone can still *submit* junk posts (they'd need the URL and intent; the
  duplicate/limit checks contain the damage, and you can delete rows).
- The intake form sends the social-media account passwords creators type in
  through URL parameters to Google. Consider whether you need to collect
  passwords through the form at all — collecting them another way (or not
  storing them in the sheet) would remove your single most sensitive data
  store. Happy to rework this flow if you want.
- Whoever knows the new admin password has full control — share it sparingly
  and change it in Script Properties if someone leaves.

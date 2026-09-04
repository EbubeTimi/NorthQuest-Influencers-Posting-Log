const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const prototypes = [
  'unified-tdt-creator-ops.html',
  'recruitment.html',
  'onboarding.html',
  'active-creator-dashboard.html',
];

const read = name => fs.readFileSync(path.join(__dirname, '..', 'prototypes', name), 'utf8');

test('all completed prototypes use the shared TypeUI visual contract', () => {
  for (const name of prototypes) {
    const html = read(name);
    assert.match(html, /TypeUI mobile-first polish/);
    assert.match(html, /--ui-canvas:#f3f5f2/);
    assert.match(html, /--ui-paper:#fffefa/);
    assert.match(html, /--ui-accent:#0b6248/);
    assert.match(html, /--ui-focus:#69b99d/);
  }
});

test('the visual pass keeps phone controls and keyboard focus accessible', () => {
  for (const name of prototypes) {
    const html = read(name);
    assert.match(html, /min-height:44px/);
    assert.match(html, /focus-visible/);
    assert.match(html, /prefers-reduced-motion/);
    assert.match(html, /h1\[tabindex="-1"\]:focus|main h1:focus|\.screen-enter h1:focus/);
  }
});

test('button-like quiet actions are not presented as text links', () => {
  for (const name of ['recruitment.html', 'onboarding.html', 'active-creator-dashboard.html']) {
    assert.match(read(name), /button\.quiet\{[^}]*text-decoration:none|\.quiet\{[^}]*text-decoration:none/);
  }
});

# Insufficiency Reminder — Phase 2 (bug-catching tests)

This repo is the Phase 1 app (`server.js`, `isolation.js`, `data.js`,
`public/`) plus a Phase 2 test suite in `tests/` that proves the 10 bugs from
my Phase 1 bug report (`BUG_REPORT.md`) are real. Each test encodes the
*expected* behavior; every test currently **fails** against the app as-is,
and that failure is the evidence for the bug.

I did not fix the bugs. Fixing is called out as an optional bonus in the
Phase 2 instructions, so the app code is unchanged from what I downloaded —
only `tests/`, `playwright.config.js`, and the `test*` scripts/devDependency
in `package.json` are additions.

## Tools used

- **Node's built-in test runner** (`node:test` / `node:assert/strict`) for
  the 6 backend/API bugs — no extra dependency needed beyond `express`,
  which the app already depends on.
- **Playwright** (`@playwright/test`) for the 4 frontend bugs — it drives a
  real Chromium browser against the real `public/app.js` + `index.html`
  served by `server.js`, so the tests exercise exactly what a user would see.
- An AI assistant (Claude) to read through `server.js`/`public/app.js`
  against my bug report and draft this test suite.

## Setup

```bash
npm install
npx playwright install chromium   # one-time, downloads the Playwright browser
```

## Running the tests

```bash
npm run test:api   # bugs 1-6 (backend), Node's built-in test runner
npm run test:ui    # bugs 7-10 (frontend), Playwright — starts/stops the server itself
npm test           # both
```

`test:api` spawns the real `server.js` on a scratch port and talks to it over
HTTP with `fetch`, reusing the per-session `sid` cookie so every request in a
test hits the same in-memory store. `test:ui` lets `playwright.config.js`
start/stop `server.js` automatically via its `webServer` option.

Every test calls `POST /api/reset` first, so tests don't leak state into each
other and always start from the same seed data (`data.js`).

## Expected result right now

All 10 tests should **fail**, each failure pointing at the bug it targets:

| Test file | Bug # | Bug name |
|---|---|---|
| `tests/api.test.js` | 1 | missing-reference-or-state-check |
| `tests/api.test.js` | 2 | off-by-one-boundary |
| `tests/api.test.js` | 3 | missing-required-field |
| `tests/api.test.js` | 4 | missing-sanitization |
| `tests/api.test.js` | 5 | wrong-persisted-default |
| `tests/api.test.js` | 6 | case-sensitivity-mismatch |
| `tests/ui.spec.js` | 7 | wrong-status-badge-color |
| `tests/ui.spec.js` | 8 | state-not-persisted |
| `tests/ui.spec.js` | 9 | ui-filter-not-applied |
| `tests/ui.spec.js` | 10 | missing-ui-feedback-guard |

One note on bug 5: the bug report describes the *displayed* reminder count as
2 for a fresh insufficiency, but the UI always renders `reminderCount + 1`
(see `public/app.js`). The actual persisted value from the API is `1`, not
the required `0`. The test asserts the real API value (`0`) so it checks the
underlying defect rather than the UI's display offset.

## Bonus (not done)

Fixing the 10 bugs so these tests pass is left as the optional bonus and
isn't included in this submission.

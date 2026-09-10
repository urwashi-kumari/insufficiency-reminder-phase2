// API regression tests for the 6 backend bugs found in Phase 1.
//
// These hit the real Express app (server.js) over HTTP, exactly like a client
// would. Each test is written against the EXPECTED behavior described in the
// bug report; each one currently FAILS because the corresponding bug is still
// present in server.js. That failure is the proof of the defect.
//
// No test here mutates seed data permanently: every test resets the
// per-session store first (via POST /api/reset), and each session is isolated
// by a `sid` cookie (see isolation.js), so tests never leak state into each
// other.
//
// Run with:  node --test tests/api.test.js
// (Node's test runner is built in - no extra dependency needed beyond the
// `express` the app itself already depends on.)

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const PORT = process.env.TEST_PORT || 4055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess;
let cookie = "";

// Minimal cookie-jar-of-one wrapper around fetch, so every request in a test
// run shares the same per-session store on the server.
async function request(urlPath, options = {}) {
  const headers = Object.assign({}, options.headers, cookie ? { Cookie: cookie } : {});
  const res = await fetch(BASE_URL + urlPath, Object.assign({}, options, { headers }));
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return res;
}

async function getItem(id) {
  const items = await (await request("/api/insufficiencies")).json();
  return items.find((i) => i.id === id);
}

before(async () => {
  serverProcess = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: Object.assign({}, process.env, { PORT: String(PORT) }),
    stdio: ["ignore", "pipe", "pipe"]
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start in time")), 8000);
    let out = "";
    serverProcess.stdout.on("data", (chunk) => {
      out += chunk.toString();
      if (out.includes("listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProcess.on("error", reject);
    serverProcess.on("exit", (code) => {
      if (code !== null && code !== 0) reject(new Error(`server exited early with code ${code}`));
    });
  });
});

after(async () => {
  if (serverProcess) serverProcess.kill();
});

// Bring the store back to the known seed before every test, using the
// session cookie established by the first request.
beforeEach(async () => {
  await request("/api/reset", { method: "POST" });
});

test("Bug 1 (missing-reference-or-state-check): remind on a RESOLVED insufficiency is rejected and reminderCount does not change", async () => {
  // Seed id 3 = Amit Verma, RESOLVED.
  const before = await getItem(3);
  assert.equal(before.status, "RESOLVED", "test setup expects seed id 3 to be RESOLVED");
  const startCount = before.reminderCount;

  const res = await request("/api/insufficiencies/3/remind", { method: "POST" });
  assert.equal(res.status, 400, "expected 400 Bad Request when reminding a RESOLVED insufficiency");

  const after = await getItem(3);
  assert.equal(after.reminderCount, startCount, "reminderCount must not change for a RESOLVED insufficiency");
});

test("Bug 2 (off-by-one-boundary): reminderCount cannot be pushed past the cap of 3", async () => {
  // Seed id 2 = Priya Sharma, OPEN, reminderCount 2. One legitimate reminder
  // brings it to the cap.
  await request("/api/insufficiencies/2/remind", { method: "POST" }); // 2 -> 3
  let item = await getItem(2);
  assert.equal(item.reminderCount, 3, "setup: reminderCount should be at the cap (3) before testing the boundary");

  const res = await request("/api/insufficiencies/2/remind", { method: "POST" });
  assert.equal(res.status, 400, "expected 400 Bad Request once reminderCount is already at the cap of 3");

  item = await getItem(2);
  assert.equal(item.reminderCount, 3, "reminderCount must stay at the cap (3), not increase to 4");
});

test("Bug 3 (missing-required-field): creating an insufficiency with an empty candidateName is rejected", async () => {
  const res = await request("/api/insufficiencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName: "", reason: "Valid reason" })
  });
  assert.equal(res.status, 400, "expected 400 Bad Request for an empty candidateName");
});

test("Bug 4 (missing-sanitization): creating an insufficiency with a whitespace-only candidateName is rejected", async () => {
  const res = await request("/api/insufficiencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName: "   ", reason: "Valid reason" })
  });
  assert.equal(res.status, 400, "expected 400 Bad Request for a whitespace-only candidateName (should be trimmed first)");
});

test("Bug 5 (wrong-persisted-default): a newly created insufficiency defaults to reminderCount 0", async () => {
  const res = await request("/api/insufficiencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName: "Test Candidate", reason: "Some reason" })
  });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.status, "OPEN");
  assert.equal(created.reminderCount, 0, "a freshly created insufficiency should start at reminderCount 0");
});

test("Bug 6 (case-sensitivity-mismatch): the status filter matches regardless of case", async () => {
  const res = await request("/api/insufficiencies?status=OPEN");
  assert.equal(res.status, 200);
  const items = await res.json();
  assert.ok(
    Array.isArray(items) && items.length > 0,
    "GET /api/insufficiencies?status=OPEN should return the OPEN insufficiencies, not an empty array"
  );
  assert.ok(items.every((i) => i.status === "OPEN"), "every returned item should actually be OPEN");
});

// UI regression tests for the 4 frontend bugs found in Phase 1.
//
// These drive a real browser against the real app (public/app.js +
// public/index.html served by server.js), exactly like a candidate using the
// app would. Each test encodes the EXPECTED behavior from the bug report;
// each one currently FAILS because the corresponding bug is still present in
// public/app.js. That failure is the proof of the defect.
//
// Run with:  npx playwright test
// (playwright.config.js starts and stops the app server automatically.)

const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  // Reset this session's data back to the known seed before every test, then
  // load the app fresh.
  await page.goto("/");
  await page.request.post("/api/reset");
  await page.reload();
  await page.waitForSelector("#insuff-body tr");
});

test("Bug 7 (wrong-status-badge-color): OPEN and RESOLVED rows get the matching badge class", async ({ page }) => {
  // Seed id 1 = Ravi Kumar, OPEN. Seed id 3 = Amit Verma, RESOLVED.
  const openRow = page.locator("tr", { hasText: "Ravi Kumar" });
  const resolvedRow = page.locator("tr", { hasText: "Amit Verma" });

  await expect(openRow.locator(".badge")).toHaveClass(/badge-open/, {
    // toHaveClass polls, but the bug is a stable mislabeling, not a timing
    // issue - keep the wait short so the failure reports quickly.
    timeout: 3000
  });
  await expect(resolvedRow.locator(".badge")).toHaveClass(/badge-resolved/, { timeout: 3000 });
});

test("Bug 8 (state-not-persisted): a newly added insufficiency appears in the table without a page reload", async ({ page }) => {
  await page.fill("#candidate-name", "New Candidate QA");
  await page.fill("#reason", "Missing signature");
  await page.click("#add-form button[type=submit]");

  await expect(page.locator("#add-message")).toHaveText("Insufficiency added.");

  // Should show up live, with no page.reload() call here.
  await expect(page.locator("tr", { hasText: "New Candidate QA" })).toBeVisible({ timeout: 2000 });
});

test("Bug 9 (ui-filter-not-applied): selecting a status in the filter narrows the table", async ({ page }) => {
  // Before filtering, both an OPEN and a RESOLVED candidate are visible.
  await expect(page.locator("tr", { hasText: "Ravi Kumar" })).toBeVisible(); // OPEN
  await expect(page.locator("tr", { hasText: "Amit Verma" })).toBeVisible(); // RESOLVED

  await page.selectOption("#status-filter", "RESOLVED");

  await expect(page.locator("tr", { hasText: "Amit Verma" })).toBeVisible({ timeout: 2000 });
  await expect(page.locator("tr", { hasText: "Ravi Kumar" })).toHaveCount(0, { timeout: 2000 });
});

test("Bug 10 (missing-ui-feedback-guard): Send Reminder is disabled once reminderCount hits the cap", async ({ page }) => {
  // Seed id 2 = Priya Sharma, OPEN, reminderCount 2. One reminder brings her
  // to the cap of 3.
  const remindBtn = page.locator('button[data-action="remind"][data-id="2"]');
  await remindBtn.click();
  await page.waitForTimeout(300); // allow the list reload triggered by the click to finish

  const remindBtnAfter = page.locator('button[data-action="remind"][data-id="2"]');
  await expect(remindBtnAfter).toBeDisabled({ timeout: 2000 });
});

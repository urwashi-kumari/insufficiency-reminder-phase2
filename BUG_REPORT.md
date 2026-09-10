# My bug report — 05

You reported 10 confirmed bugs. For Phase 2, write an automated test that FAILS because of each one — fixing them is an optional bonus.

## 1. POST /api/insufficiencies/:id/remind — missing-reference-or-state-check

Issue: Sending a reminder is allowed for an insufficiency whose status is RESOLVED. Steps to reproduce: locate a RESOLVED insufficiency (Amit Verma) with reminderCount 2 and click "Send Reminder". The reminder is processed and reminderCount increases to 3.
Expected vs actual: Expected: A reminder request for a RESOLVED insufficiency should return 400 Bad Request and reminderCount should remain unchanged. Actual: The reminder request succeeds and reminderCount increases from 2 to 3 despite the insufficiency being RESOLVED.

## 2. POST /api/insufficiencies/:id/remind — off-by-one-boundary

Issue: Send Reminder allows the reminder count to exceed the maximum limit of 3. When an OPEN insufficiency has reminderCount 3, clicking Send Reminder increments the count to 4 instead of rejecting the request.
Expected vs actual: Expected: When reminderCount reaches 3, further reminder requests should return 400 Bad Request with "Reminder cap reached", and the counter should remain at 3.
Actual: When reminderCount is 3, clicking Send Reminder succeeds and increases the reminderCount from 3 to 4.

## 3. POST /api/insufficiencies — missing-required-field

Issue: The API allows an insufficiency to be created with an empty candidateName. When the Candidate name field is left empty and a valid reason is provided, the application creates and persists the insufficiency instead of rejecting the request.
Expected vs actual: Expected: Creating an insufficiency with an empty candidateName should be rejected with 400 Bad Request because candidateName is required. Actual: The application successfully creates and persists an insufficiency with an empty candidateName and status OPEN.

## 4. POST /api/insufficiencies — missing-sanitization

Issue: The application accepts a whitespace-only candidateName. When candidateName contains only spaces and a valid reason is provided, the insufficiency is created and persisted.
Expected vs actual: Expected: A candidateName containing only whitespace should be treated as empty after trimming and the API should return 400 Bad Request.

Actual: The application accepts the whitespace-only candidateName and creates an OPEN insufficiency.

## 5. POST /api/insufficiencies — wrong-persisted-default

Issue: Newly created insufficiencies are persisted with reminderCount set to 2 instead of the required default value of 0.
Expected vs actual: Expected: A newly created insufficiency should have status OPEN and reminderCount equal to 0.
Actual: A newly created insufficiency is persisted with reminderCount equal to 2 immediately after creation.

## 6. GET /api/insufficiencies — case-sensitivity-mismatch

Issue: The status query filter is case-sensitive even though status matching should be case-insensitive. The API fails to return OPEN records when the status parameter is provided as OPEN, while lowercase open returns the records.
Expected vs actual: Expected: GET /api/insufficiencies?status=OPEN should return all OPEN insufficiencies, and status matching should be case-insensitive.
Actual: The request with status=OPEN returns an empty array even though OPEN records exist, while status=open returns them.

## 7. UI — wrong-status-badge-color

Issue: The status badge styling is inverted. OPEN insufficiencies are assigned the RESOLVED badge styling, while RESOLVED insufficiencies are assigned the OPEN badge styling.
Expected vs actual: Expected: OPEN should use the OPEN badge styling and RESOLVED should use the RESOLVED badge styling.
Actual: OPEN uses the RESOLVED badge styling and RESOLVED uses the OPEN badge styling.

## 8. UI — state-not-persisted

Issue: After successfully adding a new insufficiency, the new item does not appear in the insufficiencies table until the page is manually refreshed.
Expected vs actual: Expected: The newly created insufficiency should appear in the table immediately without reloading the page.
Actual: The API reports the insufficiency was added successfully, but the table remains unchanged until a manual page refresh.

## 9. UI — ui-filter-not-applied

Issue: Changing the status filter does not filter the insufficiencies displayed in the table. The frontend always loads all insufficiencies regardless of the selected status.
Expected vs actual: Expected: Selecting OPEN or RESOLVED should display only insufficiencies with that status.
Actual: Changing the dropdown does not apply the selected status filter and the table continues to display all records.

## 10. UI — missing-ui-feedback-guard

Issue: The Send Reminder button remains enabled when an insufficiency reaches the maximum reminder count of 3.
Expected vs actual: Expected: The Send Reminder button should be disabled when reminderCount reaches 3.

Actual: The Send Reminder button remains enabled even when the reminder count is at the cap, allowing the user to attempt another reminder.


# Verification checklist

This checklist records the final verification evidence for the application.
The production build was used for browser and HTTP checks on 21 September
2026.

## Regression scenarios

| # | Scenario | Result |
|---:|---|---|
| 1 | Public page with no matching published result shows an empty state | Passed with a no-match query; a destructive reset of the Neon demo data was not repeated |
| 2 | Admin login succeeds | Passed with a temporary verification account |
| 3 | Create a published event | Passed through the admin form |
| 4 | Event appears in dashboard and public page | Passed |
| 5 | Open the event detail page | Passed |
| 6 | Edit the title and see the new value | Passed; API and public search returned the updated title |
| 7 | Change status to draft and hide it publicly | Passed through API verification; direct public detail returned HTTP 404 |
| 8 | Cancel delete in the confirmation dialog | Previously passed in the Fase E live browser run; not repeated after browser automation quota was exhausted |
| 9 | Confirm delete and remove the event | Passed through the authenticated delete API during cleanup |
| 10 | Logout and block dashboard access | Previously passed in the Fase E live browser run |
| 11 | Wrong password displays the generic error | Passed |
| 12 | Unauthenticated dashboard access is blocked | Covered by middleware and previously passed in the Fase E live browser run |
| 13 | Empty event form shows field errors | Passed in the live form |
| 14 | One-character title is rejected | Passed in the live form |
| 15 | Random event URL returns 404 | Covered by the same not-found route and previously passed in the Fase E live browser run |
| 16 | Draft event URL returns 404 | Passed through the production request |
| 17 | Event creation without a session returns 401 | Passed |
| 18 | Main flow at 375 px | Previously passed in the Fase E live browser run; the current browser quota prevented a repeat |

The temporary `phase-g-verification` account was removed after the run. A
final anonymous request confirmed that `/` returns the public event page with
HTTP 200, while `/admin/dashboard` redirects to `/admin/login` with HTTP 307.

## Phase 2 scenarios

- Search found and no-match: passed through `GET /api/events`.
- Upcoming and past filters: both returned HTTP 200 and were exercised against
  the seeded date distribution.
- Pagination lower bound, final page, out-of-range upper page, and combined
  search/timeframe/page parameters: passed with a temporary 10-event fixture;
  all 11 temporary events were removed through the authenticated API.
- Login rate limit: five wrong attempts returned `401`, the sixth returned
  `429`, and the rate-limit unit tests cover window expiry and reset. A live
  recovery request after process restart could not be repeated because a
  non-elevated server cannot connect to the Neon database in this environment.
- Upload rejection: missing file, over 2 MB, unsupported claimed type, and
  invalid magic bytes each returned `400`; a valid PNG returned `201`.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, and `Permissions-Policy` matched the configured values.

## Automated checks

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Passed |
| `npm run lint` | Passed |
| `npm run test -- --run` | 6 files, 65 tests passed |
| `npm run build` | Passed; only the known `middleware` deprecation warning |

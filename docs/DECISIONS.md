# Decisions

Why the implementation looks the way it does: the assumptions behind it, the
boundaries drawn around it, and the trade-offs accepted knowingly. Entries
describe the code as it exists today, including the places where the
approach changed partway through.

For the technical reference, see [DESIGN.md](./DESIGN.md).

---

## 1. Assumptions

The requirements left several things open. Each was resolved in the
narrowest way that still satisfies them.

| Assumption | Basis |
|---|---|
| A single admin account, created by a seed script | Nothing asks for multiple administrators, self-registration or password reset. The schema permits more rows; no interface creates one |
| `status` means the four values `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED` | The requirement names a status field without enumerating it. Four values cover the lifecycle an event actually has |
| `DRAFT` events are private | A draft is unfinished by definition. It is hidden from the list and returns `404` on direct access, rather than a distinct error that would confirm the id exists |
| Event times are Jakarta local time | The audience is a student branch at ITB. WIB has no daylight saving, so a fixed `+07:00` offset is exact |
| No author attribution on events | No screen in the requirements shows who created an event |
| The evaluator supplies their own database | Committing a connection string would be a credential leak, so setup asks for one |

---

## 2. Decisions that changed during implementation

These differ from the original plan. Each changed because building or
testing the thing revealed something the plan did not anticipate.

### Authentication split into two modules

*Planned:* one `src/lib/auth.ts` holding hashing and token handling.
*Built:* `auth.ts` (`jose` only) and `password.ts` (`bcryptjs` only).

The middleware runs on the Edge Runtime. Importing a combined module from
there would pull `bcryptjs` — which needs Node crypto — into the Edge bundle
and fail the build. Splitting the files makes the boundary visible in the
directory listing instead of relying on someone remembering it. The built
middleware chunk was inspected to confirm it contains no `bcrypt`.

### An unknown `?status=` value is rejected, not ignored

*Planned:* filter when the value is valid.
*Built:* `400` with `field: "status"`, while an empty value means "no
filter".

Silently ignoring a misspelled filter returns every event while the caller
believes the filter applied — a wrong answer presented as a correct one. The
empty-string exemption exists because that is what a dropdown with an "All"
option submits.

### Loading state via `<Suspense>` instead of `loading.tsx`

*Planned:* a `loading.tsx` file.
*Built:* a `<Suspense>` boundary inside `src/app/page.tsx`.

A `loading.tsx` at the app root wraps every child route, including
`/events/[id]`. That boundary makes the response start streaming with status
`200` before `notFound()` runs, so the 404 page rendered with a `200`
status. Confirmed by experiment in both development and a production build:
with the file, `200`; with no such file anywhere, `404`. Scoping the
boundary to the list itself keeps the visible loading state and restores the
correct status code.

### `force-dynamic` on the data-backed pages

Not in the plan at all. The first production build marked `/` as statically
pre-rendered, which would have frozen the event list at build time — newly
created events would never have appeared. `export const dynamic =
"force-dynamic"` fixes it, and the dashboard carries the same marker for the
same reason.

`/events/[id]` needs no marker: a dynamic segment with no
`generateStaticParams` is always rendered per request. Verified against a
production server by editing a record and re-fetching the page.

### An explicit `+07:00` offset rather than `new Date(value)`

The working note said to convert form values with
`new Date(value).toISOString()`. That reads a naive `datetime-local` string
as the *parsing machine's* local time, so it is correct only while the
admin's browser sits at UTC+7 — including on the machine where it was
tested, which is exactly how such a bug survives testing. Appending the WIB
offset explicitly makes the conversion independent of the browser.

### The scaffold's dark mode was removed

`create-next-app` ships a `prefers-color-scheme: dark` block that sets
`body { background }` outside any cascade layer, so it beats Tailwind
utilities in `@layer utilities`. On an OS in dark mode the pages rendered
dark text on a dark background. This application implements a single light
theme, so the half-finished dark mode was deleted rather than completed.

---

## 3. Trade-offs accepted knowingly

**Validation logic runs twice.** The same Zod schema is evaluated in the
browser and again in the route handler. That is duplicated execution, not
duplicated definition: one file defines the rules. The client pass exists
for immediate feedback, the server pass because the API is reachable without
the form.

**Public pages bypass the REST API.** Reads go straight to Prisma from
Server Components, so the API is not the single entry point to the data.
Making pages call their own HTTP endpoints would have cost a round trip per
render for no gain in a single-deployment application. Mutations still go
through the API, so the write path remains singular.

**No automated tests for route handlers or components.** The suites cover
pure logic — validation, hashing, tokens, time conversion — where the return
on a test is highest and no server is needed. Route and component behaviour
was verified through a manual scenario checklist run against a live server.
With more time, the route handlers are the first thing to add.

**A `401` from the middleware, not from the handler.** Authorisation for
mutations lives in the middleware rather than in each route. One rule
protects every current and future `/api/events` method, but reading a
handler in isolation does not reveal that it is protected. The middleware
uses the same error helper as the routes so the response shape stays
identical.

**Existence is not checked before update or delete.** The handlers attempt
the write and translate Prisma's `P2025` into `404`. One round trip instead
of two, and no window in which the record can vanish between check and
write. The cost is a dependency on a Prisma error code, which is isolated in
a single helper function.

**Deletion is permanent.** No soft delete, no restore. The requirement asks
for deletion with a confirmation step, and the confirmation dialog is that
safeguard. A `deletedAt` column would have meant filtering it out of every
query for a recovery path nobody asked for.

**The seed script also rotates the password.** Its upsert writes
`passwordHash` on update as well as create, so re-running it after changing
`ADMIN_PASSWORD` changes the password. Being idempotent was the requirement;
being a password-reset mechanism is a free consequence, and the script is
plainly named.

**The enum is written down twice.** `EVENT_STATUSES` in
`src/lib/validation.ts` duplicates the Prisma enum, because importing
`@prisma/client` into a module used by browser code breaks the client
bundle. A two-way compile-time assertion turns any divergence into a type
error rather than a runtime surprise.

---

## 4. Scope boundaries

Deliberately not built, because the requirements do not ask for it:

- Search, filtering by upcoming or past, pagination
- Image uploads
- Multiple admins, registration, password reset, refresh tokens, rate
  limiting on login
- Soft delete, audit logging, per-event authorship
- Deployment to a hosting provider
- Internationalisation; the interface is English throughout

Known defects that were left in place, each with its reason and a fix, are
listed under "Known issues and limitations" in the README.

---

## 5. Stack choices and what was rejected

| Chosen | Rejected alternative | Reason |
|---|---|---|
| Next.js App Router, one codebase | React SPA plus a separate Express API | Two dev servers, CORS configuration and a duplicated type layer, for no benefit at this size |
| PostgreSQL on Neon | SQLite | Local and deployed behaviour should match; SQLite has no real enum type |
| Hand-written JWT sessions | NextAuth.js | The authentication mechanism has to be explainable in an interview, and NextAuth hides it. For one admin and no OAuth it is also more machinery than the problem needs |
| `jose` | `jsonwebtoken` | The middleware runs on the Edge Runtime, where `jsonwebtoken`'s Node crypto dependency is unavailable |
| `bcryptjs` | `bcrypt` | Pure JavaScript, so installation needs no native build toolchain |
| Prisma 7 pinned | Prisma 8 | Version 8 was still a release candidate and changes the configuration format |
| Native `<dialog>` for delete confirmation | `window.confirm` | The browser dialog cannot be styled, looks inconsistent across browsers, and cannot show the event title. `showModal()` provides the backdrop and focus trap without custom code |
| `npm audit fix --force` not run | running it | It downgrades Prisma to version 6 and breaks the configuration. The advisories are in development-only transitive dependencies; see the README |

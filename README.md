# IEEE ITB Student Branch — Event Management

A small event management web application for the IEEE ITB Student Branch.
Visitors browse published events; an authenticated admin creates, edits and
deletes them from a dashboard.

Built as the selection task for the Probation Phase, Division of Fullstack
Developer 2026/2027.

- **Developer:** Fayyaz Akmal Lauda (13524076)
- **Repository:** https://github.com/pepayaz/ieee-itb-event-management

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech stack and rationale](#tech-stack-and-rationale)
4. [Local setup](#local-setup)
5. [Environment variables](#environment-variables)
6. [Database setup](#database-setup)
7. [Demo account](#demo-account)
8. [API reference](#api-reference)
9. [Testing](#testing)
10. [Known issues and limitations](#known-issues-and-limitations)
11. [AI tools usage](#ai-tools-usage)

---

## Features

Every item below was verified end to end before release. The verification
run covered eighteen scenarios, including failure paths, and was repeated at
a 375 pixel viewport.

**Public site**

- [x] Event list page showing only `PUBLISHED` events, ordered by date
- [x] Event detail page
- [x] Draft events are unreachable from the public side, including by direct
      URL — they return a real HTTP 404
- [x] Loading, empty and error states, each visible in the running app
- [x] Readable at 375 and 1440 pixels

**Admin**

- [x] Login page with inline error feedback
- [x] Dashboard listing every event, including drafts, newest first
- [x] Create event
- [x] Edit event
- [x] Delete event behind a confirmation dialog that names the event
- [x] Logout
- [x] Client-side validation with per-field messages, sharing one schema
      with the server

**Backend**

- [x] REST API for listing, reading, creating, updating and deleting events
- [x] Session authentication with a signed JWT in an httpOnly cookie
- [x] Edge middleware guarding `/admin/*` and every mutating request to
      `/api/events*`
- [x] Server-side validation on every write, with a single error response
      shape across all endpoints
- [x] All event data persisted in PostgreSQL

---

## Architecture

```
                          ┌───────────────────────────────┐
  Visitor ───────────────▶│  /            (Server Comp.)  │
                          │  /events/[id] (Server Comp.)  │──┐
                          └───────────────────────────────┘  │  Prisma
                                                             │  (read only)
                          ┌───────────────────────────────┐  │
  Admin ──── cookie ─────▶│  /admin/login                 │  │
                          │  /admin/dashboard             │──┤
                          │  /admin/events/new            │  │
                          │  /admin/events/[id]/edit      │  │
                          └───────────────┬───────────────┘  │
                                          │ fetch            │
                                          ▼                  ▼
                          ┌───────────────────────────────┐ ┌──────────────┐
                          │  middleware.ts  (Edge)        │ │  PostgreSQL  │
                          │  verifies the session JWT     │ │  (Neon)      │
                          └───────────────┬───────────────┘ └──────────────┘
                                          │                        ▲
                                          ▼                        │
                          ┌───────────────────────────────┐        │
                          │  /api/events        (Node)    │────────┘
                          │  /api/events/[id]   (Node)    │  Prisma
                          │  /api/auth/*        (Node)    │  (read + write)
                          └───────────────────────────────┘
```

**Reads and writes take different paths.** Public pages are Server
Components that query the database directly through Prisma, which avoids an
HTTP round trip from the app to its own API. Every mutation goes through the
REST API, so validation and authorisation live in exactly one place.

**Authentication is split across two runtimes.** The middleware runs on the
Edge Runtime, where Node's crypto modules are unavailable, so it may only
verify tokens — `src/lib/auth.ts` holds the `jose` code it is allowed to
import. Password hashing lives in a separate module, `src/lib/password.ts`,
which is only ever imported by Node-runtime route handlers. Keeping them in
separate files means the boundary is visible in the file layout rather than
maintained by memory.

### Project layout

```
prisma/
  schema.prisma          Admin and Event models, EventStatus enum
  migrations/            applied migration history
  seed.ts                creates or updates the admin account
src/
  app/
    page.tsx             public event list
    events/[id]/         public event detail and its not-found page
    admin/               login, dashboard, create and edit pages
    api/events/          event collection and single-event endpoints
    api/auth/            login, logout, session endpoints
  components/            EventCard, EventForm, DeleteEventButton,
                         LogoutButton, StateViews
  lib/
    prisma.ts            PrismaClient singleton with the pg adapter
    validation.ts        Zod schemas shared by client and server
    auth.ts              JWT signing and verification (Edge-safe)
    password.ts          bcrypt hashing (Node only)
    api.ts               shared error response helpers
    format.ts            date formatting and time zone conversion
  middleware.ts          route protection
tests/                   Vitest suites
docs/                    design notes and decision log
```

### Database schema

```
Admin                         Event
─────────────────────         ─────────────────────────────────────
id            String  PK      id           String       PK  (cuid)
username      String  unique  title        String
passwordHash  String          description  String
createdAt     DateTime        date         DateTime
                              location     String
                              status       EventStatus  default DRAFT
                              createdAt    DateTime
                              updatedAt    DateTime
                              index (status, date)

EventStatus = DRAFT | PUBLISHED | CANCELLED | COMPLETED
```

Identifiers use `cuid()` rather than auto-incrementing integers, so record
URLs cannot be enumerated by guessing the next number. The composite index
on `(status, date)` matches the public list query, which filters by status
and sorts by date.

---

## Tech stack and rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.3.5, App Router | One codebase for frontend and backend: no CORS setup, no second dev server. Server Components let public pages read the database without an internal HTTP hop |
| UI | React 19.2.8 | Required by Next.js 16 |
| Language | TypeScript, strict mode | Catches the mistakes this stack is prone to — awaited `params`, nullable env vars — at compile time |
| Database | PostgreSQL on Neon | A real relational database rather than SQLite, so the deployed and local setups behave identically. Neon's free tier is sufficient at this scale |
| ORM | Prisma 7.10.0 with `@prisma/adapter-pg` | Typed queries generated from the schema, plus a migration history that is committed to the repository. Prisma 7 requires a driver adapter at runtime |
| Auth | `jose`, HS256, httpOnly cookie | The middleware runs on the Edge Runtime, which has no Node crypto modules, so `jsonwebtoken` cannot run there. Written by hand rather than with NextAuth because the mechanism has to be explainable, and because a single admin with no OAuth does not justify the dependency |
| Password hashing | `bcryptjs` | Pure JavaScript, so it installs without a native toolchain. Salt rounds 10 |
| Validation | Zod 4 | One schema definition imported by both the form and the route handler, so client and server cannot drift apart |
| Styling | Tailwind CSS 4 | Styling stays next to the markup; no separate stylesheet to keep in sync |
| Testing | Vitest 4 | Fast, and shares the TypeScript configuration already in the project |

---

## Local setup

**Requirements:** Node.js 20 or newer, npm, and a PostgreSQL database. The
instructions below assume [Neon](https://neon.tech), which is what this
project was developed against, but any PostgreSQL instance works.

```bash
# 1. Clone the repository
git clone https://github.com/pepayaz/ieee-itb-event-management.git
cd ieee-itb-event-management

# 2. Install dependencies
npm install

# 3. Create your environment file, then fill in the values
cp .env.example .env        # on Windows: copy .env.example .env

# 4. Generate the Prisma client
npx prisma generate

# 5. Create the database tables
npx prisma migrate deploy

# 6. Create the admin account
npx prisma db seed

# 7. Start the development server
npm run dev
```

Open http://localhost:3000. If port 3000 is already in use, Next.js picks
the next free port and prints the actual URL in the terminal — use that one.

Step 4 is not optional and is not run automatically by `npm install`. Prisma
generates its client into `node_modules`, which is not committed, so without
it the app fails at startup with
`Cannot find module '.prisma/client/default'`.

### Other commands

```bash
npm run build         # production build
npm start             # run the production build
npm run lint          # ESLint
npm run test -- --run # Vitest, single run
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in every value. `.env` is ignored by
Git and must never be committed.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection string, used by the application at runtime |
| `DIRECT_URL` | Direct (non-pooled) connection string, used by the Prisma CLI for migrations |
| `JWT_SECRET` | Secret used to sign session tokens. Use a long random string, for example from `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Username created by the seed script |
| `ADMIN_PASSWORD` | Password for that account. It is hashed before it is stored; the plain value is never written to the database |

On Neon, both connection strings come from the same dashboard: **Connection
Details** offers a pooled and a direct string. The pooled one goes in
`DATABASE_URL`, the direct one in `DIRECT_URL`. Serverless request handlers
open many short-lived connections, which is what the pooler is for, while
migrations need a stable direct connection.

The application fails fast and loudly when either `DATABASE_URL` or
`JWT_SECRET` is missing, rather than starting up in a broken state.

---

## Database setup

The repository contains the full migration history, so the schema does not
need to be created by hand.

```bash
npx prisma migrate deploy   # apply migrations to the database in .env
npx prisma db seed          # create the admin account
```

The seed script is idempotent: it upserts on `username`, so running it twice
produces one account, not two. Running it again after changing
`ADMIN_PASSWORD` updates the stored hash, which is also how the admin
password is changed.

To inspect the data directly:

```bash
npx prisma studio
```

---

## Demo account

There is no hard-coded account. The admin is created by the seed script from
the values you put in `.env`:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="choose-a-password-here"
```

Sign in with exactly those values at http://localhost:3000/admin/login.

If login fails, the most likely cause is that `npx prisma db seed` has not
been run, so no account exists yet. The login endpoint deliberately returns
the same message — `Invalid username or password` — whether the username is
unknown or the password is wrong, so it will not tell you which of the two
went wrong.

---

## API reference

Every error response has the same shape, so the frontend needs only one
error handler:

```json
{ "error": { "message": "Title must be at least 3 characters", "field": "title" } }
```

`field` is present only when the error belongs to a specific input.

| Method | Endpoint | Auth | Behaviour |
|---|---|---|---|
| `GET` | `/api/events` | no | All events, ordered by date ascending. Optional `?status=` filter; an unknown value returns `400`, an empty value means no filter |
| `POST` | `/api/events` | yes | Creates an event. `201` with the created record |
| `GET` | `/api/events/[id]` | no | One event, or `404` |
| `PUT` | `/api/events/[id]` | yes | Partial update. `200`, or `404` if the record is gone |
| `DELETE` | `/api/events/[id]` | yes | `204` with no body, or `404` |
| `POST` | `/api/auth/login` | no | Sets the session cookie, returns `{ username }`, or `401` |
| `POST` | `/api/auth/logout` | no | Clears the session cookie |
| `GET` | `/api/auth/me` | yes | Returns `{ username }` for the current session, or `401` |

Requests without a valid session cookie receive `401` from the middleware
before reaching the handler. `GET` requests are always allowed, which is what
makes the public pages work for anonymous visitors.

### Dates and time zones

The API exchanges ISO 8601 timestamps and the database stores UTC. The admin
form works in **Asia/Jakarta (WIB)**: values loaded into the
`datetime-local` input are converted to Jakarta wall-clock time, and values
submitted are converted back with an explicit `+07:00` offset rather than
relying on the browser's own time zone. Event dates are displayed in Jakarta
time everywhere, so the same event reads identically on any machine.

---

## Testing

```bash
npm run test -- --run
```

29 tests across three suites cover the validation schemas, password hashing
and session tokens, and the time zone conversion in both directions,
including a round trip and a case that falls on a different day in UTC.

Beyond the automated tests, the application was walked through eighteen
manual scenarios — the full create-to-delete flow, then the failure paths,
then the whole flow again at a 375 pixel viewport — and the setup
instructions in this README were verified by cloning the repository into an
empty directory and following them from scratch.

Continuous integration runs lint, tests and a production build on every push
to `main`.

---

## Known issues and limitations

**1. Login response times can reveal whether a username exists**

The login endpoint returns the same message for an unknown username and a
wrong password, but not in the same amount of time: when no account matches,
bcrypt never runs, so the response comes back sooner. Someone measuring that
difference could work out which usernames are registered — the very thing
the identical message is meant to hide.

*Not addressed because* it falls outside the required scope, and the
remaining time went to functionality that is being assessed.

*How to fix:* keep a dummy bcrypt hash as a constant and compare against it
when no account is found, so both paths spend comparable time before
returning `401`.

**2. The `middleware` file convention is deprecated in Next.js 16**

The build prints a warning: the `middleware` convention has been superseded
by `proxy`. Route protection works correctly, but the convention will be
removed in a future major version.

*Not addressed because* switching conventions late would mean re-verifying
every authorisation path for no functional gain.

*How to fix:* run `npx @next/codemod@canary middleware-to-proxy .`, then
re-test the protected routes — mutating requests to `/api/events`, the
`/admin/*` redirects, and logout.

**3. `Date.parse` accepts loosely formatted dates**

Date validation accepts any string `Date.parse` understands, and that
includes values like `"42"`, which it reads as the year 2042.

*Not addressed because* the admin form uses a `datetime-local` input that
always submits ISO format, so the gap is unreachable through the UI. It only
affects clients calling the API directly.

*How to fix:* check the value against an ISO 8601 pattern in
`src/lib/validation.ts` before the `Date.parse` refinement.

**4. `npm audit` reports four high-severity advisories**

The advisories are in `mysql2` and `deepmerge-ts`, which arrive as
transitive dependencies of the Prisma CLI. All of them sit under
`devDependencies` and none ship to production. `mysql2` is never executed at
all, since this project uses PostgreSQL.

*Not addressed because* `npm audit fix --force` downgrades Prisma to version
6, which uses a different configuration format and breaks this project's
setup.

*How to fix:* wait for a Prisma release that updates those transitive
dependencies, then re-run `npm audit`.

### Scope limitations

The following were deliberately left out. They are not part of the required
scope:

- Search, filtering by upcoming or past, and pagination
- Image uploads
- Multiple admin accounts, self-registration and password reset — the schema
  supports more than one admin row, but nothing in the UI creates one
- Deployment to a hosting provider; the project runs locally as documented

---

## AI tools usage

Claude (Anthropic) was used as a coding assistant throughout this project,
in an agentic setup with access to the repository, a terminal and a browser.

**Where it was applied**

- Drafting implementation code for each stage from a written specification,
  one task at a time
- Writing the Vitest suites and the manual test scenarios
- Running verification: executing the endpoints with `curl`, driving the UI
  in a real browser, measuring layouts at 375 and 1440 pixels, and cloning
  the repository into an empty directory to check these setup instructions
- Reviewing its own output for version-specific pitfalls in this stack, such
  as Next.js 16's asynchronous `params` and Prisma 7's required driver
  adapter
- Drafting this README and the documents under `docs/`

**How it was directed**

Work proceeded in reviewed increments. Each stage was specified before any
code was written, the assistant explained its plan and then its decisions,
and every change was inspected and committed by the developer — the
assistant never committed or pushed. Several of its proposals were rejected
after review; one example is a `postinstall` hook to run `prisma generate`,
which would have made `npm install` fail on a clean clone because the Prisma
config reads an environment variable that does not exist yet at that point.

Verification was treated as the assistant's main contribution rather than
code generation. Three defects that type checking and tests did not catch
were found this way: the public list page being pre-rendered at build time
so new events would never appear; a `loading.tsx` file causing `notFound()`
to answer `200` instead of `404`; and unreadable dark-on-dark text left over
from the scaffold's default stylesheet.

The developer understands and can explain every part of this codebase.

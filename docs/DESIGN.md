# Design

Technical reference for the implementation as it currently stands. Where the
implementation diverges from the original plan, this document describes the
code, not the plan; the reasoning behind those divergences is in
[DECISIONS.md](./DECISIONS.md).

---

## 1. System architecture

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
                          │  /api/uploads       (Node)    │──▶ public/uploads
                          └───────────────────────────────┘
```

### Two paths to the data

| Path | Used by | Why |
|---|---|---|
| Server Component → Prisma | public list, public detail, admin dashboard, edit form | Rendering already happens on the server; calling the app's own HTTP API from there would add a round trip and a second copy of the query |
| Browser → REST API → Prisma | every create, update and delete | Validation and authorisation belong in one place. A Server Action would also work, but an explicit REST surface is easier to inspect and test with `curl` |

### Runtime boundary

`src/middleware.ts` runs on the Edge Runtime, which has no Node crypto
modules. This constrains what it may import:

| Module | Contents | Runtime | Imported by |
|---|---|---|---|
| `src/lib/auth.ts` | `jose` sign and verify, `SESSION_COOKIE`, cookie lifetime | Edge-safe | middleware, auth routes |
| `src/lib/password.ts` | `bcryptjs` hash and compare | Node only | login route, seed script |
| `src/lib/prisma.ts` | `PrismaClient` with `PrismaPg` | Node only | Server Components, API routes, seed |
| `src/lib/api.ts` | error response helpers | Edge-safe | middleware, all API routes |
| `src/lib/validation.ts` | Zod schemas | both | form component, API routes |
| `src/lib/events.ts` | filters, pagination and event persistence | Node only | Server Components, event API routes |
| `src/lib/uploads.ts` | image signature and size rules | Node only | upload route, tests |

Splitting signing from hashing is what keeps the middleware buildable: a
single module holding both would pull `bcryptjs` into the Edge bundle and
fail the build. The production bundle was inspected to confirm the
middleware chunk contains no `bcrypt` reference.

---

## 2. Database schema

Defined in `prisma/schema.prisma`, migration `20260917065656_init`.

```prisma
model Admin {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}

model Event {
  id          String      @id @default(cuid())
  title       String
  description String
  date        DateTime
  location    String
  status      EventStatus @default(DRAFT)
  imageUrl    String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([status, date])
}
```

Notes on the choices encoded here:

- **`cuid()` over auto-increment.** Sequential integers let anyone walk the
  record space by changing a number in the URL.
- **`status` as a database enum**, not a free string. The requirement only
  said "status"; an enum makes the allowed values a property of the schema
  rather than a convention.
- **Composite index on `(status, date)`** matches the public list query,
  which filters on `status = PUBLISHED` and sorts by `date`.
- **Nullable `imageUrl`** keeps images optional. Values point to files under
  `/uploads`; the database stores no binary data.
- **No relation between `Admin` and `Event`.** Nothing in the requirements
  attributes an event to its author, and inventing the relation would add a
  column no screen displays.
- **`updatedAt`** is maintained by Prisma and is used during testing to
  confirm that an update actually reached the database.

---

## 3. API contract

Base path `/api`. All request and response bodies are JSON.

### Error shape

Every endpoint fails in the same shape:

```json
{ "error": { "message": "string", "field": "string (optional)" } }
```

`field` appears only when the failure belongs to one input, which lets the
admin form attach the message to the right control without parsing anything
endpoint-specific.

Database failures are logged on the server with `console.error` and reported
to the client as a generic `Something went wrong`; Prisma's messages can
disclose table structure and connection details.

### Events

**`GET /api/events`** — public

| Query | Effect |
|---|---|
| none | every event, `date` ascending; legacy array response |
| `?status=PUBLISHED` | filtered to that status |
| `?status=` (empty) | treated as no filter |
| `?status=ANYTHING_ELSE` | `400` with `field: "status"` |
| `?search=robotics` | case-insensitive title or description match |
| `?timeframe=upcoming` | events at or after the current time |
| `?timeframe=past` | events before the current time |
| `?page=2&pageSize=15` | paginated response with `total`, `page`, `pageSize`, and `totalPages` |

```
200 → [ { id, title, description, date, location, status, createdAt, updatedAt } ]
```

When `page` or `pageSize` is present, the response is
`{ events, total, page, pageSize, totalPages }`. The service layer clamps a
page beyond the upper bound to the final valid page and a page below one to
page one.

**`POST /api/events`** — admin only

```
201 → { id, title, ... }
400 → invalid JSON body:  { "error": { "message": "Invalid JSON body" } }
400 → validation failure: { "error": { "message": "...", "field": "title" } }
401 → no valid session (returned by the middleware)
500 → unexpected server error
```

**`GET /api/events/[id]`** — public

```
200 → { id, title, ... }
404 → { "error": { "message": "Event not found" } }
```

**`PUT /api/events/[id]`** — admin only

Body is a partial event; `eventUpdateSchema` is `eventSchema.partial()`, so
any subset of fields is accepted and each supplied field is validated with
the same rules as on create.

```
200 → updated record
400 → invalid JSON body or validation failure
401 → no valid session
404 → record does not exist (Prisma error P2025, translated)
```

**`DELETE /api/events/[id]`** — admin only

```
204 → no body
401 → no valid session
404 → record does not exist (Prisma error P2025, translated)
```

`PUT` and `DELETE` do not check for existence before acting. They let the
write fail and translate Prisma's `P2025` into `404`, which is one database
round trip instead of two and leaves no window in which the record can
disappear between the check and the write.

### Authentication

**`POST /api/auth/login`**

```
200 → { "username": "admin" }  + Set-Cookie: session=<jwt>
400 → invalid JSON body or validation failure
401 → { "error": { "message": "Invalid username or password" } }
```

The `401` message is identical for an unknown username and a wrong password,
and both branches are written as a single condition so the two cannot drift
apart.

Cookie attributes:

| Attribute | Value | Reason |
|---|---|---|
| `httpOnly` | true | JavaScript cannot read the token, limiting the impact of XSS |
| `secure` | true in production only | A `Secure` cookie is never sent over `http://localhost`, which would break local development |
| `sameSite` | `lax` | Mitigates CSRF while keeping normal top-level navigation working |
| `path` | `/` | Applies across the whole application |
| `maxAge` | 86400 | Matches the token's own 24-hour lifetime, so cookie and token expire together |

**`POST /api/auth/logout`** — clears the cookie by setting the same
attributes with `maxAge: 0`. Browsers match cookies on name, path and
domain, so a deletion that omits an attribute creates a second cookie
instead of removing the first.

**`GET /api/auth/me`** — returns `{ username }` for a valid session, or
`401`. Used to check a session without exposing the token itself.

Failed logins are limited to five attempts per client IP in a sliding
15-minute window. An unknown username is still compared against a fixed
bcrypt hash so it costs approximately the same as a wrong password. A
successful login clears that client's counter.

### Uploads

**`POST /api/uploads`** — admin only, multipart field `file`.

The route accepts JPEG, PNG and WebP up to 2 MB. It rejects unsupported
claimed MIME types early, then makes the final decision from magic bytes.
Client filenames are discarded; a random UUID and detected extension form
the stored filename under `public/uploads`.

```
201 → { "url": "/uploads/<uuid>.<ext>" }
400 → missing file, file too large, unsupported type or invalid signature
401 → no valid session
```

---

## 4. Request flows

### Public list

```
GET /  →  Server Component renders the shell immediately
       →  <Suspense> streams the event list
       →  src/lib/events.ts builds search/timeframe/status predicates and pagination
       →  prisma.event.findMany({ where, skip, take, orderBy: { date: asc } })
       →  empty result  → EmptyState
       →  query throws  → ErrorState, details logged server-side only
```

The page is marked `dynamic = "force-dynamic"`. Without it Next.js
pre-renders the route at build time and new events never appear.

### Admin mutation

```
Browser form submit
  → Zod validation on the already-converted values
  → fetch POST/PUT with the session cookie attached automatically
  → middleware verifies the JWT, else 401
  → route handler re-validates with the same schema
  → Prisma write
  → router.push('/admin/dashboard') + router.refresh()
```

Validation runs twice on purpose. The client copy gives immediate per-field
feedback; the server copy is the one that actually protects the database,
since anything can call the API directly.

### Session lifecycle

```
login    → bcrypt.compare → jose SignJWT (HS256, 24h, sub = admin id)
         → httpOnly cookie
request  → middleware reads the cookie → jwtVerify (algorithm pinned to HS256)
         → payload shape checked: sub and username must both be strings
logout   → cookie overwritten with maxAge 0
```

The payload check after verification matters: a valid signature proves the
token came from this application, not that its contents have the expected
shape.

---

## 5. Time zone handling

Event times are stored in UTC and presented in Asia/Jakarta (WIB) — the
audience's own time zone, and a zone with no daylight saving, so its offset
is constant at `+07:00`.

`src/lib/format.ts` owns all three conversions:

| Function | Direction | Notes |
|---|---|---|
| `formatEventDate` | `Date` → display string | `Intl.DateTimeFormat("en-GB")` with `timeZone: "Asia/Jakarta"` |
| `toDateTimeLocalValue` | `Date` → `datetime-local` value | Builds `YYYY-MM-DDTHH:mm` from `formatToParts`, with `hourCycle: "h23"` so midnight is `00`, never `24` |
| `fromDateTimeLocalValue` | form value → ISO string | Appends `+07:00` explicitly |

The last one is the important one. `new Date("2026-10-05T16:00")` interprets
a naive string as the *parsing machine's* local time, so it is only correct
while the admin's browser happens to sit at UTC+7. Appending the offset
makes the result identical from any time zone.

Verified end to end: an event entered as `16:00` is stored as
`09:00:00.000Z`, loads back into the edit form as `16:00`, and re-saving it
without edits leaves the stored value unchanged.

---

## 6. Validation rules

`src/lib/validation.ts`, shared by the admin form and the API.

| Field | Rule | Message |
|---|---|---|
| `title` | trimmed, 3–150 characters | `Title must be at least 3 characters` |
| `description` | trimmed, 10–5000 characters | `Description must be at least 10 characters` |
| `date` | string parseable as a date, transformed to `Date` | `Date must be a valid date` |
| `location` | trimmed, 3–200 characters | `Location must be at least 3 characters` |
| `status` | one of the four enum values | `Status must be one of DRAFT, PUBLISHED, CANCELLED, or COMPLETED` |
| `imageUrl` | optional local path, at most 500 characters | `Image URL must be at most 500 characters` |

`username` is trimmed; `password` is not, because leading or trailing spaces
can be a deliberate part of a password and trimming them would cause a login
failure with no visible cause.

`EVENT_STATUSES` is declared locally rather than imported from
`@prisma/client`, because this module is also imported by browser code and
pulling in the Prisma client would break the client bundle. A two-way
compile-time guard keeps the two lists in step: one assertion fails if a
value here is unknown to Prisma, the other fails if a Prisma value is
missing here. Both directions were confirmed by temporarily breaking them.

---

## 7. Testing

| Suite | Covers |
|---|---|
| `tests/validation.test.ts` | every rule above, trimming before length checks, missing and wrong-typed fields, `eventUpdateSchema` partial behaviour, login schema |
| `tests/auth.test.ts` | hashes differ from the plain password and from each other, correct and incorrect verification, sign/verify round trip, tampered token, token signed with a foreign secret, malformed token |
| `tests/format.test.ts` | display formatting, both conversion directions, round trip, a time that falls on a different day in UTC |
| `tests/events.test.ts` | query predicates, combined filters, URL preservation and pagination boundaries |
| `tests/rate-limit.test.ts` | sliding-window limit, recovery, reset and client-IP selection |
| `tests/uploads.test.ts` | JPEG/PNG/WebP signature detection, spoof rejection and image URL validation |

`vitest.config.mts` injects its own `JWT_SECRET` so the suite does not
depend on a `.env` file, which CI does not have.

Automated tests do not cover the route handlers or React components. That gap
is covered by the manual regression and Phase 2 scenario checklists against a
live production server, including at a 375 pixel viewport. The security review
and evidence are recorded in [SECURITY.md](./SECURITY.md).

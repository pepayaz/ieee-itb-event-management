# Security Architecture & OWASP Top 10 Audit

This document details the security posture, defensive controls, OWASP Top 10 (2021)
evaluation, and empirical verification results for the IEEE ITB SB Event Management
application.

---

## 1. Security Philosophy & Threat Model

The application serves two distinct roles:
1. **Public Visitors**: Unauthenticated browsing of published events (`/`, `/events/[id]`, `GET /api/events`).
2. **Administrator**: Privileged management of event lifecycles (`/admin/*`, `POST/PUT/DELETE /api/events*`).

### Threat Boundaries
- The public network can access public read routes.
- Mutations (`POST`, `PUT`, `PATCH`, `DELETE`) and admin interfaces are strictly protected at the edge by `src/middleware.ts`.
- Database credentials and session signing secrets are isolated to Node.js server environments and are never bundled into client assets.

---

## 2. OWASP Top 10 (2021) Audit Matrix

| Category | Application Risk | Mitigations in Place | Verification Evidence | Residual Risk & Rationale |
|---|---|---|---|---|
| **A01: Broken Access Control** | Unauthorized mutation of events; access to draft events; viewing admin dashboards without a session. | Edge middleware intercepts `/admin/*` and mutative HTTP methods on `/api/events*`. Public detail page explicitly calls `notFound()` if `status !== "PUBLISHED"`. | `tests/auth.test.ts` passes 8/8 tests. Direct HTTP tests confirm `POST /api/events` without cookie returns 401; `/admin/dashboard` returns 307 to `/admin/login`. Direct URL access to draft event returns 404. | Mitigated. No unauthenticated mutation paths exist. |
| **A02: Cryptographic Failures** | Credential leakage; weak session tokens; transit snooping. | Password hashed with `bcryptjs` (salt rounds 10). Session tokens signed via `jose` using HS256 and minimum 32-character secret. Cookie flags: `HttpOnly`, `SameSite=lax`, and `Secure` in production. Database connections enforce TLS (`sslmode=require`). | Tested with `tests/auth.test.ts`. Browser inspect shows `document.cookie` cannot access `session`. DB connection string verified to enforce TLS. | Mitigated for web scope. Secret rotation requires redeployment (accepted for single-admin design). |
| **A03: Injection** | SQL injection via event attributes or query parameters; Cross-Site Scripting (XSS) via rendered content. | All database access uses Prisma ORM with parameterized queries. Zero raw SQL calls. React JSX escapes interpolated strings by default. Zero `dangerouslySetInnerHTML` usage. | Codebase scan: `rg "queryRaw|executeRaw|dangerouslySetInnerHTML" src/` returned 0 matches. Input validation schemas enforce strict lengths. | Mitigated. |
| **A04: Insecure Design** | Brute force guessing of admin credentials; unbounded payloads causing resource exhaustion; accidental deletions. | In-memory sliding window rate limiter (max 5 failed attempts per 15 minutes). Zod schemas enforce strict bounds on all strings (e.g. title max 150, description max 5000). Delete operation requires explicit modal confirmation dialog (`<dialog>` with `showModal()`). | Rate limiter blocked 6th attempt with HTTP 429 and `Retry-After`. Destructive delete verified with interactive modal. | In-memory rate limiting resets on process restart; acceptable for single-instance, production recommends Redis. |
| **A05: Security Misconfiguration** | Missing defensive HTTP headers; verbose server error stack traces leaked to clients; client bundle leaking secrets. | HTTP security headers configured in `next.config.ts`. Generic error responses (`{"error":{"message":"Something went wrong"}}`) for 500 exceptions. Production bundle contains no env keys. | Verified via `curl -I http://localhost:3000`. Bundle scan of `.next/static/` for `JWT_SECRET`, `DATABASE_URL`, `passwordHash` returned 0 matches. | CSP allows `'unsafe-inline'` for scripts/styles due to Next.js hydration constraints; documented in Section 3. |
| **A06: Vulnerable and Outdated Components** | Exploits in third-party dependencies. | `npm audit` tracked. Automated CI runs dependency linting and build checks on pull requests. | `npm audit --json` identified 4 high-severity advisories exclusively in transitive dependencies of `prisma` CLI in `devDependencies` (`mysql2`, `deepmerge-ts`). | Accepted residual risk: `mysql2` is unused (app runs on PostgreSQL) and `prisma` CLI is not shipped in production runtime. |
| **A07: Identification and Authentication Failures** | Credential stuffing; timing oracle on username enumeration; session fixation. | Constant-time password verification using dummy bcrypt hash on unknown usernames. Neutral 401 error message. Sliding window rate limiting. Session cookie invalidated with `Max-Age=0` on logout. | Timing benchmark over 20 runs: median 331.79 ms (non-existent) vs 338.56 ms (wrong password) — delta is only 6.77 ms (within network noise). Attempt 6 returns 429. | Mitigated. |
| **A08: Software and Data Integrity Failures** | Tampered packages; unverified builds; deployment discrepancies. | `package-lock.json` committed. CI pipeline (`.github/workflows/ci.yml`) runs `npm ci`, `prisma generate`, `lint`, `vitest`, and `next build` on clean container. | Verified: commit `2086bfa` and `36ebf4d` run green on GitHub Actions. | Mitigated. |
| **A09: Security Logging and Monitoring Failures** | Silent breaches; credential leakage in server logs. | Internal server errors logged to `console.error` with error context, but without sensitive user passwords or tokens. Failed attempts tracked in rate limit store. | Tested server exceptions: client receives clean JSON 500 error while server console logs stack trace without password payloads. | Advanced SIEM/centralized telemetry not configured (out of scope for local evaluation). |
| **A10: Server-Side Request Forgery (SSRF)** | Server making unauthorized outbound requests based on user input. | Application makes zero external HTTP requests based on user input. Only outbound traffic is direct DB connection to Neon PostgreSQL via static environment variable. | Architectural review confirms no `fetch()` or `http.request()` accepts user-controlled URLs. | Not applicable / Mitigated by design. |

---

## 3. Deep Dive: Content-Security-Policy (CSP) Design Decisions

Next.js App Router applications inject inline bootstrap and hydration scripts, as well as dynamic streaming chunks. Configuring a strict CSP with cryptographically random nonces in App Router requires:
1. Dynamic generation of nonces in `middleware.ts`.
2. Passing the nonce through request headers to the root layout.
3. Reading `headers()` in the root Server Component, which automatically opts all static and cached routes out of SSG/ISR, forcing dynamic rendering across the entire application.

### Adopted Approach
To preserve Next.js performance optimizations and prevent hydration breakages, the baseline CSP is declared in `next.config.ts`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

### Protection Enforced:
- **`frame-ancestors 'none'`**: Completely prevents clickjacking by forbidding embedding inside `<frame>`, `<iframe>`, `<embed>`, or `<applet>`.
- **`base-uri 'self'`**: Prevents `<base>` tag injection attacks that alter relative URL resolution.
- **`form-action 'self'`**: Ensures forms can only submit to the app's own origin.
- **`object-src 'none'`**: Prohibits legacy plugins (Flash, Java).
- **`default-src 'self'`**: Constrains all unclassified resources to the origin.

### Documented Limitation:
Because `'unsafe-inline'` is retained for `script-src` and `style-src` to support Next.js runtime hydration and Tailwind CSS, script execution is not strictly nonced. React's default context-aware string escaping provides the primary XSS barrier.

---

## 4. Empirical Verification Evidence

All tests below were actively executed against the application running in production and development configurations.

### 4.1 Security Headers Verification (`next start`)
Command:
```bash
curl.exe -I http://localhost:3000
```
Verified Response:
```http
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

### 4.2 Leak Detection Verification
1. **Raw SQL and Dangerous HTML Checks**:
   Command:
   ```bash
   rg "queryRaw|executeRaw|dangerouslySetInnerHTML" src/
   ```
   Result: **0 matches** found.

2. **Client Static Bundle Secret Scan**:
   Command:
   ```bash
   Get-ChildItem -Path .next\static -Recurse -File | Select-String -Pattern "JWT_SECRET|DATABASE_URL|passwordHash"
   ```
   Result: **0 matches** found (exit code 0, no secrets embedded in browser JS).

### 4.3 Rate Limiting Verification (`POST /api/auth/login`)
Sequential failed requests from identical IP (`192.168.1.100`):
- Attempt 1: HTTP 401 (`Invalid username or password`)
- Attempt 2: HTTP 401 (`Invalid username or password`)
- Attempt 3: HTTP 401 (`Invalid username or password`)
- Attempt 4: HTTP 401 (`Invalid username or password`)
- Attempt 5: HTTP 401 (`Invalid username or password`)
- Attempt 6: HTTP 429 (`Too many login attempts. Please try again later.`), `Retry-After: 888`
- Subsequent successful login resets failed attempt counter back to 0.

### 4.4 Timing Attack Mitigation Benchmark
20 samples collected for non-existent users vs 20 samples for valid users with incorrect password:
- Non-existent username median latency: **331.79 ms**
- Existing username with incorrect password median latency: **338.56 ms**
- Measured delta: **6.77 ms** (statistically negligible, accounting for TLS/network fluctuation).
- Root cause of balance: Execution of `verifyPassword(password, DUMMY_PASSWORD_HASH)` on unknown user branch ensures identical CPU work factor (bcrypt salt rounds 10).

### 4.5 Strict ISO 8601 Date Parsing
Verified via Vitest suite (`tests/validation.test.ts`):
- `"42"`: Rejected (`Date must be a valid date`)
- `"tomorrow"`: Rejected (`Date must be a valid date`)
- `"2026-13-45T00:00:00Z"`: Rejected (`Date must be a valid date`)
- `"2026-10-05T16:00"` (naive local): Accepted
- `"2026-10-05T16:00:00+07:00"` (offset ISO): Accepted
- `"2026-10-05T09:00:00.000Z"` (UTC ISO): Accepted

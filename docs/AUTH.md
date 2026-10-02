# Administrator authentication

PowerPlugPicks uses Better Auth with its supported Drizzle SQLite adapter against Cloudflare D1. Password hashing, session cookies, reset tokens, authenticator codes, and recovery codes are handled by the library. Authentication tables are in `migrations/0002_auth.sql`; `0003_auth_admin.sql` adds the library's administrative-account fields. D1 does not support interactive transactions; the adapter explicitly disables them, while app operations use atomic statements and D1 batches.

## Local first owner

1. Run `npm run setup`. This creates `.dev.vars` with random secrets and preserves an existing file.
2. Run `npm run db:migrate` and `npm run db:seed`, then `npm run dev`.
3. Open `/admin/setup`. Enter your real name, email, a unique password of at least 12 characters, and the `BOOTSTRAP_TOKEN` stored in `.dev.vars`.
4. Sign in at `/admin/login`. Open **Account security** at `/admin/security` and choose **Set up authenticator**. Enter your current password, add the displayed setup key to an authenticator, and verify one generated code.
5. Download the recovery codes and store them securely. Each code works once.

The owner-creation endpoint checks the configured setup token with Node's constant-time comparison, requires the correct Origin, and atomically claims a singleton D1 row only when no user exists. Duplicate and concurrent setup attempts cannot create another owner. The public Better Auth signup route is always closed. The setup token does not bypass login or replace an existing owner. Remove `BOOTSTRAP_TOKEN` from the deployed worker after successful setup.

If a database failure leaves an unfinished bootstrap claim with no users, inspect the database before removing that claim and retrying. If a user was partially created, reconcile that specific account and credential record with a database backup; do not reopen setup on a populated database. The application deliberately fails closed.

## Production configuration

Configure `DB` as a D1 binding, apply migrations remotely, and set secrets with `wrangler secret put BETTER_AUTH_SECRET` and `wrangler secret put BOOTSTRAP_TOKEN`. Generate separate random values with a password manager or `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Set `APP_ENV=production`, `SITE_URL`, and `BETTER_AUTH_URL` to the same HTTPS origin. Never deploy local secrets.

The auth secret must be at least 32 characters. Production rejects insecure auth origins and obvious development secrets. Cookies are HttpOnly, SameSite=Lax, and Secure under HTTPS. Authentication responses are private and not cached. Sessions last twelve hours, refresh every thirty minutes, and security actions require a recently created session where the library applies that check.

## Roles and server enforcement

Roles are OWNER, ADMIN, EDITOR, AUTHOR, and ANALYST. User role and active state cannot be changed through a public profile payload. `getSession()` reads the current user state from D1 on every call. Cookie caching is disabled, so revocation, suspension, and role changes apply promptly.

- `requireUser(roles?)` protects APIs. It checks authentication and an optional allowed-role list, and requires TOTP enrollment for OWNER and ADMIN.
- `requireUser(roles, { allowUnenrolled: true })` is only for safe reads or account enrollment.
- `requirePageUser(roles?)` protects pages and permits the new owner to reach enrollment.
- `assertSameOrigin(request)` protects application mutations; Better Auth protects its own endpoints.
- `authorize(user, roles, createdBy)` also checks AUTHOR ownership when supplied.

Account management, including owner transfer, must independently enforce the permission matrix. These helpers do not make an unchecked endpoint safe.

## Recovery and sessions

At sign-in, an account with 2FA enabled receives a challenge; the library does not issue a usable session until that challenge succeeds. Choose **Use a recovery code** when your authenticator is unavailable. Generate replacement recovery codes in **Account security** after recovery; older codes stop working. The UI does not offer a switch that removes owner/admin 2FA.

**Account security** also changes your password, lists your active devices, ends individual sessions, and signs out other devices. Password changes request revocation of other sessions. Successful bootstrap, profile, password, 2FA, and session-management operations record redacted audit events.

Password reset becomes available when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Better Auth creates a single-use reset link lasting thirty minutes, and the application queues it in the durable outbox for the configured delivery job. The reset response does not reveal account existence. Password reset revokes existing sessions. With delivery disabled, the sign-in screen shows that email recovery is unavailable. Delivery requires a verified sender and the scheduler/outbox worker; configuring a key alone does not verify an email domain.

Login, reset, and 2FA endpoints use Better Auth's D1-backed rate limiter. Cloudflare's `cf-connecting-ip` is the trusted client IP in production. Do not expose the production origin through an untrusted proxy that can spoof that header.

## Invite a colleague

An enrolled owner may invite ADMIN, EDITOR, AUTHOR, or ANALYST accounts. An enrolled admin may invite EDITOR, AUTHOR, or ANALYST accounts. Creating an OWNER through invitations is prohibited. The invitation helper rechecks the caller's current database-backed session and permissions.

The helper uses Better Auth's supported `admin.createUser` API to create an identity with no password. It then asks Better Auth to generate a password-reset token. The invitee opens `/admin/accept-invite` through that link and chooses their own password; the library creates the initial credential. Tokens last thirty minutes, are hashed in the verification table, and are consumed once. Public signup and all library `/api/auth/admin/*` HTTP endpoints remain closed; account operations must use the application's protected, audited APIs.

With email delivery configured, invitations are queued in the private outbox. Otherwise the administrator receives a manual invitation link and shares it privately. It is a credential and must not be copied into logs, public documents, analytics, or screenshots. An expired pending invitation can be generated again for the same email and role. An existing account with a password cannot be reset through the invitation helper. Suspension prevents sign-in even if an invitation link is redeemed.

Verification-table identifiers are hashed by the auth library. Queued email payloads contain the actual link so they can be delivered; restrict outbox access and purge sensitive payloads after delivery or expiry.

## Verification boundaries

Installed Better Auth schema and TypeScript interfaces were inspected during implementation. Automated local flow results and any unverified production email or deployment prerequisites are recorded in `docs/BUILD_STATUS.md`. No external email account, Cloudflare deployment, or domain is implied to have been verified.

References: [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [two-factor authentication](https://better-auth.com/docs/plugins/2fa), [sessions](https://better-auth.com/docs/concepts/session-management), and [rate limiting](https://better-auth.com/docs/concepts/rate-limit).

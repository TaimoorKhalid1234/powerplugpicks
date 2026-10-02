# Security and operations

## Access and data boundaries

Better Auth stores credentials and sessions in D1. Public registration is closed; the first owner uses a one-time token, later users use private invitations. Owners/admins must enroll an authenticator before admin writes. Each request reloads role and suspension state from D1. Route handlers check identity, role, record ownership, input, and same-origin requests. Audit records cover content, settings, users, and security actions. Authenticated responses and previews use private/no-store headers and noindex directives.

Public queries select only `PUBLISHED` and non-demo records, following the live revision pointer. Content passes a structured document schema; raw HTML, scripts, executable links, and remote inline images are rejected. R2 media is private until explicitly approved and is served through `/api/media/[id]` with access checks. Image upload verifies PNG/JPEG/WebP bytes, requires permission/alt data, and rejects SVG. Product cards do not infer prices, availability, certifications, or test results.

## Jobs and email

The separate scheduler Worker calls the main Worker every five minutes using `CRON_SECRET`. D1 records keep work keys, status, attempts, scheduled time, and a lease; publication is idempotent. Failed jobs appear in **System & activity** and can be retried by an authorized admin. Outbox messages retry with a stable provider idempotency key. Delivery is inactive until an email provider and verified sender are configured. Password-reset and invitation links are purged from the outbox after delivery or expiry.

Analytics records only approved page-view or affiliate-click event types after the visitor accepts analytics. It stores page path and minimal content IDs, not full IPs or user fingerprints. Local event counts are observations, not unique visitors, orders, or revenue. Raw events expire after 90 days. A failed analytics event never blocks an Amazon anchor.

## Operational checklist

- Restrict Cloudflare account, D1, R2, and backup access. Rotate credentials when needed.
- Monitor Worker errors, job failures, auth rate limits, and email provider responses without logging tokens, private drafts, or contact messages.
- Configure D1 and R2 backups; test a restore in isolation. Cloudflare D1 Time Travel retention depends on the plan. An editorial export is only a content portability aid.
- Review privacy text and retention after enabling analytics or email.
- Apply migrations before a compatible Worker deployment; test staging and plan rollback around schema changes.
- Recheck Amazon Associates and Google rules before enabling any optional catalog content or claims of rich-result eligibility.

## Current limits

Cloudflare remote resources, custom domain, email sender, Amazon account/tag, and backup jobs are not configured in this repository. The optional Amazon Creators API adapter is not enabled; the site uses manual direct Amazon links. Newsletter delivery stays disabled until a consent and delivery workflow is configured and tested. There is no live provider verification or production monitoring evidence yet. See [build status](BUILD_STATUS.md) for current checks.

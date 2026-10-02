# PowerPlugPicks build status

## Implementation

The owner requested Cloudflare hosting and Cloudflare's database after providing the original brief. The app therefore uses Next.js on Cloudflare Workers through OpenNext, Cloudflare D1 for content and accounts, and Cloudflare R2 for owned media. Versioned SQL migrations, a separate scheduled Worker, and local Wrangler persistence are included.

The public site has a homepage, article templates, category/type/author/tag archives, search, contact form, RSS, robots, sitemap, and policy-page routing. The editorial workspace includes structured articles, products, pages, revisions, private previews, review/publish/schedule workflows, media, settings, analytics, SEO findings, contacts, users, and system activity. First-owner setup, two-factor authentication, scoped roles, invitations, recovery codes, and password reset are implemented. Published revisions remain separate from drafts.

The site starts without published articles or recommendations. Editors must add real sources, products, author biographies, policy text, and publication settings. Newsletter delivery and Amazon catalog API syncing are disabled until an external provider/account is configured and verified.

For design review, the current local D1 has five removable demo articles and five fictional product records. They are labelled as samples and have no purchase links. See [demo content](DEMO_CONTENT.md). A fresh remote database does not receive them.

## Verification on local development resources

- TypeScript typecheck and Next.js production build passed.
- Unit tests: 16 passed.
- Local auth checks passed for owner bootstrap, sign-in with TOTP, invitation and password reset token use, role restrictions, sign-out, and session revocation.
- Local editorial checks passed for draft save, revision conflict, preview, publication, public/draft separation, slug redirect, and unpublish.
- Local scheduled publication passed: a future revision stayed private, the first due job published it, and a duplicate invocation did no extra work.
- Local R2 media checks passed: an SVG with active content was rejected, private media stayed private, approval made it public, and deletion removed access.
- Public article and key admin pages passed browser checks at 360–1440 px, with no horizontal overflow or axe WCAG 2 A/AA and 2.1 AA violations. The article/admin report is in ignored `artifacts/ui/report.json`.
- OpenNext packaging and local Cloudflare Worker preview were exercised on Windows with local D1/R2 bindings. OpenNext warns that Windows support is limited; use Linux or WSL in CI.

These checks use local development data. They do not prove remote D1/R2, email delivery, the production domain, scheduled Cron execution, backups, or live indexing.

## Before launch

Provision the Cloudflare account resources, replace the placeholder D1 UUID, set a real HTTPS origin and secrets, apply remote migrations, deploy both Workers, and test live scheduling and email if enabled. Create the real owner, review the starter policy drafts, set the contact identity and affiliate tag, and publish sourced content. Verify backups and restore, then enable indexing. See [deployment](DEPLOYMENT.md), [owner guide](OWNER_GUIDE.md), and [SEO checklist](SEO_CHECKLIST.md).

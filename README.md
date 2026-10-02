# PowerPlugPicks

PowerPlugPicks is an editorial website for power accessories, with a database-backed publishing studio. It supports guides, reviews, comparisons, products, categories, media, author profiles, drafts, previews, scheduling, affiliate links, search, SEO, and first-party analytics. The public site starts with honest empty states. Real recommendations must be researched and approved before publication.

The owner selected **Cloudflare Workers + D1 + R2**. This supersedes the original brief's PostgreSQL/Prisma/Docker plan. The app uses Next.js 16.3.8, OpenNext Cloudflare 1.20.7, Wrangler 4.145.0, Better Auth 1.7.6, D1 migrations, TypeScript, Tailwind, and Tiptap. The package lockfile pins the resolved dependency tree.

The current local development database also has removable [demo articles and products](docs/DEMO_CONTENT.md) so the full reader design can be explored. These samples are not part of the remote deployment seed.

## Run locally

Requires Node.js 22 or later. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

```sh
npm ci
npm run setup
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. `setup` creates `.dev.vars` with random local secrets and does not overwrite an existing file. Wrangler stores D1 and R2 development data under `.wrangler/`; both `.dev.vars` and `.wrangler/` are ignored by Git. Open `/admin/setup` to create the first owner using the one-time `BOOTSTRAP_TOKEN` in `.dev.vars`, then set up an authenticator at **Account security**. See [authentication guide](docs/AUTH.md) and [owner guide](docs/OWNER_GUIDE.md).

To inspect the packaged Worker locally:

```sh
npm run cf:build
npm run cf:preview
```

OpenNext warns that its Windows support is limited. The standard Next.js build and Cloudflare packaging both completed locally on Windows in this project; use Linux or WSL for deployment CI. `cf:preview` uses local D1/R2 bindings.

## Checks

```sh
npm run typecheck
npm run lint
npm run test
npm run build
npm run cf:build
```

`LOCAL_QA=1 npm run verify:local`, `verify:invites`, and `verify:jobs-media` are opt-in integration checks. They create temporary local accounts/content and keep test credentials in ignored `artifacts/` files. Use only on an isolated local D1 database. `verify:ui` publishes a temporary local article for browser checks, then unpublishes it. Do not run these scripts against production.

## How the application is organized

| Location | Purpose |
| --- | --- |
| `src/app/(public)` | Server-rendered reader pages and archives |
| `src/app/admin` | Login, security, and editorial studio |
| `src/app/api` | Server-validated APIs and job endpoint |
| `src/lib/server` | D1 queries, auth, publishing, media, analytics, jobs |
| `src/components/content` | Safe shared article renderer |
| `src/lib/validation.ts` | Structured document and settings validation |
| `migrations` | Versioned D1 migrations |
| `scripts/seed.sql` | Idempotent starting categories and settings |
| `workers/scheduler.ts` | Separate Cloudflare Cron Trigger Worker |
| `docs` | Owner, deployment, SEO, security, and build-status guides |

Public data is read dynamically from D1. Draft revisions have no public route; the live pointer determines the rendered body and metadata. Authenticated and preview responses are private. Static Next.js assets use long cache lifetimes. Publishing updates the live revision and search index in a D1 batch, creates redirects for old paths, and changes the live timestamp. Manual Amazon links remain direct anchors; no Amazon API account is needed for the CMS.

## Launch

See [Cloudflare deployment](docs/DEPLOYMENT.md), [SEO checklist](docs/SEO_CHECKLIST.md), and [current build status](docs/BUILD_STATUS.md). Domain ownership, real editorial content, verified contact identity, Cloudflare production resources, Amazon Associates tag, and production indexing require owner action. No remote deployment has been performed.

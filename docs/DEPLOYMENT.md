# Cloudflare deployment guide

The application targets a Cloudflare **Worker** packaged with OpenNext. It uses a D1 binding named `DB`, an R2 binding named `MEDIA`, and a second Worker for scheduled jobs. It is not a static site export. Deploy only after staging checks and the owner's editorial review.

## 1. Provision resources

Sign in to the intended Cloudflare account with Wrangler. Create a D1 database and R2 bucket under that account:

```sh
npx wrangler login
npx wrangler d1 create powerplugpicks
npx wrangler r2 bucket create powerplugpicks-media
```

Copy the D1 database UUID into `wrangler.jsonc` under `d1_databases[0].database_id`, replacing the all-zero local placeholder. Set `r2_buckets[0].bucket_name` to the bucket you created. Keep the binding names `DB` and `MEDIA`. Create separate staging resources if you intend to test migrations and publishing away from production. These commands create remote Cloudflare resources; they have not been run for this project.

## 2. Configure the host and secrets

Set `APP_ENV` to `staging` for a staging Worker or `production` for the final Worker. Set `SITE_URL` and `BETTER_AUTH_URL` to the same final HTTPS origin in `wrangler.jsonc`. Leave `ENABLE_INDEXING` false until the owner has reviewed the live deployment. Configure any custom domain, TLS, and a www-to-canonical redirect in Cloudflare. Use the actual domain; the planned domain in the brief is not proof that it is owned.

Generate strong, distinct random values for `BETTER_AUTH_SECRET`, `BOOTSTRAP_TOKEN`, and `CRON_SECRET` in a password manager. Add them to the **main** Worker with Wrangler secrets, not to the repository:

```sh
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BOOTSTRAP_TOKEN
npx wrangler secret put CRON_SECRET
```

If you enable outbound email, verify the sender domain with the chosen provider, then add `RESEND_API_KEY` and `EMAIL_FROM`. Cloudflare's `secret put` may deploy a new Worker version immediately; plan secret changes as deployment operations. Do not upload `.dev.vars`. Production startup rejects insecure origins, short auth secrets, and obvious example secrets.

## 3. Apply migrations and seed

Review the committed SQL migrations before applying them. Apply them to the remote D1 database, then insert idempotent starting categories and settings:

```sh
npm ci
npm run db:migrate:remote
npx wrangler d1 execute DB --remote --file=./scripts/seed.sql
```

Migrations `0001` through `0004` contain the content, auth, account-management, and live timestamp schema. Re-running the seed does not overwrite owner edits. Database migrations require compatibility planning: a Worker rollback does not automatically reverse a D1 schema migration.

## 4. Package and deploy

```sh
npm run typecheck
npm run lint
npm run test
npm run cf:build
npm run cf:deploy
```

Use Linux CI or WSL for the OpenNext build; its own documentation warns that Windows support is limited. The project did complete an OpenNext build and local Worker preview on Windows, but those checks do not verify a Cloudflare account or remote host. Test the deployed public pages and login before enabling indexing.

Deploy the scheduler Worker from `wrangler.scheduler.jsonc` after updating its `SITE_URL` to the final HTTPS origin. Add the *same* `CRON_SECRET` to that Worker. It has a service binding to the main Worker and a five-minute Cron Trigger:

```sh
npx wrangler secret put CRON_SECRET --config wrangler.scheduler.jsonc
npx wrangler deploy --config wrangler.scheduler.jsonc
```

Check that scheduled publishing, outbox delivery, event retention, and the **System & activity** page work after deployment. If scheduling is enabled but no scheduler is deployed, approved scheduled revisions will remain pending.

## 5. Owner setup and launch

Open `/admin/setup` on the deployed host, create the first owner with the configured bootstrap token and a strong password, and enroll two-factor authentication at **Account security**. Remove the remote bootstrap token after setup. In **Settings**, enter the actual contact destination, affiliate tag, timezone, and site description. Review and publish real informational pages and at least one sourced article. Check canonical URLs, internal links, direct Amazon links, disclosures, preview protection, sitemap, RSS, robots, and mobile layouts. Only then set `APP_ENV=production` and `ENABLE_INDEXING=true`, rebuild/deploy, and submit the sitemap in Search Console.

## Backups, restore, and rollback

D1 has [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) within the plan's retention window. Record an actual restore drill before treating it as a tested backup. Export D1 snapshots to separate storage for retention beyond that window; configure independent R2 object backups/versioning for media. Editorial JSON export from the admin is not a database backup. Protect backup access and test restoration into an isolated database/bucket.

For an application rollback, redeploy a previously known-good Worker version that is compatible with the current D1 schema. Avoid destructive schema migrations until an older compatible Worker has been retired. For a failed data migration, use an approved D1 Time Travel bookmark or tested backup restore procedure; expect writes after that bookmark to be lost or reconciled. No remote backup, restore, or rollback has been tested yet.

Official references: [OpenNext Cloudflare deployment](https://opennext.js.org/cloudflare/get-started), [D1 Wrangler migrations](https://developers.cloudflare.com/d1/wrangler-commands/), [R2 Worker binding](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/), [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

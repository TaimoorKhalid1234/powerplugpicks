interface CloudflareEnv {
  DB: import("@cloudflare/workers-types").D1Database;
  MEDIA: import("@cloudflare/workers-types").R2Bucket;
  ASSETS: import("@cloudflare/workers-types").Fetcher;
  APP_ENV: string;
  SITE_URL: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  BOOTSTRAP_TOKEN?: string;
  CRON_SECRET?: string;
  ENABLE_INDEXING: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

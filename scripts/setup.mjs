import { randomBytes } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), ".dev.vars");
try {
  await access(path);
  console.log(".dev.vars already exists. Existing secrets were preserved.");
} catch {
  const secret = () => randomBytes(48).toString("base64url");
  await writeFile(path, [
    "# LOCAL development only. Never commit this file or reuse these values in production.",
    "APP_ENV=development",
    "SITE_URL=http://localhost:3000",
    "BETTER_AUTH_URL=http://localhost:3000",
    `BETTER_AUTH_SECRET=${secret()}`,
    `BOOTSTRAP_TOKEN=${secret()}`,
    `CRON_SECRET=${secret()}`,
    "ENABLE_INDEXING=false",
    "",
  ].join("\n"), { flag: "wx", mode: 0o600 });
  console.log("Created .dev.vars with unique local authentication, owner setup, and job secrets.");
}
console.log("Next: npm run db:migrate, npm run db:seed, npm run dev.");
console.log("Open http://localhost:3000/admin/setup and use BOOTSTRAP_TOKEN from .dev.vars.");
console.log("After creating your owner account, sign in and open Account security to enable two-factor authentication.");

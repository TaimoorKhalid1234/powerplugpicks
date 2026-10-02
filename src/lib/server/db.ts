import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as CloudflareEnv;
}

export async function getDB(): Promise<D1Database> {
  const env = await getEnv();
  if (!env.DB) throw new Error("Cloudflare D1 is not configured. Bind DB and apply the migrations.");
  return env.DB;
}

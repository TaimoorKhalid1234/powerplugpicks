import { getDB, getEnv } from "@/lib/server/db";
import { SetupForm } from "@/components/auth/SetupForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Owner setup | PowerPlugPicks", robots: { index: false, follow: false } };
export default async function SetupPage() {
  const [db, env] = await Promise.all([getDB(), getEnv()]);
  const existing = await db.prepare("SELECT id FROM user LIMIT 1").first();
  return <main className="auth-page"><SetupForm available={!existing && Boolean(env.BOOTSTRAP_TOKEN && env.BOOTSTRAP_TOKEN.length >= 32)} /></main>;
}

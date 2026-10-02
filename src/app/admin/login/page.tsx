import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { getEnv } from "@/lib/server/db";
import { LoginForm } from "@/components/auth/LoginForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in | PowerPlugPicks", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const [params, env, session] = await Promise.all([searchParams, getEnv(), getSession()]);
  if (session && !params.token) redirect("/admin");
  return <main className="auth-page"><LoginForm emailConfigured={Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)} resetToken={params.token} resetError={params.error} /></main>;
}

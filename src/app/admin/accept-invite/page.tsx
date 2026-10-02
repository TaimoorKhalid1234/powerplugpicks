import { LoginForm } from "@/components/auth/LoginForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Accept invitation | PowerPlugPicks", robots: { index: false, follow: false } };
export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><LoginForm emailConfigured={false} resetToken={params.token} resetError={params.error || (!params.token ? "INVALID_TOKEN" : undefined)} invitation /></main>;
}

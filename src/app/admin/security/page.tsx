import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { SecurityPanel } from "@/components/auth/SecurityPanel";
import s from "./security.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account security | PowerPlugPicks", robots: { index: false, follow: false } };

export default async function SecurityPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return <main className={s.page}>
    <Link href="/admin" className={s.back}>← Back to studio</Link>
    <div className={s.heading}>
      <span className={s.eyebrow}>YOUR ACCOUNT</span>
      <h1>Account security</h1>
      <p>Secure your account, manage recovery codes, and review your sessions.</p>
    </div>
    <SecurityPanel enabled={session.user.twoFactorEnabled} currentSessionId={session.session.id} />
  </main>;
}

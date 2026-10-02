import type { ReactNode } from "react";
import { requirePageUser } from "@/lib/server/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editorial studio · PowerPlugPicks", robots: { index: false, follow: false } };

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}

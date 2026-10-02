import { Overview } from "@/components/admin/Overview";
import { requirePageUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";
export default async function AdminOverviewPage() { const user = await requirePageUser(); if (user.role === "ANALYST") redirect("/admin/analytics"); return <Overview />; }

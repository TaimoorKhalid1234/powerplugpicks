import { notFound } from "next/navigation";
import { AdminSection } from "@/components/admin/AdminSection";
const sections = ["articles", "products", "categories", "tags", "authors", "media", "pages", "navigation", "homepage", "affiliate", "seo", "analytics", "contacts", "users", "settings", "system", "help"];
export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; if (!sections.includes(section)) notFound(); return <AdminSection section={section} />; }

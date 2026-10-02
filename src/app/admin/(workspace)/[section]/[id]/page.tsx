import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import type { ContentKind } from "@/lib/types";
import { requirePageUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/content";
export default async function ContentEditorPage({ params }: { params: Promise<{ section: string; id: string }> }) { const { section, id } = await params; const kinds: Record<string, ContentKind> = { articles: "article", products: "product", pages: "page" }; if (!kinds[section]) notFound(); const user = await requirePageUser(); const settings = await getSettings(); return <ContentEditor id={id} kind={kinds[section]} role={user.role} timezone={settings.timezone} />; }

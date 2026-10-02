"use client";
import { ContentList } from "./ContentList";
import { TaxonomyManager } from "./TaxonomyManager";
import { SettingsManager } from "./SettingsManager";
import { MediaManager } from "./MediaManager";
import { Analytics, Contacts, Help, SeoManager, SystemManager, UsersManager } from "./Operations";

export function AdminSection({ section }: { section: string }) {
  switch (section) {
    case "articles": return <ContentList kind="article" />;
    case "products": return <ContentList kind="product" />;
    case "pages": return <ContentList kind="page" />;
    case "categories": case "tags": case "authors": return <TaxonomyManager section={section} />;
    case "settings": case "navigation": case "homepage": case "affiliate": return <SettingsManager section={section} />;
    case "media": return <MediaManager />;
    case "analytics": return <Analytics />;
    case "seo": return <SeoManager />;
    case "contacts": return <Contacts />;
    case "users": return <UsersManager />;
    case "system": return <SystemManager />;
    default: return <Help />;
  }
}

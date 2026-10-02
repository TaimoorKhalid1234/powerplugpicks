import Link from "next/link";
import { getPublicContentByPath, getSettings, listCategories } from "@/lib/server/content";
import { BrandMark } from "@/components/public/illustrations";
import { AnalyticsConsent, MobileNavigation, PrivacyControl, PublicHeaderNavigation } from "@/components/public/client";
import s from "@/components/public/public.module.css";

export const dynamic="force-dynamic";

export default async function PublicLayout({children}:{children:React.ReactNode}) {
  const [settings,categories]=await Promise.all([getSettings(),listCategories()]);
  const paths=new Set(["/","/blog","/reviews","/buying-guides","/comparisons","/guides","/categories","/contact","/search",...categories.map(category=>`/categories/${category.slug}`)]);
  const availableLinks=await Promise.all(settings.navigation.map(async item=>item.href.startsWith("https://") || paths.has(item.href) || Boolean(await getPublicContentByPath(item.href))));
  const navigation=settings.navigation.filter((_,index)=>availableLinks[index]);
  const configuredHeaderLinks=navigation.filter(item=>item.location==="header");
  const headerLinks=configuredHeaderLinks.some(item=>item.href==="/")
    ? configuredHeaderLinks
    : [{label:"Home",href:"/",location:"header" as const},...configuredHeaderLinks];
  const footerLinks=navigation.filter(item=>item.location==="footer");
  const brand=<Link href="/" className={s.brand} aria-label={`${settings.brandName} home`}><BrandMark className={s.brandMark}/>{settings.brandName==="PowerPlugPicks"?<span>PowerPlug<strong>Picks</strong></span>:<span>{settings.brandName}</span>}</Link>;
  return <div className={s.site}><a href="#main-content" className={s.skipLink}>Skip to content</a><header className={s.header}><div className={`${s.wrap} ${s.headerInner}`}>{brand}<PublicHeaderNavigation items={headerLinks}/><MobileNavigation items={headerLinks}/></div></header><main id="main-content">{children}</main><footer className={s.footer}><div className={s.wrap}><div className={s.footerGrid}><div className={s.footerAbout}>{brand}<p>{settings.siteDescription}</p></div><div><h2>Explore</h2><nav aria-label="Explore categories">{categories.map(category=><Link key={category.id} href={`/categories/${category.slug}`}>{category.name}</Link>)}</nav></div><div><h2>The journal</h2><nav aria-label="Article types"><Link href="/buying-guides">Buying guides</Link><Link href="/reviews">Product reviews</Link><Link href="/comparisons">Comparisons</Link><Link href="/guides">Practical guides</Link><Link href="/blog">All articles</Link></nav></div><div><h2>Good to know</h2><nav aria-label="Publication information">{footerLinks.map(item=><Link key={item.href} href={item.href}>{item.label}</Link>)}{!footerLinks.some(item=>item.href==="/contact")&&<Link href="/contact">Contact</Link>}{settings.analyticsEnabled&&<PrivacyControl/>}</nav></div></div><div className={s.footerBottom}><p>&copy; {new Date().getUTCFullYear()} {settings.brandName}. All rights reserved.</p><p>{settings.affiliateTag ? "As an Amazon Associate I earn from qualifying purchases." : "Affiliate links are not configured yet."}</p></div></div></footer>{settings.analyticsEnabled&&<AnalyticsConsent/>}</div>;
}




import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { Category } from "@/lib/types";
import s from "./not-found.module.css";

function UnpluggedIllustration() {
  return <svg viewBox="0 0 420 320" fill="none" aria-hidden="true"><defs><linearGradient id="nf-plate" x1="262" y1="82" x2="380" y2="238" gradientUnits="userSpaceOnUse"><stop stopColor="#fffef8"/><stop offset="1" stopColor="#d6ded2"/></linearGradient><filter id="nf-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#364d37" floodOpacity=".16"/></filter></defs>
    <text x="210" y="300" textAnchor="middle" fontSize="150" fontWeight="800" letterSpacing="-8" fill="#176858" opacity=".07">404</text>    <g filter="url(#nf-shadow)"><rect x="268" y="90" width="118" height="156" rx="22" fill="#c8d1c1"/><rect x="262" y="82" width="118" height="156" rx="22" fill="url(#nf-plate)" stroke="#b0bdac"/>
      {[128, 192].map(y => <g key={y} transform={`translate(321 ${y})`}><circle r="24" fill="#e6eae3" stroke="#bbc7bc"/><path d="M-9-7v11M9-7v11" stroke="#42574a" strokeWidth="3.5" strokeLinecap="round"/><path d="M-4 11a4 4 0 0 1 8 0v3h-8z" fill="#42574a"/></g>)}
    </g>
    <g className={s.spark} stroke="#d59e44" strokeWidth="3.5" strokeLinecap="round"><path d="m226 132 9-11M232 160h16M226 188l9 11"/></g>
    <g className={s.plug}>
      <path d="M100 160c-38 0-40 62-66 80s-16 52 6 60" stroke="#63816c" strokeWidth="11" strokeLinecap="round"/>
      <rect x="92" y="148" width="22" height="24" rx="6" fill="#124f43"/>
      <rect x="180" y="141" width="32" height="9" rx="3" fill="#9fb3a6"/><rect x="180" y="170" width="32" height="9" rx="3" fill="#9fb3a6"/>
      <rect x="108" y="126" width="76" height="68" rx="16" fill="#176858"/>
      <path d="m151 138-13 22h12l-5 20 21-28h-14l7-14z" fill="#e8f1de"/>
    </g>
  </svg>;
}

export function NotFoundView({ categories = [] }: { categories?: Category[] }) {
  const destinations = [...categories.slice(0, 5).map(category => ({ label: category.name, href: `/categories/${category.slug}` })), { label: "Buying guides", href: "/buying-guides" }, { label: "Product reviews", href: "/reviews" }, { label: "Comparisons", href: "/comparisons" }];
  return <section className={s.notFound}><div className={s.wrap}>
    <div className={s.inner}>
      <div className={s.copy}>
        <p className={s.code}><span />Error 404 · Page not found</p>
        <h1>A loose <em>connection.</em></h1>
        <p className={s.lead}>The page you were looking for has been moved, renamed, or never plugged in. Search our guides or pick up from one of the places below.</p>
        <form className={s.search} action="/search" method="get" role="search"><label className={s.searchField}><Search size={18} aria-hidden="true" /><span className="sr-only">Search guides and reviews</span><input type="search" name="q" maxLength={200} placeholder="Search surge protectors, power strips…" /></label><button type="submit">Search</button></form>
        <div className={s.actions}><Link href="/">Back to home<ArrowRight size={16} /></Link><Link href="/blog">Browse all articles<ArrowRight size={16} /></Link></div>
      </div>
      <div className={s.visual}><UnpluggedIllustration /></div>
    </div>
    <nav className={s.explore} aria-label="Popular destinations"><h2>Popular places to start</h2><div className={s.chips}>{destinations.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div></nav>
  </div></section>;
}

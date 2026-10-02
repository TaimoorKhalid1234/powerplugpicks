"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import s from "./public.module.css";

function accepted() { return document.cookie.split("; ").some((item) => item === "ppp_consent=accepted"); }
function currentPath(pathname:string,href:string) {
  if(!href.startsWith("/"))return false;
  const path=pathname.length>1?pathname.replace(/\/$/,""):pathname;
  const target=href.length>1?href.replace(/\/$/,""):href;
  return path===target || (target!=="/"&&path.startsWith(`${target}/`));
}

export function PublicHeaderNavigation({items}:{items:{href:string;label:string}[]}) {
  const pathname=usePathname();
  return <><nav className={s.nav} aria-label="Main navigation">{items.map(item=>{const active=currentPath(pathname,item.href);return <Link key={item.href} href={item.href} aria-current={active?"page":undefined}>{item.label}</Link>;})}</nav><Link href="/search" className={s.searchLink} aria-label="Search articles" aria-current={currentPath(pathname,"/search")?"page":undefined}><Search size={19}/></Link></>;
}

export function MobileNavigation({items}:{items:{href:string;label:string}[]}) {
  const details=useRef<HTMLDetailsElement>(null);
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const links=[...items,{href:"/categories",label:"Explore categories"},{href:"/search",label:"Search articles"}].filter((item,index,all)=>all.findIndex(candidate=>candidate.href===item.href)===index);
  const hasActive=links.some(item=>currentPath(pathname,item.href));
  useEffect(()=>{setOpen(false);},[pathname]);
  useEffect(()=>{
    if(!open)return;
    const bodyOverflow=document.body.style.overflow,htmlOverflow=document.documentElement.style.overflow;
    const bodyOverscroll=document.body.style.overscrollBehavior,htmlOverscroll=document.documentElement.style.overscrollBehavior;
    document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden";
    document.body.style.overscrollBehavior="none";document.documentElement.style.overscrollBehavior="none";
    return ()=>{document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=htmlOverflow;document.body.style.overscrollBehavior=bodyOverscroll;document.documentElement.style.overscrollBehavior=htmlOverscroll;};
  },[open]);
  return <details className={s.mobileMenu} data-has-active={hasActive} ref={details} open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary aria-label={open?"Close navigation menu":"Open navigation menu"}><span className={s.menuIcon} aria-hidden="true"><span/><span/><span/></span></summary>
    <button type="button" className={s.mobileMenuBackdrop} aria-label="Close navigation menu" onClick={()=>setOpen(false)}/>
    <nav aria-label="Mobile navigation"><span className={s.mobileMenuLabel}>Explore PowerPlugPicks</span>{links.map(item=>{const active=currentPath(pathname,item.href);return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} onClick={()=>setOpen(false)}>{item.label}<span aria-hidden="true">→</span></Link>;})}</nav>
  </details>;
}

export function AffiliateLink({ href, articleId = "", productId, children, placement = "product_card", analyticsEnabled = false }: {href:string;articleId?:string;productId:string;children:ReactNode;placement?:string;analyticsEnabled?:boolean}) {
  function track() {
    if (!analyticsEnabled || !accepted()) return;
    const payload = JSON.stringify({ id: crypto.randomUUID(), eventType: "affiliate_click", articleId, productId, path: location.pathname, placement });
    navigator.sendBeacon?.("/api/events", new Blob([payload], { type: "application/json" }));
  }
  return <a className={s.button} href={href} target="_blank" rel="sponsored nofollow noopener" onClick={track}>{children}<span aria-hidden="true">↗</span></a>;
}

export function AnalyticsConsent() {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState("");
  const pathname = usePathname();
  useEffect(() => {
    const saved = document.cookie.split("; ").find((item) => item.startsWith("ppp_consent="))?.split("=")[1] || "";
    const timer = setTimeout(() => { setConsent(saved); setOpen(!saved); }, 0);
    const reopen = () => setOpen(true);
    window.addEventListener("ppp-privacy", reopen);
    return () => { clearTimeout(timer); window.removeEventListener("ppp-privacy", reopen); };
  }, []);
  useEffect(() => {
    if (consent !== "accepted") return;
    const payload = JSON.stringify({ id: crypto.randomUUID(), eventType: "page_view", path: pathname });
    navigator.sendBeacon?.("/api/events", new Blob([payload], { type: "application/json" }));
  }, [pathname, consent]);
  function choose(value: string) {
    document.cookie = `ppp_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setConsent(value); setOpen(false);
  }
  if (!open) return null;
  return <section className={s.consent} aria-label="Analytics preferences"><h2>A little insight, with your permission.</h2><p>Allow anonymous page-view and outgoing product-link counts to help us understand which guides are useful. Your choice will be remembered for a year.</p><div className={s.consentActions}><button onClick={() => choose("declined")}>Decline analytics</button><button onClick={() => choose("accepted")}>Allow analytics</button></div></section>;
}

export function PrivacyControl() { return <button className={s.privacyButton} onClick={() => window.dispatchEvent(new Event("ppp-privacy"))}>Analytics preferences</button>; }

export function ContactForm() {
  const [status, setStatus] = useState<{ok:boolean;text:string}|null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setStatus(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/contact", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
      const result = await response.json() as {error?:string;message?:string};
      if (!response.ok) throw new Error(result.error || result.message || "Your message could not be sent. Please try again.");
      setStatus({ok:true,text:"Your message has been received. Thank you for getting in touch."}); form.reset();
    } catch (error) { setStatus({ok:false,text:error instanceof Error ? error.message : "We could not send your message. Please try again."}); }
    finally { setPending(false); }
  }
  return <form className={s.form} onSubmit={submit}><label>Your name<input name="name" autoComplete="name" maxLength={120} required/></label><label>Email address<input type="email" name="email" autoComplete="email" maxLength={254} required/><small>Used only to respond to your message.</small></label><label>What can we help with?<select name="topic" defaultValue="general"><option value="general">General enquiry</option><option value="correction">Report a correction</option><option value="editorial">Editorial question</option><option value="privacy">Privacy request</option></select></label><label>Your message<textarea name="message" minLength={10} maxLength={5000} rows={7} required/></label><div className={s.honey} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><small>Submitting this form sends your name, email, and message to the site owner so they can review and respond.</small>{status && <p role="status" className={`${s.formNote} ${status.ok ? "" : s.formError}`}>{status.text}</p>}<button className={s.button} type="submit" disabled={pending}>{pending ? "Sending…" : "Send message"}<span aria-hidden="true">↗</span></button></form>;
}

export function ShareButton({title}:{title:string}) {
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title, url: location.origin + location.pathname }); }
      else { await navigator.clipboard.writeText(location.origin + location.pathname); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    } catch { /* Dismissing the native sharing sheet needs no error message. */ }
  }
  return <button className={s.privacyButton} style={{fontSize:12}} onClick={share}>{copied ? "Link copied" : "Share this article ↗"}</button>;
}

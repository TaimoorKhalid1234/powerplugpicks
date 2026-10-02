"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Activity, ArrowUpRight, BarChart3, BookOpen, ChevronRight, CircleHelp, FileText, FolderTree, Home, Image, LayoutDashboard, Link2, LogOut, Mail, Menu, Moon, Navigation, Package, PenLine, Search, Settings, ShieldCheck, Sun, Tags, Users, Zap } from "lucide-react";
import type { Role } from "@/lib/types";
import { adminApi } from "./api";
import s from "./admin.module.css";

const groups = [
  { title: "Workspace", items: [{ slug: "", name: "Overview", icon: LayoutDashboard }, { slug: "articles", name: "Articles", icon: FileText }, { slug: "products", name: "Products", icon: Package }, { slug: "categories", name: "Categories", icon: FolderTree }, { slug: "tags", name: "Tags", icon: Tags }, { slug: "media", name: "Media library", icon: Image }, { slug: "authors", name: "Authors", icon: PenLine }] },
  { title: "Your website", items: [{ slug: "pages", name: "Pages", icon: BookOpen }, { slug: "navigation", name: "Navigation", icon: Navigation }, { slug: "homepage", name: "Home page", icon: Home }, { slug: "affiliate", name: "Affiliate links", icon: Link2 }, { slug: "seo", name: "SEO health", icon: Search }, { slug: "analytics", name: "Analytics", icon: BarChart3 }, { slug: "contacts", name: "Contacts", icon: Mail }] },
  { title: "Management", items: [{ slug: "users", name: "Users & roles", icon: Users }, { slug: "settings", name: "Settings", icon: Settings }, { slug: "system", name: "System & activity", icon: Activity }, { slug: "security", name: "Account security", icon: ShieldCheck }, { slug: "help", name: "Help & getting started", icon: CircleHelp }] },
];
function subscribeTheme(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener("ppp-theme", listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener("ppp-theme", listener); }; }
function themeSnapshot() { return localStorage.getItem("ppp-admin-theme") || "light"; }

export function AdminShell({ children, user }: { children: ReactNode; user: { name: string; email: string; role: Role | string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const section = pathname.split("/")[2] || "";
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, () => "light");
  const [open, setOpen] = useState(false);
  function toggleTheme() { const next = theme === "light" ? "dark" : "light"; localStorage.setItem("ppp-admin-theme", next); window.dispatchEvent(new Event("ppp-theme")); }
  async function signOut() { try { await adminApi("/api/auth/sign-out", { method: "POST", body: "{}" }); router.replace("/admin/login"); router.refresh(); } catch { window.alert("Sign out did not complete. Please try again."); } }
  const title = groups.flatMap(group => group.items).find(item => item.slug === section)?.name || "Editor";
  const privileged = ["OWNER", "ADMIN"].includes(user.role);
  function visible(slug: string) {
    if (["users", "settings", "system", "contacts", "pages", "homepage", "navigation"].includes(slug)) return privileged;
    if (user.role === "ANALYST") return ["", "analytics", "help", "security"].includes(slug);
    if (user.role === "AUTHOR") return ["", "articles", "products", "media", "help", "security"].includes(slug);
    return true;
  }
  return <div className={s.workspace} data-theme={theme}>
    {open && <button className={s.mobileBackdrop} aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={s.sidebar} data-open={open}>
      <Link href="/admin" className={s.brand}><span className={s.brandMark}><Zap size={21} fill="currentColor" /></span><span>PowerPlugPicks<small>Editorial studio</small></span></Link>
      <nav className={s.navigation} aria-label="Admin navigation">{groups.map(group => <div key={group.title}><div className={s.navGroup}>{group.title}</div>{group.items.filter(item => visible(item.slug)).map(item => <Link key={item.slug} className={s.navLink} data-active={section === item.slug} href={`/admin${item.slug ? `/${item.slug}` : ""}`} aria-current={section === item.slug ? "page" : undefined} onClick={() => setOpen(false)}><item.icon size={17} strokeWidth={1.65} />{item.name}</Link>)}</div>)}</nav>
      <div className={s.sidebarBottom}><div className={s.actionRow}><span className={s.avatar}>{user.name?.slice(0, 2).toUpperCase() || "PP"}</span><div><strong>{user.name || "Your account"}</strong><div style={{ fontSize: 10, textTransform: "capitalize" }}>{user.role.toLowerCase()}</div></div><button className={s.iconButton} onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button></div></div>
    </aside>
    <div className={s.main}><header className={s.topbar}><div className={s.breadcrumb}><button className={`${s.iconButton} ${s.mobileMenu}`} aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20} /></button><span>Workspace</span><ChevronRight size={12} /><strong>{title}</strong>{pathname.split("/").length > 3 && <><ChevronRight size={12} /><span>Editor</span></>}</div><div className={s.topActions}><Link className={s.secondary} href="/" target="_blank">View website <ArrowUpRight size={14} /></Link><button className={s.iconButton} onClick={toggleTheme} aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button><span className={s.avatar}>{user.name?.slice(0, 2).toUpperCase() || "PP"}</span></div></header><main className={s.content}>{children}</main></div>
  </div>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import type { ContentKind, ContentRecord, ListResult } from "@/lib/types";
import { adminApi, dateLabel, errorMessage, friendly, useResource } from "./api";
import { Badge, Empty, Loading, Notice, PageHeading } from "./ui";
import s from "./admin.module.css";

export function ContentList({ kind }: { kind: ContentKind }) {
  const plural = kind === "article" ? "articles" : kind === "product" ? "products" : "pages";
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [starterBusy, setStarterBusy] = useState(false);
  const [starterMessage, setStarterMessage] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  const params = new URLSearchParams({ kind, page: String(page), q: query, state, type });
  const { data, error, loading, refresh } = useResource<ListResult<ContentRecord>>(`/api/admin/content?${params}`);
  async function addStarterPages() { setStarterBusy(true); setStarterMessage(""); try { await adminApi("/api/admin/initialize", { method: "POST", body: "{}" }); await refresh(); setStarterMessage("Starter pages are ready as drafts. Review each page before publishing."); } catch (e) { setStarterMessage(errorMessage(e)); } finally { setStarterBusy(false); } }
  return <><PageHeading title={friendly(plural)} description={kind === "article" ? "Helpful research, thoughtful recommendations. Manage your editorial work." : kind === "product" ? "A reference library of products and independently verified specifications." : "The policies, people, and principles behind your publication."}><div className={s.actionRow}>{kind === "page" && <button className={s.secondary} disabled={starterBusy} onClick={() => void addStarterPages()}>{starterBusy ? "Adding pages…" : "Add starter page drafts"}</button>}<Link className={s.button} href={`/admin/${plural}/new`}><Plus size={16} />New {kind}</Link></div></PageHeading><Notice message={error} error /><Notice message={starterMessage} error={starterMessage !== "" && !starterMessage.startsWith("Starter pages")} /><section className={s.card}><div className={s.filters}><div className={s.search}><Search size={16} /><input className={s.input} aria-label={`Search ${plural}`} placeholder={`Search ${plural}…`} value={search} onChange={e => setSearch(e.target.value)} /></div><select aria-label="Filter by status" className={s.select} value={state} onChange={e => { setState(e.target.value); setPage(1); }}><option value="">All statuses</option>{["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "UNPUBLISHED", "ARCHIVED", "TRASHED"].map(value => <option key={value} value={value}>{friendly(value)}</option>)}</select>{kind === "article" && <select aria-label="Filter by article type" className={s.select} value={type} onChange={e => { setType(e.target.value); setPage(1); }}><option value="">All article types</option>{["GUIDE", "BUYING_GUIDE", "REVIEW", "COMPARISON"].map(value => <option key={value} value={value}>{friendly(value)}</option>)}</select>}</div>
    {loading ? <Loading /> : !data ? <Empty title="Unable to load content" description="Try loading the list again."><button className={s.secondary} onClick={() => void refresh()}>Try again</button></Empty> : !data.items.length ? <Empty title={query || state || type ? "No matching content" : `Your ${plural} start here`} description={query || state || type ? "Try a different search or status filter." : `Create a ${kind} to begin. New content stays in draft until it is reviewed and published.`}>{!query && !state && !type && <Link className={s.secondary} href={`/admin/${plural}/new`}><Plus size={14} />Create {kind}</Link>}</Empty> : <div className={s.tableWrap}><table className={s.table}><thead><tr><th>{kind === "product" ? "Product" : "Title"}</th>{kind === "article" && <th>Type</th>}<th>Workflow</th><th>Visibility</th><th>Updated</th><th><span className={s.muted}>Action</span></th></tr></thead><tbody>{data.items.map(record => <tr key={record.id}><td><Link className={s.tableTitle} href={`/admin/${plural}/${record.id}`}>{record.data.title || "Untitled draft"}</Link><span className={s.tableSubtitle}>/{record.data.slug || "slug-not-set"}{record.isDemo ? " · Sample draft" : ""}</span></td>{kind === "article" && <td className={s.muted}>{friendly(record.data.articleType)}</td>}<td><Badge value={record.workflow} /></td><td><Badge value={record.state} /></td><td className={s.muted}>{dateLabel(record.updatedAt)}</td><td><Link className={s.secondary} href={`/admin/${plural}/${record.id}`}>Edit <ChevronRight size={13} /></Link></td></tr>)}</tbody></table></div>}
    {data && data.total > 0 && <div className={s.pagination}><span>{data.total} {plural} · Page {data.page} of {Math.max(1, data.pages)}</span><div className={s.actionRow}><button className={s.secondary} aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></button><button className={s.secondary} aria-label="Next page" disabled={page >= data.pages || loading} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></button></div></div>}
  </section></>;
}

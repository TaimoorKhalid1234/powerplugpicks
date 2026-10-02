import Link from "next/link";
import { ArrowUpRight, BookOpen, ChevronRight, Search } from "lucide-react";
import type { Category, ContentRecord, ListResult } from "@/lib/types";
import { contentPath, typeLabels } from "@/lib/content";
import { CategoryIllustration } from "./illustrations";
import s from "./public.module.css";

export function displayDate(value:string|null) { if(!value || Number.isNaN(Date.parse(value)))return "";return new Intl.DateTimeFormat("en-US", { month:"short",day:"numeric",year:"numeric",timeZone:"UTC" }).format(new Date(value)); }
export function Breadcrumb({items}:{items:{label:string;href?:string}[]}) {
  return <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link>{items.map((item,index) => <span key={`${item.label}-${index}`} style={{display:"inline-flex",alignItems:"center",gap:8}}><ChevronRight size={11} aria-hidden="true"/>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current={index===items.length-1?"page":undefined}>{item.label}</span>}</span>)}</nav>;
}
export function SectionHeader({kicker,title,description,href,linkText="View all"}:{kicker?:string;title:string;description?:string;href?:string;linkText?:string}) {
  return <div className={s.sectionHeader}><div>{kicker && <p className={s.kicker}>{kicker}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{href && <Link href={href} className={s.textLink}>{linkText}<ArrowUpRight size={15} aria-hidden="true"/></Link>}</div>;
}
export function CategoryCards({categories}:{categories:Category[]}) {
  return <div className={s.categoryGrid}>{categories.map(category => <Link key={category.id} href={`/categories/${category.slug}`} className={s.categoryCard}><div className={s.categoryImage}><CategoryIllustration kind={category.icon || category.slug}/></div><div className={s.categoryBody}><h3>{category.name}<ArrowUpRight size={13} aria-hidden="true"/></h3><p>{category.description}</p></div></Link>)}</div>;
}
export function ArticleCards({articles,categories=[]}:{articles:ContentRecord[];categories?:Category[]}) {
  return <div className={s.articleGrid}>{articles.map(article => { const d=article.data;const category=categories.find(item=>d.categoryIds.includes(item.id)); return <Link href={contentPath(article.kind,d)} key={article.id} className={s.articleCard}><div className={s.articleImage}>{d.image ? <img src={d.image} alt={d.imageAlt || ""} loading="lazy"/> : <CategoryIllustration kind={category?.slug}/>}</div><div className={s.articleBody}><span className={s.articleType}>{typeLabels[d.articleType] || "Article"}</span><h3>{d.title}</h3><p>{d.excerpt}</p><div className={s.articleMeta}>{category && <span>{category.name}</span>}{article.publishedAt && <time dateTime={article.publishedAt}>{displayDate(article.publishedAt)}</time>}</div></div></Link>;})}</div>;
}
export function EmptyState({title="Thoughtful guides take a little groundwork.",description="Our first articles are being prepared. Explore the categories above to find the right place to start when they arrive.",search=false}:{title?:string;description?:string;search?:boolean}) {
  return <div className={s.empty}><div className={s.emptyIcon}>{search ? <Search size={27} strokeWidth={1.4}/> : <BookOpen size={28} strokeWidth={1.3}/>}</div><div><h3>{title}</h3><p>{description}</p></div></div>;
}
export function Pagination({result,path,query={}}:{result:ListResult<unknown>;path:string;query?:Record<string,string>}) {
  if(result.pages<=1) return null;
  function href(page:number) {const params=new URLSearchParams(query);if(page>1)params.set("page",String(page));else params.delete("page");return path+(params.size?`?${params}`:"");}
  const start=Math.max(1,Math.min(result.page-2,result.pages-4));const pages=Array.from({length:Math.min(5,result.pages)},(_,i)=>start+i);
  return <nav aria-label="Pagination" className={s.pagination}>{result.page>1&&<Link className={s.pageArrow} href={href(result.page-1)} rel="prev">Previous</Link>}{pages.map(page=>page===result.page?<span key={page} aria-current="page">{page}</span>:<Link key={page} href={href(page)} aria-label={`Page ${page}`}>{page}</Link>)}{result.page<result.pages&&<Link className={s.pageArrow} href={href(result.page+1)} rel="next">Next</Link>}</nav>;
}


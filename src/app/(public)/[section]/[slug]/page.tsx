import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicContentById, getPublicContentByPath, getRedirect, getSettings, listAuthors, listCategories, listPublicContent } from "@/lib/server/content";
import { articlePath, collectDocumentRefs, contentPath, typeLabels, typeSegments } from "@/lib/content";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { ContentRecord } from "@/lib/types";
import { ArchiveView, loadArchive, type SearchParams } from "@/components/public/archive";
import { ContentRenderer, documentHeadings, documentText, hasDocumentNode, ProductCard, safePublicUrl } from "@/components/content/renderer";
import { ArticleCards, Breadcrumb, displayDate, SectionHeader } from "@/components/public/ui";
import { ShareButton } from "@/components/public/client";
import s from "@/components/public/public.module.css";

type Props={params:Promise<{section:string;slug:string}>;searchParams:Promise<SearchParams>};
const taxonomySections=new Set(["categories","authors","tags"]);
export async function generateMetadata({params,searchParams}:Props) {
  const {section,slug}=await params;
  if(taxonomySections.has(section)) {const archive=await loadArchive(section,slug,await searchParams);const title=section==="categories"?archive.category?.seoTitle || archive.title:archive.title;const description=section==="categories"?archive.category?.seoDescription || archive.description:archive.description;return pageMetadata(`${title}${archive.page>1?` — Page ${archive.page}`:""}`,description,archive.path+(archive.page>1?`?page=${archive.page}`:""),archive.noindex);}
  const article=await getPublicContentByPath(`/${section}/${slug}`);
  if(!article || article.kind!=="article")return {title:"Article not found",robots:{index:false,follow:false}};
  const metadata=await pageMetadata(article.data.seoTitle || article.data.title,article.data.seoDescription || article.data.excerpt,articlePath(article.data.articleType,article.data.slug),article.data.noindex);
  const imageUrl=safePublicUrl(article.data.image)?new URL(article.data.image,await siteUrl()).href:null;
  return {...metadata,openGraph:{...metadata.openGraph,type:"article",publishedTime:article.publishedAt || undefined,modifiedTime:article.updatedAt,...(imageUrl?{images:[{url:imageUrl,alt:article.data.imageAlt}]}:{})},...(imageUrl?{twitter:{...metadata.twitter,images:[imageUrl]}}:{})};
}

export default async function DetailPage({params,searchParams}:Props) {
  const {section,slug}=await params;
  if(taxonomySections.has(section))return <ArchiveView archive={await loadArchive(section,slug,await searchParams)} section={section} slug={slug}/>;
  const article=await getPublicContentByPath(`/${section}/${slug}`);
  if(!article || article.kind!=="article" || !Object.values(typeSegments).includes(section)) {const target=await getRedirect(`/${section}/${slug}`);if(target)permanentRedirect(target);notFound();}
  const d=article.data;
  const [settings,categories,authors,base,disclosurePage,curated]=await Promise.all([getSettings(),listCategories(),listAuthors(),siteUrl(),getPublicContentByPath("/affiliate-disclosure"),Promise.all(d.relatedIds.slice(0,6).map(getPublicContentById))]);
  const author=authors.find(item=>item.id===d.authorId);
  const category=categories.find(item=>d.categoryIds.includes(item.id));
  const headings=documentHeadings(d.document);
  const minutes=Math.max(1,Math.ceil(documentText(d.document).trim().split(/\s+/).length/220));
  const manual=curated.filter((item):item is ContentRecord=>Boolean(item&&item.kind==="article"&&item.id!==article.id));
  const related=manual.length?manual.slice(0,3):category?(await listPublicContent({category:category.id,pageSize:4})).items.filter(item=>item.id!==article.id).slice(0,3):[];
  const inlineProducts=new Set(collectDocumentRefs(d.document).products);
  const listedProducts=[...new Set(d.productIds)].filter(id=>!inlineProducts.has(id));
  const faqs=d.faqs.filter(faq=>faq.question.trim()&&faq.answer.trim());
  const canonical=`${base}${contentPath(article.kind,d)}`;
  const schema={"@context":"https://schema.org","@type":"Article",headline:d.title,description:d.excerpt,mainEntityOfPage:canonical,url:canonical,datePublished:article.publishedAt || undefined,dateModified:article.updatedAt,author:author?{"@type":"Person",name:author.name,url:`${base}/authors/${author.slug}`}:undefined,publisher:{"@type":"Organization",name:settings.brandName,url:base},...(safePublicUrl(d.image)?{image:[new URL(d.image,base).href]}:{})};
  return <div className={s.wrap}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>{faqs.length>0&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(faq=>({"@type":"Question",name:faq.question,acceptedAnswer:{"@type":"Answer",text:faq.answer}}))})}}/>}<Breadcrumb items={[{label:typeLabels[d.articleType],href:`/${section}`},{label:d.title}]}/><article><header className={s.articleHeader}><p className={s.kicker}>{category?.name || typeLabels[d.articleType]} · {typeLabels[d.articleType]}</p><h1>{d.title}</h1><p className={s.intro}>{d.excerpt}</p><div className={s.byline}>{author&&<span>By <Link href={`/authors/${author.slug}`}>{author.name}</Link></span>}{article.publishedAt&&<span>Published <time dateTime={article.publishedAt}>{displayDate(article.publishedAt)}</time></span>}{article.publishedAt&&article.updatedAt.slice(0,10)!==article.publishedAt.slice(0,10)&&<span>Updated <time dateTime={article.updatedAt}>{displayDate(article.updatedAt)}</time></span>}<span>{minutes} min read</span></div></header>{safePublicUrl(d.image)&&<figure className={s.cover}><img src={d.image} alt={d.imageAlt}/>{d.imageCredit&&<figcaption>{d.imageCredit}</figcaption>}</figure>}<div className={s.readingLayout}><div className={s.prose}><aside className={s.disclosure}>{settings.affiliateTag ? "As an Amazon Associate I earn from qualifying purchases." : "Affiliate tracking is not configured. Check product information with the seller before purchase."} {disclosurePage&&<Link href="/affiliate-disclosure">Read our affiliate disclosure.</Link>}</aside><ContentRenderer document={d.document} articleId={article.id} settings={settings} sources={d.sources}/>{listedProducts.map(id=><ProductCard key={id} id={id} articleId={article.id} settings={settings}/>)}{faqs.length>0&&<section className={s.faq} aria-labelledby="faq-heading"><h2 id="faq-heading">Frequently asked questions</h2>{faqs.map((faq,index)=><details key={index}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}{d.researchBasis&&<section className={s.callout}><strong>Research basis</strong><p>{d.researchBasis}</p></section>}{d.sources.length>0&&!hasDocumentNode(d.document,"sourceList")&&<section className={s.sources} aria-label="Sources"><h2>Sources &amp; further reading</h2><ol>{d.sources.map((source,index)=><li key={`${source.url}-${index}`}>{safePublicUrl(source.url)?<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a>:source.title}{source.note&&<> — {source.note}</>}{source.verifiedAt&&<> <span>Accessed {displayDate(source.verifiedAt)}.</span></>}</li>)}</ol></section>}{author&&<section className={s.authorBox}>{safePublicUrl(author.image)&&<img src={author.image} alt="" loading="lazy"/>}<div><h2><Link href={`/authors/${author.slug}`}>{author.name}</Link></h2><p>{author.biography}</p></div></section>}<div className={s.utilityLinks}><Link href="/contact">Suggest a correction</Link><ShareButton title={d.title}/></div></div>{headings.length>0&&<nav className={s.toc} aria-label="Table of contents"><h2>In this article</h2><ul>{headings.map(heading=><li key={heading.id} style={heading.level===3?{paddingLeft:9}:undefined}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ul></nav>}</div></article>{related.length>0&&<section className={s.section}><SectionHeader kicker="Keep exploring" title="A little more useful reading."/><ArticleCards articles={related} categories={categories}/></section>}</div>;
}


import { notFound, permanentRedirect } from "next/navigation";
import { getPublicContentByPath, getRedirect, getSettings, listCategories, listPublicContent } from "@/lib/server/content";
import { pageMetadata } from "@/lib/seo";
import { ContentRenderer } from "@/components/content/renderer";
import { ArchiveView, archiveDefinitions, loadArchive, oneParam, parsePage, type SearchParams } from "@/components/public/archive";
import { ArticleCards, Breadcrumb, CategoryCards, EmptyState, Pagination } from "@/components/public/ui";
import { ContactForm } from "@/components/public/client";
import s from "@/components/public/public.module.css";

type Props={params:Promise<{section:string}>;searchParams:Promise<SearchParams>};

export async function generateMetadata({params,searchParams}:Props) {
  const {section}=await params;const query=await searchParams;
  if(Object.hasOwn(archiveDefinitions,section)) {const archive=await loadArchive(section,undefined,query);return pageMetadata(`${archive.title}${archive.page>1?` — Page ${archive.page}`:""}`,archive.description,archive.path+(archive.page>1?`?page=${archive.page}`:""),archive.noindex);}
  if(section==="categories") {const articles=await listPublicContent({pageSize:1});return pageMetadata("Explore power accessories","Explore surge protectors, extension cords, power strips, and other power accessories by category.","/categories",!articles.total);}
  if(section==="search")return pageMetadata("Search the journal","Find published guides, comparisons, and reviews.","/search",true);
  if(section==="contact") {const settings=await getSettings();return pageMetadata(`Contact ${settings.brandName}`,"Get in touch with the publication, ask an editorial question, or report a correction.","/contact",!settings.contactEmail);}
  const page=await getPublicContentByPath(`/${section}`);
  if(!page || page.kind!=="page")return {title:"Page not found",robots:{index:false,follow:false}};
  return pageMetadata(page.data.seoTitle || page.data.title,page.data.seoDescription || page.data.excerpt,`/${section}`,page.data.noindex || !page.data.ownerReviewed);
}

export default async function SectionPage({params,searchParams}:Props) {
  const {section}=await params;const query=await searchParams;
  if(Object.hasOwn(archiveDefinitions,section))return <ArchiveView archive={await loadArchive(section,undefined,query)} section={section}/>;
  if(section==="categories") {const categories=await listCategories();return <div className={`${s.wrap} ${s.archive}`}><Breadcrumb items={[{label:"Categories"}]}/><header className={s.archiveHeading}><p className={s.kicker}>Start with the essentials</p><h1>Find your connection.</h1><p>Explore the accessories that bring a setup together, from a well-organized desk to the right cord for the job.</p></header>{categories.length?<CategoryCards categories={categories}/>:<EmptyState title="Our categories are taking shape." description="Check back for collections of useful guidance on everyday power accessories."/>}</div>;}
  if(section==="search") {
    const rawQuery=oneParam(query.q);const q=rawQuery.trim().slice(0,200);const page=parsePage(query);
    if(rawQuery.length>200)notFound();
    const [results,categories]=await Promise.all([listPublicContent({q:q || "!",page,pageSize:12}),listCategories()]);
    if(page>results.pages)notFound();
    return <div className={`${s.wrap} ${s.archive}`}><Breadcrumb items={[{label:"Search"}]}/><header className={s.archiveHeading}><p className={s.kicker}>A good place to start</p><h1>What are you looking for?</h1><p>Search published articles for a product, a specification, or your next setup.</p></header><form action="/search" className={s.searchForm} role="search"><label className="sr-only" htmlFor="site-search">Search the journal</label><input id="site-search" name="q" type="search" defaultValue={q} placeholder="Try “surge protector”" maxLength={200}/><button className={s.button} type="submit">Search</button></form>{q&&<p className={s.resultCount} style={{marginBottom:24}}>{results.total} {results.total===1?"result":"results"} for “{q}”</p>}{q&&results.items.length?<ArticleCards articles={results.items} categories={categories}/>:<EmptyState search title={q?"Nothing here just yet.":"A little curiosity goes a long way."} description={q?"Try a broader phrase, a different product name, or explore the categories for more ideas.":"Enter a few words above to search our published guides, product reviews, and comparisons."}/>}<Pagination result={results} path="/search" query={q?{q}:{}}/></div>;
  }
  if(section==="contact") {const [contact,settings]=await Promise.all([getPublicContentByPath("/contact"),getSettings()]);return <div className={s.wrap}><Breadcrumb items={[{label:"Contact"}]}/><div className={s.pageBody}><header className={s.archiveHeading}><p className={s.kicker}>Get in touch</p><h1>{contact?.data.title || "Let’s make the connection."}</h1><p>{contact?.data.excerpt || (settings.contactEmail?"Have a question, a suggestion, or a correction? Send a message to the publication below.":"Questions, suggestions, and corrections help shape a useful publication.")}</p></header>{contact&&<div className={s.prose}><ContentRenderer document={contact.data.document} sources={contact.data.sources}/></div>}{settings.contactEmail?<ContactForm/>:<EmptyState title="A place to share your thoughts." description="The contact form is not available yet. Please check back soon."/>}</div></div>;}
  const page=await getPublicContentByPath(`/${section}`);
  if(!page || page.kind!=="page") {const target=await getRedirect(`/${section}`);if(target)permanentRedirect(target);notFound();}
  const settings=await getSettings();
  return <div className={s.wrap}><Breadcrumb items={[{label:page.data.title}]}/><div className={s.pageBody}><header className={s.archiveHeading}><p className={s.kicker}>{settings.brandName}</p><h1>{page.data.title}</h1>{page.data.excerpt&&<p>{page.data.excerpt}</p>}</header><div className={s.prose}><ContentRenderer document={page.data.document} settings={settings} sources={page.data.sources}/></div></div></div>;
}




import { notFound } from "next/navigation";
import { ARTICLE_TYPES, type ArticleType, type Category } from "@/lib/types";
import { typeLabels } from "@/lib/content";
import { getAuthor, getCategory, getTag, listCategories, listPublicContent } from "@/lib/server/content";
import { ArticleCards, Breadcrumb, EmptyState, Pagination } from "./ui";
import s from "./public.module.css";

export type SearchParams = Record<string,string|string[]|undefined>;
export const archiveDefinitions:Record<string,{title:string;description:string;type?:ArticleType}>={
  blog:{title:"The journal",description:"Buying guides, thoughtful comparisons, and practical advice. Find the details that help make your everyday setup work a little better."},
  reviews:{title:"Product reviews",description:"A closer look at power accessories, with documented specifications, useful context, and a clear view of their limitations.",type:"REVIEW"},
  "buying-guides":{title:"Buying guides",description:"Find your starting point. Explore power accessories by intended use, the details that matter, and the tradeoffs worth considering.",type:"BUYING_GUIDE"},
  comparisons:{title:"Side by side, with context.",description:"Compare the details that make a difference. A considered look at how power accessories fit different spaces and needs.",type:"COMPARISON"},
  guides:{title:"A little practical know-how.",description:"Straightforward explanations for everyday power accessories, from understanding the specifications to planning a more considered setup.",type:"GUIDE"},
};

export function oneParam(value:string|string[]|undefined):string {return Array.isArray(value)?value[0] || "":value || "";}
export function parsePage(params:SearchParams) {const raw=oneParam(params.page);if(raw&&!/^[1-9]\d{0,5}$/.test(raw))notFound();return raw?Number(raw):1;}

export async function loadArchive(section:string,slug:string|undefined,params:SearchParams) {
  const categories=await listCategories();
  let title="",description="",type:ArticleType|undefined,category:Category|null=null,author:Awaited<ReturnType<typeof getAuthor>>=null,tag:Awaited<ReturnType<typeof getTag>>=null;
  let noindex=false;
  if(slug) {
    if(section==="categories") {category=await getCategory(slug);if(!category)notFound();title=category.name;description=category.description;}
    else if(section==="authors") {author=await getAuthor(slug);if(!author)notFound();title=author.name;description=author.biography;noindex=!description.trim();}
    else if(section==="tags") {tag=await getTag(slug);if(!tag)notFound();title=tag.name;description=tag.description;noindex=!tag.indexable;}
    else notFound();
  } else {if(!Object.hasOwn(archiveDefinitions,section))notFound();const definition=archiveDefinitions[section];({title,description,type}=definition);}
  const rawType=oneParam(params.type);
  if(rawType) {if(!ARTICLE_TYPES.includes(rawType as ArticleType) || (type && rawType!==type))notFound();type=rawType as ArticleType;noindex=true;}
  const rawCategory=oneParam(params.category);
  if(rawCategory) {if(category&&rawCategory!==category.slug)notFound();category=categories.find(item=>item.slug===rawCategory)||null;if(!category)notFound();noindex=true;}
  const page=parsePage(params);
  const result=await listPublicContent({type,category:category?.id,author:author?.id,tag:tag?.id,page,pageSize:12});
  if(page>result.pages)notFound();
  const query:Record<string,string>={};if(rawType)query.type=rawType;if(rawCategory)query.category=rawCategory;
  const path=`/${section}${slug?`/${slug}`:""}`;
  return {title,description,type,category,author,tag,categories,result,path,query,noindex:noindex || result.total===0,page};
}

export function ArchiveView({archive,section,slug}:{archive:Awaited<ReturnType<typeof loadArchive>>;section:string;slug?:string}) {
  const {title,description,categories,result,path,query,author}=archive;
  const fixedType=Boolean(archiveDefinitions[section]?.type);
  return <div className={`${s.wrap} ${s.archive}`}><Breadcrumb items={slug?[{label:section==="categories"?"Categories":section==="authors"?"Authors":"Topics",href:section==="categories"?"/categories":undefined},{label:title}]:[{label:section==="blog"?"All articles":title}]}/><header className={s.archiveHeading}><p className={s.kicker}>{author?"Meet the author":section==="categories"?"Explore the essentials":"The PowerPlugPicks journal"}</p>{author?.image&&<img src={author.image} alt="" width={84} height={84} style={{borderRadius:"50%",objectFit:"cover",marginBottom:18}}/>}<h1>{title}</h1>{description&&<p>{description}</p>}{author?.links?.length? <div className={s.utilityLinks}>{author.links.filter(link=>/^https:\/\//.test(link)).map(link=><a key={link} href={link} target="_blank" rel="noopener noreferrer">{new URL(link).hostname} ↗</a>)}</div>:null}</header><form className={s.filters} action={path}>{!fixedType&&<><label htmlFor="archive-type">Show</label><select name="type" id="archive-type" defaultValue={query.type || ""}><option value="">All article types</option>{ARTICLE_TYPES.map(type=><option key={type} value={type}>{typeLabels[type]}</option>)}</select></>}{section!=="categories"&&<><label htmlFor="archive-category">Category</label><select id="archive-category" name="category" defaultValue={query.category || ""}><option value="">All categories</option>{categories.map(category=><option key={category.id} value={category.slug}>{category.name}</option>)}</select></>}<button className={s.button} type="submit">Apply filters</button><span className={s.resultCount}>{result.total} {result.total===1?"article":"articles"}{result.pages>1?` · Page ${result.page} of ${result.pages}`:""}</span></form>{result.items.length?<ArticleCards articles={result.items} categories={categories}/>:<EmptyState title={Object.keys(query).length?"No articles match these filters.":"The first chapter is on its way."} description={Object.keys(query).length?"Try a different category or article type to explore more of the journal.":`There are no published articles ${author?"by this author":"in this collection"} yet. Come back for considered guidance and useful comparisons.`}/>}<Pagination result={result} path={path} query={query}/></div>;
}

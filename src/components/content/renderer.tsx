import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ContentRecord, DocNode, SiteSettings, SourceReference } from "@/lib/types";
import { amazonDestination, contentPath } from "@/lib/content";
import { getPublicContentById, getPublicProduct, getSettings } from "@/lib/server/content";
import { AffiliateLink } from "@/components/public/client";
import { CategoryIllustration } from "@/components/public/illustrations";
import s from "@/components/public/public.module.css";

export function documentText(node:DocNode):string { return node.text || (node.content || []).map(documentText).join(" "); }
export function hasDocumentNode(node:DocNode,type:string):boolean {return node.type===type || Boolean(node.content?.some(child=>hasDocumentNode(child,type)));}
function headingId(node:DocNode,path:string) {return `${documentText(node).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "section"}-${path.replaceAll(".","-")}`;}
export function documentHeadings(doc:DocNode) {
  const items:{id:string;text:string;level:number}[]=[];
  function visit(node:DocNode,path:string) {if(node.type==="heading" && Number(node.attrs?.level || 2)<=3)items.push({id:headingId(node,path),text:documentText(node),level:Number(node.attrs?.level || 2)});node.content?.forEach((child,index)=>visit(child,`${path}.${index}`));}
  visit(doc,"0");return items;
}
export function safePublicUrl(value:unknown):string|null {
  if(typeof value!=="string" || !value || /[\u0000-\u0020\\]/.test(value))return null;
  if(value.startsWith("/")&&!value.startsWith("//"))return value;
  if(value.startsWith("#"))return value;
  try {const url=new URL(value);return url.protocol==="https:" || url.protocol==="http:" ? url.href : null;}catch{return null;}
}

export async function ProductCard({id,articleId,settings}:{id:string;articleId:string;settings:SiteSettings}) {
  const product=await getPublicProduct(id);if(!product)return null;
  const d=product.data;const destination=amazonDestination(d,settings.affiliateTag);
  return <section className={s.product} aria-label={d.title}>{d.recommendation&&<p className={s.productLabel}>{d.recommendation}</p>}<div className={s.productIntro}><div className={s.productArt}>{safePublicUrl(d.image)?<img src={d.image} alt={d.imageAlt || d.title} loading="lazy"/>:<CategoryIllustration/>}</div><div>{d.brand&&<p className={s.kicker}>{d.brand}</p>}<h3>{d.title}</h3>{d.excerpt&&<p>{d.excerpt}</p>}</div></div>{d.specifications.length>0&&<dl>{d.specifications.map((spec,index)=><div key={`${spec.key}-${index}`}><dt>{spec.key.replaceAll("_"," ")}</dt><dd>{spec.value} {spec.unit}{safePublicUrl(spec.sourceUrl)&&<> <a href={spec.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Source for ${spec.key}`}><ExternalLink size={11} aria-hidden="true"/></a></>}</dd></div>)}</dl>}{(d.strengths.length>0||d.limitations.length>0)&&<div className={s.prosCons}>{d.strengths.length>0&&<div><h4>Reasons to consider</h4><ul>{d.strengths.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}{d.limitations.length>0&&<div><h4>Keep in mind</h4><ul>{d.limitations.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}</div>}{destination&&<AffiliateLink href={destination} articleId={articleId} productId={product.id} analyticsEnabled={settings.analyticsEnabled}>View on Amazon</AffiliateLink>}</section>;
}

async function Comparison({ids,articleId,settings}:{ids:string[];articleId:string;settings:SiteSettings}) {
  const products=(await Promise.all(ids.slice(0,8).map(getPublicProduct))).filter((p):p is ContentRecord=>!!p);
  if(products.length<2)return null;
  const keys=[...new Set(products.flatMap(product=>product.data.specifications.map(spec=>spec.key)))];
  return <div className={s.tableScroll} role="region" aria-label="Product comparison; scroll horizontally for more products" tabIndex={0}><table><caption style={{padding:14,textAlign:"left",fontWeight:600}}>At a glance</caption><thead><tr><th scope="col">Specification</th>{products.map(product=><th key={product.id} scope="col">{product.data.title}</th>)}</tr></thead><tbody>{keys.map(key=><tr key={key}><th scope="row">{key.replaceAll("_"," ")}</th>{products.map(product=>{const spec=product.data.specifications.find(item=>item.key===key);return <td key={product.id}>{spec?`${spec.value} ${spec.unit}`:"Not specified"}</td>;})}</tr>)}<tr><th scope="row">Product link</th>{products.map(product=>{const destination=amazonDestination(product.data,settings.affiliateTag);return <td key={product.id}>{destination?<AffiliateLink href={destination} articleId={articleId} productId={product.id} analyticsEnabled={settings.analyticsEnabled} placement="comparison">Amazon</AffiliateLink>:"Not available"}</td>;})}</tr></tbody></table></div>;
}

export async function ContentRenderer({document,articleId="",settings:providedSettings,sources=[]}:{document:DocNode;articleId?:string;settings?:SiteSettings;sources?:SourceReference[]}) {
  const settings=providedSettings || await getSettings();
  async function render(node:DocNode,path:string):Promise<ReactNode> {
    const attrs=node.attrs || {};
    const children=await Promise.all((node.content || []).map((child,index)=>render(child,`${path}.${index}`)));
    const text=String(attrs.text || "");
    if(node.type==="text") {
      let result:ReactNode=node.text || "";
      for(const mark of node.marks || []) {
        if(mark.type==="bold")result=<strong>{result}</strong>;
        if(mark.type==="italic")result=<em>{result}</em>;
        if(mark.type==="strike")result=<s>{result}</s>;
        if(mark.type==="underline")result=<u>{result}</u>;
        if(mark.type==="code")result=<code>{result}</code>;
        if(mark.type==="link") { const href=safePublicUrl(mark.attrs?.href);if(href)result=<a href={href} rel={mark.attrs?.affiliate?"sponsored nofollow noopener":href.startsWith("http")?"noopener noreferrer":undefined}>{result}</a>; }
      }
      return <Fragment key={path}>{result}</Fragment>;
    }
    switch(node.type) {
      case "doc": return <Fragment key={path}>{children}</Fragment>;
      case "paragraph": return <p key={path}>{children}</p>;
      case "heading": {const level=Math.min(4,Math.max(2,Number(attrs.level)||2));const id=headingId(node,path);return level===2?<h2 key={path} id={id}>{children}</h2>:level===3?<h3 key={path} id={id}>{children}</h3>:<h4 key={path} id={id}>{children}</h4>;}
      case "bulletList": return <ul key={path}>{children}</ul>;
      case "orderedList": return <ol key={path} start={Number(attrs.start)||1}>{children}</ol>;
      case "listItem": return <li key={path}>{children}</li>;
      case "blockquote": return <blockquote key={path}>{children}</blockquote>;
      case "hardBreak": return <br key={path}/>;
      case "horizontalRule": return <hr key={path}/>;
      case "codeBlock": return <pre key={path}><code>{documentText(node)}</code></pre>;
      case "image": {const src=safePublicUrl(attrs.src);return src?<figure key={path}><img src={src} alt={String(attrs.alt || "")} loading="lazy"/>{Boolean(attrs.caption || attrs.credit)&&<figcaption>{String(attrs.caption || "")}{attrs.credit?` · ${String(attrs.credit)}`:""}</figcaption>}</figure>:null;}
      case "table": return <div key={path} className={s.tableScroll} role="region" aria-label="Article table; scroll horizontally if needed" tabIndex={0}><table><tbody>{children}</tbody></table></div>;
      case "tableRow": return <tr key={path}>{children}</tr>;
      case "tableHeader": return <th key={path} scope="col" colSpan={Math.max(1,Math.min(10,Number(attrs.colspan)||1))}>{children}</th>;
      case "tableCell": return <td key={path} colSpan={Math.max(1,Math.min(10,Number(attrs.colspan)||1))}>{children}</td>;
      case "productCard": return typeof attrs.productId==="string"?<ProductCard key={path} id={attrs.productId} articleId={articleId} settings={settings}/>:null;
      case "comparison": case "comparisonTable": case "productComparison": return Array.isArray(attrs.productIds)?<Comparison key={path} ids={attrs.productIds.filter((id):id is string=>typeof id==="string")} articleId={articleId} settings={settings}/>:null;
      case "affiliateDisclosure": return <aside key={path} className={s.disclosure}>{text || "As an Amazon Associate, we earn from qualifying purchases."}</aside>;
      case "callout": case "verdict": return <aside key={path} className={s.callout}>{Boolean(attrs.title)&&<strong>{String(attrs.title)}</strong>}{text&&<p>{text}</p>}{children}</aside>;
      case "prosCons": return <div key={path} className={s.prosCons}>{Array.isArray(attrs.pros)&&<div><h4>Reasons to consider</h4><ul>{attrs.pros.map((item,index)=><li key={index}>{String(item)}</li>)}</ul></div>}{Array.isArray(attrs.cons)&&<div><h4>Keep in mind</h4><ul>{attrs.cons.map((item,index)=><li key={index}>{String(item)}</li>)}</ul></div>}</div>;
      case "faq": case "questionAnswer": return <details key={path} className={s.faq}><summary>{String(attrs.question || attrs.title || "Question")}</summary><div>{attrs.answer?<p>{String(attrs.answer)}</p>:children}</div></details>;
      case "relatedArticle": {const related=typeof attrs.articleId==="string"?await getPublicContentById(attrs.articleId):null;return related&&related.kind==="article"?<p key={path}>Related reading: <Link href={contentPath(related.kind,related.data)}>{related.data.title}</Link></p>:null;}
      case "sourceList": return sources.length?<section key={path} className={s.sources} aria-label="Sources"><h2>Sources &amp; further reading</h2><ol>{sources.map((source,index)=><li key={`${source.url}-${index}`}>{safePublicUrl(source.url)?<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a>:source.title}{source.note&&<> — {source.note}</>}{source.verifiedAt&&<> <span>Accessed {source.verifiedAt.slice(0,10)}.</span></>}</li>)}</ol></section>:null;
      default: return null;
    }
  }
  return <>{await render(document,"0")}</>;
}
export default ContentRenderer;


import type { ArticleType, ContentData, ContentKind, DocNode } from "./types";
export const typeLabels: Record<ArticleType,string> = { REVIEW: "Review", BUYING_GUIDE: "Buying guide", COMPARISON: "Comparison", GUIDE: "Practical guide" };
export const typeSegments: Record<ArticleType,string> = { REVIEW: "reviews", BUYING_GUIDE: "buying-guides", COMPARISON: "comparisons", GUIDE: "guides" };
export function articlePath(type: ArticleType, slug: string) { return `/${typeSegments[type]}/${slug}`; }
export function contentPath(kind: ContentKind, data: Pick<ContentData,"articleType"|"slug">) { return kind === "article" ? articlePath(data.articleType, data.slug) : kind === "page" ? `/${data.slug}` : ""; }
export function slugify(text: string) { return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,120); }
export function documentText(node: DocNode): string { return [node.text ?? "", ...(node.content ?? []).map(documentText)].join(" ").trim(); }
export function safeHref(value: string): boolean { if (value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u0020]/.test(value)) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }
export function amazonDestination(data: Pick<ContentData,"asin"|"amazonUrl">, tag: string): string | null {
  let url: URL;
  try { url = data.amazonUrl ? new URL(data.amazonUrl) : new URL(`https://www.amazon.com/dp/${data.asin}`); } catch { return null; }
  if (url.protocol !== "https:" || !["www.amazon.com","amazon.com","amzn.to"].includes(url.hostname) || url.username || url.password || url.port) return null;
  if (!data.amazonUrl && !/^[A-Z0-9]{10}$/.test(data.asin)) return null;
  if (tag && url.hostname !== "amzn.to") url.searchParams.set("tag",tag);
  return url.href;
}
export function collectDocumentRefs(node: DocNode): {products:string[];media:string[];articles:string[]} {
  const products=new Set<string>(), media=new Set<string>(), articles=new Set<string>();
  const visit=(n:DocNode)=>{ const a=n.attrs??{}; if(n.type==="productCard"&&typeof a.productId==="string")products.add(a.productId); if(["comparisonTable","productComparison"].includes(n.type)&&Array.isArray(a.productIds))a.productIds.filter((v):v is string=>typeof v==="string").forEach(v=>products.add(v)); if(n.type==="image"&&typeof a.src==="string")media.add(a.src); if(n.type==="relatedArticle"&&typeof a.articleId==="string")articles.add(a.articleId); n.content?.forEach(visit); };visit(node);
  return {products:[...products],media:[...media],articles:[...articles]};
}

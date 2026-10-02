import type {MetadataRoute} from "next";
import {getDB} from "@/lib/server/db";
import {indexingEnabled,siteUrl} from "@/lib/seo";
import {typeSegments} from "@/lib/content";
import type {ArticleType} from "@/lib/types";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(!await indexingEnabled())return [];
 const [db,base]=await Promise.all([getDB(),siteUrl()]);
 const live="c.state='PUBLISHED' AND c.kind='article' AND c.is_demo=0 AND json_extract(r.data,'$.noindex')=0";
 const [paths,types,categories,authors,tags]=await Promise.all([
  db.prepare("SELECT c.public_path,coalesce(c.live_updated_at,c.published_at) updated_at FROM content_records c JOIN revisions r ON r.id=c.live_revision_id WHERE c.state='PUBLISHED' AND c.is_demo=0 AND c.kind<>'product' AND json_extract(r.data,'$.noindex')=0 AND c.public_path IS NOT NULL ORDER BY c.published_at DESC LIMIT 45000").all<{public_path:string;updated_at:string}>(),
  db.prepare(`SELECT DISTINCT json_extract(r.data,'$.articleType') type FROM content_records c JOIN revisions r ON r.id=c.live_revision_id WHERE ${live}`).all<{type:ArticleType}>(),
  db.prepare(`SELECT DISTINCT cat.slug FROM categories cat CROSS JOIN content_records c JOIN revisions r ON r.id=c.live_revision_id JOIN json_each(r.data,'$.categoryIds') j ON j.value=cat.id WHERE cat.visible=1 AND ${live}`).all<{slug:string}>(),
  db.prepare(`SELECT DISTINCT a.slug FROM authors a CROSS JOIN content_records c JOIN revisions r ON r.id=c.live_revision_id WHERE json_extract(r.data,'$.authorId')=a.id AND trim(a.biography)<>'' AND ${live}`).all<{slug:string}>(),
  db.prepare(`SELECT DISTINCT t.slug FROM tags t CROSS JOIN content_records c JOIN revisions r ON r.id=c.live_revision_id JOIN json_each(r.data,'$.tagIds') j ON j.value=t.id WHERE t.indexable=1 AND ${live}`).all<{slug:string}>(),
 ]);
 const archive=types.results.flatMap(({type})=>typeSegments[type]?[{url:`${base}/${typeSegments[type]}`}]:[]);
 return [{url:base},{url:`${base}/blog`},{url:`${base}/categories`},...archive,...paths.results.map(r=>({url:`${base}${r.public_path}`,lastModified:new Date(r.updated_at)})),...categories.results.map(c=>({url:`${base}/categories/${c.slug}`})),...authors.results.map(a=>({url:`${base}/authors/${a.slug}`})),...tags.results.map(t=>({url:`${base}/tags/${t.slug}`}))];
}

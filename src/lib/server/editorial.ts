import "server-only";
import { getDB } from "./db";
import { getRecord, getPublicProduct, listCategories, listAuthors } from "./content";
import { parseContent, slugSchema } from "@/lib/validation";
import { amazonDestination, collectDocumentRefs, contentPath, documentText } from "@/lib/content";
import { defaultContent, type ContentData, type ContentKind, type ContentRecord } from "@/lib/types";
import type { User } from "./auth";

export class AppError extends Error {constructor(message:string,public status=400){super(message);this.name="AppError";}}
export const now=()=>new Date().toISOString();
export async function audit(actor:string,action:string,target:string,context:Record<string,unknown>={}){const db=await getDB();await db.prepare("INSERT INTO audit_log(id,actor_id,action,target_id,context,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor,action,target,JSON.stringify(context),now()).run();}
export function canEdit(user:User,record:ContentRecord){if(user.role==="ANALYST"||(user.role==="AUTHOR"&&(record.kind!=="article"||record.createdBy!==user.id))||(record.kind==="page"&&!["OWNER","ADMIN"].includes(user.role)))throw new AppError("You do not have permission to edit this content.",403);}
export async function requireRecord(id:string,user:User){const record=await getRecord(id);if(!record)throw new AppError("Content not found.",404);canEdit(user,record);return record;}
export async function createRecord(kind:ContentKind,value:unknown,user:User){
 if(!["article","product","page"].includes(kind))throw new AppError("Invalid content type.");
 if(user.role==="ANALYST"||(user.role==="AUTHOR"&&kind!=="article")||(kind==="page"&&!["OWNER","ADMIN"].includes(user.role)))throw new AppError("You cannot create this content.",403);
 const data=parseContent(value),id=crypto.randomUUID(),revisionId=crypto.randomUUID(),time=now(),db=await getDB();
 await db.batch([db.prepare("INSERT INTO content_records(id,kind,created_by,created_at,updated_at,draft_revision_id) VALUES(?,?,?,?,?,?)").bind(id,kind,user.id,time,time,revisionId),db.prepare("INSERT INTO revisions(id,content_id,data,created_by,created_at) VALUES(?,?,?,?,?)").bind(revisionId,id,JSON.stringify(data),user.id,time)]);
 await audit(user.id,"content.create",id,{kind});return (await getRecord(id))!;
}
export async function saveRecord(id:string,value:unknown,version:number,user:User){
 const record=await requireRecord(id,user);if(record.version!==version)throw new AppError("Someone else saved this content. Reload to review their changes before saving.",409);if(record.workflow==="SCHEDULED")throw new AppError("Cancel the schedule before changing this revision.",409);
 const data=parseContent(value),revisionId=crypto.randomUUID(),time=now(),db=await getDB();
 const results=await db.batch([db.prepare("INSERT INTO revisions(id,content_id,data,created_by,created_at) SELECT ?,id,?,?,? FROM content_records WHERE id=? AND version=?").bind(revisionId,JSON.stringify(data),user.id,time,id,version),db.prepare("UPDATE content_records SET draft_revision_id=?,version=version+1,updated_at=? WHERE id=? AND version=?").bind(revisionId,time,id,version)]);
 if(results[1].meta.changes!==1)throw new AppError("Your save conflicts with a newer edit. Your unsaved work is still here.",409);
 await audit(user.id,"content.save",id);return (await getRecord(id))!;
}
const reservedPages=new Set(["admin","api","preview","blog","reviews","buying-guides","comparisons","guides","categories","authors","tags","search","contact","sitemap.xml","robots.txt","rss.xml","favicon.ico"]);
export async function publishChecks(record:ContentRecord,data:ContentData):Promise<string[]>{
 const errors:string[]=[];if(record.isDemo)errors.push("Demo content cannot be published.");if(!data.title.trim())errors.push("Add a title.");if(!slugSchema.safeParse(data.slug).success)errors.push("Add a valid slug.");if(record.kind!=="product"&&!data.excerpt.trim())errors.push("Add an excerpt.");if(record.kind==="page"&&!data.ownerReviewed)errors.push("Confirm that the content and factual claims have been reviewed.");
 if(record.kind!=="product"&&!documentText(data.document).trim())errors.push("Write the article or page content.");
 if(record.kind==="page"&&reservedPages.has(data.slug))errors.push("This path is reserved for the application.");
 if(record.kind==="article"){
  const [categories,authors]=await Promise.all([listCategories(),listAuthors()]);if(!data.categoryIds.length||data.categoryIds.some(id=>!categories.some(c=>c.id===id)))errors.push("Select active categories.");const author=authors.find(a=>a.id===data.authorId);if(!author?.biography.trim())errors.push("Choose an author with a real biography.");if(data.faqs.some(f=>!f.question.trim()||!f.answer.trim()))errors.push("Complete each FAQ with a question and an answer, or remove it.");
 }
 if(record.kind==="product"){
  if(!data.amazonUrl||!amazonDestination(data,""))errors.push("Add the product's Amazon.com URL.");if(!data.image)errors.push("Upload a product image.");if(data.specifications.some(s=>s.value&&!s.sourceUrl))errors.push("Every product specification needs a source URL.");
 }
 if(data.sources.some(s=>!s.title.trim()||!s.verifiedAt||Number.isNaN(Date.parse(s.verifiedAt))))errors.push("Sources need a title and verification date.");
 const refs=collectDocumentRefs(data.document);const db=await getDB();
 for(const id of [...new Set([...data.productIds,...refs.products])])if(!await getPublicProduct(id))errors.push("A referenced product is not published.");
 for(const id of [...new Set([...data.relatedIds,...refs.articles])]){const row=await db.prepare("SELECT id FROM content_records WHERE id=? AND kind='article' AND state='PUBLISHED' AND is_demo=0").bind(id).first();if(!row)errors.push("A related article is not published.");}
 const media=[...refs.media,...(data.image?[data.image]:[])];if(data.image&&!data.imageAlt.trim())errors.push("Add the featured image alt text.");
 for(const path of media){const asset=await db.prepare("SELECT visibility,license,alt FROM media_assets WHERE id=?").bind(path.split("/").pop()!).first<{visibility:string;license:string;alt:string}>();if(!asset||asset.visibility!=="PUBLIC"||!asset.license.trim()||!asset.alt.trim())errors.push("All images must be approved for public use, licensed, and have alt text.");}
 const path=contentPath(record.kind,data);if(path){const clash=await db.prepare("SELECT id FROM content_records WHERE public_path=? AND id<>? UNION SELECT id FROM redirects WHERE source=? LIMIT 1").bind(path,record.id,path).first();if(clash)errors.push("This public path is already in use or reserved by a redirect.");}
 return [...new Set(errors)];
}
export async function publishRevision(id:string,revisionId:string,actor:string,expectedVersion?:number){
 const db=await getDB(),record=await getRecord(id);if(!record)throw new AppError("Content not found.",404);
 if(record.liveRevisionId===revisionId&&record.state==="PUBLISHED")return record;
 if(record.draftRevisionId!==revisionId)throw new AppError("This is no longer the approved draft.",409);
 if(expectedVersion!==undefined&&record.version!==expectedVersion)throw new AppError("Content changed. Reload before publishing.",409);
 const row=await db.prepare("SELECT data FROM revisions WHERE id=? AND content_id=?").bind(revisionId,id).first<{data:string}>();if(!row)throw new AppError("Revision not found.",404);const data=parseContent(JSON.parse(row.data));const errors=await publishChecks(record,data);if(errors.length)throw new AppError(errors.join(" "));
 const time=now(),path=contentPath(record.kind,data),old=await db.prepare("SELECT public_path FROM content_records WHERE id=?").bind(id).first<{public_path:string|null}>();
 const guard="EXISTS(SELECT 1 FROM content_records WHERE id=? AND live_revision_id=? AND version=?)";
 const queries=[db.prepare("UPDATE content_records SET live_revision_id=?,draft_revision_id=NULL,state='PUBLISHED',public_path=?,published_at=coalesce(published_at,?),live_updated_at=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND draft_revision_id=?").bind(revisionId,path||null,time,time,time,id,record.version,revisionId),db.prepare(`UPDATE revisions SET workflow='SUPERSEDED' WHERE content_id=? AND id<>? AND workflow='PUBLISHED' AND ${guard}`).bind(id,revisionId,id,revisionId,record.version+1),db.prepare(`UPDATE revisions SET workflow='PUBLISHED' WHERE id=? AND ${guard}`).bind(revisionId,id,revisionId,record.version+1),db.prepare(`DELETE FROM public_search WHERE content_id=? AND ${guard}`).bind(id,id,revisionId,record.version+1)];
 if(record.kind==="article")queries.push(db.prepare(`INSERT INTO public_search(content_id,title,excerpt,body) SELECT ?,?,?,? WHERE ${guard}`).bind(id,data.title,data.excerpt,documentText(data.document),id,revisionId,record.version+1));
 if(old?.public_path&&path&&old.public_path!==path){queries.push(db.prepare(`INSERT INTO redirects(id,source,target,created_at) SELECT ?,?,?,? WHERE ${guard}`).bind(crypto.randomUUID(),old.public_path,path,time,id,revisionId,record.version+1));queries.push(db.prepare(`UPDATE redirects SET target=? WHERE target=? AND ${guard}`).bind(path,old.public_path,id,revisionId,record.version+1));}
 const result=await db.batch(queries);if(result[0].meta.changes!==1)throw new AppError("The draft changed during publishing. Reload and review it.",409);
 await audit(actor,"content.publish",id,{revisionId,path});return (await getRecord(id))!;
}
export async function recordAction(id:string,action:string,version:number,user:User,extra:{scheduledAt?:string;revisionId?:string}={}){
 const record=await requireRecord(id,user),db=await getDB();if(record.version!==version)throw new AppError("Content changed. Reload before continuing.",409);
 if(action==="duplicate")return createRecord(record.kind,{...record.data,title:`${record.data.title} (copy)`,slug:`${record.data.slug}-copy`,ownerReviewed:false,noindex:true},user);
 if(action==="restoreRevision"){const row=await db.prepare("SELECT data FROM revisions WHERE id=? AND content_id=?").bind(extra.revisionId??"",id).first<{data:string}>();if(!row)throw new AppError("Revision not found.",404);return saveRecord(id,{...JSON.parse(row.data),ownerReviewed:false},version,user);}
 if(user.role==="AUTHOR"&&action!=="review")throw new AppError("An editor must perform this action.",403);
 if(action==="publish")return publishRevision(id,record.draftRevisionId??record.liveRevisionId??"",user.id,version);
 if(action==="schedule"){
  if(!record.draftRevisionId)throw new AppError("Save a new draft before scheduling.");const date=new Date(extra.scheduledAt??"");if(Number.isNaN(date.valueOf())||date.valueOf()<=Date.now())throw new AppError("Choose a future date and time with its UTC offset.");const errors=await publishChecks(record,record.data);if(errors.length)throw new AppError(errors.join(" "));
  const time=now(),jobId=crypto.randomUUID();const results=await db.batch([db.prepare("UPDATE content_records SET version=version+1,updated_at=? WHERE id=? AND version=?").bind(time,id,version),db.prepare("UPDATE revisions SET workflow='SCHEDULED' WHERE id=? AND EXISTS(SELECT 1 FROM content_records WHERE id=? AND version=?)").bind(record.draftRevisionId,id,version+1),db.prepare("INSERT INTO jobs(id,kind,work_key,content_id,revision_id,scheduled_at,created_at,updated_at) SELECT ?,'publish',?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM content_records WHERE id=? AND version=?)").bind(jobId,`publish:${record.draftRevisionId}`,id,record.draftRevisionId,date.toISOString(),time,time,id,version+1)]);if(results[0].meta.changes!==1)throw new AppError("Schedule conflicts with another edit.",409);
 }else if(action==="cancelSchedule"){
  await db.batch([db.prepare("UPDATE jobs SET status='CANCELLED',updated_at=? WHERE content_id=? AND status IN ('PENDING','FAILED')").bind(now(),id),db.prepare("UPDATE revisions SET workflow='DRAFT' WHERE id=? AND workflow='SCHEDULED'").bind(record.draftRevisionId),db.prepare("UPDATE content_records SET version=version+1,updated_at=? WHERE id=? AND version=?").bind(now(),id,version)]);
 }else if(action==="review"||action==="approve"){
  if(!record.draftRevisionId||record.workflow==="SCHEDULED")throw new AppError("Save an editable draft first.");const result=await db.batch([db.prepare("UPDATE content_records SET version=version+1,updated_at=? WHERE id=? AND version=?").bind(now(),id,version),db.prepare("UPDATE revisions SET workflow=? WHERE id=? AND EXISTS(SELECT 1 FROM content_records WHERE id=? AND version=?)").bind(action==="review"?"IN_REVIEW":"APPROVED",record.draftRevisionId,id,version+1)]);if(result[0].meta.changes!==1)throw new AppError("Content changed.",409);
 }else if(["unpublish","archive","trash","restore"].includes(action)){
  if(record.kind==="product"&&action!=="restore"){const usage=await db.prepare("SELECT c.id FROM content_records c JOIN revisions r ON r.id=c.live_revision_id,json_tree(r.data) jt WHERE c.state='PUBLISHED' AND c.id<>? AND jt.type='text' AND jt.value=? LIMIT 1").bind(id,id).first();if(usage)throw new AppError("This product is used by live content. Replace those references first.",409);}
  const state=action==="archive"?"ARCHIVED":action==="trash"?"TRASHED":"UNPUBLISHED";const result=await db.batch([db.prepare("UPDATE content_records SET state=?,version=version+1,updated_at=? WHERE id=? AND version=?").bind(state,now(),id,version),db.prepare("DELETE FROM public_search WHERE content_id=? AND EXISTS(SELECT 1 FROM content_records WHERE id=? AND version=?)").bind(id,id,version+1),db.prepare("UPDATE jobs SET status='CANCELLED',updated_at=? WHERE content_id=? AND status IN('PENDING','FAILED')").bind(now(),id)]);if(result[0].meta.changes!==1)throw new AppError("Content changed.",409);
 }else throw new AppError("Unknown editorial action.");
 await audit(user.id,`content.${action}`,id);return (await getRecord(id))!;
}
export async function seedPages(){
 const db=await getDB();const pages:Record<string,{title:string;text:string}>={"about":{title:"About PowerPlugPicks",text:"PowerPlugPicks is an independent publication about power accessories. We help readers compare features and understand the questions to ask before buying. Our publication covers surge protectors, power strips, extension cords, towers, and wall outlets."},"how-we-review":{title:"How we review",text:"Our articles should explain their research basis, cite product documentation, and distinguish manufacturer claims from our own observations. We do not claim hands-on testing unless it actually took place. Recommendations consider relevant features, limitations, and intended use."},"editorial-policy":{title:"Editorial policy",text:"Our editorial recommendations must have an evidence-based reason. Affiliate relationships do not determine product order. Product claims should link to sources and include verification dates. Corrections can be submitted through the contact page."},"affiliate-disclosure":{title:"Affiliate disclosure",text:"As an Amazon Associate I earn from qualifying purchases. Some links on this website are affiliate links. If you make a qualifying purchase after following a link, we may receive a commission. Prices and availability are shown on Amazon."},"privacy-policy":{title:"Privacy policy",text:"Owner review required before publication: describe the configured contact form, analytics consent, email provider, retention periods, identity, and contact details. Do not publish until this information reflects your operation."},"terms":{title:"Terms of use",text:"Owner review required before publication: add terms appropriate to your publication, identity, and jurisdiction. Our editorial material is general information. Product use must follow manufacturer instructions and applicable requirements."}};
 for(const [slug,page]of Object.entries(pages)){const id=`page-${slug}`,rev=`seed-${slug}`;const data={...defaultContent,title:page.title,slug,excerpt:page.text.slice(0,180),document:{type:"doc",content:[{type:"paragraph",content:[{type:"text",text:page.text}]}]}};await db.batch([db.prepare("INSERT OR IGNORE INTO content_records(id,kind,created_by,created_at,updated_at,draft_revision_id) VALUES(?,'page','system',?,?,?)").bind(id,now(),now(),rev),db.prepare("INSERT OR IGNORE INTO revisions(id,content_id,data,created_by,created_at) VALUES(?,?,?,'system',?)").bind(rev,id,JSON.stringify(data),now())]);}
}

import { z } from "zod";
import { requireUser,assertSameOrigin,requireRole } from "@/lib/server/auth";
import { ADMIN_ROLES,EDITOR_ROLES,WRITER_ROLES } from "@/lib/server/permissions";
import { getDB } from "@/lib/server/db";
import { getSettings,listAdminContent,listPublicContent } from "@/lib/server/content";
import { createRecord,saveRecord,recordAction,requireRecord,audit,AppError,now,seedPages } from "@/lib/server/editorial";
import { overview,analytics,listTaxonomy,saveTaxonomy,deleteTaxonomy,saveSettings,listMedia,systemStatus,seoReport,saveRedirect } from "@/lib/server/admin";
import { uploadMedia,updateMedia,deleteMedia } from "@/lib/server/media";
import { json,apiError,body } from "@/lib/server/http";
import type { ContentKind,Role } from "@/lib/types";
export const dynamic="force-dynamic";
type Context={params:Promise<{resource:string;id?:string[]}>};
async function handle(request:Request,context:Context){
 try{
  const {resource,id:parts}=await context.params;const id=parts?.[0];if(parts&&parts.length>1)throw new AppError("Not found.",404);
  const read=request.method==="GET",user=await requireUser(undefined,{allowUnenrolled:read}),db=await getDB();if(!read)await assertSameOrigin(request);const query=new URL(request.url).searchParams;
  if(read){
   if(resource==="overview")return json(await overview(user));
   if(resource==="content"){
    requireRole(user,WRITER_ROLES);if(id){const record=await requireRecord(id,user);const revisions=await db.prepare("SELECT id,workflow,created_at as createdAt,data FROM revisions WHERE content_id=? ORDER BY created_at DESC LIMIT 50").bind(id).all<{id:string;workflow:string;createdAt:string;data:string}>();return json({record,revisions:revisions.results.map(r=>({...r,data:JSON.parse(r.data)}))});}
    const kind=z.enum(["article","product","page"]).parse(query.get("kind")??"article");if(kind==="page")requireRole(user,ADMIN_ROLES);const page=z.coerce.number().int().min(1).max(100000).parse(query.get("page")??1);if(kind==="product"&&user.role==="AUTHOR")return json(await listPublicContent({kind,page,q:query.get("q")?.slice(0,200)}));return json(await listAdminContent({kind,page,q:query.get("q")?.slice(0,200),state:query.get("state")||undefined,type:query.get("type")||undefined,createdBy:user.role==="AUTHOR"?user.id:undefined}));
   }
   if(["categories","authors","tags"].includes(resource))return json({items:await listTaxonomy(resource,user)});
   if(resource==="settings"){requireRole(user,ADMIN_ROLES);return json({settings:await getSettings()});}
   if(resource==="references"){requireRole(user,WRITER_ROLES);return json({settings:{affiliateTag:(await getSettings()).affiliateTag}});}
   if(resource==="media")return json({items:await listMedia(user)});
   if(resource==="analytics")return json(await analytics(user,Number(query.get("days")??30)));
   if(resource==="system")return json(await systemStatus(user));
   if(resource==="seo")return json(await seoReport(user));
   if(resource==="contacts"){requireRole(user,ADMIN_ROLES);return json({items:(await db.prepare("SELECT id,name,email,topic,message,status,created_at as createdAt FROM contacts ORDER BY created_at DESC LIMIT 200").all()).results});}
   if(resource==="users"){requireRole(user,ADMIN_ROLES);const items=await db.prepare("SELECT id,name,email,role,active,twoFactorEnabled FROM user ORDER BY name LIMIT 200").all<Record<string,unknown>>();return json({items:items.results.map(u=>({...u,active:!!u.active,twoFactorEnabled:!!u.twoFactorEnabled}))});}
   if(resource==="export"){
    requireRole(user,["OWNER"]);const [content,categories,authors,tags,settings]=await Promise.all([db.prepare("SELECT c.id,c.kind,c.state,c.version,c.is_demo,c.created_at,c.updated_at,c.published_at,c.public_path,r.data FROM content_records c JOIN revisions r ON r.id=coalesce(c.draft_revision_id,c.live_revision_id) LIMIT 10000").all(),listTaxonomy("categories",user),listTaxonomy("authors",user),listTaxonomy("tags",user),getSettings()]);await audit(user.id,"content.export","site");return new Response(JSON.stringify({format:"powerplugpicks-editorial-v1",exportedAt:now(),content:content.results,categories,authors,tags,settings},null,2),{headers:{"Content-Type":"application/json","Content-Disposition":'attachment; filename="powerplugpicks-editorial.json"',"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
   }
   throw new AppError("Not found.",404);
  }
  if(resource==="media"&&request.method==="POST")return json({item:await uploadMedia(request,user)},201);
  const value=request.method==="DELETE"?{}:await body(request);
  if(resource==="content"){
   requireRole(user,WRITER_ROLES);if(!id&&request.method==="POST")return json({record:await createRecord(z.enum(["article","product","page"]).parse(value.kind) as ContentKind,value.data,user)},201);
   if(!id)throw new AppError("Content ID is required.");const version=z.number().int().positive().parse(value.version);
   if(request.method==="PATCH")return json({record:await saveRecord(id,value.data,version,user)});
   if(request.method==="POST")return json({record:await recordAction(id,z.string().parse(value.action),version,user,{scheduledAt:typeof value.scheduledAt==="string"?value.scheduledAt:undefined,revisionId:typeof value.revisionId==="string"?value.revisionId:undefined})});
  }
  if(["categories","tags","authors"].includes(resource)){
   if(request.method==="DELETE"&&id){await deleteTaxonomy(resource,id,user);return json({ok:true});}
   if(request.method==="POST"||request.method==="PATCH")return json({item:await saveTaxonomy(resource,id,value,user)});
  }
  if(resource==="settings"&&request.method==="PUT")return json({settings:await saveSettings(value,user)});
  if(resource==="media"&&id){if(request.method==="PATCH")return json({item:await updateMedia(id,value,user)});if(request.method==="DELETE"){await deleteMedia(id,user);return json({ok:true});}}
  if(resource==="contacts"&&id&&request.method==="PATCH"){requireRole(user,ADMIN_ROLES);const status=z.enum(["NEW","READ","CLOSED"]).parse(value.status);await db.prepare("UPDATE contacts SET status=? WHERE id=?").bind(status,id).run();await audit(user.id,"contact.status",id,{status});return json({ok:true});}
  if(resource==="users"&&id&&request.method==="PATCH"){
   requireRole(user,ADMIN_ROLES);const role=z.enum(["OWNER","ADMIN","EDITOR","AUTHOR","ANALYST"]).parse(value.role),active=z.boolean().parse(value.active);const target=await db.prepare("SELECT id,role,active FROM user WHERE id=?").bind(id).first<{id:string;role:Role;active:number}>();if(!target)throw new AppError("User not found.",404);
   if(id===user.id)throw new AppError("Ask another owner to change your access.",403);if(user.role!=="OWNER"&&(target.role==="OWNER"||target.role==="ADMIN"||role==="OWNER"||role==="ADMIN"))throw new AppError("Only an owner may manage privileged accounts.",403);
   if(target.role==="OWNER"&&(!active||role!=="OWNER")){const owners=await db.prepare("SELECT count(*) n FROM user WHERE role='OWNER' AND active=1").first<{n:number}>();if((owners?.n??0)<2)throw new AppError("The final active owner must remain available.",409);}
   await db.batch([db.prepare("UPDATE user SET role=?,active=? WHERE id=?").bind(role,+active,id),db.prepare("DELETE FROM session WHERE userId=?").bind(id)]);await audit(user.id,"user.access",id,{role,active});return json({ok:true});
  }
  if(resource==="redirects"){if(request.method==="POST")return json({item:await saveRedirect(value,user)});if(request.method==="DELETE"&&id){requireRole(user,EDITOR_ROLES);await db.prepare("DELETE FROM redirects WHERE id=?").bind(id).run();await audit(user.id,"redirect.delete",id);return json({ok:true});}}
  if(resource==="jobs"&&id&&request.method==="POST"){requireRole(user,ADMIN_ROLES);await db.prepare("UPDATE jobs SET status='PENDING',attempts=0,lease_until=NULL,scheduled_at=?,updated_at=?,last_error=NULL WHERE id=? AND status='FAILED'").bind(now(),now(),id).run();await audit(user.id,"job.retry",id);return json({ok:true});}
  if(resource==="initialize"&&request.method==="POST"){requireRole(user,ADMIN_ROLES);await seedPages();return json({ok:true});}
  throw new AppError("Unsupported operation.",405);
 }catch(error){return apiError(error);}
}
export {handle as GET,handle as POST,handle as PATCH,handle as PUT,handle as DELETE};

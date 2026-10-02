import "server-only";
import {getDB,getEnv} from "./db";
import {publishRevision,now} from "./editorial";
export async function runJobs(){
 const [db,env]=await Promise.all([getDB(),getEnv()]);const time=now();const lease=new Date(Date.now()+5*60000).toISOString();
 await db.prepare("UPDATE jobs SET status='PENDING',lease_until=NULL WHERE status='RUNNING' AND lease_until<? AND attempts<5").bind(time).run();
 const due=await db.prepare("SELECT id FROM jobs WHERE status IN('PENDING','FAILED') AND scheduled_at<=? AND attempts<5 ORDER BY scheduled_at LIMIT 20").bind(time).all<{id:string}>();let completed=0,failed=0;
 for(const {id} of due.results){const job=await db.prepare("UPDATE jobs SET status='RUNNING',lease_until=?,attempts=attempts+1,updated_at=? WHERE id=? AND status IN('PENDING','FAILED') AND scheduled_at<=? RETURNING id,kind,content_id,revision_id,attempts").bind(lease,time,id,time).first<{id:string;kind:string;content_id:string;revision_id:string;attempts:number}>();if(!job)continue;
  try{if(job.kind!=="publish")throw new Error("Unsupported job type.");await publishRevision(job.content_id,job.revision_id,"scheduler");await db.prepare("UPDATE jobs SET status='DONE',lease_until=NULL,last_error=NULL,updated_at=? WHERE id=?").bind(now(),id).run();completed++;}catch(error){const message=error instanceof Error&&error.name==="AppError"?error.message:"The job failed. Review its content and configuration before retrying.";await db.prepare("UPDATE jobs SET status='FAILED',lease_until=NULL,last_error=?,scheduled_at=?,updated_at=? WHERE id=?").bind(message,new Date(Date.now()+Math.min(3600,60*2**job.attempts)*1000).toISOString(),now(),id).run();failed++;}
 }
 let emailsSent=0;
 if(env.RESEND_API_KEY&&env.EMAIL_FROM){
  // RUNNING messages receive a lease through next_attempt_at. Stable provider keys prevent duplicate delivery on retries.
  await db.prepare("UPDATE outbox SET status='PENDING' WHERE status='RUNNING' AND next_attempt_at<? AND attempts<5").bind(time).run();
  const messages=await db.prepare("SELECT id FROM outbox WHERE status IN('PENDING','FAILED') AND attempts<5 AND next_attempt_at<=? ORDER BY created_at LIMIT 20").bind(time).all<{id:string}>();
  for(const {id}of messages.results){const row=await db.prepare("UPDATE outbox SET status='RUNNING',attempts=attempts+1,next_attempt_at=? WHERE id=? AND status IN('PENDING','FAILED') RETURNING payload,attempts,created_at,kind").bind(lease,id).first<{payload:string;attempts:number;created_at:string;kind:string}>();if(!row)continue;
   if(["password-reset","invitation"].includes(row.kind)&&Date.now()-Date.parse(row.created_at)>25*60000){await db.prepare("UPDATE outbox SET status='EXPIRED',payload='{}',last_error='Request a new account email.' WHERE id=?").bind(id).run();continue;}
   try{const payload=JSON.parse(row.payload);const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":`outbox-${id}`},body:JSON.stringify({from:env.EMAIL_FROM,to:[payload.to],subject:payload.subject,text:payload.text}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`Email provider returned ${response.status}.`);await db.prepare("UPDATE outbox SET status='SENT',payload='{}',last_error=NULL WHERE id=?").bind(id).run();emailsSent++;}catch{await db.prepare("UPDATE outbox SET status='FAILED',last_error='Email delivery failed. Verify the sender and provider configuration.',next_attempt_at=? WHERE id=?").bind(new Date(Date.now()+2**row.attempts*60000).toISOString(),id).run();}
  }
 }
 await db.batch([db.prepare("DELETE FROM rate_limits WHERE reset_at<?").bind(Math.floor(Date.now()/1000)-3600),db.prepare("DELETE FROM analytics_events WHERE created_at<?").bind(new Date(Date.now()-90*86400000).toISOString()),db.prepare("UPDATE outbox SET payload='{}' WHERE kind IN('password-reset','invitation') AND created_at<?").bind(new Date(Date.now()-86400000).toISOString())]);
 return {completed,failed,emailsSent};
}

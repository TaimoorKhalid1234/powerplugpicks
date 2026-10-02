import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { request } from "@playwright/test";

if (process.env.LOCAL_QA !== "1") throw new Error("Set LOCAL_QA=1. This check mutates only local development resources.");
const root = "http://localhost:3000";
const fixture = JSON.parse(await readFile("artifacts/local-qa-auth.json", "utf8"));
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, "")]; }));
function totp(secret) { const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let bits=0,count=0;const bytes=[];for(const ch of secret.toUpperCase().replace(/=+$/, "")){bits=(bits<<5)|alphabet.indexOf(ch);count+=5;if(count>=8){count-=8;bytes.push((bits>>>count)&255);}}const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=createHmac("sha1",Buffer.from(bytes)).update(counter).digest();return ((digest.readUInt32BE(digest.at(-1)&15)&0x7fffffff)%1000000).toString().padStart(6,"0"); }
const api=await request.newContext({baseURL:root,extraHTTPHeaders:{Origin:root}});
const anonymous=await request.newContext({baseURL:root});
async function check(response,status,label){if(response.status()!==status)throw new Error(`${label}: expected ${status}, got ${response.status()} ${await response.text()}`);process.stdout.write(`${label}: HTTP ${status}\n`);return response.headers()["content-type"]?.includes("application/json")?response.json():response.text();}
let contentId,mediaId;
try {
  const signed=await check(await api.post("/api/auth/sign-in/email",{data:{email:fixture.email,password:fixture.password}}),200,"sign in");
  if(signed.twoFactorRedirect)await check(await api.post("/api/auth/two-factor/verify-totp",{data:{code:totp(fixture.totpSecret),trustDevice:false}}),200,"TOTP challenge");
  const source=await check(await api.get(`/api/admin/content/${fixture.articleId}`),200,"read source fixture");
  const slug="local-scheduled-job-check",path=`/guides/${slug}`;
  const data={...source.record.data,title:"Local Scheduled Job Check",slug,excerpt:"A temporary local article for the scheduled publishing test.",noindex:true,ownerReviewed:true};
  const created=await check(await api.post("/api/admin/content",{data:{kind:"article",data}}),201,"create scheduled draft");contentId=created.record.id;
  const scheduled=await check(await api.post(`/api/admin/content/${contentId}`,{data:{action:"schedule",version:created.record.version,scheduledAt:new Date(Date.now()+5000).toISOString()}}),200,"schedule revision");
  if(scheduled.record.workflow!=="SCHEDULED")throw new Error("Revision did not enter scheduled state.");
  await check(await anonymous.get(path),404,"scheduled article stays private");
  await new Promise(resolve=>setTimeout(resolve,5500));
  const cronHeaders={Authorization:`Bearer ${vars.CRON_SECRET}`};
  const first=await check(await anonymous.post("/api/jobs",{headers:cronHeaders}),200,"first job run");
  if(first.completed!==1||first.failed!==0)throw new Error(`Expected one published job: ${JSON.stringify(first)}`);
  const second=await check(await anonymous.post("/api/jobs",{headers:cronHeaders}),200,"duplicate job run");
  if(second.completed!==0||second.failed!==0)throw new Error(`Duplicate run changed state: ${JSON.stringify(second)}`);
  await check(await anonymous.get(path),200,"scheduled article is public");
  const current=await check(await api.get(`/api/admin/content/${contentId}`),200,"read published revision");
  await check(await api.post(`/api/admin/content/${contentId}`,{data:{action:"unpublish",version:current.record.version}}),200,"unpublish scheduled fixture");
  await check(await anonymous.get(path),404,"unpublished article hidden");

  const bad=await api.post("/api/admin/media",{multipart:{file:{name:"bad.svg",mimeType:"image/svg+xml",buffer:Buffer.from("<svg><script>alert(1)</script></svg>")},alt:"Bad",credit:"",license:"QA"}});
  await check(bad,400,"active image rejected");
  const png=await readFile("public/social.png");
  const upload=await check(await api.post("/api/admin/media",{multipart:{file:{name:"qa.png",mimeType:"image/png",buffer:png},alt:"Local QA graphic",credit:"",license:"Owned test asset"}}),201,"upload private image");
  mediaId=upload.item.id;
  await check(await anonymous.get(`/api/media/${mediaId}`),404,"private image hidden");
  await check(await api.get(`/api/media/${mediaId}`),200,"owner views private image");
  await check(await api.patch(`/api/admin/media/${mediaId}`,{data:{alt:"Local QA graphic",credit:"",license:"Owned test asset",visibility:"PUBLIC"}}),200,"approve image");
  await check(await anonymous.get(`/api/media/${mediaId}`),200,"approved image public");
  await check(await api.delete(`/api/admin/media/${mediaId}`),200,"delete unused image");mediaId=undefined;
  await check(await anonymous.get(`/api/media/${upload.item.id}`),404,"deleted image hidden");
  process.stdout.write("Scheduled publishing and media checks passed.\n");
} finally {
  if(mediaId)await api.delete(`/api/admin/media/${mediaId}`).catch(()=>{});
  if(contentId){const current=await api.get(`/api/admin/content/${contentId}`).catch(()=>null);if(current?.ok()){const record=(await current.json()).record;if(record.state==="PUBLISHED")await api.post(`/api/admin/content/${contentId}`,{data:{action:"unpublish",version:record.version}}).catch(()=>{});}}
  await api.dispose();await anonymous.dispose();
}

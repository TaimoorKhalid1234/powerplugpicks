import { readFile, writeFile } from "node:fs/promises";
import { createHmac, randomBytes } from "node:crypto";
if (process.env.LOCAL_QA !== "1") throw new Error("Set LOCAL_QA=1 to run this local check.");
const root = "http://localhost:3000";
const owner = JSON.parse(await readFile("artifacts/local-qa-auth.json", "utf8"));
const path = "artifacts/local-qa-invite.json";
let fixture;
try { fixture = JSON.parse(await readFile(path, "utf8")); } catch { fixture = { email: "qa-author@example.test", password: randomBytes(27).toString("base64url") }; }
function totp(secret) { const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let bits=0,count=0;const bytes=[];for(const ch of secret.toUpperCase().replace(/=+$/, "")){const n=alphabet.indexOf(ch);bits=(bits<<5)|n;count+=5;if(count>=8){count-=8;bytes.push((bits>>>count)&255);}}const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=createHmac("sha1",Buffer.from(bytes)).update(counter).digest();return ((digest.readUInt32BE(digest.at(-1)&15)&0x7fffffff)%1000000).toString().padStart(6,"0");}
class Client {cookies=new Map();async call(route, body, method="POST") { const r=await fetch(root+route,{method,redirect:"manual",headers:{Origin:root,...(body?{"Content-Type":"application/json"}:{}),...(this.cookies.size?{Cookie:[...this.cookies].map(([k,v])=>`${k}=${v}`).join("; ")}: {})},body:body?JSON.stringify(body):undefined});for(const c of r.headers.getSetCookie()){const m=/^([^=;]+)=([^;]*)/.exec(c);if(m){if(/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c))this.cookies.delete(m[1]);else this.cookies.set(m[1],m[2]);}}let data;const text=await r.text();try{data=JSON.parse(text)}catch{data={text}}return {status:r.status,data};}}
function check(label,result,expected){if(result.status!==expected)throw new Error(`${label}: expected ${expected}, got ${result.status}: ${JSON.stringify(result.data).slice(0,300)}`);process.stdout.write(`${label}: HTTP ${expected}\n`);return result.data;}
const admin=new Client();const signed=check("owner login",await admin.call("/api/auth/sign-in/email",{email:owner.email,password:owner.password}),200);if(signed.twoFactorRedirect)check("owner TOTP",await admin.call("/api/auth/two-factor/verify-totp",{code:totp(owner.totpSecret),trustDevice:false}),200);
if(!fixture.inviteUrl){const response=check("invite author",await admin.call("/api/admin/invitations",{name:"Local QA Author",email:fixture.email,role:"AUTHOR"}),201);if(!response.invitationUrl)throw new Error("Manual invitation URL missing.");fixture.inviteUrl=response.invitationUrl;await writeFile(path,JSON.stringify(fixture),{mode:0o600});}
const invite=new URL(fixture.inviteUrl);const token=invite.searchParams.get("token")??invite.pathname.split("/").pop();if(!token)throw new Error("Invitation token missing.");
if(!fixture.accepted){check("accept invitation",await admin.call("/api/auth/reset-password",{token,newPassword:fixture.password}),200);fixture.accepted=true;await writeFile(path,JSON.stringify(fixture),{mode:0o600});}
check("single-use invitation rejected",await admin.call("/api/auth/reset-password",{token,newPassword:randomBytes(24).toString("base64url")}),400);
const author=new Client();check("author login",await author.call("/api/auth/sign-in/email",{email:fixture.email,password:fixture.password}),200);
check("author cannot publish owner's article",await author.call(`/api/admin/content/${owner.articleId}`,{action:"publish",version:1}),403);
check("author cannot edit taxonomy",await author.call("/api/admin/categories",{name:"Denied",slug:"denied",description:""}),403);
check("author cannot view users",await author.call("/api/admin/users",undefined,"GET"),403);
check("public admin provisioning blocked",await author.call("/api/auth/admin/create-user",{email:"stranger@example.test",name:"Stranger"}),403);
check("author can create own draft",await author.call("/api/admin/content",{kind:"article",data:{title:"Local author draft",slug:"local-author-draft"}}),201);
check("sign out",await author.call("/api/auth/sign-out",{}),200);
check("revoked session loses access",await author.call("/api/admin/overview",undefined,"GET"),401);
process.stdout.write("Invitation, role, and session checks passed. Test user is recorded in ignored artifacts/local-qa-invite.json for cleanup.\n");

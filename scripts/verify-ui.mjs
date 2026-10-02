import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { chromium, request } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

if (process.env.LOCAL_QA !== "1") throw new Error("Set LOCAL_QA=1 to run this local check.");
const fixture = JSON.parse(await readFile("artifacts/local-qa-auth.json", "utf8"));
const root = "http://localhost:3000";
const api = await request.newContext({ baseURL: root, extraHTTPHeaders: { Origin: root } });
function totp(secret) { const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let bits=0,count=0;const bytes=[];for(const ch of secret.toUpperCase().replace(/=+$/, "")){const n=alphabet.indexOf(ch);bits=(bits<<5)|n;count+=5;if(count>=8){count-=8;bytes.push((bits>>>count)&255);}}const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=createHmac("sha1",Buffer.from(bytes)).update(counter).digest();return ((digest.readUInt32BE(digest.at(-1)&15)&0x7fffffff)%1000000).toString().padStart(6,"0");}
async function post(path,data,method="POST"){const response=method==="PATCH"?await api.patch(path,{data}):await api.post(path,{data});const body=await response.json();if(!response.ok())throw new Error(`${path}: HTTP ${response.status()} ${JSON.stringify(body).slice(0,250)}`);return body;}
let published = false;
let browser;
try {
  const sign=await post("/api/auth/sign-in/email",{email:fixture.email,password:fixture.password});
  if(sign.twoFactorRedirect)await post("/api/auth/two-factor/verify-totp",{code:totp(fixture.totpSecret),trustDevice:false});
  const current=await (await api.get(`/api/admin/content/${fixture.articleId}`)).json();
  const data={...current.record.data,title:"Local Article Template Check",slug:"local-article-template-check",excerpt:"A local fixture for checking the editorial article layout and workflow.",noindex:true,ownerReviewed:true,researchBasis:"This is local layout content used for interface verification only.",sources:[{title:"CPSC public information",url:"https://www.cpsc.gov",verifiedAt:"2026-10-01"}],document:{type:"doc",content:[{type:"heading",attrs:{level:2},content:[{type:"text",text:"Plan the setup"}]},{type:"paragraph",content:[{type:"text",text:"Start with the devices and outlet positions in the space. Review manufacturer documentation before choosing an accessory."}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Check the intended environment."}]}]},{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Compare cord length and outlet placement."}]}]}]},{type:"callout",attrs:{title:"A careful reminder",text:"Follow the product instructions for any accessory you use.",variant:"info"}},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Find more detail"}]},{type:"paragraph",content:[{type:"text",text:"Keep a record of the product information you relied on."}]},{type:"sourceList",attrs:{}}]}};
  const saved=await post(`/api/admin/content/${fixture.articleId}`,{version:current.record.version,data},"PATCH");
  await post(`/api/admin/content/${fixture.articleId}`,{action:"publish",version:saved.record.version});published=true;
  browser=await chromium.launch({channel:"msedge",headless:true});
  const context=await browser.newContext({storageState:await api.storageState(),viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));
  const results=[];await mkdir("artifacts/ui",{recursive:true});
  for(const [path,label,widths] of [["/guides/local-article-template-check","article",[360,390,768,1024,1440]],["/admin","dashboard",[390,1440]],[`/admin/articles/${fixture.articleId}`,"editor",[390,1440]],["/admin/settings","settings",[390,1440]],["/admin/media","media",[390,1440]]]) {
    for(const width of widths){await page.setViewportSize({width,height:1000});const response=await page.goto(root+path,{waitUntil:"networkidle"});const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));await page.screenshot({path:`artifacts/ui/${label}-${width}.png`,fullPage:true});const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();results.push({path,width,status:response.status(),...dimensions,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))});}
  }
  await writeFile("artifacts/ui/report.json",JSON.stringify({results,errors},null,2));
  for(const result of results)process.stdout.write(`${result.path} ${result.width}px: HTTP ${result.status}, overflow ${result.document-result.viewport}px, axe ${result.violations.length}\n`);
  if(errors.length||results.some(r=>r.status!==200||r.document>r.viewport||r.violations.length))throw new Error("UI verification found errors. See artifacts/ui/report.json.");
  process.stdout.write("Article and key admin visual/accessibility checks passed.\n");
} finally {
  if(browser)await browser.close();
  if(published){const response=await api.get(`/api/admin/content/${fixture.articleId}`);if(response.ok()){const current=await response.json();await post(`/api/admin/content/${fixture.articleId}`,{action:"unpublish",version:current.record.version});}}
  await api.dispose();
}

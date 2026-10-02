import type { Metadata } from "next";
import { getEnv } from "./server/db";
export async function siteUrl(){const env=await getEnv();const url=new URL(env.SITE_URL||"http://localhost:3000");if(env.APP_ENV==="production"&&url.protocol!=="https:")throw new Error("Production SITE_URL must use HTTPS.");return url.origin;}
export async function indexingEnabled(){const env=await getEnv();return env.APP_ENV==="production"&&env.ENABLE_INDEXING==="true";}
export async function pageMetadata(title:string,description:string,path:string,noindex=false):Promise<Metadata>{const base=await siteUrl();const index=await indexingEnabled()&&!noindex;return {title,description,alternates:{canonical:`${base}${path}`},robots:{index,follow:true},openGraph:{title,description,url:`${base}${path}`,siteName:"PowerPlugPicks",type:"website",images:[{url:`${base}/social.png`,width:1200,height:630}]},twitter:{card:"summary_large_image",title,description,images:[`${base}/social.png`]}};}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c");}

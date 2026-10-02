import { z } from "zod";
import { ARTICLE_TYPES, defaultContent, type DocNode } from "./types";
import { safeHref } from "./content";
export const slugSchema=z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Use lowercase words separated by hyphens.");
const https=z.string().max(2000).refine(v=>{try{return new URL(v).protocol==="https:"}catch{return false}},"Use an HTTPS URL.");
const nodeTypes=new Set(["doc","paragraph","text","heading","bulletList","orderedList","listItem","blockquote","codeBlock","hardBreak","horizontalRule","image","table","tableRow","tableCell","tableHeader","productCard","comparisonTable","productComparison","affiliateDisclosure","callout","verdict","prosCons","sourceList","relatedArticle"]);
export function validateDocument(value:unknown): value is DocNode {
  let count=0;
  const walk=(value:unknown,depth:number):boolean=>{
    if(!value||typeof value!=="object"||depth>24||++count>5000)return false;
    const n=value as DocNode;if(!nodeTypes.has(n.type)||n.text&& (typeof n.text!=="string"||n.text.length>20000))return false;
    if(n.attrs){if(typeof n.attrs!=="object"||Array.isArray(n.attrs))return false; if(n.type==="image"&&(!/^\/api\/media\/[a-zA-Z0-9-]+$/.test(String(n.attrs.src??""))||!String(n.attrs.alt??"").trim()))return false; if(n.type==="heading"&&![2,3,4].includes(Number(n.attrs.level)))return false;}
    if(n.marks&&(!Array.isArray(n.marks)||!n.marks.every(m=>["bold","italic","strike","code","link","underline"].includes(m.type)&&(m.type!=="link"||safeHref(String(m.attrs?.href??""))))))return false;
    return !n.content||(Array.isArray(n.content)&&n.content.every(child=>walk(child,depth+1)));
  };return JSON.stringify(value).length<=250000&&walk(value,0)&&(value as DocNode).type==="doc";
}
export const contentSchema=z.object({
 title:z.string().max(200),slug:z.string().max(120).refine(v=>v===""||slugSchema.safeParse(v).success,"Use a lowercase slug."),excerpt:z.string().max(1500),document:z.custom<DocNode>(validateDocument,"This document contains unsupported content or invalid images/links."),
 articleType:z.enum(ARTICLE_TYPES), categoryIds:z.array(z.string().max(100)).max(20),tagIds:z.array(z.string().max(100)).max(30),authorId:z.string().max(100),
 seoTitle:z.string().max(200),seoDescription:z.string().max(500),noindex:z.boolean(),featured:z.boolean(),image:z.string().max(300).refine(v=>!v||/^\/api\/media\/[a-zA-Z0-9-]+$/.test(v),"Choose an owned image from the media library."),imageAlt:z.string().max(500),imageCredit:z.string().max(500),
 sources:z.array(z.object({url:https,title:z.string().max(300),note:z.string().max(2000).optional(),verifiedAt:z.string().max(50)})).max(100),researchBasis:z.string().max(5000),reviewDueAt:z.string().max(50),productIds:z.array(z.string().max(100)).max(50),relatedIds:z.array(z.string().max(100)).max(20),
 brand:z.string().max(150),model:z.string().max(150),asin:z.string().regex(/^([A-Z0-9]{10})?$/,"ASIN must be ten uppercase letters or digits."),amazonUrl:z.string().max(2000).refine(v=>{if(!v)return true;try{const u=new URL(v);return u.protocol==="https:"&&["amazon.com","www.amazon.com","amzn.to"].includes(u.hostname)&&!u.username&&!u.password&&!u.port}catch{return false}},"Use an approved HTTPS Amazon destination."),
 specifications:z.array(z.object({key:z.string().max(100),value:z.string().max(500),unit:z.string().max(30),sourceUrl:z.union([https,z.literal("")])})).max(100),strengths:z.array(z.string().max(500)).max(20),limitations:z.array(z.string().max(500)).max(20),recommendation:z.string().max(1000),ownerReviewed:z.boolean(),faqs:z.array(z.object({question:z.string().max(300),answer:z.string().max(3000)})).max(30)
});
export function parseContent(value:unknown){return contentSchema.parse({...defaultContent,...(typeof value==="object"&&value?value:{})});}
export const categorySchema=z.object({name:z.string().trim().min(1).max(100),slug:slugSchema,description:z.string().max(5000).default(""),parentId:z.string().max(100).nullable().default(null),icon:z.string().max(40).default("plug"),sortOrder:z.number().int().min(0).max(10000).default(0),visible:z.boolean().default(true),seoTitle:z.string().max(200).default(""),seoDescription:z.string().max(500).default(""),attributes:z.array(z.object({key:slugSchema,label:z.string().min(1).max(100),unit:z.string().max(30),type:z.enum(["text","number","boolean"])})).max(100).default([])});
export const authorSchema=z.object({name:z.string().min(1).max(150),slug:slugSchema,biography:z.string().max(8000).default(""),image:z.string().max(300).default(""),links:z.array(https).max(10).default([]),userId:z.string().nullable().default(null)});
export const tagSchema=z.object({name:z.string().min(1).max(100),slug:slugSchema,description:z.string().max(3000).default(""),indexable:z.boolean().default(false)});
export const settingsSchema=z.object({brandName:z.string().min(1).max(100),tagline:z.string().max(200),siteDescription:z.string().max(1000),affiliateTag:z.string().max(100).regex(/^([a-zA-Z0-9-]+)?$/),contactEmail:z.union([z.email(),z.literal("")]),timezone:z.string().refine(v=>{try{new Intl.DateTimeFormat("en",{timeZone:v});return true}catch{return false}},"Choose a valid timezone."),newsletterEnabled:z.boolean(),analyticsEnabled:z.boolean(),privacyReviewed:z.boolean(),homeSections:z.array(z.object({id:z.enum(["categories","buying-guides","latest","methodology"]),title:z.string().max(150),visible:z.boolean()})).max(10),navigation:z.array(z.object({label:z.string().min(1).max(100),href:z.string().max(500).refine(safeHref,"Use a safe internal path or HTTPS URL."),location:z.enum(["header","footer"])})).max(40)});

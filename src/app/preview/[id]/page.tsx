import Link from "next/link";
import {notFound} from "next/navigation";
import {requirePageUser} from "@/lib/server/auth";
import {requireRecord} from "@/lib/server/editorial";
import {getSettings} from "@/lib/server/content";
import {ContentRenderer,ProductCard} from "@/components/content/renderer";
import {collectDocumentRefs} from "@/lib/content";
import s from "@/components/public/public.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Private draft preview",robots:{index:false,follow:false}};
export default async function Preview({params}:{params:Promise<{id:string}>}){const user=await requirePageUser(),{id}=await params;let record;try{record=await requireRecord(id,user)}catch{notFound()}const settings=await getSettings();return <main className={s.site}><div style={{background:"#0b1220",color:"white",padding:"16px 24px",display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}><strong>Private preview · {record.workflow.toLowerCase()}</strong><Link href={`/admin/${record.kind==='article'?'articles':record.kind==='product'?'products':'pages'}/${id}`}>Return to editor →</Link></div><article className={s.prose} style={{maxWidth:760,margin:"64px auto",padding:"0 24px"}}><p>Draft preview — only authorized editors can see this page.</p><h1>{record.data.title||"Untitled draft"}</h1><p>{record.data.excerpt}</p><ContentRenderer document={record.data.document} articleId={id} settings={settings}/>{record.kind==="article"&&<>{[...new Set(record.data.productIds)].filter(productId=>!collectDocumentRefs(record.data.document).products.includes(productId)).map(productId=><ProductCard key={productId} id={productId} articleId={id} settings={settings}/>)}{record.data.faqs.some(faq=>faq.question.trim()&&faq.answer.trim())&&<section className={s.faq}><h2>Frequently asked questions</h2>{record.data.faqs.filter(faq=>faq.question.trim()&&faq.answer.trim()).map((faq,index)=><details key={index}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}</>}</article></main>}

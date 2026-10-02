import Link from "next/link";
import { BrandMark } from "@/components/public/illustrations";
import { NotFoundView } from "@/components/public/NotFoundView";
import s from "@/components/public/public.module.css";

export default function NotFound(){return <div className={s.site}><header className={s.header}><div className={`${s.wrap} ${s.headerInner}`}><Link href="/" className={s.brand} aria-label="PowerPlugPicks home"><BrandMark className={s.brandMark}/><span>PowerPlug<strong>Picks</strong></span></Link></div></header><main id="main-content"><NotFoundView/></main></div>}

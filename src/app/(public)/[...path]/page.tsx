import { notFound, permanentRedirect } from "next/navigation";
import { getRedirect } from "@/lib/server/content";

export const metadata={title:"Page not found",robots:{index:false,follow:false}};

export default async function UnmatchedPublicPath({params}:{params:Promise<{path:string[]}>}) {
  const {path}=await params;
  const target=await getRedirect(`/${path.join("/")}`);
  if(target)permanentRedirect(target);
  notFound();
}

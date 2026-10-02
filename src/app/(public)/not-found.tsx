import { listCategories } from "@/lib/server/content";
import { NotFoundView } from "@/components/public/NotFoundView";

export default async function PublicNotFound(){return <NotFoundView categories={await listCategories()}/>}

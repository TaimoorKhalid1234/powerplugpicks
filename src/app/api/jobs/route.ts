import {getEnv} from "@/lib/server/db";
import {runJobs} from "@/lib/server/jobs";
import {json,apiError} from "@/lib/server/http";
export async function POST(request:Request){try{const env=await getEnv();const auth=request.headers.get("authorization");if(!env.CRON_SECRET||env.CRON_SECRET.length<32||auth!==`Bearer ${env.CRON_SECRET}`)return json({error:"Unauthorized."},401);return json(await runJobs());}catch(error){return apiError(error);}}

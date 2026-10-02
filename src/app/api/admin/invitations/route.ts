import {requireUser,assertSameOrigin} from "@/lib/server/auth";
import {ADMIN_ROLES} from "@/lib/server/permissions";
import {createInvitation} from "@/lib/server/invitations";
import {apiError,body,json} from "@/lib/server/http";
export async function POST(request:Request){try{await assertSameOrigin(request);const actor=await requireUser(ADMIN_ROLES);const result=await createInvitation(await body(request,2000),actor);return json({invitationUrl:result.inviteUrl,emailSent:false,message:result.delivery==="queued"?"Invitation queued for delivery. The system view shows delivery status.":"Share this private invitation link with the intended user. It expires in 30 minutes."},201);}catch(error){return apiError(error);}}

import "server-only";
import { z } from "zod";
import { getAuth, requireUser, AuthorizationError, type User } from "./auth";
import { getDB, getEnv } from "./db";
import { ADMIN_ROLES } from "./permissions";

const inviteInput = z.object({ email: z.email().max(254), name: z.string().trim().min(2).max(100), role: z.enum(["ADMIN", "EDITOR", "AUTHOR", "ANALYST"]) });

/** Uses the library's expiring, single-use password reset flow as invitation acceptance. */
export async function createInvitation(input: unknown, actor: User): Promise<{ inviteUrl?: string; delivery: string }> {
  const currentActor = await requireUser(ADMIN_ROLES);
  if (currentActor.id !== actor.id) throw new AuthorizationError();
  const value = inviteInput.parse(input);
  if (currentActor.role === "ADMIN" && value.role === "ADMIN") throw new AuthorizationError("Only an owner can invite an administrator.");
  const [db, env] = await Promise.all([getDB(), getEnv()]);
  const email = value.email.toLowerCase();
  const existing = await db.prepare("SELECT id,role,active FROM user WHERE email = ?").bind(email).first<{ id: string; role: string; active: number }>();
  if (existing) {
    const credential = await db.prepare("SELECT id FROM account WHERE userId = ? AND providerId = 'credential'").bind(existing.id).first();
    if (credential || !existing.active || existing.role !== value.role) throw new AuthorizationError("This account already exists. Manage its access from Users instead.", 409);
  }
  let inviteUrl: string | undefined;
  const deliveryConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
  const auth = await getAuth({
    provisioningRole: value.role,
    captureReset: async ({ url }) => {
      if (!deliveryConfigured) { inviteUrl = url; return; }
      const now = new Date().toISOString();
      await db.prepare("INSERT INTO outbox (id,kind,payload,status,attempts,next_attempt_at,created_at,last_error) VALUES (?,?,?,'PENDING',0,?,?,NULL)")
        .bind(crypto.randomUUID(), "invitation", JSON.stringify({ to: email, subject: "You are invited to PowerPlugPicks", text: `You have been invited to the PowerPlugPicks editorial studio. Set your own password using this link within 30 minutes:\n\n${url}\n\nIf you did not expect this invitation, you can ignore it.` }), now, now).run();
    },
  });
  // No password or temporary known credential is created. The invitee chooses
  // their password through Better Auth's supported reset/credential creation API.
  const userId = existing?.id ?? (await auth.api.createUser({ body: { email, name: value.name, role: value.role } })).user.id;
  await auth.api.requestPasswordReset({ body: { email, redirectTo: `${new URL(env.BETTER_AUTH_URL).origin}/admin/accept-invite` } });
  await db.prepare("INSERT INTO audit_log (id,actor_id,action,target_id,context,created_at) VALUES (?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), actor.id, "account.invited", userId, JSON.stringify({ role: value.role, delivery: deliveryConfigured ? "queued" : "manual" }), new Date().toISOString()).run();
  return deliveryConfigured ? { delivery: "queued" } : { delivery: "manual", inviteUrl };
}

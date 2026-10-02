import { getAuth } from "@/lib/server/auth";
import { getDB } from "@/lib/server/db";

export const dynamic = "force-dynamic";
async function handler(request: Request) {
  // Public signup remains closed even if a future library config changes.
  const path = new URL(request.url).pathname;
  if (path.includes("/sign-up")) return Response.json({ error: "Registration is closed." }, { status: 403 });
  if (path.includes("/admin/")) return Response.json({ error: "Use the protected studio account-management endpoints." }, { status: 403 });
  const auth = await getAuth();
  const audited = ["/change-password", "/update-user", "/two-factor/enable", "/two-factor/verify-totp", "/two-factor/disable", "/two-factor/generate-backup-codes", "/revoke-session", "/revoke-other-sessions", "/revoke-sessions"];
  const action = audited.find((suffix) => path.endsWith(suffix));
  const actor = action ? await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } }) : null;
  if (actor) {
    const db = await getDB();
    const active = await db.prepare("SELECT active FROM user WHERE id = ?").bind(actor.user.id).first<{ active: number }>();
    if (!active?.active) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  }
  const response = await auth.handler(request);
  if (response.ok && action && actor) {
    const db = await getDB();
    await db.prepare("INSERT INTO audit_log (id,actor_id,action,target_id,context,created_at) VALUES (?,?,?,?,'{}',?)")
      .bind(crypto.randomUUID(), actor.user.id, `account${action.replaceAll("/", ".")}`, actor.user.id, new Date().toISOString()).run();
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export { handler as GET, handler as POST };

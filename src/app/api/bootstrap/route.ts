import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getAuth, assertSameOrigin, AuthorizationError } from "@/lib/server/auth";
import { getDB, getEnv } from "@/lib/server/db";

export const dynamic = "force-dynamic";
const input = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(254), password: z.string().min(12).max(128), token: z.string().min(32).max(256) });
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    if (Number(request.headers.get("content-length")) > 4096) return Response.json({ error: "Request is too large." }, { status: 413 });
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: "Request is too large." }, { status: 413 });
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { return Response.json({ error: "Send a valid JSON setup request." }, { status: 400 }); }
    const value = input.safeParse(parsed);
    if (!value.success) return Response.json({ error: "Enter your name, valid email, setup token, and a password of at least 12 characters." }, { status: 400 });
    const env = await getEnv();
    const expected = Buffer.from(env.BOOTSTRAP_TOKEN || "");
    const supplied = Buffer.from(value.data.token);
    if (expected.length < 32 || supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return Response.json({ error: "Setup is unavailable or the setup token is invalid." }, { status: 403 });
    const db = await getDB();
    const claim = crypto.randomUUID();
    const result = await db.prepare("INSERT OR IGNORE INTO bootstrap_lock (id,claim,createdAt) SELECT 1,?,? WHERE NOT EXISTS (SELECT 1 FROM user)").bind(claim, Date.now()).run();
    if (!result.meta.changes) return Response.json({ error: "The owner has already been created or setup is in progress." }, { status: 409 });
    try {
      const auth = await getAuth({ bootstrap: true });
      const result = await auth.api.signUpEmail({ body: { name: value.data.name, email: value.data.email.toLowerCase(), password: value.data.password } });
      await db.batch([
        db.prepare("UPDATE bootstrap_lock SET completedAt = ? WHERE id = 1 AND claim = ?").bind(Date.now(), claim),
        db.prepare("INSERT INTO audit_log (id,actor_id,action,target_id,context,created_at) VALUES (?,?,?,?,'{}',?)").bind(crypto.randomUUID(), result.user.id, "account.owner_bootstrap", result.user.id, new Date().toISOString()),
      ]);
      return Response.json({ success: true, next: "/admin/login" }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch {
      // Retry only when no identity was created. A partial identity stays locked for operator recovery.
      await db.prepare("DELETE FROM bootstrap_lock WHERE claim = ? AND NOT EXISTS (SELECT 1 FROM user)").bind(claim).run();
      return Response.json({ error: "Owner setup could not complete. Check database migrations and authentication configuration." }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof AuthorizationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Setup could not complete. Check server configuration." }, { status: 500 });
  }
}

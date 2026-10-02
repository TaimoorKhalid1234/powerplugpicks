import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, twoFactor } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { drizzle } from "drizzle-orm/d1";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";
import { getDB, getEnv } from "./db";
import * as schema from "./auth-schema";
import { AuthorizationError, requireRole, requireTwoFactor, type User } from "./permissions";

export { AuthorizationError, requireRole, requireTwoFactor } from "./permissions";
export type { User } from "./permissions";

function validateConfiguration(env: CloudflareEnv) {
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Authentication needs BETTER_AUTH_SECRET with at least 32 random characters. Run npm run setup locally.");
  }
  if (!env.BETTER_AUTH_URL) throw new Error("Set BETTER_AUTH_URL to this site's origin.");
  const url = new URL(env.BETTER_AUTH_URL);
  if (env.APP_ENV === "production") {
    if (url.protocol !== "https:" || url.origin !== new URL(env.SITE_URL).origin || /localhost|example|change.?me|development/i.test(env.BETTER_AUTH_SECRET)) {
      throw new Error("Production authentication requires HTTPS, matching site/auth origins, and a unique random secret.");
    }
  }
}

/** A fresh instance keeps request-scoped Cloudflare bindings out of global state. */
export async function getAuth(options: { bootstrap?: boolean; provisioningRole?: Exclude<Role, "OWNER">; captureReset?: (data: { user: { email: string }; url: string }) => Promise<void> } = {}) {
  const [env, db] = await Promise.all([getEnv(), getDB()]);
  validateConfiguration(env);
  return betterAuth({
    appName: "PowerPlugPicks",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    database: drizzleAdapter(drizzle(db, { schema }), { provider: "sqlite", schema, transaction: false }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.bootstrap,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      onPasswordReset: async ({ user }) => {
        await db.prepare("INSERT INTO audit_log (id,actor_id,action,target_id,context,created_at) VALUES (?,?,?,?,'{}',?)")
          .bind(crypto.randomUUID(), user.id, "account.password_reset", user.id, new Date().toISOString()).run();
      },
      ...(options.captureReset ? { sendResetPassword: options.captureReset } : env.RESEND_API_KEY && env.EMAIL_FROM ? {
        sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
          const now = new Date().toISOString();
          await db.prepare("INSERT INTO outbox (id,kind,payload,status,attempts,next_attempt_at,created_at,last_error) VALUES (?,?,?,'PENDING',0,?,?,NULL)")
            .bind(crypto.randomUUID(), "password-reset", JSON.stringify({ to: user.email, subject: "Reset your PowerPlugPicks password", text: `Use this link within 30 minutes to reset your password:\n\n${url}\n\nIf you did not request this, you can ignore this message.` }), now, now).run();
        },
      } : {}),
    },
    user: { additionalFields: {
      role: { type: "string", required: true, defaultValue: "AUTHOR", input: false },
      active: { type: "boolean", required: true, defaultValue: true, input: false },
    } },
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 30, freshAge: 60 * 30, cookieCache: { enabled: false } },
    verification: { storeIdentifier: "hashed" },
    hooks: { before: createAuthMiddleware(async (context) => {
      // Library administrative endpoints are only used through permission-checked
      // server helpers. No HTTP route may bypass our ownership safeguards.
      if (context.path.startsWith("/admin/") && context.request) throw new APIError("FORBIDDEN", { message: "Use the protected studio account-management endpoints." });
    }) },
    advanced: {
      useSecureCookies: new URL(env.BETTER_AUTH_URL).protocol === "https:",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      ipAddress: { ipAddressHeaders: env.APP_ENV === "production" ? ["cf-connecting-ip"] : ["x-forwarded-for"] },
    },
    rateLimit: {
      enabled: true, storage: "database", window: 60, max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
        "/two-factor/*": { window: 60, max: 8 },
      },
    },
    databaseHooks: {
      user: { create: { before: async (user) => {
        if (!options.bootstrap && !options.provisioningRole) throw new APIError("FORBIDDEN", { message: "Registration is closed." });
        return { data: { ...user, role: options.bootstrap ? "OWNER" : options.provisioningRole, active: true } };
      } } },
      session: { create: { before: async (session) => {
        const active = await db.prepare("SELECT active FROM user WHERE id = ?").bind(session.userId).first<{ active: number }>();
        if (!active?.active) throw new APIError("UNAUTHORIZED", { message: "Unable to sign in with these credentials." });
        return { data: session };
      } } },
    },
    plugins: [
      twoFactor({ issuer: "PowerPlugPicks", backupCodeOptions: { amount: 10 } }),
      admin({ defaultRole: "AUTHOR", adminRoles: ["OWNER", "ADMIN"], roles: { OWNER: adminAc, ADMIN: adminAc, EDITOR: userAc, AUTHOR: userAc, ANALYST: userAc } }),
    ],
  });
}

export async function getSession(): Promise<{ user: User; session: { id: string } } | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) return null;
  // Always read permissions from D1; cookies never retain old roles or suspension state.
  const db = await getDB();
  const user = await db.prepare("SELECT id,name,email,role,active,twoFactorEnabled FROM user WHERE id = ?")
    .bind(session.user.id).first<Omit<User, "active" | "twoFactorEnabled"> & { active: number; twoFactorEnabled: number }>();
  if (!user?.active || !["OWNER", "ADMIN", "EDITOR", "AUTHOR", "ANALYST"].includes(user.role)) return null;
  return { user: { ...user, active: Boolean(user.active), twoFactorEnabled: Boolean(user.twoFactorEnabled) }, session: { id: session.session.id } };
}

/** Protected API operations also require enrolled TOTP for privileged accounts. */
export async function requireUser(roles?: Role[], options: { allowUnenrolled?: boolean } = {}): Promise<User> {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Sign in to continue.", 401);
  if (roles) requireRole(session.user, roles);
  if (!options.allowUnenrolled) requireTwoFactor(session.user);
  return session.user;
}

/** Read-only pages remain available while a newly bootstrapped owner enrolls TOTP. */
export async function requirePageUser(roles?: Role[]): Promise<User> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (roles && !roles.includes(session.user.role)) redirect("/admin");
  return session.user;
}

export async function assertSameOrigin(request: Request): Promise<void> {
  const env = await getEnv();
  const origin = request.headers.get("origin");
  const expected = new URL(env.BETTER_AUTH_URL || env.SITE_URL).origin;
  if (!origin || origin !== expected) throw new AuthorizationError("Request origin is not allowed.");
}

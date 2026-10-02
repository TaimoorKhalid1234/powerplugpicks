import type { Role } from "@/lib/types";

export interface User { id: string; name: string; email: string; role: Role; active: boolean; twoFactorEnabled: boolean }
export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.", public status = 403) { super(message); this.name = "AuthorizationError"; }
}
export const EDITOR_ROLES: Role[] = ["OWNER", "ADMIN", "EDITOR"];
export const WRITER_ROLES: Role[] = [...EDITOR_ROLES, "AUTHOR"];
export const ADMIN_ROLES: Role[] = ["OWNER", "ADMIN"];
export function requireRole(user: User, roles: readonly Role[]): User {
  if (!user.active || !roles.includes(user.role)) throw new AuthorizationError();
  return user;
}
export function requireTwoFactor(user: User): void {
  if (ADMIN_ROLES.includes(user.role) && !user.twoFactorEnabled) {
    throw new AuthorizationError("Set up two-factor authentication in Account security before making administrative changes.", 403);
  }
}
export function authorize(user: User, roles: readonly Role[], createdBy?: string): User {
  requireRole(user, roles);
  if (user.role === "AUTHOR" && createdBy !== undefined && createdBy !== user.id) throw new AuthorizationError("You can only edit your own assigned work.");
  return user;
}

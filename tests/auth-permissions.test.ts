import { describe, expect, it } from "vitest";
import { ADMIN_ROLES, WRITER_ROLES, EDITOR_ROLES, AuthorizationError, authorize, requireRole, requireTwoFactor, type User } from "../src/lib/server/permissions";

const user = (role: User["role"], overrides: Partial<User> = {}): User => ({ id: "author-a", name: "Test user", email: "test@example.invalid", role, active: true, twoFactorEnabled: false, ...overrides });

describe("server permission boundaries", () => {
  it("rejects suspended users even if their role would otherwise allow the action", () => {
    expect(() => requireRole(user("OWNER", { active: false }), ADMIN_ROLES)).toThrow(AuthorizationError);
  });
  it("allows authors to edit their own draft but rejects another author's draft", () => {
    expect(authorize(user("AUTHOR"), WRITER_ROLES, "author-a").id).toBe("author-a");
    expect(() => authorize(user("AUTHOR"), WRITER_ROLES, "author-b")).toThrow(AuthorizationError);
  });
  it("rejects author publishing and analyst writing", () => {
    expect(() => requireRole(user("AUTHOR"), EDITOR_ROLES)).toThrow(AuthorizationError);
    expect(() => requireRole(user("ANALYST"), WRITER_ROLES)).toThrow(AuthorizationError);
  });
  it("requires verified 2FA before owner and admin changes", () => {
    expect(() => requireTwoFactor(user("OWNER"))).toThrow(/two-factor/);
    expect(() => requireTwoFactor(user("ADMIN"))).toThrow(/two-factor/);
    expect(() => requireTwoFactor(user("OWNER", { twoFactorEnabled: true }))).not.toThrow();
  });
  it("permits editors to edit assigned content while excluding them from account management", () => {
    expect(authorize(user("EDITOR"), WRITER_ROLES, "someone-else").role).toBe("EDITOR");
    expect(() => requireRole(user("EDITOR"), ADMIN_ROLES)).toThrow(AuthorizationError);
  });
});

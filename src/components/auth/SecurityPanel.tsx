"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authRequest } from "./auth-client";

type DeviceSession = { id: string; token: string; userAgent?: string | null; createdAt: string; expiresAt: string };
export function SecurityPanel({ enabled: initialEnabled, currentSessionId }: { enabled: boolean; currentSessionId: string }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [currentId, setCurrentId] = useState(currentSessionId);
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { authRequest<DeviceSession[]>("list-sessions").then(setSessions).catch(() => setError("Your sessions could not be loaded. Refresh to try again.")); }, []);
  async function action(work: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await work(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); } finally { setBusy(false); }
  }
  async function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const password = new FormData(event.currentTarget).get("password");
    await action(async () => {
      const result = await authRequest<{ totpURI: string; backupCodes: string[] }>("two-factor/enable", { password, issuer: "PowerPlugPicks" });
      setEnrollment(result); setCodes(result.backupCodes || []);
    });
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const code = new FormData(event.currentTarget).get("code");
    await action(async () => { await authRequest("two-factor/verify-totp", { code, trustDevice: false }); await authRequest("revoke-other-sessions", {}); const current = await authRequest<{ session: { id: string } }>("get-session"); setCurrentId(current.session.id); setSessions(await authRequest<DeviceSession[]>("list-sessions")); setEnabled(true); setEnrollment(null); setMessage("Two-factor authentication is enabled. Store your recovery codes somewhere safe."); });
  }
  async function recovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const password = new FormData(event.currentTarget).get("password");
    await action(async () => { const result = await authRequest<{ backupCodes: string[] }>("two-factor/generate-backup-codes", { password }); setCodes(result.backupCodes); setMessage("New recovery codes generated. Your previous codes no longer work."); });
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    await action(async () => { await authRequest("change-password", { currentPassword: data.get("currentPassword"), newPassword: data.get("newPassword"), revokeOtherSessions: true }); form.reset(); const current = await authRequest<{ session: { id: string } }>("get-session"); setCurrentId(current.session.id); setSessions(await authRequest<DeviceSession[]>("list-sessions")); setMessage("Password changed. Other sessions have been revoked."); });
  }
  return <div className="security-stack">
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    <section className="panel auth-security-panel"><h2>Two-factor authentication</h2><p>{enabled ? "Enabled. Sign-ins require a password and an authenticator or recovery code." : "Owners and admins must enable an authenticator before making administrative changes."}</p>
      {!enabled && !enrollment && <form className="form-stack" onSubmit={enroll}><label className="form-field">Confirm your current password<input type="password" className="input" name="password" autoComplete="current-password" required /></label><button className="button button-primary" disabled={busy}>Set up authenticator</button></form>}
      {enrollment && <div><h3>Connect your authenticator</h3><p>In your authenticator app, add an account using a setup key. Choose a time-based code, name the account PowerPlugPicks, and enter this key:</p><p className="secret-key"><code>{new URL(enrollment.totpURI).searchParams.get("secret")}</code></p><a className="text-link" href={enrollment.totpURI}>Open in an installed authenticator</a><form className="form-stack" onSubmit={verify}><label className="form-field">Six-digit authenticator code<input className="input" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label><button className="button button-primary" disabled={busy}>Verify and enable</button></form></div>}
      {enabled && <form className="form-stack" onSubmit={recovery}><label className="form-field">Current password<input type="password" name="password" className="input" autoComplete="current-password" required /></label><button className="button" disabled={busy}>Generate new recovery codes</button></form>}
      {codes.length > 0 && <div className="notice"><h3>Save your recovery codes</h3><p>Each code works once. Save them in your password manager or a secure offline place. They disappear when you leave this page.</p><ul className="recovery-codes">{codes.map((code) => <li key={code}><code>{code}</code></li>)}</ul><button className="button" onClick={() => { const blob = new Blob([`PowerPlugPicks recovery codes\nStore securely. Each code works only once.\n\n${codes.join("\n")}\n`], { type: "text/plain" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "powerplugpicks-recovery-codes.txt"; link.click(); URL.revokeObjectURL(url); }}>Download recovery codes</button></div>}
    </section>
    <section className="panel auth-security-panel"><h2>Change password</h2><form onSubmit={changePassword} className="form-stack"><label className="form-field">Current password<input className="input" type="password" name="currentPassword" autoComplete="current-password" required /></label><label className="form-field">New password<input className="input" type="password" name="newPassword" autoComplete="new-password" minLength={12} maxLength={128} required /></label><button className="button button-primary" disabled={busy}>Update password</button></form></section>
    <section className="panel auth-security-panel"><h2>Signed-in devices</h2><p>End any session you no longer recognize.</p><ul className="session-list">{sessions.map((session) => <li key={session.id}><div><strong>{session.id === currentId ? "This device" : "Other device"}</strong><p className="small">{session.userAgent || "Browser details unavailable"}</p><small>Signed in {new Date(session.createdAt).toLocaleString()}</small></div><button className="button" disabled={busy} onClick={() => action(async () => { await authRequest("revoke-session", { token: session.token }); if (session.id === currentId) { router.replace("/admin/login"); router.refresh(); } else { setSessions(sessions.filter((s) => s.id !== session.id)); setMessage("Session revoked."); } })}>End session</button></li>)}</ul><button className="button" disabled={busy} onClick={() => action(async () => { await authRequest("revoke-other-sessions", {}); setSessions(sessions.filter((s) => s.id === currentId)); setMessage("Other sessions revoked."); })}>Sign out other devices</button></section>
  </div>;
}

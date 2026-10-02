"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authRequest } from "./auth-client";

export function LoginForm({ emailConfigured, resetToken, resetError, invitation = false }: { emailConfigured: boolean; resetToken?: string; resetError?: string; invitation?: boolean }) {
  const router = useRouter();
  function signedIn() { router.replace("/admin"); router.refresh(); }
  const [mode, setMode] = useState<"login" | "challenge" | "forgot" | "reset">(resetToken ? "reset" : "login");
  const [backup, setBackup] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(resetError ? "This reset link has expired or is invalid. Request a new one." : "");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        const result = await authRequest<{ twoFactorRedirect?: boolean }>("sign-in/email", { email: data.get("email"), password: data.get("password"), rememberMe: false });
        if (result.twoFactorRedirect) setMode("challenge"); else signedIn();
      } else if (mode === "challenge") {
        await authRequest(backup ? "two-factor/verify-backup-code" : "two-factor/verify-totp", { code: String(data.get("code")).trim(), trustDevice });
        signedIn();
      } else if (mode === "forgot") {
        await authRequest("request-password-reset", { email: data.get("email"), redirectTo: `${window.location.origin}/admin/login` });
        setMessage("If this email belongs to an account, a reset link has been queued for delivery. The link expires after 30 minutes.");
      } else {
        await authRequest("reset-password", { newPassword: data.get("password"), token: resetToken });
        setMode("login"); setMessage("Your password has been reset. Sign in with your new password.");
        window.history.replaceState(null, "", "/admin/login");
      }
    } catch (cause) {
      setError(mode === "login" ? "Unable to sign in. Check your email and password, or wait a minute if you have tried several times." : cause instanceof Error ? cause.message : "Try again.");
    } finally { setBusy(false); }
  }
  return <div className="auth-card">
    <span className="eyebrow">POWERPLUGPICKS STUDIO</span>
    <h1>{mode === "challenge" ? "One more security check" : mode === "forgot" ? "Reset your password" : mode === "reset" ? (invitation ? "Accept your invitation" : "Choose a new password") : "Welcome back"}</h1>
    <p>{mode === "challenge" ? "Enter a code to finish signing in." : mode === "reset" && invitation ? "Set your own password to join the editorial studio." : "Your workspace for useful, carefully researched power advice."}</p>
    <form onSubmit={submit} className="form-stack">
      {(mode === "login" || mode === "forgot") && <label className="form-field">Email address<input className="input" type="email" name="email" autoComplete="username" maxLength={254} required /></label>}
      {(mode === "login" || mode === "reset") && <label className="form-field">{mode === "reset" ? "New password" : "Password"}<input className="input" type="password" name="password" autoComplete={mode === "reset" ? "new-password" : "current-password"} minLength={mode === "reset" ? 12 : undefined} maxLength={128} required /></label>}
      {mode === "challenge" && <label className="form-field">{backup ? "Recovery code" : "Authenticator code"}<input className="input" type="text" name="code" inputMode={backup ? "text" : "numeric"} autoComplete="one-time-code" maxLength={64} required autoFocus /></label>}
      {mode === "challenge" && <label className="form-check"><input type="checkbox" checked={trustDevice} onChange={e => setTrustDevice(e.target.checked)} /><span>Trust this device for 30 days<small>You won’t be asked for a code here again until then. Leave this off on shared computers.</small></span></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? "Please wait…" : mode === "challenge" ? "Verify and sign in" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Save new password" : "Sign in"}</button>
    </form>
    {mode === "login" && (emailConfigured ? <button className="button button-ghost" onClick={() => { setMode("forgot"); setError(""); }}>Forgot your password?</button> : <p className="small muted">Password reset email is not configured yet. Contact the site owner if you need help signing in.</p>)}
    {mode === "challenge" && <button className="button button-ghost" onClick={() => setBackup(!backup)}>{backup ? "Use authenticator app" : "Use a recovery code"}</button>}
    {mode === "forgot" && <button className="button button-ghost" onClick={() => { setMode("login"); setError(""); }}>Back to sign in</button>}
    <Link href="/" className="text-link">← Back to PowerPlugPicks</Link>
  </div>;
}

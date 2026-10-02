"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export function SetupForm({ available }: { available: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Setup failed.");
      setDone(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Setup failed."); } finally { setBusy(false); }
  }
  return <div className="auth-card"><span className="eyebrow">FIRST-TIME SETUP</span><h1>Create your owner account</h1>
    {!available || done ? <><p>{done ? "Your owner account is ready. Sign in, then open Account security to set up your authenticator and save your recovery codes." : "Owner setup is closed or has not been configured. Existing accounts can sign in."}</p><Link className="button button-primary" href="/admin/login">Go to sign in</Link></> : <><p>Use the private setup token created for this deployment. This flow works only once.</p><form className="form-stack" onSubmit={submit}>
      <label className="form-field">Your name<input className="input" name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label className="form-field">Email address<input className="input" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className="form-field">Password<input className="input" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><small>Use at least 12 characters and save this in your password manager.</small></label>
      <label className="form-field">Private setup token<input className="input" name="token" type="password" autoComplete="off" minLength={32} maxLength={256} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? "Creating account…" : "Create owner account"}</button>
    </form></>}
  </div>;
}

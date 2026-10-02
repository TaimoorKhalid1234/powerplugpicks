"use client";

import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { adminApi, errorMessage, friendly } from "./api";
import { Card, Field, Notice } from "./ui";
import s from "./admin.module.css";

export function InvitationForm() {
  const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [role, setRole] = useState("AUTHOR");
  const [busy, setBusy] = useState(false); const [failure, setFailure] = useState(""); const [message, setMessage] = useState(""); const [invitationUrl, setInvitationUrl] = useState("");
  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFailure(""); setMessage(""); setInvitationUrl("");
    try { const result = await adminApi<{ invitationUrl?: string; message?: string; emailSent?: boolean }>("/api/admin/invitations", { method: "POST", body: JSON.stringify({ name, email, role }) }); setInvitationUrl(result.invitationUrl || ""); setMessage(result.message || (result.emailSent ? "Invitation email sent." : "Invitation created. Share the private acceptance link with the intended person.")); }
    catch (error) { setFailure(errorMessage(error)); } finally { setBusy(false); }
  }
  return <Card title="Invite a contributor"><Notice message={failure} error /><Notice message={message} /><form onSubmit={invite}><div className={s.fieldGrid}><Field label="Name"><input className={s.input} autoComplete="off" required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Email address"><input className={s.input} type="email" required autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} /></Field></div><div className={s.actionRow}><select className={s.select} value={role} aria-label="Contributor role" onChange={e => setRole(e.target.value)}>{["ADMIN", "EDITOR", "AUTHOR", "ANALYST"].map(value => <option key={value} value={value}>{friendly(value)}</option>)}</select><button className={s.button} type="submit" disabled={busy}><UserPlus size={15} />{busy ? "Creating invitation…" : "Create invitation"}</button></div></form>{invitationUrl && <div style={{ marginTop: 20 }}><Field label="Private invitation link" hint="This link expires and can only be used once. Share it only with the invited person."><input className={s.input} value={invitationUrl} readOnly /></Field><button className={s.secondary} onClick={async () => { try { await navigator.clipboard.writeText(invitationUrl); setMessage("Invitation link copied."); } catch { setFailure("Copy failed. Select and copy the invitation link above."); } }}><Copy size={14} />Copy invitation link</button></div>}</Card>;
}

"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, CircleHelp, FileText, LoaderCircle, Send, TriangleAlert, X } from "lucide-react";
import { friendly } from "./api";
import s from "./admin.module.css";

export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className={s.pageHeading}><div><span className={s.eyebrow}>Your publishing workspace</span><h1>{title}</h1><p>{description}</p></div>{children && <div className={s.actionRow}>{children}</div>}</div>;
}
export function Card({ title, children, action, body = true }: { title?: string; children: ReactNode; action?: ReactNode; body?: boolean }) {
  return <section className={s.card}>{title && <div className={s.cardHead}><h2>{title}</h2>{action}</div>}<div className={body ? s.cardBody : undefined}>{children}</div></section>;
}
export function Notice({ message, error = false }: { message: string; error?: boolean }) { return message ? <div className={s.notice} data-error={error} role={error ? "alert" : "status"}>{error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}<p>{message}</p></div> : null; }
export function Loading() { return <div className={s.loading} role="status"><LoaderCircle size={25} /><p>Loading your workspace…</p></div>; }
export function Empty({ title, description, children }: { title: string; description: string; children?: ReactNode }) { return <div className={s.empty}><FileText size={30} strokeWidth={1.4} /><strong>{title}</strong><p>{description}</p>{children}</div>; }
export function Badge({ value }: { value: string }) { const tone = ["PUBLISHED", "APPROVED", "PUBLIC", "COMPLETED", "SUCCESS", "ACTIVE"].includes(value) ? "good" : ["IN_REVIEW", "SCHEDULED", "PENDING", "NEW"].includes(value) ? "warn" : ["FAILED", "TRASHED", "ERROR"].includes(value) ? "bad" : ""; return <span className={s.badge} data-tone={tone}>{friendly(value)}</span>; }
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className={s.field}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Modal({ title, children, footer, close }: { title: string; children: ReactNode; footer?: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "Tab" && dialog) {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex="0"]'));
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, [close]);
  return <div className={s.modalBackdrop} onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><div className={s.modal} ref={ref} role="dialog" aria-modal="true" aria-label={title}><div className={s.modalHeader}><h2>{title}</h2><button className={s.iconButton} onClick={close} aria-label="Close dialog"><X size={19} /></button></div><div className={s.modalBody}>{children}</div>{footer && <div className={s.modalFooter}>{footer}</div>}</div></div>;
}

export interface ConfirmOptions { title: string; message: string; confirmLabel?: string; cancelLabel?: string | null; tone?: "default" | "danger" | "publish" }
type ConfirmRequest = ConfirmOptions & { resolve: (confirmed: boolean) => void };
let openConfirm: ((request: ConfirmRequest) => void) | null = null;
export function confirmAction(options: ConfirmOptions) { return new Promise<boolean>(resolve => { if (openConfirm) openConfirm({ ...options, resolve }); else resolve(window.confirm(options.message)); }); }
export function ConfirmHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const pending = useRef<ConfirmRequest | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { openConfirm = next => { pending.current?.resolve(false); pending.current = next; setRequest(next); }; return () => { openConfirm = null; pending.current?.resolve(false); pending.current = null; }; }, []);
  useEffect(() => { const dialog = ref.current; if (!request || !dialog) return; if (!dialog.open) dialog.showModal(); dialog.querySelector<HTMLElement>("[data-initial-focus]")?.focus(); }, [request]);
  function finish(confirmed: boolean) { pending.current?.resolve(confirmed); pending.current = null; ref.current?.close(); setRequest(null); }
  if (!request) return null;
  const tone = request.tone || "default";
  const Icon = tone === "danger" ? TriangleAlert : tone === "publish" ? Send : CircleHelp;
  return <dialog ref={ref} className={s.confirm} data-tone={tone} aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`} onCancel={e => { e.preventDefault(); finish(false); }} onClick={e => { if (e.target === e.currentTarget) finish(false); }}>
    <div className={s.confirmPanel}><span className={s.confirmIcon}><Icon size={21} strokeWidth={1.9} /></span><h2 id={`${id}-title`}>{request.title}</h2><p id={`${id}-message`}>{request.message}</p>
      <div className={s.confirmActions}>{request.cancelLabel !== null && <button type="button" className={s.secondary} onClick={() => finish(false)} data-initial-focus={tone === "danger" || undefined}>{request.cancelLabel || "Cancel"}</button>}<button type="button" className={s.button} onClick={() => finish(true)} data-initial-focus={tone !== "danger" || request.cancelLabel === null || undefined}>{request.confirmLabel || "Confirm"}</button></div>
    </div>
  </dialog>;
}

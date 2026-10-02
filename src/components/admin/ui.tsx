"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, X } from "lucide-react";
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

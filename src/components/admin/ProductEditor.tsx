"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Save, Send, Trash2, X } from "lucide-react";
import { defaultContent, type ContentData, type ContentRecord, type MediaAsset, type Role } from "@/lib/types";
import { slugify } from "@/lib/content";
import { adminApi, errorMessage } from "./api";
import { Badge, Card, Field, Loading, Notice, PageHeading } from "./ui";
import s from "./admin.module.css";

const amazonHosts = ["amazon.com", "www.amazon.com", "amzn.to"];
function amazonUrlProblem(value: string) {
  if (!value.trim()) return "Add the product's Amazon.com URL.";
  try { const url = new URL(value.trim()); if (url.protocol === "https:" && amazonHosts.includes(url.hostname)) return ""; } catch {}
  return "Use an https://www.amazon.com/… or https://amzn.to/… link.";
}

/** Products only need a name, an Amazon.com link, and an image. */
export function ProductEditor({ id, role }: { id: string; role: Role }) {
  const router = useRouter();
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [title, setTitle] = useState(""); const [amazonUrl, setAmazonUrl] = useState(""); const [image, setImage] = useState("");
  const [localPreview, setLocalPreview] = useState("");
  const [loading, setLoading] = useState(id !== "new"); const [busy, setBusy] = useState(""); const [message, setMessage] = useState(""); const [failure, setFailure] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const canPublish = ["OWNER", "ADMIN", "EDITOR"].includes(role);

  useEffect(() => {
    if (id === "new" || record?.id === id) return;
    let active = true;
    adminApi<{ record: ContentRecord }>(`/api/admin/content/${id}`).then(result => { if (!active) return; setRecord(result.record); setTitle(result.record.data.title); setAmazonUrl(result.record.data.amazonUrl); setImage(result.record.data.image); }).catch(error => { if (active) setFailure(errorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, record?.id]);
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  async function chooseImage(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setFailure("Choose a PNG, JPEG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setFailure("Images must be smaller than 8 MB."); return; }
    setLocalPreview(URL.createObjectURL(file)); setBusy("upload"); setFailure(""); setMessage("");
    try {
      const alt = title.trim() || file.name.replace(/\.[^.]+$/, "");
      const details = { alt, credit: "", license: "Uploaded by the site owner for this product listing." };
      const form = new FormData(); form.append("file", file); Object.entries(details).forEach(([key, value]) => form.append(key, value));
      const { item } = await adminApi<{ item: MediaAsset }>("/api/admin/media", { method: "POST", body: form });
      await adminApi(`/api/admin/media/${item.id}`, { method: "PATCH", body: JSON.stringify({ ...details, visibility: "PUBLIC" }) });
      setImage(`/api/media/${item.id}`);
    } catch (error) { setFailure(errorMessage(error)); setLocalPreview(""); }
    finally { setBusy(""); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function save(): Promise<ContentRecord | null> {
    const urlProblem = amazonUrlProblem(amazonUrl);
    if (!title.trim()) { setFailure("Add the product name."); return null; }
    if (urlProblem) { setFailure(urlProblem); return null; }
    const data: ContentData = { ...(record?.data ?? defaultContent), title: title.trim(), slug: slugify(title) || "product", amazonUrl: amazonUrl.trim(), image, imageAlt: image ? title.trim() : "" };
    const result = await adminApi<{ record: ContentRecord }>(`/api/admin/content${record ? `/${record.id}` : ""}`, { method: record ? "PATCH" : "POST", body: JSON.stringify(record ? { data, version: record.version } : { kind: "product", data }) });
    setRecord(result.record);
    if (!record) router.replace(`/admin/products/${result.record.id}`);
    return result.record;
  }
  async function run(action: "save" | "publish" | "unpublish" | "trash") {
    if (action === "trash" && !window.confirm("Move this product to trash? Products used by live articles cannot be removed.")) return;
    setBusy(action); setFailure(""); setMessage("");
    try {
      const saved = action === "save" || action === "publish" ? await save() : record;
      if (!saved) return;
      if (action !== "save") { const result = await adminApi<{ record: ContentRecord }>(`/api/admin/content/${saved.id}`, { method: "POST", body: JSON.stringify({ action, version: saved.version }) }); setRecord(result.record); }
      if (action === "trash") { router.push("/admin/products"); return; }
      setMessage(action === "save" ? "Product saved as a draft." : action === "publish" ? "Product published. You can now add it to articles." : "Product unpublished.");
    } catch (error) { setFailure(errorMessage(error)); }
    finally { setBusy(""); }
  }

  if (loading) return <Loading />;
  if (id !== "new" && !record) return <><PageHeading title="Product unavailable" description="This product could not be opened." /><Notice message={failure} error /><Link href="/admin/products" className={s.secondary}>Return to products</Link></>;
  const preview = localPreview || image;
  const published = record?.state === "PUBLISHED";
  return <>
    <PageHeading title={record ? "Edit product" : "Create product"} description="Add the product name, its Amazon link, and a product image."><Link className={s.secondary} href="/admin/products"><ArrowLeft size={14} />All products</Link></PageHeading>
    <Notice message={message} /><Notice message={failure} error />
    <div className={s.editorLayout}>
      <Card>
        <Field label="Product name"><input className={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Anker 12-Outlet Surge Protector" maxLength={200} /></Field>
        <Field label="Amazon URL" hint="Paste the product link from Amazon.com. Your affiliate tag from Settings is added automatically."><input className={s.input} type="url" value={amazonUrl} onChange={e => setAmazonUrl(e.target.value)} placeholder="https://www.amazon.com/dp/…" maxLength={2000} /></Field>
        <Field label="Product image" hint="PNG, JPEG, or WebP under 8 MB. Use a photo you own or have permission to publish.">
          <input ref={fileInput} className={s.input} type="file" accept="image/png,image/jpeg,image/webp" disabled={!!busy} onChange={e => void chooseImage(e.target.files?.[0])} />
        </Field>
      </Card>
      <aside className={s.editorSide}>
        <Card title="Image preview">
          <button type="button" className={s.imagePreview} onClick={() => fileInput.current?.click()} disabled={!!busy} aria-label={preview ? "Replace product image" : "Choose product image"}>
            {preview ? <NextImage unoptimized width={480} height={480} src={preview} alt={title || "Product image preview"} /> : <span><ImagePlus size={30} strokeWidth={1.5} /><br />Choose an image</span>}
            {busy === "upload" && <span className={s.imagePreviewStatus}>Uploading…</span>}
          </button>
          {image && !busy && <button type="button" className={`${s.secondary} ${s.fullWidth}`} style={{ marginTop: 12 }} onClick={() => { setImage(""); setLocalPreview(""); }}><X size={14} />Remove image</button>}
        </Card>
        <Card title="Publication">
          <div className={s.splitLine}><span className={s.muted}>Reader visibility</span><Badge value={record?.state || "UNPUBLISHED"} /></div>
          <div className={s.actionRow} style={{ marginTop: 18 }}>
            {canPublish && <button className={`${s.button} ${s.fullWidth}`} disabled={!!busy} onClick={() => void run("publish")}><Send size={15} />{busy === "publish" ? "Publishing…" : published ? "Publish changes" : "Publish product"}</button>}
            <button className={`${s.secondary} ${s.fullWidth}`} disabled={!!busy} onClick={() => void run("save")}><Save size={15} />{busy === "save" ? "Saving…" : "Save draft"}</button>
            {record && canPublish && published && <button className={`${s.secondary} ${s.fullWidth}`} disabled={!!busy} onClick={() => void run("unpublish")}>Unpublish</button>}
            {record && <button className={`${s.danger} ${s.fullWidth}`} disabled={!!busy} onClick={() => void run("trash")}><Trash2 size={14} />Move to trash</button>}
          </div>
        </Card>
      </aside>
    </div>
  </>;
}

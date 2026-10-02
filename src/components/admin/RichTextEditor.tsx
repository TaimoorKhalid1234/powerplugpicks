"use client";

import { useEffect, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Redo2, Table2, Undo2 } from "lucide-react";
import type { ContentRecord, DocNode } from "@/lib/types";
import { Field, Modal } from "./ui";
import s from "./admin.module.css";

const blockNames = { productCard: "Product recommendation", comparisonTable: "Product comparison", affiliateDisclosure: "Affiliate disclosure", callout: "Callout", verdict: "Editorial verdict", prosCons: "Strengths & limitations", sourceList: "Source references" };
type BlockType = keyof typeof blockNames;
const blockExtensions = (Object.keys(blockNames) as BlockType[]).map(name => Node.create({
  name, group: "block", atom: true, draggable: true,
  addAttributes() { return { productId: { default: "" }, productIds: { default: [] }, title: { default: "" }, text: { default: "" }, variant: { default: "info" }, pros: { default: [] }, cons: { default: [] } }; },
  parseHTML() { return [{ tag: `div[data-editor-block="${name}"]` }]; },
  renderHTML({ node, HTMLAttributes }) {
    const detail = name === "productCard" ? `Linked product: ${node.attrs.productId || "Select a product"}` : name === "comparisonTable" ? `${node.attrs.productIds.length} product references` : name === "sourceList" ? "Sources from the Research tab will appear here." : node.attrs.text || node.attrs.title || "Edit this block using the block menu.";
    return ["div", mergeAttributes(HTMLAttributes, { "data-editor-block": name }), ["strong", {}, blockNames[name]], ["div", {}, detail]];
  },
}));

interface BlockForm { type: BlockType; productId: string; productIds: string[]; title: string; text: string; variant: string; pros: string; cons: string }
const emptyBlock: BlockForm = { type: "productCard", productId: "", productIds: [], title: "", text: "", variant: "info", pros: "", cons: "" };

export function RichTextEditor({ value, onChange, disabled = false, resetKey, products }: { value: DocNode; onChange: (value: DocNode) => void; disabled?: boolean; resetKey: number; products: ContentRecord[] }) {
  const [modal, setModal] = useState<"block" | "image" | "link" | null>(null);
  const [block, setBlock] = useState<BlockForm>(emptyBlock);
  const [url, setUrl] = useState(""); const [alt, setAlt] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [StarterKit.configure({ link: false, heading: { levels: [2, 3, 4] } }), Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }), Image.configure({ allowBase64: false }), TableKit, Placeholder.configure({ placeholder: "Start with the question your reader needs answered…" }), ...blockExtensions],
    content: value,
    editable: !disabled,
    editorProps: { attributes: { "aria-label": "Article body", role: "textbox", "aria-multiline": "true" } },
    onUpdate({ editor: instance }) { onChange(instance.getJSON() as DocNode); },
  });
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  // Existing editor content already matches local edits, so this replaces content only after a revision is loaded.
  useEffect(() => { if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false }); }, [editor, resetKey, value]);
  if (!editor) return <div className={s.richEditor}>Loading editor…</div>;
  function insertBlock() {
    if (!editor) return;
    const attrs = { ...block, pros: block.pros.split("\n").filter(Boolean), cons: block.cons.split("\n").filter(Boolean) };
    if (editor.isActive(block.type)) editor.chain().focus().updateAttributes(block.type, attrs).run();
    else editor.chain().focus().insertContent({ type: block.type, attrs }).run();
    setModal(null);
  }
  function openBlock(type: BlockType) {
    const attrs = editor?.isActive(type) ? editor.getAttributes(type) : {};
    setBlock({ ...emptyBlock, ...attrs, type, text: String(attrs.text || (type === "affiliateDisclosure" ? "As an Amazon Associate, we earn from qualifying purchases." : "")), pros: (attrs.pros || []).join("\n"), cons: (attrs.cons || []).join("\n") }); setModal("block");
  }
  const toolbarButton = (label: string, active: boolean, action: () => void, child: React.ReactNode) => <button type="button" title={label} aria-label={label} aria-pressed={active} data-active={active} disabled={disabled} onClick={action}>{child}</button>;
  return <><div className={s.toolbar} role="toolbar" aria-label="Document formatting">
    <select aria-label="Text style" disabled={disabled} value={editor.isActive("heading", { level: 2 }) ? "2" : editor.isActive("heading", { level: 3 }) ? "3" : editor.isActive("heading", { level: 4 }) ? "4" : "p"} onChange={event => { if (event.target.value === "p") editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: Number(event.target.value) as 2 | 3 | 4 }).run(); }}><option value="p">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select><span className={s.toolbarDivider} />
    {toolbarButton("Bold", editor.isActive("bold"), () => { editor.chain().focus().toggleBold().run(); }, <Bold size={15} />)}{toolbarButton("Italic", editor.isActive("italic"), () => { editor.chain().focus().toggleItalic().run(); }, <Italic size={15} />)}{toolbarButton("Bullet list", editor.isActive("bulletList"), () => { editor.chain().focus().toggleBulletList().run(); }, <List size={16} />)}{toolbarButton("Numbered list", editor.isActive("orderedList"), () => { editor.chain().focus().toggleOrderedList().run(); }, <ListOrdered size={16} />)}{toolbarButton("Quotation", editor.isActive("blockquote"), () => { editor.chain().focus().toggleBlockquote().run(); }, <span>“ ”</span>)}
    <span className={s.toolbarDivider} />{toolbarButton("Add or edit link", editor.isActive("link"), () => { setUrl(editor.getAttributes("link").href || ""); setModal("link"); }, <Link2 size={15} />)}{toolbarButton("Insert image", false, () => { setUrl(""); setAlt(""); setModal("image"); }, <ImagePlus size={16} />)}{toolbarButton("Insert table", editor.isActive("table"), () => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }, <Table2 size={16} />)}
    <select aria-label="Insert or edit editorial block" value="" disabled={disabled} onChange={e => openBlock(e.target.value as BlockType)}><option value="" disabled>Editorial blocks +</option>{Object.entries(blockNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className={s.toolbarDivider} />{toolbarButton("Undo", false, () => { editor.chain().focus().undo().run(); }, <Undo2 size={15} />)}{toolbarButton("Redo", false, () => { editor.chain().focus().redo().run(); }, <Redo2 size={15} />)}
    {editor.isActive("table") && <><button onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button><button onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button><button onClick={() => editor.chain().focus().deleteRow().run()}>− Row</button><button onClick={() => editor.chain().focus().deleteColumn().run()}>− Column</button><button onClick={() => editor.chain().focus().deleteTable().run()}>Remove table</button></>}
  </div><EditorContent editor={editor} className={s.richEditor} /><div className={s.editorFooter}><span>{editor.getText().trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span><span>Structured editorial content</span></div>
    {modal && <Modal title={modal === "image" ? "Insert image" : modal === "link" ? "Add a link" : blockNames[block.type]} close={() => setModal(null)} footer={<><button className={s.secondary} onClick={() => setModal(null)}>Cancel</button><button className={s.button} disabled={modal === "block" && (block.type === "productCard" ? !block.productId : block.type === "comparisonTable" ? block.productIds.length < 2 : false)} onClick={() => { if (modal === "block") insertBlock(); else if (modal === "image") { editor.chain().focus().setImage({ src: url, alt }).run(); setModal(null); } else { if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run(); else editor.chain().focus().extendMarkRange("link").unsetLink().run(); setModal(null); } }}>Apply</button></>}>
      {(modal === "link" || modal === "image") && <Field label={modal === "link" ? "Destination URL" : "Image URL"} hint={modal === "image" ? "Copy the URL of an image from your Media library." : "Use a trusted https:// URL or an internal path. Leave blank to remove a link."}><input type="text" className={s.input} value={url} onChange={e => setUrl(e.target.value)} /></Field>}{modal === "image" && <Field label="Alternative text"><textarea className={s.textarea} value={alt} onChange={e => setAlt(e.target.value)} /></Field>}
      {modal === "block" && <>{block.type === "productCard" && <Field label="Product"><select className={s.select} value={block.productId} onChange={e => setBlock({ ...block, productId: e.target.value })}><option value="">Select a product…</option>{products.map(product => <option key={product.id} value={product.id}>{product.data.title}</option>)}</select></Field>}{block.type === "comparisonTable" && <><p className={`${s.small} ${s.muted}`}>Choose at least two reviewed products. Their saved specifications populate the comparison.</p><div className={s.pickList}>{products.map(product => <label className={s.check} key={product.id}><input type="checkbox" checked={block.productIds.includes(product.id)} onChange={e => setBlock({ ...block, productIds: e.target.checked ? [...block.productIds, product.id] : block.productIds.filter(id => id !== product.id) })} />{product.data.title}</label>)}</div></>}{["callout", "verdict"].includes(block.type) && <Field label="Heading"><input className={s.input} value={block.title} onChange={e => setBlock({ ...block, title: e.target.value })} /></Field>}{["callout", "verdict", "affiliateDisclosure"].includes(block.type) && <Field label="Text"><textarea className={s.textarea} value={block.text} onChange={e => setBlock({ ...block, text: e.target.value })} /></Field>}{block.type === "callout" && <Field label="Style"><select className={s.select} value={block.variant} onChange={e => setBlock({ ...block, variant: e.target.value })}><option value="info">Helpful information</option><option value="warning">Safety note</option></select></Field>}{block.type === "prosCons" && <div className={s.fieldGrid}><Field label="Strengths" hint="One per line."><textarea className={s.textarea} value={block.pros} onChange={e => setBlock({ ...block, pros: e.target.value })} /></Field><Field label="Limitations" hint="One per line."><textarea className={s.textarea} value={block.cons} onChange={e => setBlock({ ...block, cons: e.target.value })} /></Field></div>}{block.type === "sourceList" && <p className={`${s.small} ${s.muted}`}>This block displays the source references you add in the Research tab. Keep verification dates up to date.</p>}</>}
    </Modal>}
  </>;
}

export const ARTICLE_TYPES = ["REVIEW", "BUYING_GUIDE", "COMPARISON", "GUIDE"] as const;
export type ArticleType = typeof ARTICLE_TYPES[number];
export type Role = "OWNER" | "ADMIN" | "EDITOR" | "AUTHOR" | "ANALYST";
export type ContentKind = "article" | "product" | "page";
export type PublishState = "UNPUBLISHED" | "PUBLISHED" | "ARCHIVED" | "TRASHED";
export type Workflow = "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "SUPERSEDED";
export interface DocNode { type: string; text?: string; attrs?: Record<string, unknown>; marks?: {type: string; attrs?: Record<string, unknown>}[]; content?: DocNode[] }
export interface SourceReference { url: string; title: string; note?: string; verifiedAt: string }
export interface Category { id: string; name: string; slug: string; description: string; parentId: string | null; icon: string; sortOrder: number; visible: boolean; seoTitle: string; seoDescription: string; attributes: AttributeDefinition[] }
export interface AttributeDefinition { key: string; label: string; unit: string; type: "text" | "number" | "boolean" }
export interface Author { id: string; name: string; slug: string; biography: string; image: string; links: string[]; userId: string | null }
export interface ContentData {
  title: string; slug: string; excerpt: string; document: DocNode;
  articleType: ArticleType; categoryIds: string[]; tagIds: string[]; authorId: string;
  seoTitle: string; seoDescription: string; noindex: boolean; featured: boolean;
  image: string; imageAlt: string; imageCredit: string; sources: SourceReference[];
  researchBasis: string; reviewDueAt: string; productIds: string[]; relatedIds: string[];
  brand: string; model: string; asin: string; amazonUrl: string;
  specifications: { key: string; value: string; unit: string; sourceUrl: string }[];
  strengths: string[]; limitations: string[]; recommendation: string;
  ownerReviewed: boolean;
}
export interface ContentRecord { id: string; kind: ContentKind; state: PublishState; createdBy: string; version: number; isDemo: boolean; createdAt: string; updatedAt: string; publishedAt: string | null; liveRevisionId: string | null; draftRevisionId: string | null; data: ContentData; revisionId: string; workflow: Workflow }
export interface SiteSettings { brandName: string; tagline: string; siteDescription: string; affiliateTag: string; contactEmail: string; timezone: string; newsletterEnabled: boolean; analyticsEnabled: boolean; homeSections: {id: string; title: string; visible: boolean}[]; navigation: {label: string; href: string; location: "header" | "footer"}[]; privacyReviewed: boolean }
export interface ListResult<T> { items: T[]; total: number; page: number; pageSize: number; pages: number }
export interface MediaAsset { id: string; key: string; filename: string; contentType: string; size: number; alt: string; credit: string; license: string; visibility: "PRIVATE" | "PUBLIC"; createdBy: string; createdAt: string }
export const emptyDocument: DocNode = { type: "doc", content: [{ type: "paragraph" }] };
export const defaultContent: ContentData = { title: "", slug: "", excerpt: "", document: emptyDocument, articleType: "GUIDE", categoryIds: [], tagIds: [], authorId: "", seoTitle: "", seoDescription: "", noindex: true, featured: false, image: "", imageAlt: "", imageCredit: "", sources: [], researchBasis: "", reviewDueAt: "", productIds: [], relatedIds: [], brand: "", model: "", asin: "", amazonUrl: "", specifications: [], strengths: [], limitations: [], recommendation: "", ownerReviewed: false };

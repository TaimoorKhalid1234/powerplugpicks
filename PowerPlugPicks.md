# PowerPlugPicks Website Build Brief

Version 1.0  
Prepared 30 September 2026  
Planned domain https://powerplugpicks.com  
Deliverable A complete Next.js Amazon affiliate publication with a working admin dashboard

## How to use this file

Give this entire file to the AI coding agent as the project specification. Ask it to implement the project in the current repository and continue through the verification and handover requirements. The file is written in English so a coding agent can follow it precisely.

### Instruction to the implementing AI

Act as a senior full stack engineer, product designer, and technical SEO engineer. Build PowerPlugPicks as a complete, database backed publication. Produce working source code, migrations, configuration examples, a polished public website, and a secure admin dashboard.

Implement the requirements; do not deliver only a plan, static HTML, screenshots, or a dashboard populated by hardcoded statistics. The owner must be able to manage the site without editing application code.

Inspect any existing repository and its instructions before making changes. For a new repository, initialize a clean Next.js project. Work through the phases in Section 24 and keep a progress file. Continue across working sessions until the acceptance criteria are satisfied. If an external account or credential is missing, finish the parts that can be implemented, provide an honest configuration state, and document the exact owner action required. Never report an integration as tested when only its interface or mock was tested.

Do not ask the owner to make routine engineering decisions already covered here. Record reasonable decisions in the README. Ask only when missing information prevents a material decision or an existing project conflicts with these requirements.

## 1 Project purpose and default assumptions

PowerPlugPicks is an independent editorial website that helps readers select power accessories through buying guides, product reviews, comparisons, and practical guides. Revenue comes from qualifying Amazon affiliate purchases.

The initial topics are:

1. Surge protectors.
2. Extension cords.
3. Power strips.
4. Power strip towers.
5. Multi plug wall outlets.

These are starting categories, not a fixed list. Adding a category, a subcategory, a product attribute, or a new article must not require a code change.

Default assumptions, which the owner can change through the appropriate settings:

| Item | Default |
| --- | --- |
| Brand | PowerPlugPicks |
| Domain | powerplugpicks.com, planned and not assumed purchased |
| Primary audience | English speaking readers in the United States |
| Public language | English, en-US |
| Marketplace | Amazon.com |
| Currency when permitted product pricing is enabled | USD |
| Canonical hostname | https://powerplugpicks.com without www |
| Admin display timezone | Asia/Karachi |
| Database timestamps | UTC |
| Public design | Light editorial theme |
| Admin design | Light and dark themes |
| Reader accounts and comments | Disabled and outside launch scope |
| Amazon live prices | Disabled until compliant API access is configured |
| Newsletter | Disabled until the owner configures delivery and enables it |
| Public indexing | Explicitly enabled only for a reviewed production deployment |

Make the application usable for readers comparing products for a home office, desk, gaming setup, workshop, or travel setup. This is an affiliate publication: reader checkout, payments, inventory fulfillment, and order management are not required.

## 2 What complete means

All launch requirements in this file are mandatory unless explicitly marked optional. A feature is complete only when its UI, validation, authorization, persistence, and public effect work together.

Examples:

- A saved article survives a server restart and another device opening the admin.
- A newly created category can appear in navigation, article assignments, and a public archive.
- Saving a draft revision of a published article does not alter its live page.
- Publishing changes updates the page, metadata, relevant listings, feeds, and sitemap.
- An unauthorized user cannot perform the same action by calling its endpoint directly.
- A dashboard chart represents collected data, or an honest empty state.
- A failed save preserves the editor's unsaved work and displays an actionable message.

Do not use localStorage, in-memory arrays, static JSON files, or client-only state as production storage for content, roles, products, or settings. LocalStorage may be used for harmless UI preferences.

SEO completeness means the technical and editorial foundations in this specification are implemented and checked. Do not claim guaranteed rankings, indexing, traffic, rich results, earnings, or a permanent 100 percent SEO score.

Use the current stable, supported releases at implementation time. Verify the documentation for the installed versions, pin compatible versions, and commit the package lockfile. Do not mix outdated Next.js examples with current APIs.

## 3 Recommended technology stack

Use this stack unless the existing repository has a compatible, well justified alternative:

| Area | Requirement |
| --- | --- |
| Application | Next.js App Router with TypeScript in strict mode |
| Rendering | React Server Components for public content, with small Client Components for interaction |
| Styles | Tailwind CSS with shared CSS design tokens |
| UI primitives | shadcn/ui and accessible Radix based primitives where suitable |
| Icons | Lucide or an equivalent consistent icon library |
| Database | PostgreSQL |
| ORM and migrations | Prisma with committed migration history |
| Authentication | Better Auth with a supported Prisma adapter, database sessions, and email/password authentication |
| Forms and validation | React Hook Form where useful, plus Zod validation on the server |
| Article editor | Tiptap with a structured JSON document and approved custom nodes |
| Media storage | Private and public namespaces in S3 compatible object storage |
| Local development media | MinIO or another durable local S3 compatible service |
| Email | A server-side adapter; Resend is an acceptable default |
| Jobs | Durable, database recorded jobs invoked by an authenticated scheduler or worker |
| Distributed rate limits and temporary cache | Redis compatible storage; provide a local development option |
| Search | PostgreSQL full text search initially |
| Testing | Vitest, Playwright, and an accessibility checker such as axe |
| Charts | A lightweight chart library loaded only in admin views that need it |
| Deployment | A supported Node.js Next.js deployment; Vercel is a default option, not a mandatory provider |

Provide Docker Compose for local PostgreSQL, Redis, object storage, and a development mail sink where practical. The site must run locally without an Amazon API account. Never replace the database with browser storage to simplify development.

Select one authentication solution and finish its flows. Do not combine multiple auth libraries. Do not implement bespoke password hashing, token protocols, or session cryptography.

## 4 Architecture and content boundaries

Separate the public layout, authentication layout, and authenticated admin layout using route groups. Share domain services and validation, not entire client-side page bundles.

Organize the code around:

- Server-only database access and repositories.
- Authorization and a data access layer.
- Article, taxonomy, product, media, publishing, affiliate, SEO, and analytics services.
- A shared content renderer and a shared metadata builder.
- Storage, email, Amazon catalog, and analytics adapters.
- Versioned content and explicit publishing operations.
- Background jobs and cache invalidation.

Public queries must return only published, non-demo records and approved public fields. A public response must never contain drafts, private media references, internal notes, passwords, sessions, newsletter addresses, or credentials.

Do not require JavaScript to fetch the main article text. Readers and crawlers should receive useful rendered HTML, headings, links, and article content from the server. Use client interaction for search controls, admin editing, charts, and similar features.

Document the caching model for the installed Next.js version. Choose one supported model and apply it consistently. Cache editorial public data where useful; never place authenticated admin responses or previews in a shared public cache.

Use a single function to derive an article's public path from its type and slug. The content renderer, link picker, redirects, canonical metadata, sitemap, and RSS feed must use that function.

Administrative mutations must validate input, check permission on the server, write transactionally when necessary, record an audit event, and invalidate the appropriate public data. Return meaningful error types; do not conceal database failures behind a success toast.

## 5 Brand and visual design

Create an original, attractive editorial identity for PowerPlugPicks. The design should communicate clarity, useful comparisons, and careful research. Use an original plug inspired wordmark or symbol, favicon, and social sharing template. Do not use the Amazon logo or imply that Amazon endorses the website.

### Design tokens

| Token | Suggested value | Intended use |
| --- | --- | --- |
| Ink | #0B1220 | Headings and selected dark surfaces |
| Primary teal | #0F766E | Primary actions and brand accents |
| Pale mint | #D1FAE5 | Decorative highlights and soft backgrounds |
| Page background | #F8FAFC | Public page background |
| Surface | #FFFFFF | Cards and editor panels |
| Body text | #334155 | Paragraphs |
| Secondary text | #475569 | Supporting information |
| Border | #E2E8F0 | Dividers and card borders |
| Amber | #B45309 | Carefully contrasted notices |
| Danger | #B91C1C | Errors and destructive actions |

Verify contrast in the final UI rather than assuming every color pairing passes. Use a readable sans serif font, preferably a self-hosted or Next.js optimized font with a system fallback.

Use:

- A consistent spacing scale and restrained shadows.
- Rounded cards and controls with subtle borders.
- Strong typographic hierarchy.
- Editorial imagery or original diagrams with clear ownership.
- Comfortable article reading width of roughly 65 to 75 characters.
- A wider grid for archives and comparison tables.
- Clear hover, focus, disabled, loading, and selected states.
- Short, subtle transitions and a reduced motion alternative.

Avoid oversized empty hero areas, distracting animation, autoplay media, repeated generic gradient cards, misleading urgency, and excessive affiliate buttons.

### Responsive layouts

Verify the public site at 360, 390, 768, 1024, and 1440 pixels. There must be no unintended horizontal scrolling. A wide comparison table may scroll within its own labelled container.

The public header needs a desktop navigation menu, accessible mobile drawer, search entry, and visible brand. It must remain easy to use with long category names.

The admin needs a collapsible desktop sidebar, mobile navigation, breadcrumb, contextual page actions, notifications, and consistent data tables. Support a keyboard shortcut or command menu for common destinations. A small screen editor must keep save, preview, and publish actions accessible.

## 6 Public routes and page inventory

Use the following route structure. Equivalent changes are acceptable only if documented and consistently applied.

| Route | Purpose | Default indexing |
| --- | --- | --- |
| / | Editorial home page | Index when production is ready |
| /blog | All published articles | Index when populated |
| /reviews | Review archive | Index when populated |
| /reviews/[slug] | A single editorial product review | Index when publish checks pass |
| /buying-guides | Buying guide archive | Index when populated |
| /buying-guides/[slug] | Ranked recommendations and selection guide | Index when publish checks pass |
| /comparisons | Comparison archive | Index when populated |
| /comparisons/[slug] | An editorial comparison | Index when publish checks pass |
| /guides | Informational guide archive | Index when populated |
| /guides/[slug] | A practical or informational article | Index when publish checks pass |
| /categories | Category directory | Index when populated |
| /categories/[slug] | A curated category archive | Index when populated |
| /tags/[slug] | Tag archive | Noindex by default |
| /authors/[slug] | Author biography and published work | Index with a real biography and published work |
| /search?q=... | Internal search | Noindex |
| /about | Brand and editorial purpose | Index |
| /contact | Contact form | Index when configured |
| /how-we-review | Actual review and research methodology | Index |
| /editorial-policy | Content, corrections, and commercial independence | Index |
| /affiliate-disclosure | Affiliate relationship disclosure | Index |
| /privacy-policy | Accurate data processing information | Index after owner review |
| /terms | Appropriate site terms | Index after owner review |
| /sitemap.xml | XML sitemap or sitemap index | Not an HTML page |
| /robots.txt | Environment-aware crawler instructions | Not an HTML page |
| /rss.xml | Published article feed | Not an HTML page |
| /admin/login | Admin login | Noindex |
| /admin/* | Authenticated administration | Noindex and protected |
| /preview/* | Authorized draft preview | Noindex and private |

Use one article URL per article. Product database records are reusable editorial entities, not automatically indexed product landing pages. Do not create thin /products pages merely because products exist in the database.

Paginated archives must have persistent URLs and crawlable links. Use a consistent page parameter or path convention. Empty but valid archive pages need honest empty states and should be noindex until ready; unknown slugs and out-of-range pagination must return a real 404.

Allow editable informational pages while protecting reserved route names. A custom page cannot overwrite /admin, /api, an article route, robots, sitemap, or another system route.

## 7 Public website requirements

### 7.1 Home page

Create a composed editorial home page with:

1. A compact hero explaining the site and linking to buying guides and categories.
2. A category grid driven by active categories and their editorial descriptions.
3. Featured recommendations linked to published articles.
4. Latest buying guides.
5. Recent reviews and comparisons.
6. Practical guides for common reader setups.
7. A short explanation of how products are researched or tested.
8. An optional newsletter section only when enabled and configured.
9. A full footer with policy, category, and contact links.

The owner must control featured content, section visibility, section order, and section headings. Do not populate a block with unrelated posts simply to fill space. Do not use invented readership numbers, review counts, testing claims, or badges.

### 7.2 Archives and categories

Provide a breadcrumb, clear title, useful introduction, article cards, pagination, and relevant filters. Article cards should show their content type, title, excerpt, image when available, category, author when useful, and meaningful publication or update date.

Category pages can contain editorial introductory text and selected articles. Filters can narrow articles by type and taxonomy; do not assume every category has the same product specifications.

Persist filter selections in the URL. Handle invalid parameters, excessively long searches, and unsupported values safely. Add appropriate noindex behavior for arbitrary filter combinations.

### 7.3 Search

Search published articles and relevant public taxonomy text. Support useful empty states, keyboard accessible controls, result counts, pagination, and a server rendered results page. Debounced suggestions may enhance the experience but must not replace the full results page.

Never expose drafts, private author accounts, or internal product notes through search. Search ranking should be explainable and deterministic; external AI search is not required.

### 7.4 Article reading experience

Every article template needs:

- A clear H1, introduction, author, publication date, and substantive update date.
- A breadcrumb and optional reading time calculated from the live content.
- A visible affiliate notice before the first affiliate recommendation.
- An accessible table of contents generated from appropriate headings.
- Structured article blocks with consistent spacing.
- A responsive comparison table when the article needs one.
- Relevant product recommendation cards.
- Sources or evidence where factual claims require them.
- Related published articles selected by taxonomy and manual curation.
- An author section and an easy way to report a correction.
- A sensible sharing interface using the article's canonical URL.

Keep affiliate calls to action useful and proportionate. An optional mobile sticky action must not cover content, consent controls, or the footer, and must link to a relevant product or article section.

### 7.5 Product cards and comparison blocks

Provide reusable blocks with:

- Product name, brand, and appropriately licensed imagery.
- Editorial recommendation label, such as a verified use case.
- Relevant specifications with units and source information.
- A concise reason to consider the product.
- Strengths, limitations, and who it suits.
- A clearly labelled Amazon link.
- An optional link to a published full review.

Unknown values should display as unknown or be omitted. Missing imagery needs a polished neutral placeholder. Never invent prices, availability, ratings, certification, or test results to complete a card.

Comparison tables must support an owner-selected set of attributes, accessible row and column headings, and a mobile layout that preserves useful comparisons. Product order and recommendation labels are editorial decisions, not automatically determined by affiliate commission.

### 7.6 Trust and utility pages

Create editable About, methodology, editorial policy, affiliate disclosure, privacy, terms, and contact pages. Their factual content must reflect the configured website.

The methodology page must distinguish hands-on testing from research based on manufacturer documents or other sources. Do not claim the team owns a laboratory or has tested products without evidence.

Do not invent an address, legal entity, support email, author qualification, or social profile. Missing owner information must remain an admin launch task, not a fabricated public fact.

## 8 Article types and editorial templates

Use an ArticleType field with REVIEW, BUYING_GUIDE, COMPARISON, and GUIDE.

### Single product review

Provide editable sections for summary, verdict, intended user, design and build, features, relevant performance evidence, limitations, alternatives, specifications, and conclusion. Include a methodology or research basis.

An editorial score is optional. If used, define its scale and criteria and record supporting evidence. Clearly identify it as the publication's score.

### Buying guide

Provide a useful introduction, selection criteria, a quick comparison, ranked recommendations, reasons each recommendation fits a use case, limitations, buying considerations, and relevant questions and answers.

The owner must be able to select and reorder products. Every entry should contribute information; do not create a list consisting only of rewritten retailer descriptions.

### Comparison

Support two or more selected products, a side by side attribute table, meaningful differences, reader use cases, and an evidence based conclusion. A different recommendation for different needs is acceptable.

### Informational guide

Provide a direct explanation, a logical heading structure, original diagrams where useful, sourced advice, and related reading. Affiliate product blocks are optional.

Questions and answers can improve the article for readers. Do not promise Google FAQ rich results. Google discontinued that search feature in 2026; implement ordinary accessible FAQ content if useful.

### Structured editor blocks

Implement approved editor nodes for text, headings, lists, images, captions, tables, callouts, questions and answers, product cards, product comparisons, affiliate calls to action, and related articles.

Store product and article references by durable ID. Rendering must handle deleted or unpublished references without leaking private data. Avoid copying Amazon live catalog content into permanent article revisions.

Do not execute owner-entered MDX, JavaScript, arbitrary HTML, or embedded scripts. Imported Markdown must be converted into the approved document structure and validated.

## 9 Expandable categories and product attributes

Seed these category records:

| Name | Slug | Suggested focus |
| --- | --- | --- |
| Surge Protectors | surge-protectors | Protection features and appropriate setups |
| Extension Cords | extension-cords | Cord construction, length, and intended use |
| Power Strips | power-strips | Outlet layout and home or office setups |
| Power Strip Towers | power-strip-towers | Vertical layout and desk organization |
| Multi Plug Wall Outlets | multi-plug-wall-outlets | Wall mounted outlet expansion |

The owner can rename these, add categories, create subcategories, change display order, select an icon, upload an owned image, and manage archive content and SEO fields. Prevent parent-child cycles.

Support category-specific attribute definitions rather than adding a new database column for every new specification.

Possible attributes include outlet count, cord length, wire gauge, rated voltage, rated current, USB-A ports, USB-C ports, manufacturer stated USB power, surge energy rating, dimensions, mounting method, and intended environment. These are fields to verify, not claims to fabricate.

Attribute definitions need a key, label, data type, optional unit, allowed options where relevant, sort order, and category associations. Distinguish numbers, booleans, option values, and text. Validate incompatible units or values.

Allow future categories such as desk mounted power accessories, USB charging accessories, or related cable organization only when the owner chooses to add them. Do not automatically publish large sets of empty categories.

## 10 Admin dashboard and content management

### 10.1 Navigation and common behavior

Provide these working admin destinations:

| Destination | Required capabilities |
| --- | --- |
| Overview | Actual counts, editorial tasks, recent activity, content freshness, collected traffic and clicks |
| Articles | Search, filters, create, edit, review, preview, publish, schedule, archive, trash, restore |
| Products | Editorial product records, source-backed attributes, associations, Amazon destinations |
| Categories and Tags | Taxonomy management, parent categories, archive content, SEO |
| Media | Upload, browse, search, metadata, usage, access controls |
| Pages | Editable informational pages and their revisions |
| Authors | Public biographies, approved identity information, article associations |
| Navigation | Header, footer, menu groups, ordering, and validated destinations |
| Home Page | Section configuration, visibility, and curated content |
| Affiliate Links | Tracking tag settings, link issues, placements, and observed clicks |
| SEO | Content checks, redirects, indexability, sitemap status, metadata problems |
| Analytics | Collected data, date ranges, article and link breakdowns |
| Contacts | Actual form submissions, status, and access-controlled processing |
| Newsletter | Only when enabled; subscriber consent and delivery status |
| Users and Roles | Authorized invitations, role changes, suspension, sessions |
| Settings | Brand, locale, integrations, content, privacy, and public configuration |
| System and Activity | Redacted diagnostics, job status, audit trail, configuration tasks |
| Help | Owner guide and contextual help |

Every table needs server-side pagination where appropriate, search, relevant filters, clear column labels, and useful empty states. Support bulk actions only when the server checks every selected record.

Provide field-level validation, a save status, safe destructive-action confirmation, and clear success or failure feedback. Keep ordinary owner operations understandable without requiring knowledge of database tables or APIs.

### 10.2 Overview

Show actual article counts by workflow state, published content count, active categories, product count, upcoming schedules, and recently changed items.

Show traffic and affiliate click charts only when data exists. Until then, show a concise onboarding state. Earnings and Amazon purchase conversion are not measurable from a local click event; do not invent those metrics.

Provide actionable tasks such as a missing author biography, an unconfigured affiliate tag, an unpublished policy page, a failed publishing job, a broken internal reference, or an article due for review.

### 10.3 Article list and editor

Support list filters by type, author, category, workflow state, date, featured status, and review due date. Include a duplicate-as-draft action.

The editor needs:

- Title, slug, excerpt, article type, primary category, additional categories, tags, and public author.
- The structured content editor described in Section 8.
- Featured image, image alt text, caption, and image credit.
- Searchable product and related-article pickers.
- Drag-and-drop product ordering with a keyboard alternative.
- Publication controls, review notes, and a revision history.
- SEO title, description, indexing controls, and a sharing preview.
- Source references, research basis, and optional reviewer information.
- A substantive update date and next editorial review date.
- Featured and archive display settings.
- Desktop and mobile preview using the same renderer as the live site.

Do not use a raw JSON textarea as the main article editor.

Implement debounced autosave to the database, with an explicit Save action. Display saving, saved, unsaved, conflict, and error states. Do not mark the document saved until the server has accepted it.

Use optimistic concurrency so one user's save does not silently overwrite another's work. Warn before leaving with unsaved changes. A failed autosave must not erase the active document.

### 10.4 Editorial workflow

A new article starts unpublished with a draft revision. Authors can submit their own work for review. Authorized editors can approve, publish, schedule, or return it for changes.

Use separate draft and live revisions. Editing a published article must preserve the current live revision until an authorized publish operation replaces it.

A preview must be authenticated or use an explicitly issued, expiring, revocable preview grant. It must be noindex, uncached publicly, and omitted from sitemaps and feeds. The preview renderer must not accidentally switch the user's subsequent public requests into draft mode.

Scheduled publishing must use a durable scheduler. Display the owner's selected timezone but store the scheduled instant in UTC. Confirm the intended local time and offset. A scheduled revision is immutable; changing its content requires cancelling that schedule and creating an updated draft.

Publishing checks must verify at least:

- Valid type, slug, title, excerpt, author, and primary category.
- A supported, non-empty document.
- Valid product and internal content references.
- Appropriate disclosure when affiliate links are present.
- Appropriate image metadata for images that are used.
- No demo records or placeholder factual claims.
- Metadata and indexing choices.
- Source and editorial review requirements for product or safety claims.
- No known broken required CTA destination.

Separate blocking failures from advisory suggestions. Metadata length guidance and keyword usage are suggestions, not reasons to prevent legitimate publishing.

Archiving or unpublishing removes the record from public queries and invalidates its public outputs. Trashing should be reversible for a configurable retention period. Permanently deleting a previously published path requires a chosen redirect or a deliberate 410 policy; an unpublished draft path should return 404.

### 10.5 Products

Provide working forms for product name, brand, model, category associations, source references, owned imagery, independently verified specifications, editorial notes, and an Amazon ASIN or approved destination.

Support draft and live editorial product revisions. An unreviewed product edit must not silently change every published article that references it.

Record specification sources and verification dates. Distinguish manufacturer stated information from the publication's observations. Keep private editor notes separate from public text.

An optional catalog lookup can assist the owner only when the Amazon integration is configured. Never interpret an ASIN as evidence that a product is safe, certified, available, or reviewed.

Show which live and draft articles reference a product. Prevent deletion that would break required live references; provide replacement or archive actions.

### 10.6 Categories, tags, and authors

Manage taxonomy names, unique slugs, descriptions, parent relationships, display order, visibility, and SEO data. Do not delete a populated category without offering an explicit reassignment.

Tags need reusable records, duplicate prevention, and a curated/indexable flag. Creating a tag must not automatically create an indexable SEO landing page.

Public authors are separate from admin users. An admin account can exist without a public author profile. Public biographies must not expose login email addresses or security information.

Manage author name, slug, biography, approved photograph, relevant experience, public links, and display preferences. Do not seed fictional expert credentials.

### 10.7 Media

Support uploads, browsing, filtering, metadata edits, alt text, captions, credits, folder-like grouping, and usage references.

Separate original editorial media from third-party catalog imagery. Record ownership or permission, source, dimensions, content type, and upload date. The general media uploader must not copy Amazon catalog images into the site's permanent asset library.

Validate actual file content, enforce configurable size limits, and reject active content. Generate image variants only for images the website has permission to process. Private draft uploads must not be enumerable at public URLs.

Before deleting a media item, show its usage. Allow an owner-approved replacement and ensure published content does not break. Delete unreferenced temporary uploads through a recorded cleanup job.

### 10.8 Pages, menus, and home configuration

Pages use the approved editor, metadata controls, draft preview, and live revision workflow. Legal and identity content requires owner review before indexing.

Menus support internal content pickers, permitted external URLs, nested groups within a sensible depth, visibility, and ordering. Validate references; unavailable content should not remain as a broken visible menu link.

The Home Page editor controls actual section content, not arbitrary executable layout code. Provide a preview and safe fallback when selected content is no longer published.

### 10.9 Affiliate and SEO tools

Show affiliate link configuration, referenced products, placement locations, and collected click events. Mark unknown or unverified links honestly.

SEO tools need a real content audit with item-level findings: missing metadata, duplicate titles, empty archives, invalid canonicals, missing image alt text, broken internal links, orphaned content, and outdated review dates.

Provide a redirect manager with collision, loop, and chain checks. Give the owner indexability and sitemap diagnostics. Do not label a heuristic checklist as an actual Google ranking score.

### 10.10 Settings and system tools

Settings must cover brand assets, homepage configuration, menus, contact destination, default SEO templates, authoring defaults, category visibility, timezone, public integration IDs, affiliate tag, privacy preferences, and enabled features.

Secrets should normally be configured through environment variables or the hosting provider. Show only configured/not-configured status in admin. Do not expose secret values, allow arbitrary script injection, or store provider credentials as ordinary public settings.

System views must show actual job runs, failures, retry actions, and redacted integration diagnostics. Diagnostics are admin-only. Data exports require permission and must exclude credentials, sessions, and private data not explicitly requested.

## 11 Authentication and permissions

Use maintained auth-library capabilities for secure login, session management, password changes, password reset, and invitation acceptance. Reset and invite tokens must be single-use and expire. Provide session revocation and suspension.

Public admin registration must be disabled. Bootstrap the first owner through a documented, one-time CLI command or equivalent protected mechanism. Never ship a known admin password or an account that authenticates without a password.

Use secure, HttpOnly session cookies with appropriate same-site behavior and HTTPS in production. Apply login rate limits and generic authentication errors. Add two-factor authentication for owners and admins using supported library functionality; document recovery and test it.

### Permission matrix

| Action | Owner | Admin | Editor | Author | Analyst |
| --- | --- | --- | --- | --- | --- |
| View admin overview | Yes | Yes | Yes | Own work summary | Analytics summary |
| Create articles | Yes | Yes | Yes | Yes | No |
| Edit article drafts | All | All | All | Own assigned work | No |
| Publish, schedule, or unpublish | Yes | Yes | Yes | No | No |
| Manage editorial products and taxonomy | Yes | Yes | Yes | Read approved references | No |
| Upload media | Yes | Yes | Yes | Own draft use | No |
| Delete referenced media | With safeguards | With safeguards | With safeguards | No | No |
| Edit trust and policy pages | Yes | Yes | No | No | No |
| Manage menus and homepage | Yes | Yes | No | No | No |
| View traffic and click analytics | Yes | Yes | Yes | Own articles if enabled | Yes |
| Read contact or subscriber information | Yes | Yes | No | No | No |
| Manage ordinary user accounts | Yes | Limited | No | No | No |
| Promote, demote, or transfer an Owner | Yes with safeguards | No | No | No | No |
| Edit security and integration settings | Yes | Limited public settings | No | No | No |
| Export private data | Yes | Only explicit permission | No | No | No |

An admin cannot promote themselves to Owner, edit Owner credentials, or remove the final active Owner. Permission changes and account suspension must revoke or promptly invalidate affected sessions.

Enforce roles and record ownership in every server mutation and protected read. A hidden button, a guarded layout, or a route proxy is not sufficient authorization. Check direct endpoint calls, Server Actions, nested routes, exports, media access, and preview grants.

Treat profile edits, user role changes, publishing, exports, affiliate tag updates, and data deletion as audited operations. Audit logs must redact secrets and unnecessary personal data.

## 12 Database and data model

Deliver a real Prisma schema with relations, database constraints, indexes, timestamps, and migrations. The following is the minimum logical model; combine auxiliary tables only if the behavior remains clear.

| Entity | Required information and relationships |
| --- | --- |
| User | Auth-library identity, active state, role, timestamps; no public exposure |
| Session, Account, Verification | Auth-library supported session and credential records |
| Author | Public slug, biography, approved image, links, optional associated User |
| Category | Name, unique slug, parent, order, visibility, archive text, SEO |
| Tag | Name, unique slug, curated state, archive text, SEO |
| AttributeDefinition | Key, label, value type, unit, options, category associations, order |
| Product | Durable identity, ASIN/marketplace where supplied, editorial live and draft revision pointers |
| ProductRevision | Editorial name, model, specifications, references, imagery, verification state |
| ProductAttributeValue | Typed values linked to a ProductRevision and AttributeDefinition |
| Article | Durable identity, creator/assignee, publish state, live and draft revision pointers |
| ArticleRevision | Type, slug, title, excerpt, document JSON, author, image, SEO, workflow, source evidence |
| RevisionCategory and RevisionTag | Taxonomy associations for a specific ArticleRevision |
| RevisionProduct | Referenced Product, order, recommendation label, article-specific editorial context |
| SourceReference | URL/title, evidence note, accessed or verified date, linked content |
| SitePage and PageRevision | Protected or custom path, approved document, live/draft state, SEO |
| MediaAsset | Storage key, visibility, image metadata, credit, ownership, references |
| Menu and MenuItem | Location, order, label, internal record or permitted URL |
| SiteSetting | Typed, validated, non-secret configuration |
| AffiliateLink | Product or destination identity, marketplace, enabled state, placement references |
| Redirect | Unique source path, validated internal target path, permanent status, reason |
| PreviewGrant | Hashed token, record/revision scope, expiry, issuer, revocation |
| AnalyticsEvent or aggregates | Minimal, permitted traffic and link event data |
| ContactSubmission | Form content, timestamps, processing state, restricted access |
| NewsletterSubscriber | Email, consent evidence, verification, unsubscribe state |
| OutboxMessage | Message type, restricted payload, status, attempts, next retry |
| Job and JobRun | Kind, schedule, unique work key, attempts, lease, status, last error |
| AuditLog | Actor, action, target, time, redacted context |

### Revision behavior

Article publish state is UNPUBLISHED, PUBLISHED, or ARCHIVED. ArticleRevision workflow state is DRAFT, IN_REVIEW, APPROVED, SCHEDULED, PUBLISHED, or SUPERSEDED.

A published Article may have a separate DRAFT revision at the same time. Public rendering follows only the Article.liveRevisionId. The draft's slug, type, metadata, taxonomy, and content must not leak through public archives or metadata.

Publishing switches the live revision pointer transactionally and records the prior live revision as superseded. Restore an old revision by making a new draft and passing normal publishing checks.

Use the same separation for editorial Product and SitePage content. Amazon API responses are transient catalog data and do not belong in permanent editorial revisions.

### Constraints and query behavior

- Reserve public paths and prevent conflicts among articles, pages, and redirects.
- Protect slug changes with an old-path redirect created as part of the publish transaction.
- Use unique category, tag, author, and attribute keys.
- Enforce valid parent relationships and prevent taxonomy cycles.
- Avoid orphaned references through foreign keys and explicit delete policies.
- Use ordered relation records for editorial product lists.
- Validate structured documents and typed attribute values on the server.
- Index live-content lookups, published date, category relations, full text search, schedules, and event aggregation keys.
- Avoid unbounded queries and N+1 fetching on lists or article pages.
- Store monetary values, if allowed and needed in transient data, as precise decimal values rather than floating point guesses.
- Store timestamps in UTC and format them with the configured timezone.
- Use optimistic version fields and appropriate transaction isolation for conflicting updates.

Soft deletion and export tools must preserve privacy controls. Temporary Amazon catalog payloads must be excluded from ordinary long-lived database backups and editorial exports.

## 13 Amazon affiliate integration

### 13.1 Default manual-link mode

The website must work before Amazon API access is available. Let the owner enter independently researched editorial product information and an ASIN or an approved Amazon Special Link.

Use one shared AffiliateLink component and destination service. Links must clearly identify Amazon as the destination. Preserve valid generated link parameters. Validate permitted HTTPS hosts and reject executable protocols, arbitrary redirect destinations, and manipulated link input.

The tracking tag is configurable, not a developer's personal tag. Treat it as public configuration rather than a secret. If it is missing, show an admin configuration task and do not present links as commission-enabled.

Use "View on Amazon" or "Check price on Amazon" as normal CTA text. In this mode, numeric Amazon prices, stock claims, Amazon customer ratings, and copied Amazon catalog images are absent.

Clicks should use a normal direct anchor. A non-blocking tracking event must not delay navigation. Do not put a custom /go redirect or cloaking service between the visitor and Amazon.

### 13.2 Disclosures

Display this required statement clearly on the website:

> As an Amazon Associate I earn from qualifying purchases.

Also place an understandable affiliate notice before the first affiliate recommendation in an article, where the reader will notice it. A footer-only notice is insufficient for the article experience specified here.

The owner can edit supplementary disclosure text but cannot accidentally remove the required statement from an affiliate-enabled layout. Use the same policy on cards or other placements outside article templates.

Mark affiliate anchors with rel="sponsored nofollow". For a new-tab link, also use noopener. Do not add noreferrer by default; preserve normal source attribution.

### 13.3 Amazon content rules

Implement these operating constraints and re-check the current terms before enabling catalog content:

- No Amazon scraping.
- No manually maintained Amazon price or availability claims.
- No copying customer reviews or star ratings without a permitted API source.
- No self-managed caching or transformation of Amazon catalog image binaries.
- Keep Amazon catalog cache entries and image URLs within permitted lifetimes, currently at most 24 hours.
- Hide expired catalog content after refresh failure.
- Provide the required price timestamp and current Amazon disclaimers whenever applicable.
- Keep API content separate from permanent editorial records.
- No automatic affiliate clicks, hidden redirects, or click incentives.
- No price tracking or price-alert feature without Amazon permission.
- Use only permitted Amazon marks; do not imply sponsorship or endorsement.

Obtain any required exact price or catalog-content disclaimer from the official terms during implementation rather than inventing a substitute.

### 13.4 Optional live catalog mode

An Amazon API account is an external prerequisite, not a launch dependency for the editorial CMS.

As verified on the preparation date, Creators API is the supported replacement for the deprecated Product Advertising API 5.0. Use the current Creators API documentation, authentication, SDK, and account eligibility requirements. Do not scaffold a new PA-API 5 integration.

When credentials and permission are supplied, implement a server-only adapter for product lookup, current catalog data, throttling, error handling, and refresh. Do not invent endpoints, credentials, eligibility, or responses.

A disabled adapter should return a typed "not configured" state. Keep independently edited product information available if a catalog call fails.

Use a separate expiring store for catalog data. Check expiry during rendering, not only during a cleanup job. API-enabled public responses that contain volatile catalog fields must not be served from an uncontrolled stale HTML cache. Preserve the separately cached editorial content where possible.

For permitted remote catalog images, use a rendering path that does not create a Next.js optimizer, object-storage, CDN, service-worker, or export copy. Verify the source host and permitted handling.

Test integration code with fixtures, then clearly distinguish fixture tests from live credential verification in the handover report.

## 14 Technical and on-page SEO

Implement SEO as a shared system used by every public template and controlled from admin.

### 14.1 Rendering and metadata

- Render main content, navigation links, and meaningful headings on the server.
- Use Next.js metadata and generateMetadata for dynamic pages.
- Set metadataBase from the validated production site URL.
- Generate a unique, descriptive title and meta description per indexable page.
- Support owner overrides and sensible defaults without repeating the brand twice.
- Provide absolute canonical URLs, Open Graph metadata, and social card metadata.
- Generate share images from owned assets or the original brand template.
- Configure favicons, app icons, and theme color.
- Set the public document language and accessible viewport.
- Use a clear H1 and logical heading hierarchy as an editorial convention.
- Do not rely on meta keywords or rigid keyword density formulas.
- Do not add hreflang until real alternate-language pages exist.

Metadata controls need previews and approximate length guidance. Character counts are advisory; do not promise a particular Google title or snippet.

A public article must use the live revision for both metadata and body. An unavailable record must produce a real not-found response, not a generic page with a successful status.

### 14.2 Canonicals and URL behavior

Use one HTTPS hostname and one trailing-slash convention. Permanently redirect alternative hostname and HTTP requests where supported by hosting.

Use lowercase, descriptive slugs. Changing a published slug or content type creates a permanent redirect from the former path. Resolve redirects before returning 404. Prevent reserved-path collisions, loops, excessive chains, and external destinations.

Canonical rules:

| URL class | Behavior |
| --- | --- |
| Published article or curated page | Self canonical using its permanent clean path |
| Tracking query variants | Canonical to the same page with tracking parameters removed |
| Paginated archive | Each meaningful page has its own canonical, including its page value |
| Page 1 parameter variant | Redirect or canonical to the clean first-page URL |
| Alternate sorting of the same listing | Noindex and canonical to the equivalent default listing where genuinely duplicate |
| Arbitrary facets | Noindex with a normalized URL; do not pretend a different result set is identical |
| Internal search | Noindex and excluded from sitemap |
| Draft, preview, admin, demo | Noindex and excluded from public discovery |
| Unknown path or invalid pagination | Real 404 |
| Deliberately permanently removed public content | Chosen redirect or documented 410 |

Do not canonicalize every paginated archive to page 1. Provide real anchor links for previous, next, and useful page destinations; infinite scrolling may be an enhancement.

### 14.3 Sitemap, robots, and feeds

Generate sitemap data from published, indexable records only. Use actual substantive update timestamps for lastmod rather than the current server time. Exclude draft, demo, preview, search, arbitrary filters, redirects, and unavailable pages.

Implement the Next.js sitemap convention or an equivalent dynamic route. Split a large sitemap according to the supported protocol limits when needed. Include the canonical hostname in the sitemap location.

Make robots.txt environment-aware. Staging and demo deployments must remain non-indexable. Production indexing requires an explicit owner-controlled deployment setting.

Use authentication to protect admin, not robots.txt. Apply noindex metadata or X-Robots-Tag to admin, previews, private responses, and appropriate utility pages.

Do not block a public noindex search or filter URL in robots.txt in a way that prevents a crawler from reading its noindex directive. Avoid unbounded faceted URL generation.

RSS must contain only published articles with canonical URLs and valid dates. Regenerate or invalidate sitemap, robots-related public settings, and feeds when their source data changes.

### 14.4 Structured data

Create typed JSON-LD builders. Use stable identifiers derived from canonical URLs and safely serialize JSON-LD, including escaping less-than characters so stored content cannot close the script element.

| Page | Default structured data |
| --- | --- |
| Home | Organization and WebSite with accurate identity data |
| Category or archive | CollectionPage, BreadcrumbList, and an appropriate ItemList |
| Informational article | BlogPosting or Article plus BreadcrumbList |
| Buying guide | Article plus an appropriate ItemList of recommendations |
| Comparison | Article plus BreadcrumbList |
| Author | Person and, where appropriate, ProfilePage based on actual biography |
| Editorial product review with an evidence-backed score | Product with an eligible nested Review, plus article and breadcrumb data |
| Review without required eligible review fields | Accurate article markup; do not invent fields to force a product rich result |

The structured data must match visible live content. Do not populate aggregateRating from a single editorial score or copy Amazon customer ratings into it. Do not invent review counts, prices, stock, shipping, return policies, GTINs, awards, or qualifications.

Only emit offers when the data is actually available, permitted, current, and visible. This publication must not identify itself as the product seller.

Editorial pros and cons markup may be added to an eligible single-product review when the same information is visible. Do not mark an entire multi-product list as one product review.

Do not add FAQPage markup as a Google rich-result tactic. Do not assume HowTo or a sitelinks search box is an available search enhancement. Re-check current Google documentation when implementing any search feature.

Test schema generators automatically and inspect representative pages with the current Rich Results Test and Schema Markup Validator where available. Report eligibility separately from display; rich results are not guaranteed.

### 14.5 Internal linking and editorial SEO

Provide breadcrumbs and useful links among category pages, buying guides, individual reviews, comparisons, and related guides. Internal links must point to published canonical destinations and have meaningful anchor text.

Offer an admin report for orphaned articles and broken internal references. Surface opportunities for links based on shared taxonomy, while letting the editor choose useful placements.

Categories, author pages, and curated tags need original introductions. Do not index automatically generated empty archives or mass-produced keyword variants.

Content checks should encourage useful answers, clear sources, appropriate author identity, and meaningful product comparison. Do not reward content length, artificial repetition, or changing dates without substantive edits.

Provide fields for Google Search Console and other supported verification codes. Never display a property as verified merely because a code was saved.

## 15 Performance, accessibility, and browser quality

### Performance targets

Set these launch targets for representative production-style public pages:

| Measure | Target | Verification |
| --- | --- | --- |
| Lighthouse SEO | 100 where the applicable audit permits | Representative page audit, not a rankings guarantee |
| Lighthouse accessibility | At least 95 | Automated audit plus manual review |
| Lighthouse best practices | At least 95 | Investigate actionable findings |
| Lighthouse mobile performance | At least 90 in a documented test setup | Report the device profile, build, and enabled scripts |
| Largest Contentful Paint | At most 2.5 seconds | Target the 75th percentile of actual visits when sufficient field data exists |
| Interaction to Next Paint | At most 200 milliseconds | Field monitoring after launch |
| Cumulative Layout Shift | At most 0.1 | Lab review and field monitoring |

A lab result is not evidence of field performance. Do not fabricate Core Web Vitals values when the site has no real traffic.

Use optimized fonts, responsive owned images, stable image dimensions, careful above-the-fold image loading, and lazy loading below the fold. Optimize owned imagery with Next.js Image where appropriate; follow the separate rules for catalog images.

Keep public client bundles small. Lazy load admin charts and heavy editor functionality. Do not include the full admin bundle on the public site. Avoid unnecessary third-party scripts and blocking network calls to Amazon during page rendering.

Use caching and pagination rather than overfetching all articles or products. Analyze large bundles when they materially affect the targets.

### Accessibility

Target WCAG 2.2 AA behavior without claiming certification from automated tests alone.

Provide semantic landmarks, a skip link, labelled forms, readable contrast, visible focus, keyboard-operable menus and dialogs, accessible alerts, descriptive action names, appropriate alt text, and table headers.

Do not communicate status only with color. Dialogs must manage focus and return it sensibly. Consent choices must be easy to operate. Respect reduced motion. Make touch targets comfortable and keep forms and content usable when text is enlarged.

Check public reading, mobile navigation, table scrolling, admin editing, validation errors, and authentication using the keyboard. Verify the main flows in current Chrome, Firefox, and Safari where the testing environment supports them.

## 16 Security and application reliability

Treat every Route Handler and Server Action as an independently reachable interface. Verify authentication, role, ownership, and input on the server.

Required protections:

- Use server-only modules for secrets, database access, and provider adapters.
- Keep secrets out of browser bundles, repository history, logs, exports, and public settings responses.
- Use the auth library's password and token protections.
- Validate origins and use the framework/library's appropriate CSRF protections.
- Apply durable rate limits to login, reset, contact, subscribe, search, and event collection where needed.
- Validate request sizes, pagination limits, enum values, slugs, and document structures.
- Escape output and sanitize imported content.
- Disable arbitrary scripts, iframes, raw HTML, and executable Markdown in the editor.
- Validate outbound protocols and remote hosts.
- Prevent SSRF in media imports, link checking, and catalog diagnostics.
- Reject private-network destinations and dangerous redirects in server-side fetch tools.
- Verify uploads by actual format; reject executable content and untrusted SVG uploads.
- Use private object storage and scoped access for unpublished assets.
- Protect download and export endpoints with explicit permissions.
- Configure suitable security headers, including a practical Content Security Policy and anti-framing rules.
- Apply HTTPS and HSTS appropriately for the production host.
- Avoid shared caching of authenticated responses.
- Do not expose stack traces or detailed database errors to visitors.
- Escape CSV formula prefixes when exporting owner-entered text.
- Minimize and restrict personal information.
- Audit meaningful content, permission, and configuration changes.

A public analytics endpoint must not accept arbitrary event types or uncontrolled payloads. A job endpoint must not run because a visitor guessed its URL.

Do not blindly introduce a strict header configuration that breaks the editor, auth, approved imagery, or valid JSON-LD. Test the final configuration.

Use transactions and optimistic concurrency for publishing and sensitive changes. Retry transient background failures with backoff and a limit. A duplicate job invocation must not publish twice or send the same message repeatedly.

Provide useful public error, loading, empty, and not-found states. Capture operational failures through a redacted logging or monitoring adapter.

## 17 Analytics and affiliate click measurement

Implement actual first-party event collection or a documented configured analytics provider. The admin must show the origin and meaning of each metric.

### First-party events

Support minimal events for permitted page views and affiliate clicks. An affiliate click event should include the product/link ID, article ID when present, placement name, source page path, and timestamp.

Use generated event IDs to handle accidental duplicate delivery. Validate relationships so a client cannot invent an unpublished article or an invalid affiliate destination.

Do not store full IP addresses or unnecessary identifiers for routine analytics. Remove query parameters that could contain personal information. Do not fingerprint visitors. Apply consent and retention rules to collection and provider loading.

Track a normal Amazon anchor with a best-effort non-blocking event. Navigation must still work if analytics is blocked, JavaScript is unavailable, or the event endpoint fails.

### Dashboard reporting

Provide date ranges, totals, trends, and breakdowns for:

- Collected page views.
- Observed affiliate clicks.
- Most viewed published articles.
- Articles and placements generating clicks.
- Referencing category or product.
- Data availability, collection start date, and last aggregation time.

Use precise labels. Browser events are observations, not verified human visitors. Do not label page views as unique users. Define any ratio clearly; placement click rate requires corresponding measured impressions, not just article views.

Do not show Amazon orders, conversions, or revenue from local click events. If an owner report-import feature is added later, show its source, covered period, import date, and deduplication behavior. It is optional for launch.

An optional GA4 or other provider can be configured through a validated measurement ID. Do not duplicate first-party events unintentionally or claim that saving an ID proves provider access.

Analytics failures must not affect content rendering or publication. Retain aggregate data according to the documented policy and purge temporary raw events on schedule.

## 18 Content quality and electrical product credibility

The initial content system must support original editorial writing and attributable evidence. Do not generate a large volume of thin posts merely to make the site look populated.

Every product recommendation needs a basis for the relevant factual claims. Provide source URL, evidence notes, and verification date fields. Prefer manufacturer documentation and authoritative technical sources where applicable.

For this niche:

- Keep surge protection claims distinct from basic outlet expansion.
- Do not infer surge protection from a product's appearance or name.
- Verify voltage, current, cord gauge, intended environment, and USB output against reliable documentation.
- Record units consistently and distinguish product ratings from the surrounding electrical installation.
- Do not state that a product is UL Listed, ETL Listed, or otherwise certified without a verified, appropriate source.
- Do not claim that a recommendation eliminates fire, shock, or overload risk.
- Safety-critical instructions require appropriate source review.
- Do not turn an illustration, stock photo, or AI image into evidence of hands-on testing.
- Do not invent product measurements, experiences, experts, awards, or test photos.

Separate independently written editorial information from licensed retailer catalog content. The publication's research process, author biography, and corrections policy must describe what actually occurs.

Optional AI drafting assistance may be added later, but it must require human review and must never auto-publish fabricated facts. AI writing is not a launch prerequisite.

## 19 Contact, newsletter, and privacy controls

### Contact form

Provide name, email, topic, and message fields with server validation, a honeypot, rate limits, and accessible feedback. Store genuine submissions securely and support a restricted admin inbox.

If outbound email is configured, enqueue an admin notification. Notification failure must not lose the submission. Prevent mail-header injection and unsafe forwarding of user content.

The success message should mean the submission was accepted, not that someone has read it. Provide an honest setup state when the owner has not configured a contact destination.

### Newsletter

Newsletter is off by default. When enabled and delivery is configured, provide:

- An explicit subscription purpose and consent checkbox where appropriate.
- Double opt-in with an expiring, single-use verification token.
- Consent source, policy version, and time records.
- An authenticated subscriber view for permitted admins.
- Unsubscribe links that work without signing into the website.
- Suppression of unsubscribed addresses and safe duplicate handling.
- A queued email flow with retries and delivery status.
- A documented data export and deletion process.

If delivery is missing, do not show a form that pretends to complete a subscription. A local mail sink is acceptable for development testing.

### Privacy

Make the privacy page describe the implemented contact, email, analytics, cookies, storage, and retention behavior. Require owner review of identity and jurisdiction-specific information rather than inventing it.

A consent system must provide necessary, analytics, and optional marketing categories when those technologies are used. Offer an easy rejection option and a persistent way to change choices. Do not load nonessential providers before the required consent.

Privacy links and consent choices must work on mobile and with keyboard navigation. Avoid claiming universal legal compliance simply because a banner exists.

## 20 Jobs, cache invalidation, and durable storage

### Jobs

Use an authenticated scheduler or a continuously running worker with durable records. Do not rely on a browser tab, process-local timer, or request-time chance for scheduled publishing.

Implement jobs for:

- Publishing due approved revisions.
- Processing email outbox messages.
- Aggregating and expiring permitted analytics events.
- Cleaning expired preview grants and unused temporary uploads.
- Refreshing catalog cache only when its integration is enabled.
- Producing content review reminders and link-health findings.

A job should have a unique work key, bounded attempts, next attempt time, recorded errors, and a lease or lock. Handle concurrent invocations and server restarts. Provide admin-visible failures and a permission-checked retry action.

Document the actual schedule, deployment mechanism, and scheduler authentication. Pending work must survive a redeploy.

### Public invalidation

Publishing, updating, unpublishing, redirect changes, taxonomy edits, menu edits, and public setting changes must invalidate every affected public representation.

Cover the article body, metadata, category and type listings, homepage selections, author listings, related-article queries, sitemap, and RSS as applicable. Affiliate tag changes must not leave old tagged destinations in public caches.

Use supported Next.js invalidation APIs for the installed version. Test the effect against a production build, not just development's cache behavior.

### Storage and backups

Content and settings live in PostgreSQL. Owned media lives in durable object storage. Deployment-local writable directories must not be the only storage in production.

Document automated database and media backup configuration, retention, access restrictions, and a restore procedure for the selected providers. Test a restore in an isolated environment if infrastructure is available.

Editorial exports are not a substitute for operational backups. Do not claim a backup exists unless the configured infrastructure provides one. Exclude secrets and expired third-party catalog content from general exports.

## 21 Environment variables and configuration

Deliver a documented .env.example containing placeholders only. Use the actual variable names expected by the selected library and adapters.

At minimum, document these concepts:

| Configuration | Requirement |
| --- | --- |
| DATABASE_URL | PostgreSQL connection; server-only |
| Direct database connection if needed | Provider-specific migration connection |
| BETTER_AUTH_SECRET | Strong generated secret; server-only |
| BETTER_AUTH_URL | Valid authentication base URL |
| SITE_URL | Canonical site base URL, validated and environment-specific |
| APP_ENV | Development, demo, staging, or production |
| ENABLE_INDEXING | False by default; production launch setting |
| Redis connection | Distributed rate limits and temporary caches |
| Object storage endpoint, region, bucket | Durable storage configuration |
| Object storage credentials | Server-only |
| Public media base URL | For approved published owned media |
| Email API credentials and sender | Server-only delivery setup |
| Development email sink | Local testing without real delivery |
| Scheduler or cron secret | Protect job invocation |
| Amazon Associate tracking tag | Owner's public affiliate configuration |
| Creators API credential ID, secret, and version | Only for enabled catalog mode; exact integration names documented |
| Amazon marketplace | Default Amazon.com |
| Optional analytics measurement ID | Public integration configuration |
| Optional error monitoring configuration | Redacted, appropriately scoped |
| Owner bootstrap input | One-time setup procedure; no shipped password |

Never prefix a secret with NEXT_PUBLIC_. Do not commit a usable database password, token, email API key, owner password, or Amazon credential.

Validate required environment variables at startup. Missing required database or auth configuration must produce a clear setup error. Missing optional credentials must disable the related feature with an honest admin status.

A production configuration check must reject development defaults, insecure auth URLs, known example secrets, incompatible canonical URLs, and a missing scheduler when scheduling is enabled.

Store owner-controlled non-secret settings in validated database records. Do not copy all environment variables into a settings API.

## 22 Seed content and demo behavior

Provide an idempotent seed command and separate development/demo data from production.

Seed:

- The five starting categories from Section 9.
- Appropriate attribute definitions associated with those categories.
- Draft trust and informational pages.
- Article templates for each content type.
- Representative demo article and product records for testing editor blocks.
- Safe navigation and homepage configuration.

Possible draft article ideas:

1. How to Choose a Power Strip for a Home Office.
2. Surge Protector vs Power Strip What to Compare.
3. Power Strip Tower vs Flat Power Strip.
4. What to Check Before Buying an Extension Cord.
5. What to Compare in a Multi Plug Wall Outlet.
6. Planning a Desk Power Setup.
7. Understanding Manufacturer Stated USB Charging Specifications.
8. How to Read a Power Accessory Specification Sheet.

These are topic ideas, not completed or verified reviews. Keep sample recommendations, authors, product specifications, ratings, and prices clearly marked as demo or absent.

Every demo record must carry an isDemo flag and be excluded from production public queries, feeds, sitemaps, schema, and automatic schedules. Demo layouts must be non-indexable.

Do not ship fictitious published reviews to make the launch site appear complete. A clean initial public state is acceptable until the owner reviews and publishes real content. The admin and demo environment must still allow the complete design and workflow to be inspected.

Do not seed a real owner account with a known password. Use the secure bootstrap flow. Re-running seeds must not overwrite owner-written content.

## 23 Project organization

Use an understandable project structure. These are logical locations, not a requirement to use these exact names:

| Location | Responsibility |
| --- | --- |
| src/app | Public, auth, admin, preview, metadata, and API routes |
| src/components/public | Public layout and editorial UI |
| src/components/admin | Dashboard, editor, tables, and forms |
| src/components/content | Approved document rendering and blocks |
| src/lib/server/auth | Session and permission checks |
| src/lib/server/db | Database client and data access |
| src/lib/server/services | Publishing, taxonomy, media, affiliate, SEO, analytics |
| src/lib/server/adapters | Storage, email, Amazon catalog, and external analytics |
| src/lib/validation | Shared input and document schemas |
| src/lib/seo | Metadata, canonical, schema, and sitemap builders |
| src/lib/content | Types, route mapping, and safe content utilities |
| prisma | Schema, migration history, and seed entry point |
| scripts | Bootstrap, migration helpers, and operational commands |
| tests | Domain, integration, end-to-end, and accessibility checks |
| docs | Owner guide, architecture, deployment, and launch checklist |
| public | Original static brand assets |
| Root configuration | Package lockfile, environment example, lint, formatting, Docker Compose |

Use typed boundaries and reusable components. Avoid giant page components, duplicated SEO logic, multiple incompatible product-card implementations, and excessive abstraction.

Use server-only imports where appropriate. Name files and commands clearly enough that another engineer can maintain the project.

## 24 Implementation sequence

Implement in working increments. Keep docs/BUILD_STATUS.md with completed work, remaining requirements, configuration dependencies, and checks actually run.

| Phase | Work | Exit condition |
| --- | --- | --- |
| 1 Foundation | Inspect/init repository, select supported versions, configure local services, schema, migrations, design tokens | The application starts and connects to real local services |
| 2 Authentication | Owner bootstrap, login, sessions, roles, security boundaries | Direct protected-route and role tests pass |
| 3 Editorial CMS | Taxonomy, authors, products, media, pages, article editor, revisions | Content can be created, edited, previewed, and saved durably |
| 4 Publishing | Live revisions, scheduling, redirects, menus, homepage | Public outputs follow the correct approved content |
| 5 Public experience | All templates, archives, search, reading UI, responsive layouts | Reader flows work without missing pages or fake data |
| 6 SEO and affiliate | Metadata, canonical rules, schema, sitemap, robots, disclosures, direct links | Representative HTML and link checks pass |
| 7 Operations | Forms, optional delivery, real analytics, jobs, diagnostics, exports | Configured features work and missing integrations are honest |
| 8 Verification and handover | Meaningful automated tests, visual review, production build, documentation | Acceptance criteria are evidenced or external prerequisites are explicitly identified |

After an external dependency is identified, continue independent implementation work. Do not stop after the first polished page or wait for Amazon credentials to implement the CMS.

If a phase reveals an architectural conflict, resolve it and update the documentation. Do not silently downgrade mandatory features.

## 25 Verification and acceptance criteria

Use meaningful domain tests, integration tests against an isolated database, and end-to-end tests of the important user journeys. Do not substitute shallow snapshots for publishing or authorization checks.

### Required acceptance matrix

| ID | Scenario | Required result |
| --- | --- | --- |
| A01 | Install dependencies and apply migrations in a clean environment | Documented commands succeed with the committed lockfile |
| A02 | Run production build, lint, and type checking | No actionable errors; do not assume build includes separate lint checks |
| A03 | Bootstrap first Owner | No known password; repeated or unauthorized bootstrap cannot replace the Owner |
| A04 | Login, logout, reset password, and revoke a session | Supported flows work; expired tokens and revoked sessions fail |
| A05 | Complete owner/admin two-factor flow | Challenge and recovery behavior are verified |
| A06 | Call an admin mutation anonymously or with insufficient role | Server rejects it even if UI restrictions are bypassed |
| A07 | Author attempts to edit someone else's draft or publish | Request is rejected with no data change |
| A08 | Change a role or suspend a user | Effective permissions change promptly and the event is audited |
| A09 | Create a new category, subcategory, and attribute | No code edit; records are usable throughout the CMS |
| A10 | Save an article and restart the application | Content remains in the database |
| A11 | Two editors save conflicting versions | A conflict is detected; no silent overwrite |
| A12 | Edit a live article without publishing | Existing body, metadata, taxonomy, and path remain live |
| A13 | Preview a draft | Correct revision renders privately and is not in sitemap, RSS, or search |
| A14 | Publish all four article types | Their templates, routes, metadata, and blocks work |
| A15 | Publish a scheduled revision, including duplicate job invocation | The correct revision becomes live once at the intended instant |
| A16 | Change a published slug or article type | Old path permanently redirects to the new canonical path |
| A17 | Unpublish or archive content | It disappears from public outputs and cached listings |
| A18 | Create and edit a product used by multiple articles | Draft product edits remain private until explicitly published |
| A19 | Upload private media or attempt a malicious upload | Access and format rules hold; published approved media renders correctly |
| A20 | Search or request a draft slug publicly | No draft or private information is returned |
| A21 | Paginate an archive, sort, and use filters | Canonical/indexing rules are correct and invalid pages return 404 |
| A22 | Inspect rendered article HTML without running client JavaScript | Useful content, headings, and links are present |
| A23 | Inspect sitemap, robots, and RSS in staging and production | Correct environment behavior and published-only records |
| A24 | Inspect representative JSON-LD | It parses, matches visible content, and contains no invented ratings or offers |
| A25 | Render with Amazon integration disabled | No numeric Amazon price, stock claim, copied ratings, or catalog image |
| A26 | Click an Amazon CTA with analytics failing | Direct navigation still works and the required disclosure is visible |
| A27 | Change the owner's affiliate tag | Appropriate public links update; no developer tag remains |
| A28 | Simulate catalog expiry or API failure | Expired catalog values disappear; independent editorial content remains |
| A29 | Submit contact and test optional newsletter locally | Persistence, validation, rate limits, consent, token expiry, and unsubscribe work |
| A30 | Run analytics with no data, then collect valid events | Honest empty state followed by actual, correctly labelled results |
| A31 | Reject optional consent | Nonessential provider loading and event behavior follow that choice |
| A32 | Run a job twice or restart during processing | No duplicate publish or email; recoverable recorded state |
| A33 | Navigate public pages and key admin flows at the required widths | No clipped actions, broken layout, or unintended horizontal overflow |
| A34 | Navigate with keyboard and run accessibility checks | Main flows are usable; actionable failures are corrected |
| A35 | Inspect logs, client bundle, API payloads, and exports | No leaked secrets, private drafts, or unnecessary personal data |
| A36 | Export editorial content and inspect configured backup procedure | Export is permission-checked; operational backup status is accurately documented |

Fixtures may test an optional provider adapter, but live verification is a separate item. Never claim an API account, email domain, hosting integration, or Search Console property is verified without actual access and evidence.

### Visual review

Inspect the home page, a category, each article template, a wide comparison table, search results, login, dashboard overview, article editor, product form, media library, and settings.

Review small-screen and desktop versions with real representative content. Correct clipping, inconsistent spacing, unreadable contrast, inaccessible dialogs, sticky controls covering text, and console or hydration errors.

Capture useful screenshots as development evidence. Screenshots do not replace working routes or persisted workflows.

### Completion report

Report what was implemented, which checks passed, the environment used, remaining owner configuration, and any genuine limitations. Keep failures or unavailable checks explicit.

Do not claim "100 percent SEO complete" solely because Lighthouse passes. Report the implemented SEO checklist and any unresolved launch items.

## 26 Deployment and launch preparation

Provide a deployment guide for the selected hosting option. Prefer a supported managed Next.js Node.js runtime, durable PostgreSQL, object storage, Redis when used, and an actual scheduler.

Do not deploy this as a static export while pretending database-driven admin, authentication, and server actions still function.

Document:

1. Required service provisioning.
2. Environment variable setup and validation.
3. Production database migration using the proper deployment migration command.
4. Secure owner bootstrap.
5. Object storage access and media delivery configuration.
6. Email sender verification where delivery is enabled.
7. Scheduler authentication and job frequency.
8. Monitoring, redacted logging, backup configuration, and restore.
9. Domain DNS, HTTPS, canonical hostname, and www redirect.
10. A staging preview and final production smoke check.
11. A rollback procedure that accounts for database migration compatibility.

Domain ownership and external accounts belong to the owner. Do not assume powerplugpicks.com has already been purchased or create paid service accounts without authorization.

### Owner launch checklist

- The domain and HTTPS are configured.
- The canonical site URL matches the final host.
- Production uses real credentials and secure owner access.
- Contact identity and trust pages have been reviewed.
- The author's identity and biography are accurate.
- Real articles and product claims have passed editorial review.
- All demo records are excluded.
- The owner's Amazon account and tracking tag are configured as applicable.
- Affiliate notices and destination links work.
- No prohibited or expired catalog data is visible.
- Public navigation and representative article routes work.
- Sitemap and robots use the final hostname.
- Jobs, storage, and backups are configured.
- Privacy and consent accurately describe the enabled features.
- Required tests and responsive reviews have passed.
- The owner explicitly enables production indexing.
- Search Console setup and sitemap submission are documented for the owner.

Prepare the project fully before any deployment approval that is actually required. Respect the coding environment's permissions for publishing; this brief itself does not grant authority to purchase a domain or create paid accounts.

## 27 Required handover files and owner guide

Deliver at least:

- The complete application source and original brand assets.
- Committed package lockfile.
- Prisma schema, migrations, and safe seed scripts.
- .env.example without secrets.
- Local service configuration and setup commands.
- README with setup, common commands, architecture, and verified versions.
- docs/OWNER_GUIDE.md.
- docs/DEPLOYMENT.md.
- docs/SEO_CHECKLIST.md.
- docs/SECURITY_AND_OPERATIONS.md.
- docs/BUILD_STATUS.md.
- Meaningful tests and a report of the checks actually completed.

The owner guide must explain, with the actual admin screen names:

1. How to sign in and secure the account.
2. How to add a category and category-specific attributes.
3. How to add an independently researched product.
4. How to write each article type and insert product blocks.
5. How to select licensed images and supply alt text.
6. How to save, preview, request review, publish, and schedule.
7. How to update live content without exposing drafts.
8. How to change navigation and home page selections.
9. How to edit SEO metadata and manage redirects.
10. How to configure the owner's affiliate tag.
11. How to interpret observed traffic and clicks.
12. How to process contacts and, when enabled, subscribers.
13. How to review jobs, failed operations, backups, and content freshness.
14. Which external integrations are optional and how to enable them.
15. How to review launch readiness before enabling indexing.

Do not require the owner to edit React files for these routine operations.

## 28 Optional enhancements after the core is finished

The following are optional and must not delay the mandatory launch foundation:

- Approved AI drafting assistance with human review.
- Import of supported Amazon earnings reports with clear source labels.
- Advanced external search.
- Multiple languages with properly implemented alternate URLs.
- Reader accounts, saved articles, or moderated comments.
- Multiple Amazon marketplaces and permitted localization features.
- Additional affiliate retailers with independently licensed content.
- Experimentation or advanced attribution.
- Additional notification and workflow integrations.

Do not implement price tracking or price alerts as an ordinary optional feature; they require appropriate Amazon permission.

## 29 Official references and freshness checks

The implementation choices in this brief are project requirements. Use the official sources below to verify framework behavior, SEO eligibility, and Amazon requirements at implementation time. Re-check policies and supported versions before launch.

### Next.js and application implementation

- [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js sitemap convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)
- [Next.js JSON-LD guidance](https://nextjs.org/docs/app/guides/json-ld)
- [Next.js caching](https://nextjs.org/docs/app/getting-started/caching)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- [Better Auth two-factor authentication](https://better-auth.com/docs/plugins/2fa)
- [Prisma migration deployment](https://www.prisma.io/docs/orm/migrations/applying-a-migration)
- [Tiptap structured output](https://tiptap.dev/docs/guides/output-json-html)

### Google Search and performance

- [Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Writing high-quality reviews](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews)
- [Qualifying sponsored outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)
- [Pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Product snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Google Search documentation updates, including FAQ feature changes](https://developers.google.com/search/updates)
- [Core Web Vitals](https://web.dev/articles/vitals)

### Amazon Associates

- [Associates disclosure guidance](https://affiliate-program.amazon.com/help/node/topic/GPXFHVYZMTGPUMPE)
- [Associates Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement)
- [Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies)
- [Creators API introduction and prerequisites](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction)
- [PA-API 5 deprecation notice](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation)
- [Creators API license guidance](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/license-agreement)

If an official requirement has changed, follow the current official requirement and document the adjustment. Do not retain obsolete APIs or promise a discontinued search feature because it appears in an older tutorial.

## 30 Final instruction to the coding agent

Build the complete PowerPlugPicks website described here. Start by inspecting the repository and establishing the durable database and authentication foundation. Continue through the public site, complete admin workflows, SEO, affiliate handling, jobs, testing, and handover.

Finish with a working repository and a concise completion report. Identify only genuine external prerequisites or unresolved failures. Do not end with a static mockup, invented metrics, placeholder integrations presented as working, or a request for the owner to assemble the application themselves.


# Owner guide

The admin area is `/admin`. It uses your real D1 records. Published articles remain separate from private drafts.

## Start and secure the account

After local setup, visit `/admin/setup` with the one-time setup token from `.dev.vars`. Choose your own name, email, and strong password. Sign in at `/admin/login`; open **Account security** to enable an authenticator, save recovery codes, and review active sessions. The sign-in screen supports recovery codes. Password reset by email only appears when delivery is configured. Owners and admins must enroll an authenticator before changing content or settings.

**Users & roles** lists users and sends invitations. Without configured mail, it displays a private invitation link that expires in 30 minutes; send it directly to the intended person. Authors can edit their own drafts; editors publish; analysts view reporting; owner/admin controls have separate permissions. Do not share your owner login.

## Set up the publication

1. **Settings:** Check the brand name, description, timezone, contact email, analytics preference, and privacy review status. Set the Amazon Associates tag only after you have an account and a real tag. With no tag, links are not represented as commission-enabled.
2. **Categories:** Five categories are seeded. Rename or reorder them, create subcategories, and add category-specific attribute definitions. Categories become useful archives when relevant articles are published.
3. **Authors:** Create a truthful public biography. The author's public profile is separate from their login email. Article publication requires an author with a biography.
4. **Pages:** Click **Add starter page drafts** to create About, How we review, Editorial policy, Affiliate disclosure, Privacy policy, and Terms. This action is safe to repeat and preserves edits. Review every draft against your actual operation before publishing.
5. **Navigation** and **Home page:** Edit labels, destinations, section order, visibility, and headings. Links to unavailable CMS pages are filtered from the public menu.

## Work with products, images, and articles

In **Products**, create an editorial product record. Enter the name, brand/model, appropriate Amazon ASIN or approved Amazon.com link, independently checked specifications, a source URL for each specification, evidence notes, and verification dates. Publish the product before referencing it in a live article. Missing facts stay missing; do not enter invented prices, availability, ratings, certifications, or test results.

In **Media library**, upload only images you own or may publish. Choose a clear alternative description, credit, and license/permission note. Media starts private; an editor approves it for public use. Copy its `/api/media/<id>` URL to a content image field. Images referenced by content are protected against deletion. Amazon catalog images must not be copied into this library.

In **Articles**, choose **New article**, then choose Review, Buying guide, Comparison, or Guide. Enter a title, short description, URL slug, primary category, public author, research basis, and references. The **Writing** tab uses a structured editor with headings, lists, product cards, comparisons, callouts, and source lists. Product references can be reordered with drag-and-drop or the up/down buttons. **Research & sources** records URLs, verification dates, and the owner review check. **Search & sharing** controls title, description, and `noindex`. **Revision history** lists saved versions.

The editor saves changes to D1 after a pause and also has an explicit **Save draft** button. It shows saving, saved, unsaved, conflict, and error states. A conflict preserves your local text and offers a download before reloading. **Preview** opens the draft privately. **Submit for review**, **Mark approved**, **Publish content**, and **Schedule publication** are in the Publication card. Scheduling uses the Settings timezone, displays the matching UTC instant, and locks that revision until cancellation. Publishing validates the author, category, document, claims, references, image approval, and owner review. Fix any displayed blocking errors, then publish again.

To update a live article, edit and save its new draft. The old page stays live until **Publish updated revision** succeeds. If its slug or type changes, the old URL redirects permanently. **Unpublish** removes it from public queries and search. **Archive** and **Move to trash** retain recoverable records. `noindex` pages may still be directly viewed; it is a crawler directive, not an access control.

## Monitor and correct

**Overview** shows database counts and launch tasks. **Analytics** reports observed page views and affiliate clicks only when collection is enabled and consented to. These numbers are not Amazon orders, earnings, or verified people. **Affiliate links** shows the tag setup and link information; links go directly to Amazon and should show the required Associate disclosure. **SEO health** shows actual stored metadata/redirect findings. **Contacts** is an admin-only inbox when a contact destination is configured. **System & activity** shows jobs, failed work, and audit events; a failed job can be retried after fixing its cause. **Help & getting started** links to guidance.

Before enabling public indexing, review real author identity, legal and privacy text, actual article evidence, affiliate destinations/disclosures, mobile pages, jobs, backup configuration, domain/HTTPS, and sitemap/robots. See [SEO checklist](SEO_CHECKLIST.md). `ENABLE_INDEXING` must be explicitly true in a production deployment.

# SEO and editorial launch checklist

## Implemented foundations

- Public article text, headings, links, archives, and search are server rendered.
- One route mapper handles the four article types. Old published paths receive permanent redirects when the type or slug changes.
- Dynamic metadata supplies title, description, canonical, Open Graph, and PNG sharing image. A private draft never supplies public metadata.
- `robots.txt` blocks crawling while `APP_ENV` is not production or `ENABLE_INDEXING` is false. Production indexing needs that explicit switch.
- `sitemap.xml` is built from eligible live, non-demo, indexable records. It excludes drafts, search, previews, admin, and product database entities.
- `rss.xml` includes published articles only. Search and filtered archives are noindex; out-of-range pages return 404.
- Articles have an Article JSON-LD object with true dates, author, and publisher. No invented price, review score, offer, or Amazon customer rating is emitted.
- Direct Amazon links use `rel="sponsored nofollow"`, and affiliate content presents the Associate disclosure.
- Public article updates use a separate live timestamp, so saving a private draft cannot change the live modified date or sitemap lastmod.

## Owner checks before indexing

1. Confirm final domain, HTTPS, canonical hostname, and the `SITE_URL`/`BETTER_AUTH_URL` values.
2. Publish reviewed About, methodology, editorial policy, affiliate disclosure, privacy, terms, and contact details. Do not publish placeholders as factual policy.
3. Give every indexable category a useful description and published, relevant content. Keep empty archives noindex.
4. Confirm each author biography describes a real person and actual experience.
5. Verify every recommended product claim against a source, with dates. Separate hands-on observations from desk research. Do not claim safety certifications without evidence.
6. Review article title, description, excerpt, headings, alternative image text, sources, related links, and selected category.
7. Check representative rendered HTML, schema, canonical URLs, robots, sitemap, RSS, redirects, and contact form on the deployed host.
8. Test mobile navigation, comparisons, performance, and accessibility on representative real content.
9. Enable indexing explicitly, then submit the sitemap to Google Search Console. Saving a verification value does not prove property ownership or indexing.

Lighthouse results, Google indexing, rankings, rich results, traffic, and earnings are not guaranteed. A live-site SEO audit and Search Console verification remain owner launch tasks. The SEO health screen is a targeted content audit, not a ranking score.

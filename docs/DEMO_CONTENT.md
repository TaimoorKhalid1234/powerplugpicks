# Local demo content

The local development database currently contains five clearly labelled demo articles, five fictional product records, one sample author, and a demo tag. The artwork is original SVG under `public/demo`. These records are for layout and workflow previews. They have no Amazon purchase links, verified product specifications, prices, ratings, or hands-on test claims. The articles are marked `noindex` and are omitted from the sitemap, while remaining viewable on the local site.

## What to open

| Page | What it demonstrates |
| --- | --- |
| `/` | Hero, category cards, buying guides, featured articles, and methodology section |
| `/blog` | Full article archive |
| `/buying-guides/demo-surge-protector-desk-guide` | Buying guide, table of contents, product card, FAQ, sources, and related reading |
| `/buying-guides/demo-extension-cord-checklist` | Checklist and a second category's product card |
| `/reviews/demo-compact-desk-power-strip-review` | Review layout, verdict, strengths and limitations |
| `/comparisons/demo-power-strip-vs-tower` | Side-by-side comparison table and two product cards |
| `/guides/demo-wall-outlet-expander-planning` | Practical guide layout |
| `/categories/surge-protectors` | Populated category archive; the other four seeded categories also have examples |
| `/authors/demo-editorial-team` | Author profile/archive |
| `/admin/products` | Product library records in the editorial workspace |

Products appear in articles and comparison blocks. They do not have standalone public product pages in this site architecture.

## Add or remove

These commands affect **local D1 only**. They are safe to repeat and do not modify the Owner account, settings, or the five base categories:

```sh
npm run demo:seed
npm run demo:remove
```

`demo:remove` also deletes the generated sample SVG artwork and any analytics events tied to demo paths. Remove the demo before entering real product or article data that might refer to its records. The demo seed is never part of the production migration or default seed.

Browser screenshots and the check report are stored in ignored `artifacts/demo/`. Regenerate them with `npm run demo:verify` while the local development server is running.

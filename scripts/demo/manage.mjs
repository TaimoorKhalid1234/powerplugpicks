import { execFileSync } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const action = process.argv[2];
if (!["seed", "remove"].includes(action)) throw new Error("Use `npm run demo:seed` or `npm run demo:remove`.");
const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
if (config.vars?.APP_ENV !== "development") throw new Error("Demo commands run only when APP_ENV is development.");

const prefix = "demo-ppp-";
const authorId = `${prefix}author`;
const tagId = `${prefix}tag`;
const stamp = new Date().toISOString();
const sql = value => value === null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const json = value => sql(JSON.stringify(value));
const text = value => ({ type: "text", text: value });
const p = value => ({ type: "paragraph", content: [text(value)] });
const h = value => ({ type: "heading", attrs: { level: 2 }, content: [text(value)] });
const bullets = values => ({ type: "bulletList", content: values.map(value => ({ type: "listItem", content: [p(value)] })) });
const numbered = values => ({ type: "orderedList", content: values.map(value => ({ type: "listItem", content: [p(value)] })) });
const card = product => ({ type: "productCard", attrs: { productId: `${prefix}${product}` } });
const callout = (title, value) => ({ type: "callout", attrs: { title, text: value } });
const faq = (question, answer) => ({ type: "faq", attrs: { question, answer } });
const doc = (...content) => ({ type: "doc", content });
const source = (title, url, note = "") => ({ title, url, note, verifiedAt: stamp.slice(0, 10) });
const extensionSource = source("U.S. Consumer Product Safety Commission: Extension cord safety", "https://www.cpsc.gov/s3fs-public/5032.pdf", "Check ratings, condition, and intended environment.");
const surgeSource = source("Electrical Safety Foundation International: Surge and Protect", "https://www.esfi.org/surge-and-protect-2014/", "A power strip alone does not imply surge protection.");
const stripSource = source("U.S. Consumer Product Safety Commission: Extension cords and power strips", "https://www.cpsc.gov/s3fs-public/ExtensionCordsPowerStrips.pdf", "Avoid overloading power strips and extension cords.");

const base = {
  title: "", slug: "", excerpt: "", document: doc(p("")), articleType: "GUIDE", categoryIds: [], tagIds: [tagId], authorId,
  seoTitle: "", seoDescription: "", noindex: true, featured: false, image: "", imageAlt: "", imageCredit: "Original PowerPlugPicks demo illustration",
  sources: [], researchBasis: "Sample editorial content for local layout testing. No products were independently tested.", reviewDueAt: "", productIds: [], relatedIds: [],
  brand: "", model: "", asin: "", amazonUrl: "", specifications: [], strengths: [], limitations: [], recommendation: "", ownerReviewed: false,
};
const image = name => `/demo/${name}.svg`;
const products = [
  { key: "surge", title: "Demo six-outlet surge protector", category: "cat-surge", image: image("surge"), excerpt: "Fictional reference item used to preview product cards. Check an actual model's rating, certification, and warranty before buying.", specs: [["outlets", "6 (sample)", ""], ["cord length", "6 (sample)", "ft"], ["surge protection", "Illustrative only", ""]], strengths: ["Shows how a compact product card can summarize fit and tradeoffs.", "Makes room for source-linked specifications in real records."], limits: ["No real model, testing, certification, or purchase link is represented."] },
  { key: "cord", title: "Demo indoor extension cord", category: "cat-cords", image: image("cord"), excerpt: "A sample cord record to show an article recommendation layout. Its dimensions and ratings are placeholders.", specs: [["length", "10 (sample)", "ft"], ["use", "Indoor example", ""], ["rating", "Verify on real packaging", ""]], strengths: ["Illustrates where intended use and length would appear.", "Shows a concise pros-and-limitations layout."], limits: ["Do not treat placeholder specifications as purchase guidance."] },
  { key: "strip", title: "Demo compact desk power strip", category: "cat-strips", image: image("strip"), excerpt: "Fictional desk strip for testing a review and side-by-side comparison.", specs: [["outlets", "4 (sample)", ""], ["layout", "Horizontal example", ""], ["surge protection", "Not claimed", ""]], strengths: ["Compact shape in the article card.", "Clear placement for an editorial summary."], limits: ["The example does not represent a real electrical product."] },
  { key: "tower", title: "Demo vertical power tower", category: "cat-towers", image: image("tower"), excerpt: "Fictional vertical outlet layout used to preview comparison tables.", specs: [["outlets", "8 (sample)", ""], ["layout", "Vertical example", ""], ["surge protection", "Not claimed", ""]], strengths: ["Shows a different shape in product imagery.", "Useful comparison-table example."], limits: ["No real model or certification is implied."] },
  { key: "wall", title: "Demo wall outlet expander", category: "cat-wall", image: image("wall"), excerpt: "A sample wall-mounted format for illustrating product cards and category pages.", specs: [["outlets", "3 (sample)", ""], ["mounting", "Wall example", ""], ["rating", "Verify on real packaging", ""]], strengths: ["Shows a compact wall-mounted form.", "Makes room for fit and clearance notes."], limits: ["Not a tested or purchasable recommendation."] },
];
const articles = [
  {
    key: "surge-guide", type: "BUYING_GUIDE", slug: "demo-surge-protector-desk-guide", title: "Demo: Choosing a surge protector for a home desk", image: image("surge"), categories: ["cat-surge", "cat-strips"], featured: true, products: ["surge"], sources: [surgeSource, stripSource],
    excerpt: "A sample buying guide that shows how research, product cards, and practical checkpoints fit together on the page.",
    body: doc(h("Begin with the devices on your desk"), p("A good buying guide starts with the setup, not a product ranking. Make a list of the devices that need an outlet, note plug sizes, and decide where the unit can sit without hiding its label or switch. This article is sample content for testing the website layout; its product is fictional."), h("Check the product information"), p("A regular power strip should not be assumed to provide surge protection. For a real purchase, read the manufacturer's description and markings, compare the electrical rating with the connected devices, and check the conditions of use. The linked safety resources below provide background for these questions."), bullets(["Count outlets after accounting for wide adapters.", "Read the actual product label for its rating and any surge-protection indication.", "Consider cord routing and whether the switch and indicator will remain visible.", "Keep the real product's documentation for later reference."]), h("Example product presentation"), p("The card below demonstrates how an editorial product summary would appear. It contains no price, stock claim, or purchase link."), card("surge"), callout("For this preview", "All product details in this demo are placeholders. Replace them with sourced facts before publishing real recommendations."), h("Questions to ask before choosing"), faq("Does every power strip protect against surges?", "No. A power strip and a surge protector are different product descriptions; verify the feature on the actual device and its documentation."), { type: "sourceList", attrs: {} }),
  },
  {
    key: "cord-guide", type: "BUYING_GUIDE", slug: "demo-extension-cord-checklist", title: "Demo: An extension cord checklist for a flexible workspace", image: image("cord"), categories: ["cat-cords"], featured: false, products: ["cord"], sources: [extensionSource],
    excerpt: "See a second buying-guide layout, with a step-by-step checklist and a sample product card.",
    body: doc(h("Start with the intended environment"), p("An extension cord is a temporary way to reach a device. The right choice depends on the appliance, the location, and the cord's own markings. This sample guide is here to show the page design; it does not recommend the fictional product below."), h("A simple review sequence"), numbered(["Identify the device and read its electrical requirements.", "Check that the real cord is marked for the location where it will be used.", "Inspect the cord and plug for damage before use.", "Keep the cord visible and avoid running it under rugs or furniture."]), p("The U.S. Consumer Product Safety Commission advises checking capacity, inspecting damage, and avoiding concealed or damaged cords. Follow the instructions for the actual cord and connected equipment."), h("How a product appears in a guide"), card("cord"), faq("Can I use an indoor cord outdoors?", "Use a cord outdoors only when the actual product is marked for outdoor use; check its label and instructions."), { type: "sourceList", attrs: {} }),
  },
  {
    key: "strip-review", type: "REVIEW", slug: "demo-compact-desk-power-strip-review", title: "Demo review: A compact desk power strip", image: image("strip"), categories: ["cat-strips"], featured: true, products: ["strip"], sources: [stripSource, surgeSource],
    excerpt: "A sample review page showing a verdict, strengths, limitations, product summary, and supporting sources.",
    body: doc(h("Review summary"), p("This is a design preview, not a hands-on review. The sample product has no real manufacturer, measured performance, or verified certification. A real review would identify the exact model and explain how each claim was checked."), callout("Sample verdict", "A compact horizontal layout can look tidy on a desk, but the actual fit depends on plug shapes, cable routing, and the product's documented rating."), h("What a real review would examine"), bullets(["The physical spacing around outlets and bulky adapters.", "The length and route of the cord in the intended space.", "Clear markings for electrical rating and any claimed protection features.", "A documented distinction between manufacturer claims and hands-on observations."]), card("strip"), h("The tradeoffs"), { type: "prosCons", attrs: { pros: ["Compact example footprint", "Simple summary card"], cons: ["Placeholder data only", "No verified product test"] } }, p("A strip adds access to a circuit; it does not create extra circuit capacity. Refer to the actual product documentation for limits and intended use."), { type: "sourceList", attrs: {} }),
  },
  {
    key: "comparison", type: "COMPARISON", slug: "demo-power-strip-vs-tower", title: "Demo comparison: Desk power strip or vertical tower?", image: image("tower"), categories: ["cat-towers", "cat-strips"], featured: true, products: ["strip", "tower"], sources: [stripSource],
    excerpt: "Explore the comparison-table layout, two product cards, and the way tradeoffs read on desktop and mobile.",
    body: doc(h("Two shapes, one planning question"), p("A horizontal strip and a vertical tower organize outlets differently. This sample compares fictional layouts so you can inspect the website's table and card design. It does not rank real products."), h("At a glance"), { type: "comparisonTable", attrs: { productIds: [`${prefix}strip`, `${prefix}tower`] } }, h("Horizontal layout"), p("A strip may fit along the edge of a desk or behind equipment. In a real comparison, measure the installation area and check whether every plug can be reached without stressing cables."), card("strip"), h("Vertical layout"), p("A tower puts outlets on multiple sides. In a real comparison, check stability, footprint, and where the cord and switch sit in your workspace."), card("tower"), callout("Read the real rating", "Neither shape guarantees surge protection or higher circuit capacity. Use the actual product markings and instructions when choosing."), { type: "sourceList", attrs: {} }),
  },
  {
    key: "wall-guide", type: "GUIDE", slug: "demo-wall-outlet-expander-planning", title: "Demo: Planning a wall outlet expander setup", image: image("wall"), categories: ["cat-wall"], featured: false, products: ["wall"], sources: [stripSource],
    excerpt: "A practical-guide example with an illustrated wall adapter card, checklist, and FAQ block.",
    body: doc(h("Look at the space around the receptacle"), p("Wall outlet expanders can vary in shape and orientation. Before choosing a real model, look at the available clearance, the position of nearby furniture, and the size of the plugs you plan to use. This example exists only to preview article components."), h("Questions for a real product listing"), bullets(["Will the body obstruct the neighboring outlet or a wall switch?", "Are its electrical rating and intended use clear on the packaging?", "How will larger power adapters fit without blocking other sockets?", "Does the manufacturer provide installation and use instructions?"]), h("Sample product card"), card("wall"), faq("Is a wall expander automatically a surge protector?", "No. Check whether the specific product claims surge protection and read its documentation."), { type: "sourceList", attrs: {} }),
  },
];

function productData(item) {
  return { ...base, title: item.title, slug: item.key, excerpt: item.excerpt, image: item.image, imageAlt: `Illustration of a ${item.title.toLowerCase()}`, categoryIds: [item.category], brand: "PowerPlugPicks demo", model: "Fictional layout sample", specifications: item.specs.map(([key,value,unit]) => ({ key, value, unit, sourceUrl: "" })), strengths: item.strengths, limitations: item.limits, recommendation: "Sample product layout", researchBasis: "Fictional item for local UI preview; not tested or for sale." };
}
function articleData(item) {
  return { ...base, title: item.title, slug: item.slug, excerpt: item.excerpt, document: item.body, articleType: item.type, categoryIds: item.categories, featured: item.featured, image: item.image, imageAlt: `Original illustration for ${item.title}`, sources: item.sources, productIds: item.products.map(key => `${prefix}${key}`), researchBasis: "Sample editorial content for local interface testing. The featured products are fictional and were not hands-on tested." };
}
function documentText(node) { return [node.text || "", ...(node.content || []).map(documentText)].join(" ").trim(); }
const statements = [];
function insertContent(id, kind, data, path, offset) {
  const revision = `${id}-rev`;
  const time = new Date(Date.now() - offset * 86400000).toISOString();
  statements.push(`INSERT OR IGNORE INTO content_records(id,kind,state,created_by,version,is_demo,created_at,updated_at,published_at,live_updated_at,public_path) VALUES(${sql(id)},${sql(kind)},'PUBLISHED','demo-fixture',1,0,${sql(time)},${sql(time)},${sql(time)},${sql(time)},${sql(path)});`);
  statements.push(`INSERT OR IGNORE INTO revisions(id,content_id,workflow,data,created_by,created_at) VALUES(${sql(revision)},${sql(id)},'PUBLISHED',${json(data)},'demo-fixture',${sql(time)});`);
  statements.push(`UPDATE content_records SET live_revision_id=${sql(revision)} WHERE id=${sql(id)} AND live_revision_id IS NULL AND created_by='demo-fixture';`);
  if (kind === "article") statements.push(`INSERT INTO public_search(content_id,title,excerpt,body) SELECT ${sql(id)},${sql(data.title)},${sql(data.excerpt)},${sql(documentText(data.document))} WHERE NOT EXISTS(SELECT 1 FROM public_search WHERE content_id=${sql(id)});`);
}

if (action === "seed") {
  await mkdir("public/demo", { recursive: true });
  const colors = { surge: ["#dcefe6", "#245d45"], cord: ["#e7edf6", "#34577d"], strip: ["#f1ede4", "#86634a"], tower: ["#e8e8f3", "#565982"], wall: ["#f5ebe3", "#a46848"] };
  for (const item of products) {
    const [background,accent] = colors[item.key];
    const device = item.key === "tower" ? `<rect x="514" y="126" width="172" height="462" rx="45" fill="#fdfefd" stroke="#c8d5d0" stroke-width="8"/><rect x="544" y="153" width="112" height="410" rx="30" fill="#edf3f0"/>${[0,1,2,3].map(i=>`<g transform="translate(600 ${207+i*96})"><circle r="30" fill="#fff"/><circle cx="-10" cy="0" r="4" fill="${accent}"/><circle cx="10" cy="0" r="4" fill="${accent}"/><circle cx="0" cy="12" r="4" fill="${accent}"/></g>`).join("")}` : item.key === "wall" ? `<rect x="411" y="180" width="378" height="338" rx="56" fill="#fdfefd" stroke="#c8d5d0" stroke-width="8"/>${[[505,280],[695,280],[600,416]].map(([x,y])=>`<g transform="translate(${x} ${y})"><circle r="51" fill="#edf3f0"/><circle cx="-13" cy="-5" r="5" fill="${accent}"/><circle cx="13" cy="-5" r="5" fill="${accent}"/><circle cx="0" cy="14" r="5" fill="${accent}"/></g>`).join("")}` : item.key === "cord" ? `<path d="M372 379 C368 255 556 235 586 362 S815 477 838 322" fill="none" stroke="#fff" stroke-width="58" stroke-linecap="round"/><path d="M372 379 C368 255 556 235 586 362 S815 477 838 322" fill="none" stroke="#c8d5d0" stroke-width="7" stroke-linecap="round"/><rect x="316" y="337" width="101" height="85" rx="22" fill="#fdfefd" stroke="#c8d5d0" stroke-width="7"/><rect x="822" y="264" width="82" height="90" rx="18" fill="#fdfefd" stroke="#c8d5d0" stroke-width="7"/>` : `<g transform="rotate(-12 600 375)"><rect x="272" y="286" width="656" height="177" rx="57" fill="#fff" stroke="#c8d5d0" stroke-width="8"/><rect x="300" y="313" width="600" height="123" rx="37" fill="#edf3f0"/>${Array.from({length:item.key==="surge"?6:4},(_,i)=>`<g transform="translate(${item.key==="surge"?330+i*108:420+i*120} 374)"><circle r="36" fill="#fff"/><circle cx="-11" cy="-5" r="4" fill="${accent}"/><circle cx="11" cy="-5" r="4" fill="${accent}"/><circle cx="0" cy="13" r="4" fill="${accent}"/></g>`).join("")}</g>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-label="Illustration of a sample ${item.key} product"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#ffffff"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="${accent}" flood-opacity=".18"/></filter></defs><rect width="1200" height="750" fill="url(#bg)"/><circle cx="160" cy="135" r="124" fill="#fff" opacity=".45"/><circle cx="1070" cy="665" r="240" fill="${accent}" opacity=".07"/><g filter="url(#shadow)">${device}</g><text x="64" y="680" fill="${accent}" font-family="Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="3">POWERPLUGPICKS  /  DEMO</text></svg>`;
    await writeFile(resolve("public/demo", `${item.key}.svg`), svg);
  }
  statements.push(`INSERT OR IGNORE INTO authors(id,name,slug,biography,image,links,user_id) VALUES(${sql(authorId)},'PowerPlugPicks demo team','demo-editorial-team','Sample author profile for local website previews. This is not a real editorial byline.','','[]',NULL);`);
  statements.push(`INSERT OR IGNORE INTO tags(id,name,slug,description,indexable) VALUES(${sql(tagId)},'Demo content','demo-content','Temporary layout examples. Replace with reviewed editorial content.',0);`);
  products.forEach((item, index) => insertContent(`${prefix}${item.key}`, "product", productData(item), null, 14 - index));
  articles.forEach((item, index) => insertContent(`${prefix}${item.key}`, "article", articleData(item), `/${({REVIEW:"reviews",BUYING_GUIDE:"buying-guides",COMPARISON:"comparisons",GUIDE:"guides"})[item.type]}/${item.slug}`, 6 - index));
} else {
  statements.push(`DELETE FROM jobs WHERE content_id IN (SELECT id FROM content_records WHERE created_by='demo-fixture' AND id LIKE '${prefix}%');`);
  statements.push(`DELETE FROM analytics_events WHERE article_id IN (SELECT id FROM content_records WHERE created_by='demo-fixture' AND id LIKE '${prefix}%') OR product_id IN (SELECT id FROM content_records WHERE created_by='demo-fixture' AND id LIKE '${prefix}%') OR path LIKE '/%/demo-%';`);
  statements.push(`DELETE FROM public_search WHERE content_id IN (SELECT id FROM content_records WHERE created_by='demo-fixture' AND id LIKE '${prefix}%');`);
  statements.push(`DELETE FROM redirects WHERE source LIKE '/%/demo-%' OR target LIKE '/%/demo-%';`);
  statements.push(`DELETE FROM content_records WHERE created_by='demo-fixture' AND id LIKE '${prefix}%';`);
  statements.push(`DELETE FROM authors WHERE id=${sql(authorId)};`);
  statements.push(`DELETE FROM tags WHERE id=${sql(tagId)};`);
  statements.push(`DELETE FROM audit_log WHERE actor_id='demo-fixture';`);
}

await mkdir("artifacts/demo", { recursive: true });
const file = resolve("artifacts/demo", `${action}.sql`);
await writeFile(file, statements.join("\n") + "\n");
const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
execFileSync(process.execPath, [wrangler, "d1", "execute", "DB", "--local", `--file=${file}`], { stdio: "inherit" });
if (action === "remove") for (const item of products) await unlink(resolve("public/demo", `${item.key}.svg`)).catch(error => { if (error.code !== "ENOENT") throw error; });
process.stdout.write(action === "seed" ? `Added ${articles.length} demo articles and ${products.length} demo products to local D1.\n` : "Removed demo articles, products, author, and tag from local D1.\n");

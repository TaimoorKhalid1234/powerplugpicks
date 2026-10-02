import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
await mkdir("artifacts/demo", { recursive: true });
const checks = [
  ["/", "home", [390, 1440]],
  ["/blog", "blog", [390]],
  ["/buying-guides/demo-surge-protector-desk-guide", "buying-guide", [390, 1440]],
  ["/reviews/demo-compact-desk-power-strip-review", "review", [390]],
  ["/comparisons/demo-power-strip-vs-tower", "comparison", [390, 1440]],
  ["/categories/extension-cords", "category", [390]],
];
const results = [];
try {
  for (const [path, name, widths] of checks) for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(root + path, { waitUntil: "networkidle" });
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(image => image.decode().catch(() => {}));
    }
    await page.evaluate(() => scrollTo(0, 0));
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, brokenImages: [...document.images].filter(image => image.naturalWidth === 0).map(image => image.src) }));
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    await page.screenshot({ path: `artifacts/demo/${name}-${width}.png`, fullPage: true });
    const result = { path, width, status: response.status(), ...dimensions, violations: axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), errors };
    results.push(result);
    process.stdout.write(`${path} ${width}px: HTTP ${result.status}, overflow ${result.document - result.viewport}px, broken images ${result.brokenImages.length}, axe ${result.violations.length}\n`);
    await context.close();
  }
  await writeFile("artifacts/demo/report.json", JSON.stringify(results, null, 2));
  if (results.some(r => r.status !== 200 || r.document > r.viewport || r.brokenImages.length || r.violations.length || r.errors.length)) throw new Error("Demo UI check failed; see artifacts/demo/report.json.");
} finally { await browser.close(); }

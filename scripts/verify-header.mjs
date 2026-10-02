import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = "http://localhost:3000";
const cases = [
  ["/", "Home"],
  ["/buying-guides", "Buying guides"],
  ["/buying-guides/demo-surge-protector-desk-guide", "Buying guides"],
  ["/reviews/demo-compact-desk-power-strip-review", "Reviews"],
  ["/comparisons/demo-power-strip-vs-tower", "Comparisons"],
  ["/guides/demo-wall-outlet-expander-planning", "Guides"],
  ["/search?q=surge", "Search articles"],
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
await mkdir("artifacts/header", { recursive: true });
try {
  for (const [path, expected] of cases) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const response = await page.goto(root + path, { waitUntil: "networkidle" });
    const desktopCurrent = page.locator("header nav[aria-label='Main navigation'] [aria-current=page], header > div > a[aria-current=page]");
    const current = await desktopCurrent.getAttribute("aria-label").catch(() => null) || await desktopCurrent.textContent().catch(() => null);
    const visual = await desktopCurrent.evaluate(element => ({ color: getComputedStyle(element).color, underline: getComputedStyle(element, "::after").height }));
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const row = { path, status: response.status(), expected, current: current?.trim(), visual, violations: axe.violations.map(v => v.id) };
    results.push(row);
    process.stdout.write(`${path}: ${row.current || "none"}, axe ${row.violations.length}\n`);
    if(path.includes("demo-surge"))await page.screenshot({path:"artifacts/header/desktop-active.png",fullPage:false});
    if (row.status !== 200 || row.current !== expected || row.visual.color !== "rgb(23, 104, 88)" || (expected !== "Search articles" && row.visual.underline !== "2px") || row.violations.length) throw new Error(`Header check failed: ${JSON.stringify(row)}`);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(root + "/buying-guides/demo-surge-protector-desk-guide", { waitUntil: "networkidle" });
  await page.locator("header details summary").click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("header details summary span span:nth-child(2)")).opacity === "0");
  const mobileCurrent = await page.locator("header details nav [aria-current=page]").evaluate(element => element.childNodes[0]?.textContent?.trim());
  const menuState = await page.locator("header details").evaluate(element => {
    const lines=[...element.querySelectorAll("summary span span")];
    return {open:element.hasAttribute("open"),label:element.querySelector("summary")?.getAttribute("aria-label"),firstTransform:getComputedStyle(lines[0]).transform,middleOpacity:getComputedStyle(lines[1]).opacity,lastTransform:getComputedStyle(lines[2]).transform,backdrop:getComputedStyle(element.querySelector("button")).display,bodyOverflow:getComputedStyle(document.body).overflow,htmlOverflow:getComputedStyle(document.documentElement).overflow};
  });
  const beforeWheel=await page.evaluate(()=>scrollY);
  await page.mouse.move(10,700);await page.mouse.wheel(0,700);
  const afterWheel=await page.evaluate(()=>scrollY);
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  const mobileAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  await page.screenshot({ path: "artifacts/header/mobile-active.png", fullPage: false });
  results.push({ path: "mobile nested buying guide", current: mobileCurrent, menuState, beforeWheel, afterWheel, ...dimensions, violations:mobileAxe.violations.map(v=>v.id) });
  if (mobileCurrent !== "Buying guides" || !menuState.open || menuState.label!=="Close navigation menu" || menuState.firstTransform==="none" || menuState.lastTransform==="none" || menuState.middleOpacity!=="0" || menuState.backdrop==="none" || menuState.bodyOverflow!=="hidden" || menuState.htmlOverflow!=="hidden" || beforeWheel!==afterWheel || dimensions.document > dimensions.viewport || mobileAxe.violations.length) throw new Error(`Mobile header check failed: ${JSON.stringify(results.at(-1))}`);
  await page.mouse.click(10,800);
  if(await page.locator("header details").getAttribute("open")!==null)throw new Error("Backdrop did not close the mobile navigation.");
  await page.locator("header details summary").click();
  await page.locator("header details summary").click();
  await page.waitForFunction(() => !document.querySelector("header details")?.hasAttribute("open"));
  await context.close();
  await writeFile("artifacts/header/report.json", JSON.stringify(results, null, 2));
} finally { await browser.close(); }

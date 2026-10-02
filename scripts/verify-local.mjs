import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHmac, randomBytes } from "node:crypto";

if (process.env.LOCAL_QA !== "1") throw new Error("Set LOCAL_QA=1 to run this local integration check.");
const root = "http://localhost:3000";
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, "")]; }));
const fixturePath = "artifacts/local-qa-auth.json";
let fixture;
try { fixture = JSON.parse(await readFile(fixturePath, "utf8")); } catch { fixture = { email: "qa-owner@example.test", password: randomBytes(28).toString("base64url") }; }
const jar = new Map();
async function request(path, body, method = "POST") {
  const response = await fetch(root + path, { method, redirect: "manual", headers: { Origin: root, ...(body ? { "Content-Type": "application/json" } : {}), ...(jar.size ? { Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") } : {}) }, body: body ? JSON.stringify(body) : undefined });
  for (const cookie of response.headers.getSetCookie()) { const match = /^([^=;]+)=([^;]*)/.exec(cookie); if (match) { if (/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(cookie)) jar.delete(match[1]); else jar.set(match[1], match[2]); } }
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = { text }; }
  return { status: response.status, data };
}
function check(name, result, statuses) { if (!statuses.includes(result.status)) throw new Error(`${name}: expected ${statuses.join("/")}, received ${result.status}: ${JSON.stringify(result.data).slice(0, 350)}`); process.stdout.write(`${name}: HTTP ${result.status}\n`); return result.data; }
function totp(secret) { const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = 0, count = 0; const bytes = []; for (const ch of secret.toUpperCase().replace(/=+$/, "")) { const n = alphabet.indexOf(ch); if (n < 0) throw new Error("Invalid authenticator key."); bits = (bits << 5) | n; count += 5; if (count >= 8) { count -= 8; bytes.push((bits >>> count) & 255); } } const period = Math.floor(Date.now() / 30000), counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(period)); const digest = createHmac("sha1", Buffer.from(bytes)).update(counter).digest(); const offset = digest.at(-1) & 15; return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0"); }
check("anonymous admin mutation", await request("/api/admin/content", { kind: "article", data: {} }), [401]);
check("public signup closed", await request("/api/auth/sign-up/email", { email: "nobody@example.test", password: "not-a-real-password" }), [403]);
if (!fixture.bootstrapped) {
  check("first owner bootstrap", await request("/api/bootstrap", { name: "Local QA Owner", email: fixture.email, password: fixture.password, token: vars.BOOTSTRAP_TOKEN }), [201]);
  fixture.bootstrapped = true; await mkdir("artifacts", { recursive: true }); await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
}
check("repeat bootstrap denied", await request("/api/bootstrap", { name: "Other Owner", email: "other-owner@example.test", password: randomBytes(24).toString("base64url"), token: vars.BOOTSTRAP_TOKEN }), [409]);
const login = check("owner sign in", await request("/api/auth/sign-in/email", { email: fixture.email, password: fixture.password }), [200]);
if (login.twoFactorRedirect) { if (!fixture.totpSecret) throw new Error("Owner has 2FA but fixture has no authenticator key."); check("TOTP sign in", await request("/api/auth/two-factor/verify-totp", { code: totp(fixture.totpSecret), trustDevice: false }), [200]); }
if (!fixture.totpSecret) {
  check("admin write requires 2FA", await request("/api/admin/content", { kind: "article", data: { title: "Denied" } }), [403]);
  const enabled = check("enable authenticator", await request("/api/auth/two-factor/enable", { password: fixture.password }), [200]);
  fixture.totpSecret = new URL(enabled.totpURI).searchParams.get("secret");
  if (!fixture.totpSecret) throw new Error("Authenticator setup did not return a key.");
  check("verify authenticator", await request("/api/auth/two-factor/verify-totp", { code: totp(fixture.totpSecret), trustDevice: false }), [200]);
  await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
}
check("authenticated overview", await request("/api/admin/overview", undefined, "GET"), [200]);
if (fixture.completed) { process.stdout.write("Local workflow fixture was already verified.\n"); process.exit(0); }
let changed;
if (!fixture.articleId) {
const author = check("create public author", await request("/api/admin/authors", { name: "Local QA Writer", slug: "local-qa-writer", biography: "Local test author profile for checking publishing. This identity is removed after verification.", image: "", links: [], userId: null }), [200, 201]);
fixture.authorId = author.item.id;
const body = { title: "Local Publishing Workflow Check", slug: "local-publishing-workflow-check", excerpt: "A local article used to verify draft and live publishing behavior.", document: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "What to check" }] }, { type: "paragraph", content: [{ type: "text", text: "Compare outlet counts, cord length, and the manufacturer documentation for the intended setup." }] }] }, articleType: "GUIDE", categoryIds: ["cat-strips"], authorId: fixture.authorId, researchBasis: "Local workflow fixture using no real product recommendations.", ownerReviewed: true, noindex: true };
const created = check("create article draft", await request("/api/admin/content", { kind: "article", data: body }), [201]);
fixture.articleId = created.record.id; await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
const path = "/guides/local-publishing-workflow-check";
check("draft not public", await request(path, undefined, "GET"), [404]);
check("private draft preview", await request(`/preview/${fixture.articleId}`, undefined, "GET"), [200]);
const saved = check("save article", await request(`/api/admin/content/${fixture.articleId}`, { version: created.record.version, data: { ...body, title: "Local Publishing Workflow Check" } }, "PATCH"), [200]);
check("stale save conflicts", await request(`/api/admin/content/${fixture.articleId}`, { version: created.record.version, data: body }, "PATCH"), [409]);
const published = check("publish article", await request(`/api/admin/content/${fixture.articleId}`, { action: "publish", version: saved.record.version }), [200]);
check("published article public", await request(path, undefined, "GET"), [200]);
changed = check("save new draft", await request(`/api/admin/content/${fixture.articleId}`, { version: published.record.version, data: { ...body, title: "Private draft title", slug: "new-local-workflow-path" } }, "PATCH"), [200]);
} else {
  changed = check("resume current draft", await request(`/api/admin/content/${fixture.articleId}`, undefined, "GET"), [200]);
}
const path = "/guides/local-publishing-workflow-check";
const live = check("published page remains live", await request(path, undefined, "GET"), [200]);
if (!live.text.includes("Local Publishing Workflow Check") || live.text.includes("Private draft title")) throw new Error("Private draft changed the live HTML.");
check("draft slug remains private", await request("/guides/new-local-workflow-path", undefined, "GET"), [404]);
check("publish revised path", await request(`/api/admin/content/${fixture.articleId}`, { action: "publish", version: changed.record.version }), [200]);
const redirected = await request(path, undefined, "GET"); check("old path redirects", redirected, [308]);
check("new path public", await request("/guides/new-local-workflow-path", undefined, "GET"), [200]);
const current = check("read current record", await request(`/api/admin/content/${fixture.articleId}`, undefined, "GET"), [200]);
check("unpublish removes public page", await request(`/api/admin/content/${fixture.articleId}`, { action: "unpublish", version: current.record.version }), [200]);
check("unpublished path hidden", await request("/guides/new-local-workflow-path", undefined, "GET"), [404]);
fixture.completed = true; await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
process.stdout.write("Local integration sequence completed. Fixture IDs are saved in ignored artifacts/local-qa-auth.json for cleanup.\n");

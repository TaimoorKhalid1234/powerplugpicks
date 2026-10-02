import { describe, expect, it } from "vitest";
import { articlePath, amazonDestination, collectDocumentRefs } from "../src/lib/content";
import { parseContent, settingsSchema, validateDocument } from "../src/lib/validation";

describe("publication boundaries", () => {
  it("uses one canonical route mapping for every article type", () => {
    expect(articlePath("REVIEW", "desk-strip")).toBe("/reviews/desk-strip");
    expect(articlePath("BUYING_GUIDE", "desk-strip")).toBe("/buying-guides/desk-strip");
    expect(articlePath("COMPARISON", "a-b")).toBe("/comparisons/a-b");
    expect(articlePath("GUIDE", "outlets")).toBe("/guides/outlets");
  });

  it("keeps a direct Amazon destination and applies the owner's tag", () => {
    const destination = amazonDestination({
      asin: "B012345678",
      amazonUrl: "https://www.amazon.com/dp/B012345678?tag=old-20&linkCode=ll1",
    }, "owner-20");
    expect(destination).toContain("tag=owner-20");
    expect(destination).toContain("linkCode=ll1");
  });

  it("rejects invalid retailer hosts and protocols", () => {
    for (const amazonUrl of [
      "javascript:alert(1)",
      "https://amazon.com.evil.test/dp/B012345678",
      "http://amazon.com/dp/B012345678",
      "https://me@amazon.com/dp/B012345678",
      "https://amazon.com:444/dp/B012345678",
    ]) {
      expect(amazonDestination({ asin: "", amazonUrl }, "owner-20")).toBeNull();
    }
  });

  it("rejects script nodes, unsafe links, and unowned images", () => {
    expect(validateDocument({ type: "doc", content: [{ type: "html", text: "<script>" }] })).toBe(false);
    expect(validateDocument({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "click", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] })).toBe(false);
    expect(validateDocument({ type: "doc", content: [{ type: "image", attrs: { src: "https://amazon.com/copied.jpg", alt: "test" } }] })).toBe(false);
  });

  it("finds durable product references in structured content", () => {
    const refs = collectDocumentRefs({ type: "doc", content: [
      { type: "productCard", attrs: { productId: "p1" } },
      { type: "comparisonTable", attrs: { productIds: ["p1", "p2"] } },
    ] });
    expect(refs.products).toEqual(["p1", "p2"]);
  });

  it("validates product URLs and safe default draft indexing", () => {
    expect(() => parseContent({ amazonUrl: "https://example.com" })).toThrow();
    expect(parseContent({ title: "Draft" }).noindex).toBe(true);
  });

  it("rejects executable navigation protocols", () => {
    const navigation = [{ label: "X", href: "javascript:alert(1)", location: "header" }];
    expect(settingsSchema.shape.navigation.safeParse(navigation).success).toBe(false);
  });
});

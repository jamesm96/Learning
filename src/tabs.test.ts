import { describe, expect, it } from "vitest";
import { hashForTab, tabFromHash, TABS } from "./tabs";

describe("tabFromHash", () => {
  it("reads a known tab", () => {
    expect(tabFromHash("#/learn")).toBe("learn");
  });

  it("ignores anything after the tab name", () => {
    expect(tabFromHash("#/learn/data-04")).toBe("learn");
  });

  it("falls back to Today for an empty hash", () => {
    expect(tabFromHash("")).toBe("today");
  });

  it("falls back to Today for an unknown tab", () => {
    expect(tabFromHash("#/settings")).toBe("today");
  });

  it("round-trips every tab through hashForTab", () => {
    for (const tab of TABS) {
      expect(tabFromHash(hashForTab(tab.id))).toBe(tab.id);
    }
  });
});

import { describe, expect, it } from "vitest";
import { formatPath, parsePath, resolvePath, samePath } from "./data-path";

const scene = {
  level: "harbour",
  assets: [
    { name: "rock_01", materials: ["moss", "stone"] },
    { name: "boat_01", materials: ["wood", "rope", "metal"] },
  ],
};

describe("parsePath", () => {
  it("reads keys and indexes, with either quote style", () => {
    expect(parsePath(`scene["assets"][1]['materials'][-1]`, "scene")).toEqual(["assets", 1, "materials", -1]);
  });

  it("explains a path that does not start with the name", () => {
    expect(parsePath(`data["assets"]`, "scene")).toEqual({ error: "Start the path with scene." });
  });

  it("explains a step it cannot read", () => {
    expect(parsePath("scene.assets", "scene")).toMatchObject({ error: expect.stringContaining('["key"]') });
  });
});

describe("resolvePath", () => {
  it("follows a path to its value", () => {
    expect(resolvePath(scene, ["assets", 1, "materials", 1])).toMatchObject({ found: true, value: "rope" });
  });

  it("turns negative indexes into ordinary ones", () => {
    const result = resolvePath(scene, ["assets", -1, "materials", -1]);
    expect(result).toMatchObject({ found: true, value: "metal", parts: ["assets", 1, "materials", 2] });
  });

  it("explains a missing key, a bad index and a string index into a list", () => {
    expect(resolvePath(scene, ["lod"])).toMatchObject({ found: false, error: expect.stringContaining("KeyError") });
    expect(resolvePath(scene, ["assets", 5])).toMatchObject({ found: false, error: expect.stringContaining("IndexError") });
    expect(resolvePath(scene, ["assets", "name"])).toMatchObject({ found: false, error: expect.stringContaining("TypeError") });
  });
});

describe("formatPath and samePath", () => {
  it("writes a path the Python way", () => {
    expect(formatPath("scene", ["assets", 1, "materials", 2])).toBe('scene["assets"][1]["materials"][2]');
  });

  it("compares paths part by part", () => {
    expect(samePath(["a", 1], ["a", 1])).toBe(true);
    expect(samePath(["a", 1], ["a", "1"])).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("should handle conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
    expect(cn("a", true && "b", "c")).toBe("a b c");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-2", "p-4")).toBe("p-4");
  });
});

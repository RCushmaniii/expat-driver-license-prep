import { describe, it, expect } from "vitest";
import {
  boundedArray,
  boundedNumber,
  boundedString,
} from "../server/api-validation";

describe("boundedString", () => {
  it("accepts a normal string within the limit", () => {
    expect(boundedString("hello", 10)).toBe("hello");
  });

  it("trims surrounding whitespace", () => {
    expect(boundedString("  hi  ", 10)).toBe("hi");
  });

  it("rejects strings over the limit", () => {
    expect(boundedString("a".repeat(11), 10)).toBeNull();
  });

  it("rejects empty and whitespace-only strings", () => {
    expect(boundedString("", 10)).toBeNull();
    expect(boundedString("   ", 10)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(boundedString(42, 10)).toBeNull();
    expect(boundedString(null, 10)).toBeNull();
    expect(boundedString(undefined, 10)).toBeNull();
    expect(boundedString(["a"], 10)).toBeNull();
  });
});

describe("boundedNumber", () => {
  it("accepts numbers within range, including bounds", () => {
    expect(boundedNumber(50, 0, 100)).toBe(50);
    expect(boundedNumber(0, 0, 100)).toBe(0);
    expect(boundedNumber(100, 0, 100)).toBe(100);
  });

  it("rejects out-of-range numbers", () => {
    expect(boundedNumber(-1, 0, 100)).toBeNull();
    expect(boundedNumber(101, 0, 100)).toBeNull();
  });

  it("rejects NaN, Infinity, and non-numbers", () => {
    expect(boundedNumber(NaN, 0, 100)).toBeNull();
    expect(boundedNumber(Infinity, 0, 100)).toBeNull();
    expect(boundedNumber("50", 0, 100)).toBeNull();
    expect(boundedNumber(null, 0, 100)).toBeNull();
  });
});

describe("boundedArray", () => {
  it("accepts arrays within the item limit", () => {
    expect(boundedArray([1, 2, 3], 5)).toEqual([1, 2, 3]);
    expect(boundedArray([], 5)).toEqual([]);
  });

  it("rejects arrays over the item limit", () => {
    expect(boundedArray([1, 2, 3], 2)).toBeNull();
  });

  it("rejects non-arrays", () => {
    expect(boundedArray("abc", 5)).toBeNull();
    expect(boundedArray({ length: 1 }, 5)).toBeNull();
    expect(boundedArray(null, 5)).toBeNull();
  });
});

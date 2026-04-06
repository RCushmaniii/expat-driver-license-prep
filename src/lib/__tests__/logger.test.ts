import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogger } from "../logger";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("createLogger", () => {
  it("creates a logger with the given route", () => {
    const log = createLogger("/api/ai/explain");
    expect(log.info).toBeTypeOf("function");
    expect(log.warn).toBeTypeOf("function");
    expect(log.error).toBeTypeOf("function");
  });

  it("outputs structured JSON on info", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("/api/ai/explain");

    log.info("request received", { questionId: "q-001" });

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("request received");
    expect(output.route).toBe("/api/ai/explain");
    expect(output.questionId).toBe("q-001");
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("outputs to console.warn on warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = createLogger("/api/ai/readiness");

    log.warn("slow response");

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("warn");
  });

  it("outputs to console.error on error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("/api/ai/explain");

    log.error("API call failed", { error: "timeout" });

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("error");
    expect(output.error).toBe("timeout");
  });

  it("works without extra metadata", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger("/api/test");

    log.info("simple message");

    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("simple message");
    expect(output.route).toBe("/api/test");
  });
});

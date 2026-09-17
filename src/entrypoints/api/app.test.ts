import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

describe("GET /health", () => {
  it("answers ok with the clock's time", async () => {
    const app = createApp({
      clock: { now: () => new Date("2026-09-17T00:00:00Z") },
    });

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      time: "2026-09-17T00:00:00.000Z",
    });
  });
});

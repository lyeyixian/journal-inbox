import { describe, expect, it } from "vitest";
import { dayOf } from "./day.ts";

describe("dayOf", () => {
  it("rolls over at Singapore midnight, not UTC midnight", () => {
    expect(dayOf(new Date("2026-09-17T15:59:59Z"))).toBe("2026-09-17");
    expect(dayOf(new Date("2026-09-17T16:00:00Z"))).toBe("2026-09-18");
  });
});

import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.ts";

function app(handleEvent = vi.fn(async () => {})) {
  return createApp({
    clock: { now: () => new Date("2026-09-17T00:00:00Z") },
    handleEvent,
    eventIntakeSecret: "s3cret",
  });
}

describe("GET /health", () => {
  it("answers ok with the clock's time", async () => {
    const response = await app().request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      time: "2026-09-17T00:00:00.000Z",
    });
  });
});

describe("POST /events", () => {
  const post = (body: unknown, secret?: string) =>
    new Request("http://localhost/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret === undefined ? {} : { "x-event-secret": secret }),
      },
      body: JSON.stringify(body),
    });

  it("hands a well-formed event to HandleEvent", async () => {
    const handleEvent = vi.fn(async () => {});

    const response = await app(handleEvent).request(
      post({ name: "mac_unlocked" }, "s3cret"),
    );

    expect(response.status).toBe(202);
    expect(handleEvent).toHaveBeenCalledWith("mac_unlocked");
  });

  it("refuses without the shared secret", async () => {
    const handleEvent = vi.fn(async () => {});

    const response = await app(handleEvent).request(
      post({ name: "mac_unlocked" }),
    );

    expect(response.status).toBe(401);
    expect(handleEvent).not.toHaveBeenCalled();
  });

  it("refuses without the shared secret before reading the body", async () => {
    const response = await app().request(post({ name: "Mac Unlocked" }));

    expect(response.status).toBe(401);
  });

  it("refuses the wrong shared secret", async () => {
    const handleEvent = vi.fn(async () => {});

    const response = await app(handleEvent).request(
      post({ name: "mac_unlocked" }, "guess"),
    );

    expect(response.status).toBe(401);
    expect(handleEvent).not.toHaveBeenCalled();
  });

  it("refuses an event name that is not snake_case", async () => {
    const response = await app().request(
      post({ name: "Mac Unlocked" }, "s3cret"),
    );

    expect(response.status).toBe(400);
  });
});

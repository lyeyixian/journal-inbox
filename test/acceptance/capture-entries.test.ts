import { describe, expect, it } from "vitest";
import { createWorld } from "../harness/world.ts";

// Scenarios read as given, when, then. Times are Singapore wall clock.

describe("capturing an entry", () => {
  it("appends a text message with the time it arrived and logs entry_recorded", async () => {
    const world = createWorld();

    // given it is 09:20
    world.clock.set("2026-09-22 09:20");

    // when the owner sends a text
    await world.ownerSends("standup went long again");

    // then today's raw daily file holds one entry stamped 09:20
    expect(world.entryStore.entries).toEqual([
      {
        kind: "text",
        text: "standup went long again",
        receivedAt: new Date("2026-09-22T01:20:00Z"),
      },
    ]);

    // and the day's events log says an entry was recorded
    expect(world.eventLog.events).toEqual([
      { name: "entry_recorded", at: new Date("2026-09-22T01:20:00Z") },
    ]);
  });

  it("ignores anyone who is not the owner", async () => {
    const world = createWorld();

    // when a stranger sends a text
    await world.strangerSends("hello bot");

    // then nothing is recorded and nothing is logged
    expect(world.entryStore.entries).toEqual([]);
    expect(world.eventLog.events).toEqual([]);
  });

  it.each([
    ["Instagram", "https://www.instagram.com/reel/DAbCdEfGhIj/"],
    ["YouTube", "https://youtu.be/dQw4w9WgXcQ"],
    ["Facebook", "https://www.facebook.com/share/p/1AbCdEfGhI/"],
  ])("appends a link shared from %s as a link entry", async (_app, url) => {
    const world = createWorld();
    world.clock.set("2026-09-22 21:05");

    // when the share sheet sends just the link
    await world.ownerSends(url);

    // then the entry is a link, stamped like any other
    expect(world.entryStore.entries).toEqual([
      { kind: "link", url, receivedAt: new Date("2026-09-22T13:05:00Z") },
    ]);
    expect(world.eventLog.events).toEqual([
      { name: "entry_recorded", at: new Date("2026-09-22T13:05:00Z") },
    ]);
  });

  it("keeps the words sent alongside a link as they were typed", async () => {
    const world = createWorld();

    // when the share sheet sends a two-line title before the link
    await world.ownerSends(
      "Never Gonna Give You Up\nwatch the dance\nhttps://youtu.be/dQw4w9WgXcQ",
    );

    // then the entry keeps the words, line breaks and all
    expect(world.entryStore.entries).toMatchObject([
      {
        kind: "link",
        url: "https://youtu.be/dQw4w9WgXcQ",
        text: "Never Gonna Give You Up\nwatch the dance",
      },
    ]);
  });

  it("records an entry against no slot, since nothing prompted for it", async () => {
    const world = createWorld();

    await world.ownerSends("no prompt asked for this");

    // then the entry names no slot. Later tickets fill it with the prompt answered.
    expect(world.entryStore.entries[0]).toHaveProperty("kind", "text");
    expect(world.entryStore.entries[0]?.slotName).toBeUndefined();
  });

  it("starts a new day at Singapore midnight, not UTC midnight", async () => {
    const world = createWorld();

    // given a text arrives at 23:59 Singapore time, which is 15:59 UTC
    world.clock.set("2026-09-22 23:59");
    await world.ownerSends("last thought of Tuesday");

    // and another at 00:01, which is 16:01 UTC, still the 22nd in UTC
    world.clock.set("2026-09-23 00:01");
    await world.ownerSends("first thought of Wednesday");

    // then each lands in its own Singapore day
    expect(await world.entryStore.readDay("2026-09-22")).toContain(
      "last thought of Tuesday",
    );
    expect(await world.entryStore.readDay("2026-09-22")).not.toContain(
      "first thought of Wednesday",
    );
    expect(await world.entryStore.readDay("2026-09-23")).toContain(
      "first thought of Wednesday",
    );
    expect(await world.eventLog.read("2026-09-23")).toEqual([
      { name: "entry_recorded", at: new Date("2026-09-22T16:01:00Z") },
    ]);
  });
});

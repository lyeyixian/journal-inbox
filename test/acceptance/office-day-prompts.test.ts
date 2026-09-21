import { describe, expect, it } from "vitest";
import { createWorld } from "../harness/world.ts";

// Scenarios read as given, when, then. Times are Singapore wall clock.
// 2026-09-22 is a Tuesday.

describe("gym prompt on an office day", () => {
  it("sends once when AirPods connect at lunch, and not again", async () => {
    const world = createWorld();

    // given it is a Tuesday and arrived_office fired at 09:20
    world.clock.set("2026-09-22 09:20");
    await world.handleEvent("arrived_office");

    // when airpods_on fires at 12:50
    world.clock.set("2026-09-22 12:50");
    await world.handleEvent("airpods_on");

    // then the gym prompt is sent once
    expect(world.promptsSent).toEqual(["how's the morning going?"]);

    // when airpods_on fires again at 13:50
    world.clock.set("2026-09-22 13:50");
    await world.handleEvent("airpods_on");

    // then nothing more is sent
    expect(world.promptsSent).toEqual(["how's the morning going?"]);
  });
});

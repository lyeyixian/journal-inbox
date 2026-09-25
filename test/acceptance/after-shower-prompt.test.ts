import { describe, expect, it } from "vitest";
import { createWorld } from "../harness/world.ts";

// Scenarios read as given, when, then. Times are Singapore wall clock.

const AFTER_SHOWER = "anything from today, or what are you on tonight?";

describe("after-shower prompt", () => {
  it("sends when the MacBook is unlocked at 21:00", async () => {
    const world = createWorld();

    // when mac_unlocked fires at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // then the after-shower prompt is sent
    expect(world.promptsSent).toEqual([AFTER_SHOWER]);
  });
});

describe("after-shower prompt, when it stays quiet", () => {
  it("sends nothing when the MacBook is unlocked at 15:00", async () => {
    const world = createWorld();

    // when mac_unlocked fires at 15:00
    world.clock.set("2026-09-22 15:00");
    await world.handleEvent("mac_unlocked");

    // then nothing is sent
    expect(world.promptsSent).toEqual([]);
  });

  it("sends once when the MacBook is unlocked twice in one evening", async () => {
    const world = createWorld();

    // given mac_unlocked fired at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // when it fires again at 22:30
    world.clock.set("2026-09-22 22:30");
    await world.handleEvent("mac_unlocked");

    // then the prompt went out only the first time
    expect(world.promptsSent).toEqual([AFTER_SHOWER]);
  });

  it("still sends once when the container restarts between two unlocks", async () => {
    const world = createWorld();

    // given mac_unlocked fired at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // and the container restarted, keeping only the files on the data volume
    world.restart();

    // when mac_unlocked fires again at 22:30
    world.clock.set("2026-09-22 22:30");
    await world.handleEvent("mac_unlocked");

    // then nothing more is sent
    expect(world.promptsSent).toEqual([AFTER_SHOWER]);
  });

  it("sends again the next evening", async () => {
    const world = createWorld();

    // given the prompt went out on Tuesday evening
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // when the MacBook is unlocked on Wednesday evening
    world.clock.set("2026-09-23 21:00");
    await world.handleEvent("mac_unlocked");

    // then it goes out again, since once per day starts over
    expect(world.promptsSent).toEqual([AFTER_SHOWER, AFTER_SHOWER]);
  });
});

describe("answering the after-shower prompt", () => {
  it("stores the reply in the raw daily file with the slot it answered", async () => {
    const world = createWorld();

    // given the after-shower prompt went out at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // when the owner replies at 21:05
    world.clock.set("2026-09-22 21:05");
    await world.ownerSends("reading Dune tonight");

    // then the raw daily file names the slot in the entry's heading
    expect(await world.entryStore.readDay("2026-09-22")).toBe(
      "## 21:05 · after_shower\n\nreading Dune tonight\n\n",
    );
  });

  it("counts only the first message after a prompt as its reply", async () => {
    const world = createWorld();

    // given the prompt went out at 21:00 and the owner replied at 21:05
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");
    world.clock.set("2026-09-22 21:05");
    await world.ownerSends("reading Dune tonight");

    // when the owner sends another message at 22:40
    world.clock.set("2026-09-22 22:40");
    await world.ownerSends("unrelated late thought");

    // then only the first names the slot
    expect(await world.entryStore.readDay("2026-09-22")).toBe(
      "## 21:05 · after_shower\n\nreading Dune tonight\n\n" +
        "## 22:40\n\nunrelated late thought\n\n",
    );
  });

  it("still knows which slot a reply answers after a restart", async () => {
    const world = createWorld();

    // given the prompt went out at 21:00 and the container restarted
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");
    world.restart();

    // when the owner replies at 21:05
    world.clock.set("2026-09-22 21:05");
    await world.ownerSends("reading Dune tonight");

    // then the reply still names the slot
    expect(await world.entryStore.readDay("2026-09-22")).toBe(
      "## 21:05 · after_shower\n\nreading Dune tonight\n\n",
    );
  });
});

describe("one prompt open at a time", () => {
  async function gymPromptAtLunch(world: ReturnType<typeof createWorld>) {
    world.clock.set("2026-09-22 09:20");
    await world.handleEvent("arrived_office");
    world.clock.set("2026-09-22 12:50");
    await world.handleEvent("airpods_on");
  }

  it("deletes the gym prompt when the after-shower prompt sends and the gym one had no reply", async () => {
    const world = createWorld();

    // given the gym prompt went out at lunch and nobody answered it
    await gymPromptAtLunch(world);
    const [gymMessageId] = world.messageSender.sentIds;

    // when the after-shower prompt sends at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // then the gym prompt is gone from the chat, and the log says so
    expect(world.messageSender.deleted).toEqual([gymMessageId]);
    expect(world.eventLog.events).toContainEqual({
      name: "prompt_deleted",
      at: new Date("2026-09-22T13:00:00Z"),
      slotName: "gym",
      messageId: gymMessageId,
    });
  });

  it("leaves an answered prompt in the chat", async () => {
    const world = createWorld();

    // given the gym prompt went out at lunch and the owner answered it
    await gymPromptAtLunch(world);
    world.clock.set("2026-09-22 13:10");
    await world.ownerSends("legs today");

    // when the after-shower prompt sends at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // then nothing is deleted
    expect(world.messageSender.deleted).toEqual([]);
  });

  it("still deletes the unanswered prompt after a restart", async () => {
    const world = createWorld();

    // given the gym prompt went out at lunch with no reply, and the container restarted
    await gymPromptAtLunch(world);
    const [gymMessageId] = world.messageSender.sentIds;
    world.restart();

    // when the after-shower prompt sends at 21:00
    world.clock.set("2026-09-22 21:00");
    await world.handleEvent("mac_unlocked");

    // then the gym prompt is still deleted
    expect(world.messageSender.deleted).toEqual([gymMessageId]);
  });
});

describe("after-shower prompt, when unlocks overlap", () => {
  it("sends once when a retried unlock lands while the first is still sending", async () => {
    const world = createWorld();
    world.clock.set("2026-09-22 21:00");

    // when two mac_unlocked events arrive before either has finished
    await Promise.all([
      world.handleEvent("mac_unlocked"),
      world.handleEvent("mac_unlocked"),
    ]);

    // then the prompt went out once
    expect(world.promptsSent).toEqual([AFTER_SHOWER]);
  });
});

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileEventLog } from "./file-event-log.ts";

describe("FileEventLog", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "journal-inbox-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("reads back what it appended, one day at a time", async () => {
    const log = new FileEventLog(dir);
    const monday = {
      name: "mac_unlocked",
      at: new Date("2026-09-21T13:00:00Z"),
    };
    const tuesday = {
      name: "prompt_sent",
      at: new Date("2026-09-22T04:50:00Z"),
      slotName: "gym",
      messageId: "1",
    };
    await log.append(monday);
    await log.append(tuesday);

    expect(await log.readDay("2026-09-21")).toEqual([monday]);
    expect(await log.readDay("2026-09-22")).toEqual([tuesday]);
  });

  it("reads an empty day as no events", async () => {
    expect(await new FileEventLog(dir).readDay("2026-01-01")).toEqual([]);
  });
});

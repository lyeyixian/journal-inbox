import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileEntryStore } from "../../src/infrastructure/entry-store/file-entry-store.ts";
import { FileEventLog } from "../../src/infrastructure/event-log/file-event-log.ts";

// Hits a real temp folder. The two file adapters share the day folder, so this
// proves an entry and its entry_recorded event land side by side.
describe("filesystem adapter", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "journal-inbox-contract-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("keeps the raw daily file and the events log in the same day folder", async () => {
    const receivedAt = new Date("2026-09-22T01:20:00Z");
    await new FileEntryStore(dir).append({
      kind: "text",
      text: "standup went long again",
      receivedAt,
    });
    await new FileEventLog(dir).append({
      name: "entry_recorded",
      at: receivedAt,
    });

    expect((await readdir(path.join(dir, "2026-09-22"))).sort()).toEqual([
      "entries.md",
      "events.jsonl",
    ]);
  });
});

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileEntryStore } from "./file-entry-store.ts";

describe("FileEntryStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "journal-inbox-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("appends each entry under a Singapore wall-clock heading in the day's entries.md", async () => {
    const store = new FileEntryStore(dir);

    await store.append({
      kind: "text",
      text: "standup went long again",
      receivedAt: new Date("2026-09-22T01:20:00Z"),
    });
    await store.append({
      kind: "link",
      url: "https://youtu.be/dQw4w9WgXcQ",
      text: "Never Gonna Give You Up",
      receivedAt: new Date("2026-09-22T13:05:00Z"),
    });
    await store.append({
      kind: "text",
      text: "felt good after the walk",
      slotName: "after_shower",
      receivedAt: new Date("2026-09-22T15:30:00Z"),
    });

    expect(
      await readFile(path.join(dir, "2026-09-22", "entries.md"), "utf8"),
    ).toBe(`## 09:20

standup went long again

## 21:05

Never Gonna Give You Up
https://youtu.be/dQw4w9WgXcQ

## 23:30 · after_shower

felt good after the walk

`);
  });

  it("reads back the day's file as it is, and an empty day as an empty string", async () => {
    const store = new FileEntryStore(dir);
    await store.append({
      kind: "text",
      text: "hello",
      receivedAt: new Date("2026-09-22T01:20:00Z"),
    });

    expect(await store.readDay("2026-09-22")).toBe("## 09:20\n\nhello\n\n");
    expect(await store.readDay("2026-01-01")).toBe("");
  });
});

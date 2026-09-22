import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { EntryStore } from "../../application/ports.ts";
import { type Day, dayOf } from "../../domain/day.ts";
import type { Entry } from "../../domain/entry.ts";
import { renderEntry } from "../../domain/raw-daily-file.ts";

/** One `entries.md` per day folder under the data dir, the raw daily file. Append only. */
export class FileEntryStore implements EntryStore {
  private readonly dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async append(entry: Entry): Promise<void> {
    const file = this.fileFor(dayOf(entry.receivedAt));
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, renderEntry(entry));
  }

  async readDay(day: Day): Promise<string> {
    try {
      return await readFile(this.fileFor(day), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
      throw error;
    }
  }

  private fileFor(day: Day): string {
    return path.join(this.dataDir, day, "entries.md");
  }
}

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { EventLog } from "../../application/ports.ts";
import { type Day, dayOf } from "../../domain/day.ts";
import type { Event } from "../../domain/event.ts";

/** One `events.jsonl` per day folder under the data dir, one JSON object per line. */
export class FileEventLog implements EventLog {
  private readonly dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async append(event: Event): Promise<void> {
    const file = this.fileFor(dayOf(event.at));
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify(event)}\n`);
  }

  async readDay(day: Day): Promise<Event[]> {
    let text: string;
    try {
      text = await readFile(this.fileFor(day), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    return text
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => {
        const parsed = JSON.parse(line) as Event & { at: string };
        return { ...parsed, at: new Date(parsed.at) };
      });
  }

  private fileFor(day: Day): string {
    return path.join(this.dataDir, day, "events.jsonl");
  }
}

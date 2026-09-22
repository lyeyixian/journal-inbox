// One fake per port in src/application/ports.ts, plus a clock scenarios can set.
// Every fake keeps what it was given in memory, so a scenario can read it back.

import type {
  Clock,
  EntryStore,
  EventLog,
  JournalWriter,
  LinearWriter,
  MessageChannel,
  ThoughtSplitter,
  Transcriber,
  VaultWriter,
} from "../../src/application/ports.ts";
import type { Day } from "../../src/domain/day.ts";
import { dayOf } from "../../src/domain/day.ts";
import type { Entry } from "../../src/domain/entry.ts";
import type { Event } from "../../src/domain/event.ts";
import { renderEntry } from "../../src/domain/raw-daily-file.ts";
import type { Thought } from "../../src/domain/thought.ts";

/** Parses a Singapore wall-clock time such as `2026-09-22 12:50`. */
export function singapore(local: string): Date {
  return new Date(`${local.replace(" ", "T")}:00+08:00`);
}

export class FakeClock implements Clock {
  private current: Date;

  constructor(local = "2026-09-22 09:00") {
    this.current = singapore(local);
  }

  now(): Date {
    return new Date(this.current);
  }

  /** Moves to a Singapore wall-clock time such as `2026-09-22 12:50`. */
  set(local: string): void {
    this.current = singapore(local);
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export class FakeMessageChannel implements MessageChannel {
  readonly sent: string[] = [];
  readonly deleted: string[] = [];

  async send(text: string): Promise<string> {
    this.sent.push(text);
    return String(this.sent.length);
  }

  async delete(messageId: string): Promise<void> {
    this.deleted.push(messageId);
  }
}

export class FakeTranscriber implements Transcriber {
  readonly transcripts = new Map<string, string>();

  async transcribe(audioFile: string): Promise<string> {
    const transcript = this.transcripts.get(audioFile);
    if (transcript === undefined) {
      throw new Error(`No canned transcript for ${audioFile}`);
    }
    return transcript;
  }
}

export class FakeEntryStore implements EntryStore {
  readonly entries: Entry[] = [];

  async append(entry: Entry): Promise<void> {
    this.entries.push(entry);
  }

  async readDay(day: Day): Promise<string> {
    return this.entries
      .filter((entry) => dayOf(entry.receivedAt) === day)
      .map(renderEntry)
      .join("");
  }
}

export class FakeEventLog implements EventLog {
  readonly events: Event[] = [];

  async append(event: Event): Promise<void> {
    this.events.push(event);
  }

  async readDay(day: Day): Promise<Event[]> {
    return this.events.filter((event) => dayOf(event.at) === day);
  }
}

export class FakeThoughtSplitter implements ThoughtSplitter {
  /** What the next split returns. Scenarios set it instead of relying on an LLM. */
  thoughts: Thought[] = [];

  async split(): Promise<Thought[]> {
    return this.thoughts;
  }
}

class FakeThoughtWriter {
  readonly written: Thought[] = [];

  async write(thought: Thought): Promise<void> {
    this.written.push(thought);
  }
}

export class FakeVaultWriter extends FakeThoughtWriter implements VaultWriter {}
export class FakeLinearWriter
  extends FakeThoughtWriter
  implements LinearWriter {}
export class FakeJournalWriter
  extends FakeThoughtWriter
  implements JournalWriter {}

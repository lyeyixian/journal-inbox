import type { Day } from "../domain/day.ts";
import type { Entry } from "../domain/entry.ts";
import type { Event } from "../domain/event.ts";
import type { Thought } from "../domain/thought.ts";

// Every port the use cases depend on. Infrastructure holds one adapter per port,
// and entrypoints decide which adapter fills which port.

export interface Clock {
  now(): Date;
}

export interface MessageSender {
  /** Returns the id of the sent message so it can be deleted later. */
  send(text: string): Promise<string>;
  delete(messageId: string): Promise<void>;
}

export interface Transcriber {
  transcribe(audioFile: string): Promise<string>;
}

export interface EntryStore {
  append(entry: Entry): Promise<void>;
  /** The raw daily file for one day. */
  readDay(day: Day): Promise<string>;
}

export interface EventLog {
  append(event: Event): Promise<void>;
  read(day: Day): Promise<Event[]>;
}

export interface ThoughtSplitter {
  split(rawDailyFile: string): Promise<Thought[]>;
}

export interface VaultWriter {
  write(thought: Thought): Promise<void>;
}

export interface LinearWriter {
  write(thought: Thought): Promise<void>;
}

export interface JournalWriter {
  write(thought: Thought): Promise<void>;
}

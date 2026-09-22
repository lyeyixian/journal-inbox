import { entryFrom } from "../domain/entry.ts";
import type { Clock, EntryStore, EventLog } from "./ports.ts";

/** A message as the gateway hands it over: who sent it and what it said. */
export type IncomingMessage = {
  senderId: number;
  text: string;
};

export type RecordEntry = (message: IncomingMessage) => Promise<void>;

/**
 * Appends a message from the owner to today's raw daily file, stamped with the
 * time it arrived, and logs entry_recorded. Anyone else is ignored.
 */
export function createRecordEntry(deps: {
  clock: Clock;
  entryStore: EntryStore;
  eventLog: EventLog;
  ownerId: number;
}): RecordEntry {
  return async (message) => {
    if (message.senderId !== deps.ownerId) return;
    const receivedAt = deps.clock.now();
    await deps.entryStore.append(entryFrom(message.text, receivedAt));
    await deps.eventLog.append({ name: "entry_recorded", at: receivedAt });
  };
}

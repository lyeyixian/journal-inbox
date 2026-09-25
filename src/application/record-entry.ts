import { dayOf, foldDay } from "../domain/day.ts";
import { entryFrom } from "../domain/entry.ts";
import type { Clock, EntryStore, EventLog } from "./ports.ts";

/** A message as the listener hands it over: who sent it and what it said. */
export type IncomingMessage = {
  senderId: number;
  text: string;
};

export type RecordEntry = (message: IncomingMessage) => Promise<void>;

/**
 * Appends a message from the owner to today's raw daily file, stamped with the
 * time it arrived and, if a prompt is open, the slot it answers. Logs
 * entry_recorded, which closes that prompt. Anyone else is ignored.
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
    const slotName = foldDay(await deps.eventLog.readDay(dayOf(receivedAt)))
      .openPrompt?.slotName;
    const entry = entryFrom(message.text, receivedAt);
    await deps.entryStore.append(
      slotName === undefined ? entry : { ...entry, slotName },
    );
    await deps.eventLog.append(
      slotName === undefined
        ? { name: "entry_recorded", at: receivedAt }
        : { name: "entry_recorded", at: receivedAt, slotName },
    );
  };
}

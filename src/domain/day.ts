import type { Event } from "./event.ts";

/** A Singapore calendar day, written `YYYY-MM-DD`. */
export type Day = string;

// Singapore is UTC+8 all year, so the day boundary needs no timezone database.
const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;

function singaporeTime(instant: Date): Date {
  return new Date(instant.getTime() + SINGAPORE_OFFSET_MS);
}

export function dayOf(instant: Date): Day {
  return singaporeTime(instant).toISOString().slice(0, 10);
}

/** Singapore wall-clock time, `HH:MM`. */
export function wallClockOf(instant: Date): string {
  return singaporeTime(instant).toISOString().slice(11, 16);
}

/** What the day's events say about the day. Rebuilt from the log whenever it is needed. */
export type DayState = {
  officeDay: boolean;
  /** Slots that already sent a prompt today. */
  firedSlots: ReadonlySet<string>;
};

export function foldDay(events: readonly Event[]): DayState {
  const firedSlots = new Set<string>();
  let officeDay = false;
  for (const event of events) {
    if (event.name === "arrived_office") officeDay = true;
    if (event.name === "prompt_sent" && event.slotName !== undefined) {
      firedSlots.add(event.slotName);
    }
  }
  return { officeDay, firedSlots };
}

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

/** A prompt still waiting in the chat for its reply. */
export type OpenPrompt = {
  slotName: string;
  messageId: string;
};

/** What the day's events say about the day. Rebuilt from the log whenever it is needed. */
export type DayState = {
  officeDay: boolean;
  /** Slots that already sent a prompt today. */
  firedSlots: ReadonlySet<string>;
  /** The prompt sent last, until an entry answers it or the bot deletes it. */
  openPrompt?: OpenPrompt;
};

/**
 * Replays the day's events, oldest first, and returns what they add up to.
 * Call it with everything logged so far today to get the day as it stands now.
 */
export function dayStateFrom(events: readonly Event[]): DayState {
  const firedSlots = new Set<string>();
  let officeDay = false;
  let openPrompt: OpenPrompt | undefined;
  for (const event of events) {
    switch (event.name) {
      case "arrived_office":
        officeDay = true;
        break;
      case "prompt_sent":
        if (event.slotName === undefined) break;
        firedSlots.add(event.slotName);
        openPrompt =
          event.messageId === undefined
            ? undefined
            : { slotName: event.slotName, messageId: event.messageId };
        break;
      // The first entry after a prompt is its reply, so the prompt closes.
      case "entry_recorded":
      case "prompt_deleted":
        openPrompt = undefined;
        break;
    }
  }
  return openPrompt === undefined
    ? { officeDay, firedSlots }
    : { officeDay, firedSlots, openPrompt };
}

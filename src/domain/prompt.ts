import type { Day } from "./day.ts";

/** The message the bot sends for a slot. At most one is open at a time. */
export type Prompt = {
  slotName: string;
  day: Day;
  sentAt: Date;
};

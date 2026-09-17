/** The conditions that turn an event into a prompt for a slot. */
export type Rule = {
  eventName: string;
  slotName: string;
  /** Singapore wall-clock times, `HH:MM`. */
  window: { from: string; to: string };
  oncePerDay: boolean;
  officeDayOnly: boolean;
  silencedByPause: boolean;
};

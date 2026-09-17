/** A Singapore calendar day, written `YYYY-MM-DD`. */
export type Day = string;

// Singapore is UTC+8 all year, so the day boundary needs no timezone database.
const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;

export function dayOf(instant: Date): Day {
  return new Date(instant.getTime() + SINGAPORE_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

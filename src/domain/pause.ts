import type { Day } from "./day.ts";

/** Silences work slots until a date. Public holidays set it automatically. */
export type Pause = {
  until: Day;
};

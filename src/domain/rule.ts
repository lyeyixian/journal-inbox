import { type DayState, wallClockOf } from "./day.ts";
import type { Event } from "./event.ts";

/** The conditions that turn an event into a prompt for a slot. */
export type Rule = {
  eventName: string;
  slotName: string;
  /** Singapore wall-clock times, `HH:MM`, both ends inclusive. */
  window: { from: string; to: string };
  oncePerDay: boolean;
  officeDayOnly: boolean;
  silencedByPause: boolean;
};

// One row per prompt in the prompt table. Feature tickets add rows here, never code paths.
export const RULES: readonly Rule[] = [
  {
    eventName: "airpods_on",
    slotName: "gym",
    window: { from: "12:30", to: "13:45" },
    oncePerDay: true,
    officeDayOnly: true,
    silencedByPause: true,
  },
];

export type RuleContext = {
  day: DayState;
  paused: boolean;
};

/** Given this event, this day and this time, which slot fires. */
export function slotToFire(
  event: Event,
  context: RuleContext,
  rules: readonly Rule[] = RULES,
): string | undefined {
  return rules.find((rule) => fires(rule, event, context))?.slotName;
}

function fires(rule: Rule, event: Event, context: RuleContext): boolean {
  if (rule.eventName !== event.name) return false;
  const time = wallClockOf(event.at);
  if (time < rule.window.from || time > rule.window.to) return false;
  if (rule.oncePerDay && context.day.firedSlots.has(rule.slotName))
    return false;
  if (rule.officeDayOnly && !context.day.officeDay) return false;
  if (rule.silencedByPause && context.paused) return false;
  return true;
}

import { dayOf, foldDay } from "../domain/day.ts";
import { slotToFire } from "../domain/rule.ts";
import type { Clock, EventLog } from "./ports.ts";
import type { SendPrompt } from "./send-prompt.ts";

export type HandleEvent = (eventName: string) => Promise<void>;

/** Logs an event from a device, then sends a prompt if a rule says so. */
export function createHandleEvent(deps: {
  clock: Clock;
  eventLog: EventLog;
  sendPrompt: SendPrompt;
}): HandleEvent {
  return async (eventName) => {
    const event = { name: eventName, at: deps.clock.now() };
    await deps.eventLog.append(event);

    const day = foldDay(await deps.eventLog.readDay(dayOf(event.at)));
    // Pause arrives with ENG-64. Until then nothing is ever paused.
    const slotName = slotToFire(event, { day, paused: false });
    if (slotName !== undefined) await deps.sendPrompt(slotName);
  };
}

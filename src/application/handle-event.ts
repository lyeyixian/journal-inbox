import { dayOf, dayStateFrom } from "../domain/day.ts";
import { slotToFire } from "../domain/rule.ts";
import type { Clock, EventLog } from "./ports.ts";
import type { SendPrompt } from "./send-prompt.ts";

export type HandleEvent = (eventName: string) => Promise<void>;

/**
 * Logs an event from a device, then sends a prompt if a rule says so. Events are
 * handled one at a time: a device retrying a slow request would otherwise fold
 * the log before the first prompt_sent lands and send the slot twice.
 */
export function createHandleEvent(deps: {
  clock: Clock;
  eventLog: EventLog;
  sendPrompt: SendPrompt;
}): HandleEvent {
  let previous: Promise<unknown> = Promise.resolve();

  const handle: HandleEvent = async (eventName) => {
    const event = { name: eventName, at: deps.clock.now() };
    await deps.eventLog.append(event);

    const day = dayStateFrom(await deps.eventLog.readDay(dayOf(event.at)));
    // Pause arrives with ENG-64. Until then nothing is ever paused.
    const slotName = slotToFire(event, { day, paused: false });
    if (slotName !== undefined) await deps.sendPrompt(slotName);
  };

  return (eventName) => {
    const next = previous.then(() => handle(eventName));
    // A failed event must not stop the ones queued behind it.
    previous = next.catch(() => {});
    return next;
  };
}

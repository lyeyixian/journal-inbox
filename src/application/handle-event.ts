import { dayOf, dayStateFrom } from "../domain/day.ts";
import { slotToFire } from "../domain/rule.ts";
import type { Clock, EventLog } from "./ports.ts";
import type { SendPrompt } from "./send-prompt.ts";

export type HandleEvent = (eventName: string) => Promise<void>;

/**
 * Logs an event from a device, then sends a prompt if a rule says so.
 *
 * Events are handled one at a time. Two at once would both read the log before
 * either wrote prompt_sent, both see the slot as unfired, and both send it. That
 * happens when the Mac retries an unlock whose first request is still sending.
 */
export function createHandleEvent(deps: {
  clock: Clock;
  eventLog: EventLog;
  sendPrompt: SendPrompt;
}): HandleEvent {
  const handle: HandleEvent = async (eventName) => {
    const event = { name: eventName, at: deps.clock.now() };
    await deps.eventLog.append(event);

    const day = dayStateFrom(await deps.eventLog.read(dayOf(event.at)));
    // Pause arrives with ENG-64. Until then nothing is ever paused.
    const slotName = slotToFire(event, { day, paused: false });
    if (slotName !== undefined) await deps.sendPrompt(slotName);
  };

  // The last event in line. Each new event waits for it before starting.
  let queue: Promise<unknown> = Promise.resolve();

  return (eventName) => {
    const handled = queue.then(() => handle(eventName));
    // The caller still sees a failure, but the next event in line starts anyway.
    queue = handled.catch(() => {});
    return handled;
  };
}

import { dayOf, dayStateFrom } from "../domain/day.ts";
import { promptTextOf } from "../domain/slot.ts";
import type { Clock, EventLog, MessageSender } from "./ports.ts";

export type SendPrompt = (slotName: string) => Promise<void>;

/**
 * Sends the slot's prompt and logs that it went out, so the day knows the slot
 * has fired. A prompt still open from earlier in the day had no reply, so it is
 * deleted first and at most one prompt is ever open in the chat.
 */
export function createSendPrompt(deps: {
  clock: Clock;
  messageSender: MessageSender;
  eventLog: EventLog;
}): SendPrompt {
  return async (slotName) => {
    const now = deps.clock.now();
    const { openPrompt } = dayStateFrom(await deps.eventLog.read(dayOf(now)));
    if (openPrompt !== undefined) {
      await deps.messageSender.delete(openPrompt.messageId);
      await deps.eventLog.append({
        name: "prompt_deleted",
        at: now,
        ...openPrompt,
      });
    }

    const messageId = await deps.messageSender.send(promptTextOf(slotName));
    await deps.eventLog.append({
      name: "prompt_sent",
      at: deps.clock.now(),
      slotName,
      messageId,
    });
  };
}

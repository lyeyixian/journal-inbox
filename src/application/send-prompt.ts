import { slotNamed } from "../domain/slot.ts";
import type { Clock, EventLog, MessageSender } from "./ports.ts";

export type SendPrompt = (slotName: string) => Promise<void>;

/** Sends the slot's prompt and logs that it went out, so the day knows the slot has fired. */
export function createSendPrompt(deps: {
  clock: Clock;
  messageSender: MessageSender;
  eventLog: EventLog;
}): SendPrompt {
  return async (slotName) => {
    const messageId = await deps.messageSender.send(
      slotNamed(slotName).promptText,
    );
    await deps.eventLog.append({
      name: "prompt_sent",
      at: deps.clock.now(),
      slotName,
      messageId,
    });
  };
}

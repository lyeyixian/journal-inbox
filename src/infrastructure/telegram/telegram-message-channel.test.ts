import { Bot } from "grammy";
import { describe, expect, it } from "vitest";
import { TelegramMessageChannel } from "./telegram-message-channel.ts";

describe("TelegramMessageChannel", () => {
  it("sends to the owner's chat and returns the message id, and deletes by it", async () => {
    const bot = new Bot("token");
    const calls: { method: string; payload: unknown }[] = [];
    // An API transformer stands in for Telegram, so nothing leaves the process.
    bot.api.config.use(async (_prev, method, payload) => {
      calls.push({ method, payload });
      return method === "sendMessage"
        ? ({ ok: true, result: { message_id: 99 } } as never)
        : ({ ok: true, result: true } as never);
    });
    const channel = new TelegramMessageChannel(bot, 12345);

    const messageId = await channel.send("how's the morning going?");
    await channel.delete(messageId);

    expect(messageId).toBe("99");
    expect(calls).toEqual([
      {
        method: "sendMessage",
        payload: { chat_id: 12345, text: "how's the morning going?" },
      },
      { method: "deleteMessage", payload: { chat_id: 12345, message_id: 99 } },
    ]);
  });
});

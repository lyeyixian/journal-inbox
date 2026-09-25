import { Bot } from "grammy";
import { describe, expect, it } from "vitest";
import { TelegramMessageSender } from "./telegram-message-sender.ts";

describe("TelegramMessageSender", () => {
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
    const sender = new TelegramMessageSender(bot, 12345);

    const messageId = await sender.send("how's the morning going?");
    await sender.delete(messageId);

    expect(messageId).toBe("99");
    expect(calls).toEqual([
      {
        method: "sendMessage",
        payload: { chat_id: 12345, text: "how's the morning going?" },
      },
      { method: "deleteMessage", payload: { chat_id: 12345, message_id: 99 } },
    ]);
  });

  it("treats a message that is already gone as deleted", async () => {
    const bot = new Bot("token");
    bot.api.config.use(
      async () =>
        ({
          ok: false,
          error_code: 400,
          description: "Bad Request: message to delete not found",
        }) as never,
    );
    const sender = new TelegramMessageSender(bot, 12345);

    await expect(sender.delete("99")).resolves.toBeUndefined();
  });

  it("still fails on any other error", async () => {
    const bot = new Bot("token");
    bot.api.config.use(
      async () =>
        ({
          ok: false,
          error_code: 401,
          description: "Unauthorized",
        }) as never,
    );
    const sender = new TelegramMessageSender(bot, 12345);

    await expect(sender.delete("99")).rejects.toThrow("Unauthorized");
  });
});

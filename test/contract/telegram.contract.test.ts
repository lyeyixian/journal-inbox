import { Bot } from "grammy";
import { describe, expect, it } from "vitest";
import { TelegramMessageSender } from "../../src/infrastructure/telegram/telegram-message-sender.ts";

// Hits the real Telegram with the bot and owner from .env. Sends one message to
// the owner's chat and deletes it again, so it proves send and delete.
const token = process.env.TELEGRAM_BOT_TOKEN;
const ownerId = Number(process.env.TELEGRAM_OWNER_ID);

describe.skipIf(!token || !ownerId)("telegram adapter", () => {
  it("sends a message to the owner and deletes it", async () => {
    const sender = new TelegramMessageSender(new Bot(token ?? ""), ownerId);

    const messageId = await sender.send(
      "contract test: this message deletes itself",
    );

    expect(messageId).toMatch(/^\d+$/);
    await expect(sender.delete(messageId)).resolves.toBeUndefined();
  });
});

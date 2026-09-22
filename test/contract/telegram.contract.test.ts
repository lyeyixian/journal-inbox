import { Bot } from "grammy";
import { describe, expect, it } from "vitest";
import { TelegramMessageChannel } from "../../src/infrastructure/telegram/telegram-message-channel.ts";

// Hits the real Telegram with the bot and owner from .env. Sends one message to
// the owner's chat and deletes it again, so it proves both halves of the channel.
const token = process.env.TELEGRAM_BOT_TOKEN;
const ownerId = Number(process.env.TELEGRAM_OWNER_ID);

describe.skipIf(!token || !ownerId)("telegram adapter", () => {
  it("sends a message to the owner and deletes it", async () => {
    const channel = new TelegramMessageChannel(new Bot(token ?? ""), ownerId);

    const messageId = await channel.send(
      "contract test: this message deletes itself",
    );

    expect(messageId).toMatch(/^\d+$/);
    await expect(channel.delete(messageId)).resolves.toBeUndefined();
  });
});

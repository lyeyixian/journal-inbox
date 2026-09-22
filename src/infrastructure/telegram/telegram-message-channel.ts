import type { Bot } from "grammy";
import type { MessageChannel } from "../../application/ports.ts";

/** Sends and deletes messages in the owner's private chat, whose id is the owner's id. */
export class TelegramMessageChannel implements MessageChannel {
  private readonly bot: Bot;
  private readonly chatId: number;

  constructor(bot: Bot, chatId: number) {
    this.bot = bot;
    this.chatId = chatId;
  }

  async send(text: string): Promise<string> {
    const sent = await this.bot.api.sendMessage(this.chatId, text);
    return String(sent.message_id);
  }

  async delete(messageId: string): Promise<void> {
    await this.bot.api.deleteMessage(this.chatId, Number(messageId));
  }
}

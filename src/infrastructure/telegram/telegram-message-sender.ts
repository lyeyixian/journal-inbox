import { type Bot, GrammyError } from "grammy";
import type { MessageSender } from "../../application/ports.ts";

/** Sends and deletes messages in the owner's private chat, whose id is the owner's id. */
export class TelegramMessageSender implements MessageSender {
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

  /**
   * The owner may have deleted the message by hand already. Either way it is
   * gone from the chat, which is all a delete asks for.
   */
  async delete(messageId: string): Promise<void> {
    try {
      await this.bot.api.deleteMessage(this.chatId, Number(messageId));
    } catch (error) {
      if (
        error instanceof GrammyError &&
        error.description.includes("message to delete not found")
      ) {
        return;
      }
      throw error;
    }
  }
}

import type { Bot } from "grammy";
import type { RecordEntry } from "../../application/record-entry.ts";

export type TelegramGateway = {
  /** Long polls Telegram until stopped. Rejects only on a bad token or a second poller. */
  start(): Promise<void>;
  stop(): Promise<void>;
};

/**
 * The way in from Telegram. Every text message in a private chat, which includes
 * a shared link, goes to RecordEntry with the sender's id. RecordEntry decides
 * who is the owner. Groups are ignored so adding the bot to one records nothing.
 */
export function createTelegramGateway(deps: {
  bot: Bot;
  recordEntry: RecordEntry;
}): TelegramGateway {
  const { bot } = deps;

  bot.chatType("private").on("message:text", async (ctx) => {
    await deps.recordEntry({ senderId: ctx.from.id, text: ctx.message.text });
  });
  bot.catch((error) => {
    console.error(
      `telegram update ${error.ctx.update.update_id} failed`,
      error.error,
    );
  });

  return {
    start: () =>
      bot.start({
        onStart: (me) => console.log(`telegram polling as @${me.username}`),
      }),
    stop: () => bot.stop(),
  };
}

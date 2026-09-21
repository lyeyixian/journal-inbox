/**
 * A named signal, like `mac_unlocked` from a device or `prompt_sent` from the bot itself.
 * Carries no meaning on its own. The bot's own events carry the slot and message they concern.
 */
export type Event = {
  name: string;
  at: Date;
  slotName?: string;
  messageId?: string;
};

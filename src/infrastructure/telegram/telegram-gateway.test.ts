import { Bot } from "grammy";
import { describe, expect, it, vi } from "vitest";
import { createTelegramGateway } from "./telegram-gateway.ts";

// Passing botInfo skips getMe, so the bot never talks to Telegram.
const botInfo = {
  id: 42,
  is_bot: true as const,
  first_name: "journal-inbox",
  username: "journal_inbox_bot",
  can_join_groups: false,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
};

const from = { id: 12345, is_bot: false, first_name: "Owner" };
const chat = { id: 12345, type: "private" as const, first_name: "Owner" };

describe("telegram gateway", () => {
  it("hands a text message to RecordEntry with who sent it", async () => {
    const bot = new Bot("token", { botInfo });
    const recordEntry = vi.fn(async () => {});
    createTelegramGateway({ bot, recordEntry });

    await bot.handleUpdate({
      update_id: 1,
      message: {
        message_id: 7,
        date: 1_758_503_400,
        chat,
        from,
        text: "standup went long again",
      },
    });

    expect(recordEntry).toHaveBeenCalledWith({
      senderId: 12345,
      text: "standup went long again",
    });
  });

  it("ignores a text message in a group, even from the owner", async () => {
    const bot = new Bot("token", { botInfo });
    const recordEntry = vi.fn(async () => {});
    createTelegramGateway({ bot, recordEntry });

    await bot.handleUpdate({
      update_id: 3,
      message: {
        message_id: 9,
        date: 1_758_503_400,
        chat: { id: -1001, type: "group", title: "Family" },
        from,
        text: "not for the journal",
      },
    });

    expect(recordEntry).not.toHaveBeenCalled();
  });

  it("ignores a message with no text", async () => {
    const bot = new Bot("token", { botInfo });
    const recordEntry = vi.fn(async () => {});
    createTelegramGateway({ bot, recordEntry });

    await bot.handleUpdate({
      update_id: 2,
      message: {
        message_id: 8,
        date: 1_758_503_400,
        chat,
        from,
        sticker: {
          file_id: "f",
          file_unique_id: "u",
          type: "regular",
          width: 1,
          height: 1,
          is_animated: false,
          is_video: false,
        },
      },
    });

    expect(recordEntry).not.toHaveBeenCalled();
  });
});

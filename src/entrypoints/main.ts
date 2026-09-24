import { serve } from "@hono/node-server";
import { Bot } from "grammy";
import { createHandleEvent } from "../application/handle-event.ts";
import { createRecordEntry } from "../application/record-entry.ts";
import { createSendPrompt } from "../application/send-prompt.ts";
import { SystemClock } from "../infrastructure/clock/system-clock.ts";
import {
  ConfigError,
  loadConfig,
} from "../infrastructure/config/env-config.ts";
import { FileEntryStore } from "../infrastructure/entry-store/file-entry-store.ts";
import { FileEventLog } from "../infrastructure/event-log/file-event-log.ts";
import { createTelegramListener } from "../infrastructure/telegram/telegram-listener.ts";
import { TelegramMessageSender } from "../infrastructure/telegram/telegram-message-sender.ts";
import { createApp } from "./api/app.ts";
import { startWorker } from "./worker/worker.ts";

// The composition root. This is the only place that knows which adapter fills which port.
function main(): void {
  const config = loadConfig(process.env);
  const clock = new SystemClock();
  const entryStore = new FileEntryStore(config.DATA_DIR);
  const eventLog = new FileEventLog(config.DATA_DIR);
  const bot = new Bot(config.TELEGRAM_BOT_TOKEN, {
    client: { apiRoot: config.TELEGRAM_API_ROOT },
  });
  const messageSender = new TelegramMessageSender(
    bot,
    config.TELEGRAM_OWNER_ID,
  );

  const sendPrompt = createSendPrompt({ clock, messageSender, eventLog });
  const handleEvent = createHandleEvent({ clock, eventLog, sendPrompt });
  const recordEntry = createRecordEntry({
    clock,
    entryStore,
    eventLog,
    ownerId: config.TELEGRAM_OWNER_ID,
  });

  const worker = startWorker({
    telegram: createTelegramListener({ bot, recordEntry }),
  });
  const server = serve(
    {
      fetch: createApp({
        clock,
        handleEvent,
        eventIntakeSecret: config.EVENT_INTAKE_SECRET,
      }).fetch,
      port: config.PORT,
      hostname: "0.0.0.0",
    },
    (info) => console.log(`api listening on :${info.port}`),
  );

  const shutdown = () => {
    void Promise.all([
      worker.stop(),
      new Promise<void>((resolve) => server.close(() => resolve())),
    ]).then(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

try {
  main();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

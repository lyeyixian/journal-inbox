import { serve } from "@hono/node-server";
import { createHandleEvent } from "../application/handle-event.ts";
import { createSendPrompt } from "../application/send-prompt.ts";
import { SystemClock } from "../infrastructure/clock/system-clock.ts";
import {
  ConfigError,
  loadConfig,
} from "../infrastructure/config/env-config.ts";
import { FileEventLog } from "../infrastructure/event-log/file-event-log.ts";
import { ConsoleMessageChannel } from "../infrastructure/message-channel/console-message-channel.ts";
import { createApp } from "./api/app.ts";
import { startWorker } from "./worker/worker.ts";

// The composition root. This is the only place that knows which adapter fills which port.
function main(): void {
  const config = loadConfig(process.env);
  const clock = new SystemClock();
  const eventLog = new FileEventLog(config.DATA_DIR);
  const messageChannel = new ConsoleMessageChannel();

  const sendPrompt = createSendPrompt({ clock, messageChannel, eventLog });
  const handleEvent = createHandleEvent({ clock, eventLog, sendPrompt });

  const worker = startWorker();
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
    worker.stop();
    server.close(() => process.exit(0));
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

import type { TelegramListener } from "../../infrastructure/telegram/telegram-listener.ts";

// Home of the grammY polling loop, and later the clock-driven slots, the
// before-bed recheck timer and the nightly sort. Each arrives with its own ticket.
export function startWorker(deps: { telegram: TelegramListener }): {
  stop(): Promise<void>;
} {
  // grammY retries network errors on its own, so a rejection means a bad token
  // or a second poller on the same bot. Neither heals by itself, so exit and let
  // Compose restart the container where the log names the cause.
  deps.telegram.start().catch((error: unknown) => {
    console.error("telegram polling stopped", error);
    process.exit(1);
  });

  return {
    async stop() {
      // Stopping confirms the last update with Telegram. If Telegram is unreachable
      // that fails, and it must not keep the process from exiting.
      await deps.telegram.stop().catch((error: unknown) => {
        console.error("telegram did not stop cleanly", error);
      });
    },
  };
}

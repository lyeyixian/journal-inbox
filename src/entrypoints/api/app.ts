import { Hono } from "hono";
import type { Clock } from "../../application/ports.ts";

export function createApp(deps: { clock: Clock }): Hono {
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({ status: "ok", time: deps.clock.now().toISOString() }),
  );

  return app;
}

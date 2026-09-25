import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { HandleEvent } from "../../application/handle-event.ts";
import type { Clock } from "../../application/ports.ts";

const eventSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, "snake_case event name"),
});

export function createApp(deps: {
  clock: Clock;
  handleEvent: HandleEvent;
  eventIntakeSecret: string;
}): Hono {
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({ status: "ok", time: deps.clock.now().toISOString() }),
  );

  // Event intake. Devices on the tailnet post here with the shared secret, which
  // is checked before the body so a stranger learns nothing about the schema.
  app.post(
    "/events",
    async (c, next) => {
      if (c.req.header("x-event-secret") !== deps.eventIntakeSecret) {
        return c.json({ error: "wrong or missing x-event-secret" }, 401);
      }
      await next();
    },
    zValidator("json", eventSchema),
    async (c) => {
      const { name } = c.req.valid("json");
      await deps.handleEvent(name);
      console.log(`event ${name} logged`);
      return c.json({ status: "logged", name }, 202);
    },
  );

  return app;
}

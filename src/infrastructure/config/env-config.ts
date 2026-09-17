import { z } from "zod";

const configSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATA_DIR: z.string().min(1),
  VAULT_DIR: z.string().min(1),
  JOURNAL_DIR: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_OWNER_ID: z.coerce.number().int().positive(),
  EVENT_INTAKE_SECRET: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  LINEAR_API_KEY: z.string().min(1),
});

export type Config = z.infer<typeof configSchema>;

export class ConfigError extends Error {}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new ConfigError(`Invalid config:\n${problems}`);
  }
  return result.data;
}

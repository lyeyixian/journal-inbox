import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "./env-config.ts";

const complete = {
  PORT: "8080",
  DATA_DIR: "/data",
  VAULT_DIR: "/vault",
  JOURNAL_DIR: "/journal",
  TELEGRAM_BOT_TOKEN: "token",
  TELEGRAM_OWNER_ID: "12345",
  EVENT_INTAKE_SECRET: "secret",
  GROQ_API_KEY: "groq",
  LINEAR_API_KEY: "linear",
};

describe("loadConfig", () => {
  it("parses a complete env", () => {
    expect(loadConfig(complete)).toMatchObject({
      PORT: 8080,
      TELEGRAM_OWNER_ID: 12345,
    });
  });

  it("points at Telegram unless told otherwise", () => {
    expect(loadConfig(complete).TELEGRAM_API_ROOT).toBe(
      "https://api.telegram.org",
    );
    expect(
      loadConfig({ ...complete, TELEGRAM_API_ROOT: "http://127.0.0.1:9" })
        .TELEGRAM_API_ROOT,
    ).toBe("http://127.0.0.1:9");
  });

  it.each(Object.keys(complete))("refuses to load without %s", (key) => {
    const env = { ...complete, [key]: undefined };
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(key);
  });

  it("treats an empty value as missing", () => {
    expect(() => loadConfig({ ...complete, GROQ_API_KEY: "" })).toThrow(
      ConfigError,
    );
  });
});

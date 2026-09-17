/** One Telegram message. Never edited after it lands. */
export type Entry =
  | { kind: "text"; receivedAt: Date; text: string }
  | { kind: "audio"; receivedAt: Date; audioFile: string; transcript: string }
  | { kind: "link"; receivedAt: Date; url: string; text?: string };

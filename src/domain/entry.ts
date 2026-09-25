/**
 * One Telegram message. Never edited after it lands.
 * `slotName` says which prompt the entry answers, and stays unset when no prompt was open.
 */
export type Entry = {
  receivedAt: Date;
  slotName?: string;
} & (
  | { kind: "text"; text: string }
  | { kind: "audio"; audioFile: string; transcript: string }
  | { kind: "link"; url: string; text?: string }
);

const URL_PATTERN = /https?:\/\/\S+/;

/**
 * Turns the text of a message into an entry. A message holding a link is a link
 * entry. The share sheet sends the link alone or after a title, so the words
 * around the link stay as the entry's text, otherwise untouched.
 */
export function entryFrom(text: string, receivedAt: Date): Entry {
  const url = URL_PATTERN.exec(text)?.[0];
  if (url === undefined) return { kind: "text", text, receivedAt };
  const rest = text.replace(url, "").trim();
  return rest === ""
    ? { kind: "link", url, receivedAt }
    : { kind: "link", url, text: rest, receivedAt };
}

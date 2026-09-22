import { wallClockOf } from "./day.ts";
import type { Entry } from "./entry.ts";

/**
 * How one entry looks in the raw daily file: a heading with the Singapore
 * wall-clock time it arrived and the slot it answers, then the body, then a
 * blank line. The file is only ever appended to, so each block ends complete.
 */
export function renderEntry(entry: Entry): string {
  const time = wallClockOf(entry.receivedAt);
  const heading =
    entry.slotName === undefined
      ? `## ${time}`
      : `## ${time} · ${entry.slotName}`;
  return `${heading}\n\n${bodyOf(entry)}\n\n`;
}

function bodyOf(entry: Entry): string {
  switch (entry.kind) {
    case "text":
      return entry.text;
    case "audio":
      return entry.transcript;
    case "link":
      return entry.text === undefined
        ? entry.url
        : `${entry.text}\n${entry.url}`;
  }
}

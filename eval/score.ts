// Scores the real ThoughtSplitter against the hand-labelled cases in eval/cases.
// See eval/README.md for the case format. Run with `pnpm eval`.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ThoughtSplitter } from "../src/application/ports.ts";
import type { Destination, Thought } from "../src/domain/thought.ts";

const DESTINATIONS: readonly Destination[] = ["vault", "linear", "journal"];
const casesDir = path.join(import.meta.dirname, "cases");

type Case = { name: string; entries: string; expected: Thought[] };

async function loadCases(): Promise<Case[]> {
  const names = (await readdir(casesDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    names.map(async (name) => ({
      name,
      entries: await readFile(path.join(casesDir, name, "entries.md"), "utf8"),
      expected: JSON.parse(
        await readFile(path.join(casesDir, name, "expected.json"), "utf8"),
      ) as Thought[],
    })),
  );
}

function countByDestination(thoughts: Thought[]): Record<Destination, number> {
  const counts = { vault: 0, linear: 0, journal: 0 };
  for (const thought of thoughts) counts[thought.destination] += 1;
  return counts;
}

export function casePasses(expected: Thought[], actual: Thought[]): boolean {
  const want = countByDestination(expected);
  const got = countByDestination(actual);
  return DESTINATIONS.every(
    (destination) => want[destination] === got[destination],
  );
}

function createSplitter(): ThoughtSplitter {
  // ENG-61 builds the Claude Code adapter and wires it here.
  throw new Error("The ThoughtSplitter adapter is not built yet.");
}

async function main(): Promise<void> {
  const cases = await loadCases();
  if (cases.length === 0) {
    console.log("0 cases in eval/cases, nothing to score");
    return;
  }

  const splitter = createSplitter();
  let passed = 0;
  for (const { name, entries, expected } of cases) {
    const actual = await splitter.split(entries);
    if (casePasses(expected, actual)) {
      passed += 1;
      continue;
    }
    console.log(
      `${name}: expected ${JSON.stringify(countByDestination(expected))}, got ${JSON.stringify(countByDestination(actual))}`,
    );
  }
  console.log(`score: ${passed}/${cases.length} cases pass`);
}

await main();

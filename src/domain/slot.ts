/** A named moment we might prompt at, like `after_shower`. One slot, one fixed prompt text. */
export type Slot = {
  name: string;
  promptText: string;
};

// The prompt table. Feature tickets add rows here, never code paths.
export const SLOTS: readonly Slot[] = [
  { name: "gym", promptText: "how's the morning going?" },
  {
    name: "after_shower",
    promptText: "anything from today, or what are you on tonight?",
  },
];

export function slotNamed(name: string): Slot {
  const slot = SLOTS.find((candidate) => candidate.name === name);
  if (slot === undefined) throw new Error(`No slot named ${name}`);
  return slot;
}

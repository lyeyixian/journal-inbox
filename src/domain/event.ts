/** A named signal from a device, like `mac_unlocked`. Carries no meaning on its own. */
export type Event = {
  name: string;
  at: Date;
};

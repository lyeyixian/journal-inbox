export type Destination = "vault" | "linear" | "journal";

/** One atomic idea, observation or feeling split out of an entry during the sort run. */
export type Thought = {
  text: string;
  destination: Destination;
};

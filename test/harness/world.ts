// Every acceptance scenario starts from a world: all nine ports filled with fakes,
// a clock it can set, and every use case wired. A new scenario needs nothing else.

import {
  createHandleEvent,
  type HandleEvent,
} from "../../src/application/handle-event.ts";
import {
  createRecordEntry,
  type RecordEntry,
} from "../../src/application/record-entry.ts";
import {
  createSendPrompt,
  type SendPrompt,
} from "../../src/application/send-prompt.ts";
import {
  FakeClock,
  FakeEntryStore,
  FakeEventLog,
  FakeJournalWriter,
  FakeLinearWriter,
  FakeMessageSender,
  FakeThoughtSplitter,
  FakeTranscriber,
  FakeVaultWriter,
} from "./fakes.ts";

/** The owner's Telegram id in every scenario. Any other id is a stranger. */
export const OWNER_ID = 1;

export function createWorld() {
  const clock = new FakeClock();
  const messageSender = new FakeMessageSender();
  const transcriber = new FakeTranscriber();
  const entryStore = new FakeEntryStore();
  const eventLog = new FakeEventLog();
  const thoughtSplitter = new FakeThoughtSplitter();
  const vault = new FakeVaultWriter();
  const linear = new FakeLinearWriter();
  const journal = new FakeJournalWriter();

  // Use cases hold no state of their own. Wiring them again over the same fakes
  // is what a container restart does to the process, with the data volume kept.
  function wire() {
    const sendPrompt = createSendPrompt({ clock, messageSender, eventLog });
    return {
      sendPrompt,
      handleEvent: createHandleEvent({ clock, eventLog, sendPrompt }),
      recordEntry: createRecordEntry({
        clock,
        entryStore,
        eventLog,
        ownerId: OWNER_ID,
      }),
    };
  }
  let useCases = wire();
  const handleEvent: HandleEvent = (eventName) =>
    useCases.handleEvent(eventName);
  const sendPrompt: SendPrompt = (slotName) => useCases.sendPrompt(slotName);
  const recordEntry: RecordEntry = (message) => useCases.recordEntry(message);

  return {
    clock,
    messageSender,
    transcriber,
    entryStore,
    eventLog,
    thoughtSplitter,
    vault,
    linear,
    journal,
    handleEvent,
    sendPrompt,
    recordEntry,
    /** Starts the process again. Only what the fakes hold survives, as only the data volume does. */
    restart(): void {
      useCases = wire();
    },
    /** A message from the owner's Telegram account. */
    ownerSends(text: string): Promise<void> {
      return recordEntry({ senderId: OWNER_ID, text });
    },
    /** A message from any other Telegram account. */
    strangerSends(text: string): Promise<void> {
      return recordEntry({ senderId: OWNER_ID + 1, text });
    },
    /** The prompts Telegram would have shown, in order. */
    get promptsSent(): string[] {
      return messageSender.sent;
    },
  };
}

export type World = ReturnType<typeof createWorld>;

// Every acceptance scenario starts from a world: all nine ports filled with fakes,
// a clock it can set, and every use case wired. A new scenario needs nothing else.

import { createHandleEvent } from "../../src/application/handle-event.ts";
import { createSendPrompt } from "../../src/application/send-prompt.ts";
import {
  FakeClock,
  FakeEntryStore,
  FakeEventLog,
  FakeJournalWriter,
  FakeLinearWriter,
  FakeMessageChannel,
  FakeThoughtSplitter,
  FakeTranscriber,
  FakeVaultWriter,
} from "./fakes.ts";

export function createWorld() {
  const clock = new FakeClock();
  const messageChannel = new FakeMessageChannel();
  const transcriber = new FakeTranscriber();
  const entryStore = new FakeEntryStore();
  const eventLog = new FakeEventLog();
  const thoughtSplitter = new FakeThoughtSplitter();
  const vault = new FakeVaultWriter();
  const linear = new FakeLinearWriter();
  const journal = new FakeJournalWriter();

  const sendPrompt = createSendPrompt({ clock, messageChannel, eventLog });
  const handleEvent = createHandleEvent({ clock, eventLog, sendPrompt });

  return {
    clock,
    messageChannel,
    transcriber,
    entryStore,
    eventLog,
    thoughtSplitter,
    vault,
    linear,
    journal,
    handleEvent,
    sendPrompt,
    /** The prompts Telegram would have shown, in order. */
    get promptsSent(): string[] {
      return messageChannel.sent;
    },
  };
}

export type World = ReturnType<typeof createWorld>;

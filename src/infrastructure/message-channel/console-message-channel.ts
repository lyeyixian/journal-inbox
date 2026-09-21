import type { MessageChannel } from "../../application/ports.ts";

/** Prints what Telegram would have shown. Stands in until the grammY adapter lands with ENG-58. */
export class ConsoleMessageChannel implements MessageChannel {
  private nextId = 1;

  async send(text: string): Promise<string> {
    const messageId = String(this.nextId++);
    console.log(`prompt ${messageId}: ${text}`);
    return messageId;
  }

  async delete(messageId: string): Promise<void> {
    console.log(`prompt ${messageId} deleted`);
  }
}

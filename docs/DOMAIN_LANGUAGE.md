# Domain language

Tickets, code, file names and prompts all use these words and no synonyms.

| Word           | Meaning                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry          | One Telegram message. Three shapes: text from Wispr Flow, audio as an OGG file with a transcript derived from it, or a link with optional text. Never edited after it lands. |
| Raw daily file | The markdown file holding every entry for one Singapore day.                                                                                                                 |
| Event          | A named signal from a device, like `mac_unlocked`. Carries no meaning on its own.                                                                                            |
| Slot           | A named moment we might prompt at, like `after_shower`. One slot, one fixed prompt text.                                                                                     |
| Rule           | The conditions that turn an event into a prompt for a slot. Time window, once per day, office day, paused.                                                                   |
| Prompt         | The message the bot sends for a slot. At most one is open at a time.                                                                                                         |
| Office day     | A property of the day, true once `arrived_office` has fired.                                                                                                                 |
| Pause          | A state that silences work slots until a date. Public holidays set it automatically.                                                                                         |
| Thought        | One atomic idea, observation or feeling split out of an entry during the sort run. An entry holds one or more thoughts.                                                      |
| Destination    | Where a thought goes. Vault, Linear or journal.                                                                                                                              |
| Sort run       | The nightly job that turns a raw daily file into thoughts and sends each to a destination.                                                                                   |
| Report         | The morning line listing what went where.                                                                                                                                    |
| Correction     | A reply saying a thought went to the wrong destination.                                                                                                                      |
| Event intake   | The HTTP route on the tailnet that devices post events to.                                                                                                                   |

## Words to avoid

- "Note". It could mean entry, thought or vault note.
- "Trigger". It blurs event and rule.
- "Webhook". Telegram uses it for something else.

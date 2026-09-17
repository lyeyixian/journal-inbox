# journal-inbox

A Telegram bot that takes journal entries all day, prompts at the right moments, and sorts each day's thoughts into the vault, Linear or the journal overnight. One user, one container, on the home server.

The vocabulary is in [docs/DOMAIN_LANGUAGE.md](docs/DOMAIN_LANGUAGE.md). Read it first. Code, file names and tickets use those words and no synonyms.

## Layers

Four folders under `src/`. Dependencies point inward only, and `pnpm lint` fails when one points outward.

| Layer                | Holds                                                                                                                                                                                                                                                                                          | May import                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `src/domain`         | Entry, Thought, Slot, Rule, Prompt, Day, Pause as plain types, plus pure functions such as "given this event, this day and this time, which slot fires". Day state is a fold over the day's events and is never stored separately.                                                             | Nothing. No packages, no Node built-ins. |
| `src/application`    | The use cases RecordEntry, HandleEvent, SendPrompt, SortDay, ApplyCorrection and SendReport, and the port interfaces they depend on.                                                                                                                                                           | Domain.                                  |
| `src/infrastructure` | One adapter per port: grammY gateway, filesystem store, Groq transcriber, Linear client, Claude Code headless splitter, holiday list. Also the env config loader.                                                                                                                              | Application and domain.                  |
| `src/entrypoints`    | Three folders, one process. `api` is the Hono server with event intake and health. `worker` is the grammY polling loop, clock-driven slots, the before-bed recheck timer and the nightly sort. `cli` hand-runs the sort. `main.ts` is the only file that knows which adapter fills which port. | Everything.                              |

The rule lives in `eslint.config.js`. `pnpm build` runs lint first, so the Docker build fails on a bad import too.

## Ports

All nine are in `src/application/ports.ts`.

| Port            | What it does                                                    |
| --------------- | --------------------------------------------------------------- |
| Clock           | Says what time it is.                                           |
| MessageChannel  | Sends and deletes Telegram messages.                            |
| Transcriber     | Turns an OGG file into a transcript.                            |
| EntryStore      | Appends entries to the raw daily file and reads it back.        |
| EventLog        | Appends events to the day's log and reads them back.            |
| ThoughtSplitter | Splits a raw daily file into thoughts, each with a destination. |
| VaultWriter     | Writes a thought to the vault repo.                             |
| LinearWriter    | Writes a thought to Linear.                                     |
| JournalWriter   | Writes a thought to the journal repo.                           |

## Stack

Node 24, TypeScript strict, ESM, pnpm. Node runs the `.ts` files directly in dev, and `tsc` compiles them for production. TypeScript stays on 6 until typescript-eslint supports 7.

- grammY with the files plugin for Telegram
- Hono with its Node adapter and zod validator for event intake
- zod at every boundary: event payloads, config, splitter output
- Vitest
- Linear SDK
- Groq over plain fetch
- Claude Code headless mode for the splitter, version pinned by `CLAUDE_CODE_VERSION` in the Dockerfile
- ESLint and Prettier

A package joins `package.json` in the ticket that first uses it.

## Storage

Plain files in a Docker volume, no database.

```
/data
  pause.json            outlives a day, so it sits outside the day folders
  2026-09-17/           one folder per Singapore day
    entries.md          the raw daily file
    events.jsonl        append-only, one JSON object per line
    audio/              OGG files
    sort.json           the sort record, written by the sort run
```

The bot logs its own actions, such as prompt sent and prompt deleted, as events too. A restart loses nothing because day state is rebuilt from the log. SQLite is the upgrade path if cross-day queries get painful, and only infrastructure would change.

## Assumptions

Written down so we notice when one breaks.

- One user, ever. No auth beyond the owner's Telegram id and one shared secret on event intake.
- Singapore time is the day boundary, even in Malaysia.
- The server is up whenever a prompt should fire. If it is down, prompts are lost, not queued.
- Events arrive at most a few per minute. No queue, no backpressure.
- The vault README conventions stay as they are today.
- Groq's free tier stays free, and a voice note never exceeds Telegram's 20 MB download cap.
- The LLM decides routing. We correct it, we don't hand-write routing rules.
- A logged-in Claude Code CLI on the server is an acceptable way to run the splitter on the existing subscription.

## Working on it

Open the repo in VS Code and choose "Reopen in Container". The devcontainer builds the `dev` stage of the production Dockerfile, so Node, pnpm, system packages and the Claude Code version match the server. It installs the ESLint, Prettier, Vitest and Docker extensions and sets format on save, so lint, format and tests work with no editor setup outside the repo. The Docker CLI inside talks to the host's Docker socket.

Claude Code credentials live in a named volume mounted at `/home/node/.claude`, the same path production uses. Run `claude` once inside the container to log in.

| Command           | Does                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `pnpm check`      | Format check, lint, typecheck and tests. Run before every commit. |
| `pnpm test`       | Vitest, once.                                                     |
| `pnpm lint`       | ESLint, including the layer rule.                                 |
| `pnpm dev`        | Runs the process with reload, reading `.env`.                     |
| `pnpm build`      | Lint, then compile to `dist/`.                                    |
| `pnpm sort <day>` | Hand-runs the sort run. Not built yet.                            |

## Config

The process reads config from env through the zod schema in `src/infrastructure/config/env-config.ts`. It prints every missing value and exits with code 1 if any are absent. `.env.example` lists them all.

## Deploying to the home server

```sh
cp .env.example .env     # fill in every value
tailscale ip -4          # goes in TAILNET_IP
docker compose up -d --build
curl http://$TAILNET_IP:8080/health
```

Compose publishes the port on the tailnet address only, so nothing answers on the LAN or from the internet. Check that from a device off the tailnet.

`restart: unless-stopped` brings the container back after a reboot as long as the Docker daemon starts at boot:

```sh
sudo systemctl enable docker
```

Docker must start after Tailscale, or it cannot bind the tailnet address. If the container fails to start after a reboot with "cannot assign requested address", add a systemd drop-in for `docker.service` with `After=tailscaled.service` and `Wants=tailscaled.service`.

Log Claude Code in once. The credentials persist in the `claude-credentials` volume.

```sh
docker compose exec journal-inbox claude
```

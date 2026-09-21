# Development

Open the repo in VS Code and choose "Reopen in Container". The devcontainer builds the `dev` stage of the production Dockerfile, so Node, pnpm, system packages and the Claude Code version match the server. It installs the Biome, Vitest and Docker extensions and sets format on save, so lint, format and tests work with no editor setup outside the repo. The Docker CLI inside talks to the host's Docker socket.

Claude Code credentials live in a named volume mounted at `/home/node/.claude`, the same path production uses. Run `claude` once inside the container to log in.

The scripts are in `package.json`. `pnpm check` runs format, lint, typecheck and tests. Run it before every commit.

## Tests

`pnpm test` is the trusted suite. If it passes, the app works. It runs in under ten seconds, and the script kills it if it does not. It never opens a socket, never touches a real file and never reads the real clock, so it is safe to run anywhere.

| Command | What runs | When |
| --- | --- | --- |
| `pnpm test` | Acceptance scenarios in `test/acceptance` and unit tests next to the code in `src` | Every commit |
| `pnpm test:contract` | `test/contract`, one file per adapter, hitting the real thing with credentials from `.env` | When an adapter changes |
| `pnpm test:smoke` | `test/smoke/smoke.sh`: builds the image, starts it with Compose, checks health, posts an event, finds it in the log | Before a deploy, or when the Dockerfile or Compose file changes |
| `pnpm eval` | The sorter eval set in `eval`. A score, not a pass or fail | When the splitter prompt changes |

### Writing a scenario

Scenarios describe behaviour from the prompt table and the sort rules, never code. Each one reads as given, when, then, and runs a use case against fakes for every port. `test/harness/fakes.ts` holds one fake per port in `src/application/ports.ts` plus `FakeClock`, and `test/harness/world.ts` wires them into every use case. A new scenario needs only the given, when, then:

```ts
const world = createWorld();

world.clock.set("2026-09-22 09:20"); // Singapore wall clock, a Tuesday
await world.handleEvent("arrived_office");

world.clock.set("2026-09-22 12:50");
await world.handleEvent("airpods_on");

expect(world.promptsSent).toEqual(["how's the morning going?"]);
```

Copy `test/acceptance/office-day-prompts.test.ts`. If a scenario seems to need a new fake or new setup, the world is missing something every scenario should have, so add it there.

`test/harness/no-network.ts` loads before every acceptance test and makes `fetch` and socket connects throw. A real adapter reaching into the suite fails loudly instead of quietly hitting the network.

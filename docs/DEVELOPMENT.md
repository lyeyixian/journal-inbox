# Development

Open the repo in VS Code and choose "Reopen in Container". The devcontainer builds the `dev` stage of the production Dockerfile, so Node, pnpm, system packages and the Claude Code version match the server. It installs the Biome, Vitest and Docker extensions and sets format on save, so lint, format and tests work with no editor setup outside the repo. The Docker CLI inside talks to the host's Docker socket.

Claude Code credentials live in a named volume mounted at `/home/node/.claude`, the same path production uses. Run `claude` once inside the container to log in.

The scripts are in `package.json`. `pnpm check` runs format, lint, typecheck and tests. Run it before every commit.

# journal-inbox

A Telegram bot that takes journal entries all day, prompts at the right moments, and sorts each day's thoughts into the vault, Linear or the journal overnight. One user, one container, on the home server.

## Run it

Needs Docker. From a clone of the repo:

```sh
cp .env.example .env     # fill in every value
docker compose up -d --build
curl http://127.0.0.1:8080/health
```

Compose publishes the port on `127.0.0.1` only, so nothing on the LAN or the internet can reach it.

## Config

The process reads config from env through the zod schema in `src/infrastructure/config/env-config.ts`. It prints every missing value and exits with code 1 if any are absent. `.env.example` lists them all, and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) says where the Telegram ones come from.

## More

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the home server and the Tailscale Service
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the devcontainer, the commands and the test layers
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for layers, ports, stack, storage and assumptions
- [docs/DOMAIN_LANGUAGE.md](docs/DOMAIN_LANGUAGE.md) for the words everything uses

# Contract tests

One file per adapter, each hitting the real thing: a test chat for Telegram, a fixture OGG for Groq, a temp folder for the filesystem, a throwaway issue for Linear. They need real credentials from `.env`, so `pnpm test` skips them.

```sh
pnpm test:contract
```

The Telegram file sends you a message from whichever bot `TELEGRAM_BOT_TOKEN` names. Make a second bot in BotFather for this and keep its token in the dev `.env`, so the contract chat never mixes with the journal chat and a future inbound test can poll without fighting the server.

Run them when an adapter changes. Every file starts as a placeholder and the ticket that builds the adapter fills it in.

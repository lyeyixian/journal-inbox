# Contract tests

One file per adapter, each hitting the real thing: a test chat for Telegram, a fixture OGG for Groq, a temp folder for the filesystem, a throwaway issue for Linear. They need real credentials from `.env`, so `pnpm test` skips them.

```sh
pnpm test:contract
```

Run them when an adapter changes. Every file starts as a placeholder and the ticket that builds the adapter fills it in.

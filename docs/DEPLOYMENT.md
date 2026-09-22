# Deployment

## First time

Two values in `.env` come from Telegram. Ask [@BotFather](https://t.me/BotFather) for a new bot and copy its token into `TELEGRAM_BOT_TOKEN`. Ask [@userinfobot](https://t.me/userinfobot) for your own id and put it in `TELEGRAM_OWNER_ID`. The bot answers that account and ignores every other one. Open a chat with the bot and press Start once, or it cannot message you.

The server needs Docker, your user in the `docker` group, and an SSH key registered on GitHub so it can clone the private repos. Clone `journal-inbox`, `experience-vault` and `journal` side by side under `~/repo`. Write `.env` with the real values. Then run the three commands under "Run it" in the [README](../README.md).

Tailscale then publishes the container on the tailnet as a Tailscale Service with HTTPS. The order matters:

1. In the admin console under Services, create a service named `journal-inbox` on `tcp:443`.
2. In the access controls, allow `tag:server` to host it and grant your devices access to `svc:journal-inbox`. Copy whatever the `yx-budget` service has.
3. On the server:
   ```sh
   tailscale serve --bg --service=svc:journal-inbox --https=443 http://127.0.0.1:8080
   ```
4. Back in the console, open the service and approve `lyeyixian-mbp-intel` as its host. If the host is not listed, run `tailscale serve clear svc:journal-inbox` and repeat step 3, then reload the page.

The serve config lives in Tailscale, not in the repo, so a fresh server needs steps 3 and 4 again. Once approved:

```sh
curl https://journal-inbox.taila5aaaf.ts.net/health
```

`restart: unless-stopped` brings the container back after a crash or a reboot. It does not restart after `docker compose stop` or `kill`, because Docker treats those as you asking for it to stay down. To test the policy without a reboot, kill the process from inside:

```sh
docker compose exec journal-inbox node -e 'process.kill(1, "SIGTERM")'
docker compose ps    # back to Up within seconds
```

The reboot case also needs the Docker daemon to start at boot:

```sh
sudo systemctl enable docker
```

Log Claude Code in once. The credentials persist in the `claude-credentials` volume.

```sh
docker compose exec journal-inbox claude
```

## Updating

There is no pipeline. Deploys are a pull and a rebuild on the server:

```sh
ssh lyeyixian@lyeyixian-mbp-intel
cd ~/repo/journal-inbox
git pull
docker compose up -d --build
docker compose ps                       # Up (healthy) within a minute
curl https://journal-inbox.taila5aaaf.ts.net/health
docker compose logs -f                  # watch the first minute
```

`up -d --build` rebuilds the image and swaps the container only if the image changed. The `data` and `claude-credentials` volumes survive the swap. The Tailscale Service points at the host port, not the container, so nothing there changes.

If `.env` gained a value, add it before `up`, or the process refuses to start and the container restarts in a loop. `docker compose logs` names the missing value.

Old images pile up. `docker image prune -f` now and then.

### Rolling back

Check out the last good commit and rebuild:

```sh
git log --oneline -5
git checkout <sha>
docker compose up -d --build
```

Return to the branch with `git checkout main` when the fix is in. A rollback leaves the volumes alone, so if the bad commit changed the storage layout, the old code now reads files in the new shape. Check what it wrote before rolling back across one of those.


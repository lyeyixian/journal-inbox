#!/usr/bin/env bash
# Installs the unlock watcher as a launchd agent for the logged-in user.
# Safe to run again: it replaces the binary and the agent.
set -euo pipefail
cd "$(dirname "$0")"

label=com.journal-inbox.unlock-watcher
support="$HOME/Library/Application Support/journal-inbox"
plist="$HOME/Library/LaunchAgents/$label.plist"
log="$HOME/Library/Logs/journal-inbox-unlock-watcher.log"
url="${JOURNAL_INBOX_URL:-https://journal-inbox.taila5aaaf.ts.net}"

if [[ -z "${EVENT_INTAKE_SECRET:-}" ]]; then
  read -rsp "EVENT_INTAKE_SECRET from the server's .env: " EVENT_INTAKE_SECRET
  echo
fi

mkdir -p "$support" "$(dirname "$plist")"
swiftc -O unlock-watcher.swift -o "$support/unlock-watcher"

# The plist holds the secret, so only this user may read it.
umask 077
cat >"$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>$support/unlock-watcher</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>JOURNAL_INBOX_URL</key>
    <string>$url</string>
    <key>EVENT_INTAKE_SECRET</key>
    <string>$EVENT_INTAKE_SECRET</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$log</string>
  <key>StandardErrorPath</key>
  <string>$log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist"
echo "installed. Lock and unlock the screen, then: tail $log"

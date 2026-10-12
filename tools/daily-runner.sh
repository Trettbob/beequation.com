#!/bin/bash
# Run by launchd (~/Library/LaunchAgents/com.trettlabs.beequation-daily.plist) every 15 minutes, at login and
# whenever a disk mounts. Runs tools/daily.sh once per UK day, from 00:05, so a sleeping Mac or an unplugged
# drive just delays the run. A failed run is retried on the next tick (daily.sh is safe to re-run).
# Logs: ../logs/daily-YYYY-MM-DD.log next to this repo; ../logs/daily-last-run holds the last successful date.
set -u
export DEVTOOLS="/Volumes/External SSD/Projects/devtools"
export PATH="$DEVTOOLS/bin:$DEVTOOLS/node/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export GH_CONFIG_DIR="$DEVTOOLS/gh-config" NPM_CONFIG_CACHE="$DEVTOOLS/npm-cache" TMPDIR="$DEVTOOLS/tmp"
export GIT_TERMINAL_PROMPT=0 GH_PROMPT_DISABLED=1
HERE="$(cd "$(dirname "$0")/.." && pwd)"
LOGS="$(dirname "$HERE")/logs"
mkdir -p "$LOGS"
TODAY="$(TZ=Europe/London date +%F)"
NOW="$(TZ=Europe/London date +%H%M)"
[ "$((10#$NOW))" -ge 5 ] || exit 0
[ "$(cat "$LOGS/daily-last-run" 2>/dev/null)" = "$TODAY" ] && exit 0
# One run at a time; a lock older than two hours is stale.
LOCK="$LOGS/daily.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  [ -n "$(find "$LOCK" -maxdepth 0 -mmin +120 2>/dev/null)" ] || exit 0
  rm -rf "$LOCK"; mkdir "$LOCK" || exit 0
fi
trap 'rm -rf "$LOCK"' EXIT
LOG="$LOGS/daily-$TODAY.log"
echo "== $(date '+%F %T %Z') daily run for $TODAY" >> "$LOG"
if bash "$HERE/tools/daily.sh" --date "$TODAY" >> "$LOG" 2>&1; then
  echo "$TODAY" > "$LOGS/daily-last-run"
  echo "== done" >> "$LOG"
else
  echo "== failed (exit $?); will retry on the next tick" >> "$LOG"
fi
find "$LOGS" -name 'daily-20*.log' -mtime +60 -delete 2>/dev/null
exit 0

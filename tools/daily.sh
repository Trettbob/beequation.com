#!/bin/bash
# TRETTBOT_GLOBAL_MAINTENANCE_PREFLIGHT_V1
# Build and publish only from a clean website worktree. Not installed as a job.
set -euo pipefail

SCHEDULED=0
RUN_DATE=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --scheduled) SCHEDULED=1; shift ;;
    --date) RUN_DATE="${2:?--date needs YYYY-MM-DD}"; shift 2 ;;
    *) echo "Usage: $0 [--scheduled] [--date YYYY-MM-DD]" >&2; exit 64 ;;
  esac
done
TASK_ID="beequation-daily"
TASK_NAME="Beequation daily publication"
MAINTENANCE="$HOME/.local/bin/trettbot-codex-maintenance"
LOCK_INSTANCE=""
if [ "$SCHEDULED" = 1 ]; then
  "$MAINTENANCE" preflight --scheduled --task-id "$TASK_ID" --task-name "$TASK_NAME"
  # PPID belongs to the persistent wrapper; do not launch this script with exec.
  RECEIPT="$("$MAINTENANCE" task-begin --task-id "$TASK_ID" --task-name "$TASK_NAME" --pid "$PPID")"
  LOCK_INSTANCE="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["lock_instance_id"])' <<< "$RECEIPT")"
  [ -n "$LOCK_INSTANCE" ]
fi
finish() {
  result=$?
  trap - EXIT
  if [ -n "$LOCK_INSTANCE" ]; then
    outcome=failed-safe
    [ "$result" = 0 ] && outcome=success
    "$MAINTENANCE" task-end --task-id "$TASK_ID" --lock-instance-id "$LOCK_INSTANCE" --outcome "$outcome" || { end_result=$?; [ "$result" != 0 ] || result=$end_result; }
  fi
  exit "$result"
}
trap finish EXIT
heartbeat() {
  if [ -n "$LOCK_INSTANCE" ]; then
    "$MAINTENANCE" task-heartbeat --task-id "$TASK_ID" --lock-instance-id "$LOCK_INSTANCE" --description "$1"
  fi
}

HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"
export PATH="/Volumes/External SSD/Projects/devtools/node/bin:$PATH"
STATUS="$(git status --porcelain --untracked-files=all)"
if [ -n "$STATUS" ]; then
  echo "Daily publication stopped: the worktree has uncommitted changes." >&2
  printf '%s\n' "$STATUS" >&2
  exit 1
fi
# Pick up anything pushed from elsewhere before building (never merges: fails if the branches diverged).
git pull -q --ff-only
if [ -z "$RUN_DATE" ]; then
  RUN_DATE="$(python3 -c 'from datetime import datetime; from zoneinfo import ZoneInfo; print(datetime.now(ZoneInfo("Europe/London")).date())')"
fi
python3 -c 'from datetime import date; import sys; d=date.fromisoformat(sys.argv[1]); assert d.isoformat()==sys.argv[1]' "$RUN_DATE"
MESSAGE="Daily: $RUN_DATE"
heartbeat "Publishing dated Learn queue"
python3 tools/publish_queue.py --date "$RUN_DATE"
heartbeat "Building English Learn pages"
python3 tools/build-learn.py
heartbeat "Building language sites and daily puzzles"
python3 tools/build-langs.py --date "$RUN_DATE"
python3 tools/build-langs.py --check
heartbeat "Committing generated website content"
# Stage only sources the queue may publish and output of the two builders.
git add -A -- '*.html' learn-src learn-i18n learn today sitemap.xml llms.txt
if ! git diff --cached --quiet; then
  git commit -m "$MESSAGE"
fi
heartbeat "Pushing English website"
git push
heartbeat "Publishing language websites"
# Invoke via bash so executable bits in an existing checkout are not a dependency.
bash tools/publish-langs.sh "$MESSAGE"

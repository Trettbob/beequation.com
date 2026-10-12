#!/bin/bash
# No downloads, fixes or PDF writes: validate the source asset trees only.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-/Volumes/External SSD/Projects/devtools/java/jdk-21.0.12.1+1-jre/Contents/Home}"
VERAPDF="${VERAPDF:-/Volumes/External SSD/Projects/devtools/verapdf/verapdf}"
NODE="${NODE:-/Volumes/External SSD/Projects/devtools/node/bin/node}"
mkdir -p "$ROOT/reports/a11y"
RAW="$(mktemp "$ROOT/reports/a11y/pdfs.raw.XXXXXX")"
trap 'rm -f "$RAW"' EXIT
# veraPDF recursively selects .pdf files. Exit 1 is its non-compliance result;
# the summarizer also checks job errors and that every expected PDF was processed.
STATUS=0
set -- "$ROOT/assets"
for ASSETS in "$ROOT"/learn-i18n/*/assets; do
  if [[ -d "$ASSETS" ]]; then set -- "$@" "$ASSETS"; fi
done
"$VERAPDF" -f ua1 --format json --maxfailuresdisplayed 1 --recurse "$@" > "$RAW" 2> "$ROOT/reports/a11y/pdfs.validator.log" || STATUS=$?
"$NODE" "$ROOT/tools/a11y/summarize-pdfs.mjs" "$RAW" "$STATUS"

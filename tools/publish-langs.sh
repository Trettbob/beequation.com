#!/bin/bash
# Publishes dist/<lang>/ (from tools/build-langs.py) to each language site's repo, Trettbob/<lang>.beequation.com.
# Keeps a working copy of each repo next to this one, in ../langsites/<lang>. Run build-langs.py first.
#
#   tools/publish-langs.sh ["message"]                 every live language (LIVE in build-langs.py)
#   tools/publish-langs.sh --first <code> ["message"]  a new language's first publish, before it is in LIVE: its repo
#                                                      must exist; this gives GitHub Pages something (and the CNAME
#                                                      file) to serve while DNS and HTTPS are set up
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SITES="$(dirname "$HERE")/langsites"
if [ "$1" = "--first" ]; then
  if [ -z "$2" ] || [ ! -f "$HERE/dist/$2/index.html" ]; then
    echo "usage: $0 --first <code> [message]   (run python3 tools/build-langs.py first)"; exit 1
  fi
  LIST="$2"; MSG="${3:-First publish from beequation.com}"
else
  # Only live languages have a working site; a new language needs its repo, DNS and HTTPS first (see README).
  LIST="$(python3 "$HERE/tools/build-langs.py" --live)"; MSG="${1:-Update from beequation.com}"
fi
for L in $LIST; do
  D="$SITES/$L"
  [ -d "$D/.git" ] || git clone -q "https://github.com/Trettbob/$L.beequation.com.git" "$D"
  # Commit as the same author as the main repo (not the machine's global git identity).
  git -C "$D" config user.name "$(git -C "$HERE" config user.name)"; git -C "$D" config user.email "$(git -C "$HERE" config user.email)"
  git -C "$D" pull -q --ff-only origin main 2>/dev/null || true   # pick up anything GitHub committed (e.g. a CNAME file)
  rsync -a --delete --exclude .git "$HERE/dist/$L/" "$D/"
  git -C "$D" add -A
  if git -C "$D" diff --cached --quiet; then echo "$L: no changes"; continue; fi
  git -C "$D" commit -q -m "$MSG" && git -C "$D" push -q origin HEAD:main && echo "$L: published"
done

#!/bin/bash
# Publishes dist/<lang>/ (from tools/build-langs.py) to each language site's repo, Trettbob/<lang>.beequation.com.
# Keeps a working copy of each repo next to this one, in ../langsites/<lang>. Run build-langs.py first.
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SITES="$(dirname "$HERE")/langsites"
MSG="${1:-Update from beequation.com}"
for L in fr es de pt; do
  D="$SITES/$L"
  [ -d "$D/.git" ] || git clone -q "https://github.com/Trettbob/$L.beequation.com.git" "$D"
  rsync -a --delete --exclude .git "$HERE/dist/$L/" "$D/"
  git -C "$D" add -A
  if git -C "$D" diff --cached --quiet; then echo "$L: no changes"; continue; fi
  git -C "$D" commit -q -m "$MSG" && git -C "$D" push -q origin HEAD:main && echo "$L: published"
done

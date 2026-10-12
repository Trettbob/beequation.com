# Daily website publication

Nothing is installed by these tools. `tools/daily.sh` publishes the website: it validates and
moves due Learn sources, builds Learn and all language sites (including `/today/`), checks
translations, commits changes as `Daily: YYYY-MM-DD`, pushes the website and invokes the
existing language publishing script with the same message. Any error stops the script.
It refuses every uncommitted change, including untracked files, before processing the queue.
Use a clean publication checkout with working Git authentication; do not run it in an active
editing worktree. A publication failure may leave generated changes or a local commit: inspect
and reconcile that state before a later run. There is no automatic reset, stash or cleanup.

The date defaults to Europe/London. For an intentional dated run:

```sh
bash tools/daily.sh --date 2026-11-05
```

## Content queue

The default queue is `../growth/content/queue/<code>/`. Codes: `en fr es de pt it nl pl sv da no fi tr ja ko`.
Use `YYYY-MM-DD__slug.html`. The filename date determines when the source becomes due;
`path` determines its destination. Matching paths across languages produce Learn hreflang pairs.
The ordinary Learn builder also updates menus, sitemaps and English `llms.txt`.

```html
---
title: A short maths guide
description: A clear description of this guide.
h1: A short maths guide
layout: article
updated: 2026-10-20
path: parents/a-short-maths-guide.html
author: Lee Trett
author_role: founder
---
<p>The article goes here, using the existing Learn shortcodes.</p>
```

`title`, `description`, `h1`, `layout`, `updated` and `path` are required. `published` defaults to
its filename date. Optional `author`, `author_role`, `reviewer`, `reviewer_role`, `published`
and `reviewed` produce the visible byline; dates use `YYYY-MM-DD`. Roles are written in the
page's own language. Published sources retain `path` as provenance. Different existing pages
are never overwritten. Malformed front matter, invalid paths/dates, unbalanced shortcodes and
unresolved `/learn/` links leave the source queued and produce exit status 1. Same-batch links
are allowed only to valid pages in that language; links to rejected pages are also rejected.
Valid independent pages are published even if others fail. `tools/publish_days.json` only warns
about weekdays; it never delays a due file.

Preview without moving anything:

```sh
python3 tools/publish_queue.py --dry-run --date 2026-11-05
python3 tools/publish_queue.py --queue /private/tmp/example-queue --dry-run
```

Optional strategy tips are local JSON at `../growth/content/tips/<code>.json`, including
`en.json`: a list of `{"title": "…", "text": "…"}` objects. A missing file or empty list omits
the box. There are no requests to the growth project or third-party services from the browser.

## Daily puzzle builds

`python3 tools/build-langs.py` builds today's pages for all 15 sites. English output is `today/`;
other languages are `dist/<code>/today/`. `tools/build_today.py` is also importable and can
build individual sites, for example `python3 tools/build_today.py --lang fr --date 2026-11-05`
after the normal language build. To simulate all sites and their sitemaps, use
`python3 tools/build-langs.py --date 2026-11-05`. Restore with the ordinary build afterward.

The engine comes directly from the generated block in `play.html`, evaluated once in Node for
all needed dates. `BEEQUATION_NODE` can select Node; otherwise the known Node 22 location or
PATH is used. Current puzzles have no solution metadata in the page. Archives begin on
19 October 2026, contain days only through yesterday and support printing two per row.
Before that first date the current-month archive is empty. Hive numbering begins on 1 November.
Previous/next links appear only for months that exist.

## Optional launchd setup at 00:05 Europe/London

An owner may configure this later; no plist or job has been installed. The Mac's system timezone
must be **Europe/London**: launchd's calendar trigger uses the host timezone (including British
summer time); an environment `TZ` alone does not change that trigger. Set `StartCalendarInterval`
to `Hour: 0`, `Minute: 5`, and point `WorkingDirectory` to the clean publication checkout.
Use these `ProgramArguments`, replacing the checkout path if needed:

```xml
<key>ProgramArguments</key>
<array>
  <string>/bin/bash</string>
  <string>-c</string>
  <string>export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"; /bin/bash "/Volumes/External SSD/Projects/Beequation/beequation.com-build/tools/daily.sh" --scheduled; result=$?; exit "$result"</string>
</array>
<key>StartCalendarInterval</key>
<dict><key>Hour</key><integer>0</integer><key>Minute</key><integer>5</integer></dict>
```

Keep the outer shell alive: do not use `exec`. `--scheduled` first runs the global maintenance
preflight and registers the persistent shell parent with stable task ID `beequation-daily`.
It preserves the returned `lock_instance_id` for heartbeats and final task-end. It ends the lock
only after all foreground work finishes, with success or failed-safe. Manual runs do not touch
maintenance locks. Set stdout/stderr log destinations and working Git credentials as part of
any future installation. The SSD must be mounted. launchd runs missed calendar events after
wake; normal due-date processing catches up queued sources.

## Installed job (this Mac)

Installed 2026-10-12 with Lee's OK: `~/Library/LaunchAgents/com.trettlabs.beequation-daily.plist` runs
`tools/daily-runner.sh` every 15 minutes, at login and whenever a disk mounts. The runner calls `daily.sh` once per
UK day from 00:05 (so a sleeping Mac or unplugged drive only delays it) and retries a failed run on the next tick.
Logs: `../logs/daily-YYYY-MM-DD.log`; `../logs/daily-last-run` holds the last successful date (delete it to force a
re-run today). Keep this checkout clean: `daily.sh` stops if it has uncommitted changes, so work in worktrees.

    launchctl kickstart gui/$(id -u)/com.trettlabs.beequation-daily      # run a tick now
    launchctl bootout gui/$(id -u)/com.trettlabs.beequation-daily        # stop the job (then delete the plist)

# Daily website publication

Nothing is installed by these tools. `tools/daily.sh` publishes the website: it validates and
moves due Learn sources, builds Learn and all language sites (including `/today/`), checks
translations, commits changes as `Daily: YYYY-MM-DD`, pushes the website and invokes the
existing language publishing script with the same message. After language publication succeeds, it
runs `python3 tools/indexnow.py`; IndexNow failures are logged and do not fail the daily run.
Other errors stop the script.
It refuses every uncommitted change, including untracked files, before processing the queue.
Use a clean publication checkout with working Git authentication; do not run it in an active
editing worktree. A publication failure may leave generated changes or a local commit: inspect
and reconcile that state before a later run. There is no automatic reset, stash or cleanup.

The date defaults to Europe/London. For an intentional dated run:

```sh
bash tools/daily.sh --date 2026-11-05
```

## Content queue

The default queue is `../growth/content/queue/<code>/`. Codes: `en fr es de pt it nl pl sv da no fi tr ja ko`, plus `in` and `hi` (India; live).
Use `YYYY-MM-DD__slug.html`. The filename date determines when the source becomes due;
`path` determines a Learn item's destination. Matching paths across languages produce Learn hreflang pairs.
The ordinary builders also update menus, sitemaps, the blog and English `llms.txt`.

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

For a news post, use `type: news` and omit `path` and `layout`:

```html
---
type: news
title: News from the hive
description: The latest Beequation news.
h1: News from the hive
updated: 2026-10-20
author: Lee Trett
author_role: founder
image: /assets/og-image.png
---
<p>The news goes here, with the same shortcodes and byline fields as Learn.</p>
```

News requires `title`, `description`, `h1` and `updated`. Its filename supplies the slug;
`published` defaults to the filename date. The publisher moves it to `blog-src/<slug>.html`
or `blog-i18n/<code>/<slug>.html`, and the language build renders `/blog/<slug>.html`.
The slugs `index`, `page` and `feed` are reserved. `image` is optional: a site-relative
path or absolute HTTP(S) URL, used in OG metadata and RSS. External images use the local
default thumbnail on the index so visiting the blog adds no third-party requests.
News validation and collision handling follow the same queue rules as Learn.

Every site's `/blog/` combines news and Learn pages with a front-matter `published` date,
newest first, with 20 entries per page and `/blog/feed.xml` for the latest 20. Empty
indexes are noindex and omitted from sitemaps; their feeds remain valid. Post hreflang
links exist only for matching news slugs in more than one language. Visible blog words
live in `i18n/blog/<code>.json`; month names are shared with `i18n/today/<code>.json`.

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

## Sitemap dates and IndexNow

Every sitemap URL has a `YYYY-MM-DD` lastmod. A shared cache reads Git history once per
builder process (`git log --name-only --format=%x1e%cs`) plus working-tree status. Committed
sources use their last Git commit date (`%cs`, matching `git log -1 --format=%cs -- <sources>`);
uncommitted or new sources use today's date in Europe/London. Generated output timestamps
and file mtimes are never used. Git `%cs` preserves the commit's calendar date; London is
used for the current day and the Today build date.

Learn pages use their `learn-src/` or `learn-i18n/<code>/` source; worksheet pages also use
their individual worksheet JSON. Legacy English Learn articles use their maintained HTML.
Root and Easy Read pages use their English HTML. For translated root pages, we pragmatically
use the maximum of the English source date and `i18n/<code>.json` date: a translation change
to any page can therefore advance all that language's root-page dates. The translated
teachers page uses its own `learn-i18n/<code>/pack.html` source. Assets/PDFs use the Git date
of the original file, including language-specific assets. Today uses the build date;
monthly archives use the last day included (empty archives are omitted). Blog indexes use
the newest publication date; posts use reviewed, updated, then published date. Sitemap
indexes, if introduced, use the newest lastmod in their child sitemap.

`tools/indexnow.json` contains the public IndexNow key. Its matching root `.txt` file is
copied into each `dist/<code>/` by the language build, so normal language publication
includes it. The verification file is excluded from sitemaps. Keep these files together;
the builder does not regenerate or rotate the key.

Once the key file and rebuilt sitemaps have been published on all 15 hosts, preview and
make the one-off full submission from this checkout:

```sh
python3 tools/indexnow.py --all --dry-run
python3 tools/indexnow.py --all
```

The default command submits new URLs and URLs whose sitemap lastmod differs from the last
successful submission, plus `/today/`, `/today/<current-month>/`, `/blog/` and `/blog/feed.xml`
on every host. These four URLs are always submitted even when omitted from an empty sitemap.
Each host's key is checked with a GET before any POST; the body must exactly equal the key.
Missing, incorrect or unreachable key files skip that host and leave its state unchanged.
POSTs go to `https://api.indexnow.org/indexnow`, use at most 10,000 URLs per batch and a 20-second
timeout. Every response code or network error is logged; only 200/202 count as success.
All hosts/batches are attempted before a non-zero exit. A host's snapshot advances only
when all its batches succeed; successful hosts are saved even if another host fails.

State lives outside the repository at `../logs/indexnow-state.json`; use `--state /path/to/state.json`
to override it. State is written atomically after each successful host. Failed hosts may safely
be retried with `python3 tools/indexnow.py`; successful unchanged sitemap URLs are skipped.
`--dry-run` prints the actual JSON payloads and neither accesses the network nor writes state.

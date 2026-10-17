# beequation.com

The customer website for Beequation Pro and Beequation Kids. Plain static files: no build step.

| Page | Use |
| --- | --- |
| `/` | Home: playable puzzle, both apps, free printables |
| `/play.html` | The full web game (both apps) |
| `/support.html` | Support URL for App Store Connect and Play Console |
| `/privacy.html` | Privacy policy URL for both stores |

Fonts (Fredoka and Space Grotesk, SIL Open Font Licence) are self-hosted in `assets/fonts/`, so the site makes no
requests to Google or any other third party.

Company details (number 17310137, registered office from Companies House) and the privacy and terms dates are filled in.
Update the "Last updated" date on privacy.html or terms.html (and in i18n/*.json) whenever either changes.
When the apps are live, swap the "coming soon" tags on the home page for App Store and Google Play links.

## Smart link: /get

Use `https://beequation.com/get/kids/?c=tiktok-daily` or
`https://beequation.com/get/pro/?c=x-daily&m=social`. The path selects the app first, then
`?app=kids|pro`; `/get` defaults to Kids. Campaign `c` and optional medium `m` accept 1–40
lowercase letters, digits or hyphens, defaulting to `direct` and `link`. The source is the
campaign's first part before a hyphen.

Before launch, visitors open the browser game in their preferred language with the chosen app
and UTM parameters. At launch, fill in both numeric iOS IDs in `STORES`, confirm the Android
package names, optionally set `APPLE_PT`, and enable `LIVE.ios` and/or `LIVE.android` only when
that store's pages are live for both apps. Apply the same config to all three identical files:
`get/index.html`, `get/kids/index.html` and `get/pro/index.html`. Phones and tablets then open
their live store; desktops open the localized `#apps` section once both stores are live.
The pages use only inline code and a local favicon; there is no build step or third-party resource.

## Hosting on GitHub Pages (free)
1. Create a public repo, for example Trettbob/beequation.com, and push these files (the `CNAME` file is already set to beequation.com).
2. Repo Settings, then Pages: deploy from branch `main`, folder `/`.
3. In 123-reg, go to beequation.com, then Manage DNS, and set:
   - A records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (remove any existing A record for `@`)
   - CNAME for `www`: `trettbob.github.io`
4. Back in GitHub Pages settings, confirm the custom domain beequation.com and tick "Enforce HTTPS" when it's offered (DNS can take up to a few hours).

## Languages

The English pages in this repo are the source. `python3 tools/build-langs.py` builds a translated copy of the main
pages (home, how to play, about, support, privacy, terms, accessibility, 404 and the web game) into `dist/<code>/` for every `i18n/<code>.json`, and
updates the English pages' language menu and hreflang links. `--check` lists English text and shared interface
strings that have no translation yet. Learn and Teachers use each country's sources in `learn-i18n/`; their
footer comes from the translated About page. The game uses `i18n/play/<code>.js`.

| Code | Language | Site | Status |
| --- | --- | --- | --- |
| fr | Français | https://fr.beequation.com | live |
| es | Español | https://es.beequation.com | live |
| de | Deutsch | https://de.beequation.com | live |
| pt | Português (Brasil) | https://pt.beequation.com | live |
| it | Italiano | it.beequation.com | live |
| nl | Nederlands | nl.beequation.com | live |
| pl | Polski | pl.beequation.com | live |
| sv | Svenska | sv.beequation.com | live |
| da | Dansk | da.beequation.com | live |
| no | Norsk (bokmål) | no.beequation.com | live |
| fi | Suomi | fi.beequation.com | live |
| tr | Türkçe | tr.beequation.com | live |
| ja | 日本語 | ja.beequation.com | live |
| ko | 한국어 | ko.beequation.com | live |
| in | English (India) | https://in.beequation.com | live |
| hi | हिन्दी | https://hi.beequation.com | live |
| id | Bahasa Indonesia | id.beequation.com | preview, not live |
| vi | Tiếng Việt | vi.beequation.com | preview, not live |
| th | ไทย | th.beequation.com | preview, not live |
| uk | Українська | uk.beequation.com | preview, not live |
| ar | العربية | ar.beequation.com | preview, not live; right-to-left |

`LIVE` in `tools/build-langs.py` lists the languages whose site works. Every site only offers, links to and
suggests those (a site that isn't live yet also lists itself), so a translated language stays invisible until
its site is up. Indie's speech bubbles, the cookie note and the menu labels for the newer languages are in each
`i18n/<code>.json` under `"__site__"`; the header's words for every language are under `"__site__"` → `"nav"`
(English in `NAV_TEXT` in `tools/build-langs.py`; `--check` lists any that are missing).

The five new previews stay out of both `LIVE` and `LEARN_LIVE`. A site without a Learn section needs only its
site, game, today and blog translations; it does not require Learn or braille resources to build.
`tools/locale_output.py` adds Arabic `lang="ar" dir="rtl"` to all page types, converts inline CSS to logical
properties, and includes `assets/rtl.css` for directional icons and runtime UI. Boards, equations, numbers and
code stay LTR; Arabic dates use Western digits. Arabic and Thai alone receive system font fallback stacks.
English output passes through unchanged. `i18n-identity.py` remains restricted to Indian English (`in`);
Indonesian (`id`) and the other new languages must not be filled with English identity translations.

## The header

`tools/build-langs.py` (`header()`) writes the same header into every page between `<!--header-->` markers, with its
styles (`<!--nav-css-->`) and script (`<!--nav-->`): a floating pill with Apps and Learn mega menus, Teachers,
Support, the language menu and "Play free" on wide screens, and the beehive button with a full-screen menu on
phones and tablets. Learn's menu is built from the Learn data (`TOPICS` and `YEARS` in `tools/build-learn.py`, the
`learn-src/` pages and `worksheets.json`), so run `python3 tools/build-learn.py` then `python3 tools/build-langs.py`
after changing either. Language sites include Learn and Teachers when listed in `LEARN_LIVE`.

### Putting a new language live (owner, once per language)
Replace `<code>` with the code above, e.g. `ja`.
1. GitHub: create a **public** repo `Trettbob/<code>.beequation.com` (it can be empty).
2. 123-reg: beequation.com → Manage DNS → add a **CNAME** record, name `<code>`, value `trettbob.github.io`.
3. Here: `python3 tools/build-langs.py`, then `tools/publish-langs.sh --first <code>`. This pushes `dist/<code>/`
   (including its `CNAME` file) to the new repo without linking to it from any other site yet.
4. In the new repo: Settings → Pages → deploy from branch `main`, folder `/`. The custom domain
   `<code>.beequation.com` comes from the CNAME file. When GitHub has issued the certificate (minutes to a few
   hours after DNS works), tick **Enforce HTTPS**.
5. When https://<code>.beequation.com loads, add `'<code>'` to `LIVE` in `tools/build-langs.py`, run
   `python3 tools/build-langs.py` and `tools/publish-langs.sh` (this updates every live site's language menu), then
   commit and push this repo (the English pages' menu, hreflang links and browser-language suggestion now include it).

`tools/publish-langs.sh` keeps a clone of each language repo in `../langsites/<code>` and only publishes live
languages (or the one named with `--first`).

## Email
The contact address is the "hello" mailbox at this domain. It never appears in the HTML: links have class="em" and a data-e attribute (the address reversed, then base64), and a small script added by tools/build-langs.py turns them into a mailto link in the browser, so spam bots that scrape pages can't read it. Set up the mailbox or forwarding in 123-reg (Email settings for the domain).

## International SEO and local checks

Run in this order after changing sources or translations:

```sh
python3 tools/build-learn.py
python3 tools/build-langs.py
python3 tools/build-langs.py --check
python3 tools/check-international-seo.py
node tools/check-language-script.mjs
```

For changes that must preserve English bytes, snapshot **after the baseline build and before editing**, then
compare after the new build (including all Arabic HTML, recursively):

```sh
python3 tools/check-rtl.py --snapshot /tmp/beequation-english-before.json
# Make the changes and rebuild with the commands above.
python3 tools/check-rtl.py --english-baseline /tmp/beequation-english-before.json
python3 -m unittest discover -s tools/tests -p test_preview_locales.py
node tools/check-rtl-browser.mjs
```

The RTL browser check uses the existing local Chrome/puppeteer-core, blocks external requests and checks desktop
and mobile navigation, board geometry/keyboard movement, back arrows and Western-digit certificate dates.
The output check fails explicitly if Arabic translations have not yet produced `dist/ar/`.

The last script checks the four older guides and accessibility hreflang across all 15 sites, local accessibility
links, localized footers, Latin-script metadata limits, WebSite identities and public PDF sitemap entries.
English hreflang annotations and explicit English language-menu choices remain intentional.
`build-learn.py` adds public `assets/**/*.pdf` resources to the English sitemap; `build-langs.py` adds each
language's public PDFs after copying its localized assets. All current PDFs are worksheets or puzzle packs
intended for search. Do not put private or non-indexable documents in these public asset folders.

English pages offer a small suggestion in the visitor's language rather than redirecting. The suggestion
links to the corresponding page, or the language's Learn hub for a country-specific year page. Dismissal is
remembered locally; blocked storage is tolerated, and the legacy no-storage choice is respected. The cookie
note and explicit opt-in for Google Analytics are unchanged; the suggestion makes no network requests.

There is no `.nojekyll` in the publishing root. GitHub Pages' branch-based publishing therefore runs Jekyll
([GitHub documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site#static-site-generators)).
`_config.yml` excludes `learn-src/`, `learn-i18n/`, `i18n/` and `tools/` from that output. The existing finished
HTML and public assets retain their paths. Do not add `.nojekyll`: it would disable those exclusions. Matching
robots.txt rules discourage crawling, but do not themselves remove files or guarantee deindexing. After a
future deployment, check that all four source/tool paths return HTTP 404; local builds cannot prove live status.

Browser regression check (requires Playwright and Chrome):

```sh
node tools/check-language-banner.mjs /path/to/playwright/index.mjs
```

This serves local build bytes through browser request interception, blocks external traffic, and checks
language suggestions, storage denial, dismissal, cookie-note coexistence and the analytics opt-in boundary.

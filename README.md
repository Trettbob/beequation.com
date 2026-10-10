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

## Hosting on GitHub Pages (free)
1. Create a public repo, for example Trettbob/beequation.com, and push these files (the `CNAME` file is already set to beequation.com).
2. Repo Settings, then Pages: deploy from branch `main`, folder `/`.
3. In 123-reg, go to beequation.com, then Manage DNS, and set:
   - A records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (remove any existing A record for `@`)
   - CNAME for `www`: `trettbob.github.io`
4. Back in GitHub Pages settings, confirm the custom domain beequation.com and tick "Enforce HTTPS" when it's offered (DNS can take up to a few hours).

## Languages

The English pages in this repo are the source. `python3 tools/build-langs.py` builds a translated copy of the main
pages (home, how to play, about, support, privacy, terms, 404) into `dist/<code>/` for every `i18n/<code>.json`, and
updates the English pages' language menu and hreflang links. `--check` only lists English text that has no
translation yet. The Learn section, teachers page, accessibility page and the web game stay English-only.

| Code | Language | Site | Status |
| --- | --- | --- | --- |
| fr | Français | https://fr.beequation.com | live |
| es | Español | https://es.beequation.com | live |
| de | Deutsch | https://de.beequation.com | live |
| pt | Português (Brasil) | https://pt.beequation.com | live |
| it | Italiano | it.beequation.com | translated, not set up |
| nl | Nederlands | nl.beequation.com | translated, not set up |
| pl | Polski | pl.beequation.com | translated, not set up |
| sv | Svenska | sv.beequation.com | translated, not set up |
| da | Dansk | da.beequation.com | translated, not set up |
| no | Norsk (bokmål) | no.beequation.com | translated, not set up |
| fi | Suomi | fi.beequation.com | translated, not set up |
| tr | Türkçe | tr.beequation.com | translated, not set up |
| ja | 日本語 | ja.beequation.com | translated, not set up |
| ko | 한국어 | ko.beequation.com | translated, not set up |

`LIVE` in `tools/build-langs.py` lists the languages whose site works. Every site only offers, links to and
redirects to those (a site that isn't live yet also lists itself), so a translated language stays invisible until
its site is up. Indie's speech bubbles, the cookie note and the menu labels for the newer languages are in each
`i18n/<code>.json` under `"__site__"`.

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
   commit and push this repo (the English pages' menu, hreflang links and browser-language redirect now include it).

`tools/publish-langs.sh` keeps a clone of each language repo in `../langsites/<code>` and only publishes live
languages (or the one named with `--first`).

## Email
The contact address is the "hello" mailbox at this domain. It never appears in the HTML: links have class="em" and a data-e attribute (the address reversed, then base64), and a small script added by tools/build-langs.py turns them into a mailto link in the browser, so spam bots that scrape pages can't read it. Set up the mailbox or forwarding in 123-reg (Email settings for the domain).

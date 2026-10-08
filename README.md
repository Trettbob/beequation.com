# beequation.com

The customer website for Beequation and Beequation Kids. Plain static files: no build step.

| Page | Use |
| --- | --- |
| `/` | Home: playable puzzle, both apps, free printables |
| `/play.html` | The full web game (both apps) |
| `/support.html` | Support URL for App Store Connect and Play Console |
| `/privacy.html` | Privacy policy URL for both stores |

Fonts (Fredoka and Space Grotesk, SIL Open Font Licence) are self-hosted in `assets/fonts/`, so the site makes no
requests to Google or any other third party.

Company details (number 17310137, registered office from Companies House) are filled in. Replace before going live:
`[DATE]` in privacy.html.
When the apps are live, swap the "coming soon" tags on the home page for App Store and Google Play links.

## Hosting on GitHub Pages (free)
1. Create a public repo, for example Trettbob/beequation.com, and push these files (the `CNAME` file is already set to beequation.com).
2. Repo Settings, then Pages: deploy from branch `main`, folder `/`.
3. In 123-reg, go to beequation.com, then Manage DNS, and set:
   - A records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (remove any existing A record for `@`)
   - CNAME for `www`: `trettbob.github.io`
4. Back in GitHub Pages settings, confirm the custom domain beequation.com and tick "Enforce HTTPS" when it's offered (DNS can take up to a few hours).

## Email
The site uses hello@beequation.com. Set up a mailbox or forwarding for it in 123-reg (Email settings for the domain), or change the address in the footer, support and privacy pages.

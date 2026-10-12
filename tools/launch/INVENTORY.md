# Launch-day inventory

Inspected 12 October 2026, before applying the switch. Website worktree was clean.
Apps repository inspected read-only: `/Volumes/External SSD/Projects/Beequation/beequation`.

## Website source items

| Source | Pre-launch item | Switch behavior |
| --- | --- | --- |
| `index.html:30,35` | Description and Open Graph description say “in your browser now and soon on iPhone and Android” | Launch description: browser and apps, without claiming a disabled store is live |
| `index.html:334` | Hero `soon` span: “Coming soon to iPhone and Android. Follow @beequationapp for launch day.” | Translated availability sentence and separate Kids/Pro store links |
| `index.html:359,371` | Pro and Kids `soon-tag` chips: “iPhone and Android: coming soon” | Per-app translated download text and live-store links |
| `index.html:90,130,131` | `soon`/`soon-tag` CSS | Replace with styles for launch text and links |
| `teachers.html:284` | Kids “coming soon to iPhone, iPad and Android” | Available-now sentence, six worlds description preserved, Kids store links |
| `i18n/{code}.json:3,45,48` | Three English pre-launch keys and their translated values in all 14 dictionaries | Remove obsolete keys, add launch sentences and link markup with translated text |
| `get/index.html`, `get/kids/index.html`, `get/pro/index.html:9–11` | Empty `STORES.*.ios`, `LIVE.ios/android=false`, empty `APPLE_PT` | Configured IDs, packages, flags and provider token; routing/campaign behavior retained |
| `play.html:240–241,859,1041` | Purchase-preview wording and preview-only reset label | Update preview explanation and add Kids/Pro store links inside the existing adult purchase areas |
| `i18n/play/{code}.js` | `previewNote` in all 14 game dictionaries | Translated browser-demo explanation; keep simulated purchases and preview-only reset label |
| `play.html:41` | WebApplication JSON-LD: browser OS, free offer, browser URL | Keep accurate free browser offer; add store `isRelatedTo` links |
| `index.html:41` | Organization and WebSite JSON-LD; no native SoftwareApplication offer currently exists | Add live store links as WebSite `isRelatedTo`; do not invent native pricing |

`{code}` covers **fr es de pt it nl pl sv da no fi tr ja ko** (Portuguese is pt-BR; Norwegian is Bokmål).

Scanned every root HTML file, `learn-src/`, `learn-i18n/`, `i18n/*.json`, `i18n/play/*.js`, and `get/`.
There are no launch placeholders or “coming soon” items in Learn source/localized Learn content.
Other root pages have no launch-state wording. “See you soon!”, “as soon as”, worksheet/pack preview
images, `savedHere`, and browser preview/reset labels are unrelated to store availability and stay.
Generated `learn/` and `dist/` are rebuild outputs, not launch edit targets.
`tools/i18n_segments.py` recognizes the old soon spans: new text uses ordinary translated `<p>` blocks,
so no builder change is needed. Root `README.md:17,29` contains manual launch guidance; this new
README supersedes those instructions without treating documentation as visitor content.

## Apps source items

**Pro is the `apps/adult/` directory**, not `apps/pro/`.

| Source | Current placeholder | Config mapping |
| --- | --- | --- |
| `apps/kids/src/catalog.ts:43` | `FAMILY_CODE.ios=[IOS_CODE]`, `.android=[ANDROID_CODE]` | **Pro** offer codes (redeem in the other app) |
| `apps/adult/src/catalog.ts:34` | Same FAMILY_CODE placeholders | **Kids** offer codes |
| `apps/kids/src/purchases.ts:20` | `OTHER_APP.iosAppId=[ADULT_APP_ID]` | Pro iOS app ID |
| `apps/adult/src/purchases.ts:20` | `OTHER_APP.iosAppId=[KIDS_APP_ID]` | Kids iOS app ID |
| `apps/{kids,adult}/eas.json:27–29` | `[APPLE ID EMAIL]`, `[APP STORE CONNECT APP ID]`, `[TEAM ID]` | Each app's own appleId, ascAppId, appleTeamId |
| `apps/{kids,adult}/eas.json:32–33` | Android key path `./google-play-service-account.json`, track `internal` | Explicit Android submit config; example preserves existing settings |

The reversal of FAMILY_CODE is confirmed by `apps/*/src/catalog.ts` comments and
`LAUNCH.md:146–149,174–176`. Codes belong to the app where they are redeemed.
`familyCode()` and `otherAppLinkReady()` already hide placeholders; filling them enables the card.
`WEBSITE` is already `https://beequation.com`, so `LINKS_READY`, help/privacy/terms and share links are ready.
Android package identifiers are already `com.trettlabs.beequationkids` and `com.trettlabs.beequation`;
this switch validates those fixed identifiers rather than renaming released apps.

A broader apps-repository scan (excluding dependencies/Git/build binaries) found no additional literal
`[PLACEHOLDER]` or “coming soon” visitor/runtime copy. `LAUNCH.md:20,43,148,154,176` records the
same launch tasks and manual store-console prerequisites. They are documentation, not app strings.
The switch does not create store listings, offer codes, credentials, builds, submissions, or releases.
App source changes require the normal build/release workflow before installed apps receive them.

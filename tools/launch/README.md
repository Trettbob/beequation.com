# Launch-day switch

Fill one JSON config, then run this command from the website worktree when the store pages are live:

```sh
python3 tools/launch/launch.py --config /absolute/path/to/launch.json --apply
```

First copy `tools/launch/launch.example.json` to a private local config file and replace every bracketed
value. No Python packages, installations or network access are needed. The config contains Apple
account email and family codes: keep it out of Git. It contains no password, API key or service-account
JSON; `serviceAccountKeyPath` is only a path to an existing credential used later by EAS.

For a preview, omit `--apply` or explicitly use `--dry-run`:

```sh
python3 tools/launch/launch.py --config /absolute/path/to/launch.json --dry-run
```

Every changed file is printed as a unified diff, including the app sources. The script prints both
resolved repository roots before the diff. All config/source anchors are checked before any write.
Unexpected source changes, placeholders, incorrect value types or mismatching iOS IDs stop the run.
A filesystem failure during writing can leave a partial result; correct that failure and rerun with
the same config. The switch is idempotent, including updates to an already-applied config.

## Config fields

- `stores_live.ios` / `.android`: JSON booleans, global to **both apps**. Enable a store only after
  **both** apps' public listings are live there. At least one store must be enabled. Disabled stores
  have no download links and their `/get/` flag stays false. This also supports a staggered store launch.
- `apps.kids.ios_app_id` / `apps.pro.ios_app_id`: different numeric App Store IDs, represented as strings.
- `android_package`: the existing app identities `com.trettlabs.beequationkids` (Kids) and
  `com.trettlabs.beequation` (Pro). The switch refuses a renamed identity.
- `app_store_provider_token`: numeric campaign provider token as a string; explicitly use `""`
  if no campaign provider token is used. This sets `APPLE_PT` in all three `/get/` routers.
- `family_offer_codes`: each app's **own redeemable codes**, separately for iOS and Android.
  The script puts **Pro's codes in Kids** and **Kids' codes in Pro**, because each app offers the other
  app to subscribers. Enter existing store-issued custom codes, not a placeholder or a made-up code.
  Accepted characters are ASCII letters, digits, underscore, dot and hyphen.
- `submit.ios`: each app's own `appleId` email, `ascAppId` (must equal `ios_app_id`), and ten-character
  uppercase/digit `appleTeamId`.
- `submit.android`: existing `serviceAccountKeyPath` and intended `track` (`internal`, `alpha`, `beta`
  or `production`). The example preserves the existing internal track; use your intended submission
  track. Updating this field does not submit or promote a build. Other EAS fields are preserved.

The default app repository root is `/Volumes/External SSD/Projects/Beequation/beequation`.
**Pro maps to `apps/adult/`.** Override the repository root (the directory containing `apps/`) when needed:

```sh
python3 tools/launch/launch.py --config /absolute/path/to/launch.json --apps-root /path/to/apps-repo --apply
```

## What changes

The homepage hero, store chips, search/social description and Teachers paragraph become launch copy.
`copy.json` holds prepared English and all 14 translations, matching the existing dictionaries' tone,
including pt-BR and Norwegian Bokmål. The switch removes obsolete English pre-launch translation keys
and adds the launch keys and translated link markup to every `i18n/<code>.json`.
Links are plain HTML anchors, labelled **App Store** and **Google Play** in every language. No badge
images, remote scripts or new dependencies are added.

All `/get/` routers receive store IDs, package names, LIVE flags and campaign provider token. Their
routing, language fallback and campaign parameters stay intact. Homepage and browser JSON-LD gain
related native-app download links. The free browser offer stays free; no native price is invented.
Browser purchase explanations are translated in all 15 languages and gain app download links inside
the existing Grown-ups/Pro settings screens. Simulated purchases and preview-only reset remain accurate.

The six app files receive crossed family codes/other-app IDs and the configured EAS submission fields.
This edits source only; native apps need the normal build/release process to receive those changes.
Learn sources contain no launch wording to replace. Full discovery evidence is in [INVENTORY.md](INVENTORY.md).

## After applying

Review the printed diff. Run the translation check, then build and publish the language sites:

```sh
python3 tools/build-langs.py --check
python3 tools/build-langs.py
tools/publish-langs.sh
```

The switch itself never runs those commands, commits, pushes, submits apps or installs anything.
`publish-langs.sh` **does commit and push** the language-site repositories. Publish the English root site
through its normal GitHub Pages workflow separately. App source edits also need their normal release
workflow. A local switch is not proof that store listings, Pages deployment or installed apps are updated.

## Repeatable verification

```sh
PYTHONDONTWRITEBYTECODE=1 python3 tools/launch/test_launch.py
```

The standard-library integration tests copy website inputs and only the six relevant app files to
`/private/tmp`. They cover dry-run read-only behavior, crossed app values, complete application,
idempotency, changed config, disabled-store links, and validation before writes. They never apply to the
real apps repository. The test expects the read-only original apps repository at the path above.

For a manual test, use fake values and pass `--apps-root` pointing at a temporary copy containing
`apps/{kids,adult}/{src/catalog.ts,src/purchases.ts,eas.json}`. Save any existing website edits first.
Then dry-run, apply, run `build-langs.py --check` (expect **all translated**), and apply again (expect
**0 file(s) changed**). Restore tracked website inputs afterwards, keeping `tools/launch/`.
The development acceptance run is recorded in [TEST-RESULTS.md](TEST-RESULTS.md).

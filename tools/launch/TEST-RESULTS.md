# Development acceptance results

12 October 2026, macOS, Python 3.14.6. No packages installed, commits, pushes, publishing, app submissions,
or changes to the real apps repository.

## Requested worktree test

Fake values: Kids iOS `1111111111`, Pro iOS `2222222222`, provider token `123456`,
`KIDSIOS/KIDSANDROID` and `PROIOS/PROANDROID`, fake Apple email/team, existing Android packages.
Fixture config: `/private/tmp/bee-launch-acceptance/config.json`.
Apps fixture: `/private/tmp/bee-launch-acceptance/apps-copy/` contained only the six relevant files.

Commands run from **this website worktree**:

```sh
python3 tools/launch/launch.py --config /private/tmp/bee-launch-acceptance/config.json --apps-root /private/tmp/bee-launch-acceptance/apps-copy --dry-run
python3 tools/launch/launch.py --config /private/tmp/bee-launch-acceptance/config.json --apps-root /private/tmp/bee-launch-acceptance/apps-copy --apply
python3 tools/build-langs.py --check
python3 tools/launch/launch.py --config /private/tmp/bee-launch-acceptance/config.json --apps-root /private/tmp/bee-launch-acceptance/apps-copy --apply
```

Results:

- Dry-run: **40 file(s) would change**; tracked website inputs remained unchanged.
- Apply: **40 file(s) changed** = 34 website inputs + 6 temporary app files.
- Translation check: **all translated**, exit 0, across all 14 dictionaries.
- Second apply: **0 file(s) changed. No changes: already matches config.**, exit 0.
- JSON-LD parsed; 27 inline/localized JavaScript scripts passed Node `new Function` syntax checks.
- `git diff --check` passed on the applied website changes.
- SHA-256 readback proved all six **real** app source files unchanged.

`git checkout -- .` was attempted as requested. It failed before changing files because Git needed an
index lock outside the writable worktree:
`beequation.com/.git/worktrees/beequation.com-launch/index.lock: Operation not permitted`.
Since the website was clean before testing, the 34 changed website files were restored byte-for-byte
using `git show HEAD:<path>` readback and writes only to this worktree. `git diff --name-only` then
returned empty. Only the new `tools/launch/` directory remains. The launch switch is **not applied**.

## Integration regression checks

```sh
PYTHONDONTWRITEBYTECODE=1 python3 tools/launch/test_launch.py
```

**4 tests passed**, covering default dry-run with unchanged fixture hashes, complete apply and crossed
app mappings, idempotency, changed-config Android-only links, and rejection before writes for
placeholders, nonboolean flags, mismatching App Store IDs and source-anchor drift.
The initial test-first run failed because the CLI did not yet exist. The first implementation run
caught a second-run dictionary-order rewrite; the corrected implementation passed the same test.

## Independent behavioral check

A separate validator received only the behavior contract and fixture inputs. It did not read
`launch.py`, `copy.json`, or the implementation's test file. It copied and executed the exact CLI
in `/private/tmp/bee-launch-behavior-source-blind/` and reported **465 passing assertions**.
The parent inspected the validator and its recorded result.

It checked both explicit/default dry runs, complete apply, changed IDs/token/codes/submission tracks,
zero-change repeats, translated link destinations, browser free-offer preservation and native crossed
values. It executed the actual emitted `/get/` JavaScript using Node VM for **27 router cases**:
three router files × iOS/Android/desktop × both stores/iOS only/Android only, checking store destinations,
provider/campaign tokens, Android referrer attribution and French fallback behavior. Real website and
native fixture input hashes remained unchanged. Temporary evidence is not needed by the launch tool.

Validated CLI SHA-256: `593220a65651e060911239dc7d253ee1fa204cf5276628b0969c5c5de3db24da`.

## Source-review mechanism and limitation

The autoreview helper was invoked with `--mode local --no-web-search --prompt <bounded launch requirements>`
using its default Codex `gpt-5.6-sol` / `high` reviewer. Its initial sensitive-content guard rejected the
example's `[PROVIDER_TOKEN]` value; the optional example token was changed to the supported empty string
(no campaign tracking), after which the validated source review started.

The CLI then produced only heartbeats for over 30 minutes and no verdict. After that window, bounded
process inspection was attempted: `ps` was sandbox-blocked; `lsof` confirmed the launcher was still
running with its isolated temporary workspace. A graceful SIGTERM through the installed CLI's documented
signal-forwarding path was also sandbox-blocked. No further signal or permission-bypass attempts were made.
This attempt is **incomplete, without a clean verdict**, and may still be running as PID `22720` / tool
session `95123`. Its underlying delay is UNKNOWN. It is a read-only review, not a website/app mutation.

A supported independent native Codex source reviewer was dispatched with the same `gpt-5.6-sol` / `high`
model, exact file scope and structured-finding contract. Its result is recorded below separately;
it does not turn the incomplete CLI attempt into a successful autoreview run.

**Native source-review verdict: NO ACTIONABLE FINDINGS.** The independent reviewer covered all seven
launch files, existing build/translation/HTML/router interfaces, and the six read-only native app
interfaces. It verified HEAD `596c4f7c60c9d8a1a9e4f168d2d0288eb8b7d128` and the launcher SHA-256 above.
No findings were accepted or rejected, and no source edits followed this review. The source-blind
behavioral proof remains valid for the exact reviewed implementation. The reviewer was marked done.

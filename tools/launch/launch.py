#!/usr/bin/env python3
"""Prepare the complete launch diff; only --apply writes it. Python standard library only."""
import argparse
import difflib
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_APPS = Path('/Volumes/External SSD/Projects/Beequation/beequation')
LANGS = 'fr es de pt it nl pl sv da no fi tr ja ko'.split()
# India's sites (Indian English, Hindi) are switched too once their words exist, so they never keep "coming soon".
LANGS += [c for c in ('in', 'hi') if (ROOT / 'i18n' / f'{c}.json').is_file() and (ROOT / 'i18n/play' / f'{c}.js').is_file()]
OLD_DESCRIPTION = 'Find the number two others add up or multiply to. Free mental maths puzzles for ages 5 to adult, in your browser now and soon on iPhone and Android. No ads.'
OLD_HERO = 'Coming soon to iPhone and Android. Follow <a href="https://www.instagram.com/beequationapp" target="_blank" rel="noopener" style="color:var(--honey)">@beequationapp</a> for launch day.'
OLD_CHIP = 'iPhone and Android: coming soon'
TEACHER_OLD = 'Beequation Kids is coming soon to iPhone, iPad and Android, with six worlds of levels, hints from Indie the bee and no clock.'
TEACHER_NEW = 'Beequation Kids is available now, with six worlds of levels, hints from Indie the bee and no clock.'


def dumps(value):
    return json.dumps(value, ensure_ascii=False)


def text(value, label, pattern=None):
    if not isinstance(value, str) or not value.strip() or value != value.strip():
        raise ValueError(f'{label}: supply a nonempty string without surrounding whitespace')
    if any(c in value for c in '[]<>\n\r\u2028\u2029'):
        raise ValueError(f'{label}: placeholders and unsafe characters are not allowed')
    if pattern and not re.fullmatch(pattern, value):
        raise ValueError(f'{label}: invalid value')
    return value


def validate(config):
    live = config['stores_live']
    if set(live) != {'ios', 'android'} or any(type(v) is not bool for v in live.values()):
        raise ValueError('stores_live must contain ios/android JSON booleans')
    if not any(live.values()):
        raise ValueError('At least one store must be live for a launch switch')
    token = config['app_store_provider_token']
    if token != '':
        text(token, 'app_store_provider_token', r'[0-9]+')
    for name, package in [('kids', 'com.trettlabs.beequationkids'), ('pro', 'com.trettlabs.beequation')]:
        app = config['apps'][name]
        text(app['ios_app_id'], f'{name}.ios_app_id', r'[1-9][0-9]+')
        if app['android_package'] != package:
            raise ValueError(f'{name}.android_package must be {package} (released app identity)')
        for store in ['ios', 'android']:
            text(app['family_offer_codes'][store], f'{name}.family_offer_codes.{store}', r'[A-Za-z0-9_.-]+')
        ios = app['submit']['ios']
        text(ios['appleId'], f'{name}.appleId', r'[^\s@]+@[^\s@]+\.[^\s@]+')
        text(ios['ascAppId'], f'{name}.ascAppId', r'[1-9][0-9]+')
        if ios['ascAppId'] != app['ios_app_id']:
            raise ValueError(f'{name}.ascAppId must match its ios_app_id')
        text(ios['appleTeamId'], f'{name}.appleTeamId', r'[A-Z0-9]{10}')
        android = app['submit']['android']
        text(android['serviceAccountKeyPath'], f'{name}.serviceAccountKeyPath')
        if android['track'] not in ['internal', 'alpha', 'beta', 'production']:
            raise ValueError(f'{name}.submit.android.track: invalid track')
    if config['apps']['kids']['ios_app_id'] == config['apps']['pro']['ios_app_id']:
        raise ValueError('Kids and Pro must have different App Store IDs')


def replace_one(source, pattern, replacement, label, flags=0):
    result, count = re.subn(pattern, lambda _: replacement, source, flags=flags)
    if count != 1:
        raise ValueError(f'{label}: expected one source anchor, found {count}; no files written')
    return result


def marked(source, name, initial, value):
    """Replace a known original anchor or our prior block, including config changes."""
    start, end = f'<!--launch:{name}-->', f'<!--/launch:{name}-->'
    pattern = re.escape(start) + r'.*?' + re.escape(end) if start in source else initial
    return replace_one(source, pattern, start + value + end, name, re.S)


def urls(config, name):
    app = config['apps'][name]
    result = {}
    if config['stores_live']['ios']:
        result['App Store'] = 'https://apps.apple.com/app/id' + app['ios_app_id']
    if config['stores_live']['android']:
        result['Google Play'] = 'https://play.google.com/store/apps/details?id=' + app['android_package']
    return result


def links(config, name):
    # data-app lets the GA get_click event say which app an App Store link is for (its id alone doesn't).
    return ' · '.join(f'<a href="{html.escape(url, quote=True)}" data-app="{name}">{label}</a>' for label, url in urls(config, name).items())


def home_copy(config, words):
    hero = words['available'] + '<br>' + ' · '.join(
        f'<span>Beequation {"Kids" if name == "kids" else "Pro"}: {links(config, name)}</span>'
        for name in ['kids', 'pro'])
    chips = {name: words['download'] + ' ' + links(config, name) for name in ['kids', 'pro']}
    return hero, chips


def structured_data(source, config, label):
    applications = [
        {'@type': 'SoftwareApplication', 'name': 'Beequation ' + ('Kids' if name == 'kids' else 'Pro'),
         'downloadUrl': list(urls(config, name).values())}
        for name in ['kids', 'pro']]
    matched = False

    def update(match):
        nonlocal matched
        data = json.loads(match.group(1))
        for node in data.get('@graph', [data]):
            if node.get('@type') in ['WebSite', 'WebApplication']:
                node['isRelatedTo'] = applications
                matched = True
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '</script>'

    result = re.sub(r'<script type="application/ld\+json">(.*?)</script>', update, source, flags=re.S)
    if not matched:
        raise ValueError(f'{label}: no WebSite/WebApplication structured data anchor')
    return result


def plan(config, apps_root):
    """Read and validate every target before returning any writes."""
    changes = []

    def read(path, boundary):
        if path.is_symlink() or not path.resolve().is_relative_to(boundary.resolve()):
            raise ValueError(f'Target escapes its root or is a symlink: {path}')
        return path.read_text(encoding='utf-8')

    def stage(path, before, after):
        if before != after:
            changes.append((path, before, after))

    copy = json.loads((ROOT / 'tools/launch/copy.json').read_text(encoding='utf-8'))
    if not {'en', *LANGS} <= set(copy):
        raise ValueError('Launch copy must cover English and every language: ' + ', '.join(sorted({'en', *LANGS} - set(copy))))
    for code, words in copy.items():
        for field in ['description', 'available', 'download', 'preview']:
            text(words[field], f'copy.{code}.{field}')
    en = copy['en']
    hero, chips = home_copy(config, en)
    p = ROOT / 'index.html'
    before = read(p, ROOT)
    source = before.replace(OLD_DESCRIPTION, en['description'])
    if source.count(en['description']) != 2:
        raise ValueError('index.html: expected description and OG description')
    source = marked(source, 'hero', r'<span class="soon">.*?</span>', '<p class="launch-available">' + hero + '</p>')
    # Source order is Pro, then Kids. Markers give each app a stable update anchor.
    for name in ['pro', 'kids']:
        source = marked(source, name, re.escape('<span class="soon-tag">' + OLD_CHIP + '</span>'),
                        '<p class="launch-links">' + chips[name] + '</p>') if f'<!--launch:{name}-->' in source else source
    # The identical original chips need order-specific first replacements.
    if '<span class="soon-tag">' in source:
        for name in ['pro', 'kids']:
            original = '<span class="soon-tag">' + OLD_CHIP + '</span>'
            if original not in source:
                raise ValueError(f'index.html: missing {name} chip')
            source = source.replace(original, f'<!--launch:{name}--><p class="launch-links">{chips[name]}</p><!--/launch:{name}-->', 1)
    if any(f'<!--launch:{name}-->' not in source for name in ['pro', 'kids']):
        raise ValueError('index.html: missing app launch anchors')
    source = source.replace('.hero .soon {', '.hero .launch-available {')
    source = source.replace('.soon-tag {', '.launch-links {').replace('.app-kids .soon-tag {', '.app-kids .launch-links {')
    source = structured_data(source, config, 'index.html')
    stage(p, before, source)

    p = ROOT / 'teachers.html'
    before = read(p, ROOT)
    source = marked(before, 'teachers', re.escape(TEACHER_OLD), TEACHER_NEW + ' ' + links(config, 'kids'))
    stage(p, before, source)

    for code in LANGS:
        p = ROOT / 'i18n' / (code + '.json')
        before = read(p, ROOT)
        data = json.loads(before)
        obsolete = [k for k in data if k in [OLD_DESCRIPTION, OLD_HERO, OLD_CHIP]
                    or k.startswith(en['available']) or k.startswith(en['download'])]
        for k in obsolete:
            del data[k]
        translated_hero, translated_chips = home_copy(config, copy[code])
        data[en['description']] = copy[code]['description']
        data[hero] = translated_hero
        for name in ['kids', 'pro']:
            data[chips[name]] = translated_chips[name]
        data['App Store'] = 'App Store'
        data['Google Play'] = 'Google Play'
        stage(p, before, before if data == json.loads(before) else json.dumps(data, ensure_ascii=False, indent=1) + '\n')

    for rel in ['get/index.html', 'get/kids/index.html', 'get/pro/index.html']:
        p = ROOT / rel
        before = read(p, ROOT)
        source = before
        values = {
            'STORES': {name: {'ios': app['ios_app_id'], 'android': app['android_package']} for name, app in config['apps'].items()},
            'LIVE': config['stores_live'], 'APPLE_PT': config['app_store_provider_token']}
        for name, value in values.items():
            source = replace_one(source, rf'^const {name} = [^\n]*?;', f'const {name} = {dumps(value)};', rel + ':' + name, re.M)
        stage(p, before, source)

    for code in ['en', *LANGS]:
        p = ROOT / 'play.html' if code == 'en' else ROOT / 'i18n/play' / (code + '.js')
        before = read(p, ROOT)
        source = replace_one(before, r'''\bpreviewNote:\s*(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")''',
                             'previewNote: ' + dumps(copy[code]['preview']), str(p))
        if code == 'en':
            js_start, js_end = '/*launch:stores*/', '/*/launch:stores*/'
            js = js_start + '\nconst LAUNCH_STORES = ' + dumps({name: links(config, name) for name in ['kids', 'pro']}) + ';\n' + js_end + '\n'
            if js_start in source:
                source = replace_one(source, re.escape(js_start) + r'.*?' + re.escape(js_end) + '\n', js, 'play launch links', re.S)
            else:
                source = replace_one(source, r'function k_grown\(\) \{', js + 'function k_grown() {', 'k_grown')
            for css, name in [('soft', 'kids'), ('mute', 'pro')]:
                old = f'<p class="{css}" style="font-size:13px">${{T.previewNote}}</p>'
                source = marked(source, 'play-' + name, re.escape(old),
                                old + '<div class="launch-stores">${LAUNCH_STORES.' + name + '}</div>')
            source = structured_data(source, config, 'play.html')
        stage(p, before, source)

    for name, directory, other in [('kids', 'kids', 'pro'), ('pro', 'adult', 'kids')]:
        app = config['apps'][name]
        other_app = config['apps'][other]
        p = apps_root / 'apps' / directory / 'src/catalog.ts'
        before = read(p, apps_root)
        source = replace_one(before, r'export const FAMILY_CODE = \{[^\n]+\};',
                             'export const FAMILY_CODE = ' + dumps(other_app['family_offer_codes']) + ';', str(p))
        stage(p, before, source)
        p = apps_root / 'apps' / directory / 'src/purchases.ts'
        before = read(p, apps_root)
        source = replace_one(before, r'const OTHER_APP = \{[^\n]+\};',
                             'const OTHER_APP = ' + dumps({'iosAppId': other_app['ios_app_id']}) + ';', str(p))
        stage(p, before, source)
        p = apps_root / 'apps' / directory / 'eas.json'
        before = read(p, apps_root)
        data = json.loads(before)
        production = data['submit']['production']
        for platform in ['ios', 'android']:
            production[platform].update(app['submit'][platform])
        stage(p, before, json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    return changes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True, type=Path)
    parser.add_argument('--apps-root', type=Path, default=DEFAULT_APPS,
                        help='apps repository ROOT (contains apps/kids and apps/adult); use a copy when testing')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true', help='print diffs without writing (default)')
    mode.add_argument('--apply', action='store_true', help='write website and app changes; does not publish')
    args = parser.parse_args()
    try:
        config = json.loads(args.config.read_text(encoding='utf-8'))
        validate(config)
        changes = plan(config, args.apps_root.resolve())
        print(('APPLY' if args.apply else 'DRY RUN') + f': website={ROOT}, apps={args.apps_root.resolve()}')
        for path, before, after in changes:
            print(''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                             fromfile=str(path), tofile=str(path))), end='')
        if args.apply:
            # Check all originals again before the first write (no stale-plan overwrite).
            if any(path.read_text(encoding='utf-8') != before for path, before, _ in changes):
                raise ValueError('A target changed during planning; no files written')
            for path, _, after in changes:
                path.write_text(after, encoding='utf-8')
        print(f'\n{len(changes)} file(s) ' + ('changed.' if args.apply else 'would change.'))
        if not changes:
            print('No changes: already matches config.')
        print('Next, run python3 tools/build-langs.py then tools/publish-langs.sh.')
        print('The publish script commits/pushes language repositories; run it only when ready to publish.')
        return 0
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

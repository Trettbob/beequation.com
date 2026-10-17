#!/usr/bin/env python3
"""Keeps an English-variant site's i18n/<code>.json complete (Indian English: i18n/in.json).

  python3 tools/i18n-identity.py in            add every English text the build needs and the file lacks, unchanged
  python3 tools/i18n-identity.py in --prune    also drop entries no page uses any more
  python3 tools/i18n-identity.py in --check    only list what's missing or unused (exit 1 if anything is missing)

A variant site is built like any language site, from English -> variant pairs. Most of its text is the same as the
English site's, so new English text is added as-is ("identity"), while entries already in the file, such as the
hand-written Indian adaptations (Class, rupees, CBSE…), are never changed. Run it after the English pages change,
look over the new entries, adapt the ones that need it, then rebuild (tools/build-langs.py --check lists gaps).
"""
import html as H, importlib.util, json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# id (Indonesian), vi, th, uk and ar must never receive English identity translations.
VARIANTS = {'in'}   # English variants: the only codes whose missing text may be filled with the English text


def build_langs():
    spec = importlib.util.spec_from_file_location('bq_build_langs', os.path.join(ROOT, 'tools', 'build-langs.py'))
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


class Seen(dict):
    """A translation table that remembers which keys the build looked up."""
    def __init__(self, *a):
        super().__init__(*a); self.used = set()
    def __contains__(self, k):
        self.used.add(k); return super().__contains__(k)
    def __getitem__(self, k):
        self.used.add(k); return super().__getitem__(k)
    def get(self, k, default=None):
        self.used.add(k); return super().get(k, default)


def needed(B, T, code):
    """Every English text the build of `code` asks for that T lacks (and, as T.used, every key it asks for)."""
    missing = []
    for page in B.PAGES:
        _, gaps = B.translate(B.rd(page), code, page, T)
        missing += gaps
    # the footer's words (footer_words) and the language menu's label
    for k in [B.LEGAL_EN, 'Find the number made by two others.', 'Learn', 'Teachers', 'Support', 'Privacy', 'Terms', 'Accessibility', 'Language']:
        if B.norm(k) not in T: missing.append(B.norm(k))
    return list(dict.fromkeys(missing))


def site_words(B):
    """The header, accessibility panel, cookie note, Indie and skip-link words: the English ones."""
    return {'nav': dict(B.NAV_TEXT['en']), 'a11y': dict(B.A11Y_TEXT['en']), 'consent': list(B.CONSENT_TEXT['en']),
            'say': json.loads(json.dumps(B.SAY['en'])), 'menu': B.MENU_LABEL['en'], 'skip': B.SKIP_LABEL['en']}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1 or args[0] not in VARIANTS:
        sys.exit(f'usage: {sys.argv[0]} <{"|".join(sorted(VARIANTS))}> [--prune | --check]')
    code = args[0]
    path = os.path.join(ROOT, 'i18n', f'{code}.json')
    data = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    B = build_langs()
    def fresh():   # build-langs.py caches each table's text by id(); start clean each time
        B._KEPT.clear(); return Seen(data)
    T = fresh()
    missing = needed(B, T, code)
    if '--check' in sys.argv:
        unused = [k for k in data if not k.startswith('__') and k not in T.used and k != 'Language']
        for k in missing: print('  missing:', k[:120])
        for k in unused: print('  unused:', k[:120])
        print(f'{code}: {len(missing)} missing, {len(unused)} unused')
        sys.exit(1 if missing else 0)
    added = []
    while True:   # a translated block can reveal text inside it (links), so go round until nothing is missing
        missing = [k for k in missing if k not in data]
        if not missing: break
        for k in missing: data[k] = k; added.append(k)
        T = fresh(); missing = needed(B, T, code)
    # The first round also lists the text inside blocks (bold words, links) because nothing was translated yet; once
    # their blocks are in, they need no entries of their own: drop those, then put back any the build still asks for.
    text = lambda d: '\n'.join(H.unescape(v) for v in d.values() if isinstance(v, str))
    inside = [k for k in added if H.unescape(k) in text({x: v for x, v in data.items() if x != k})]
    for k in inside: del data[k]
    T = fresh()
    for k in needed(B, T, code): data[k] = k
    added = [k for k in added if k in data]
    T = fresh(); needed(B, T, code)
    if '--prune' in sys.argv:
        for k in [k for k in data if not k.startswith('__') and k not in T.used and k != 'Language']: del data[k]
    site = data.setdefault('__site__', {})
    for key, value in site_words(B).items(): site.setdefault(key, value)
    site.setdefault('suggestion', ['See Beequation for India', 'Stay on this site'])
    open(path, 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    print(f'{code}: {len(added)} English text(s) added unchanged; {len(data)} entries')


if __name__ == '__main__':
    main()

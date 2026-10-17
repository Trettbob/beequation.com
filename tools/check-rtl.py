#!/usr/bin/env python3
"""Snapshot English before changing builders; compare it and audit Arabic after.

python3 tools/check-rtl.py --snapshot /tmp/english-before.json
python3 tools/check-rtl.py --english-baseline /tmp/english-before.json
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def english_hashes():
    # Published English HTML only: exclude dist, i18n and source fragments.
    files = list(ROOT.glob('*.html'))
    for directory in ('learn', 'today', 'blog', 'easy-read', 'get'):
        files += list((ROOT / directory).rglob('*.html'))
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(files)}


class RootTag(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.attrs = {}; self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag == 'html': self.attrs = dict(attrs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--snapshot', type=Path)
    group.add_argument('--english-baseline', type=Path)
    args = parser.parse_args()
    current = english_hashes()
    if args.snapshot:
        args.snapshot.write_text(json.dumps(current, indent=2) + '\n')
        print(f'Snapshotted {len(current)} English pages'); return 0
    before = json.loads(args.english_baseline.read_text())
    bad = [f'English bytes changed/added/removed: {p}' for p in sorted(before.keys() | current.keys())
           if before.get(p) != current.get(p)]
    pages = sorted((ROOT / 'dist/ar').rglob('*.html'))
    if not pages: bad.append('Arabic output missing: finish translations and run build-langs.py')
    for p in pages:
        attrs = RootTag(p.read_text()).attrs
        if attrs.get('lang') != 'ar' or attrs.get('dir') != 'rtl':
            bad.append(f'Arabic lang/dir missing: {p.relative_to(ROOT)}')
    if bad:
        print('\n'.join(bad)); return 1
    print(f'PASS: {len(current)} English pages byte-identical; all {len(pages)} Arabic pages lang=ar dir=rtl')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

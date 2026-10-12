#!/usr/bin/env python3
"""Validate and publish dated Learn sources; invalid files remain queued.

Queue: growth/content/queue/<code>/YYYY-MM-DD__slug.html
Required metadata: title, description, h1, layout, updated, path.
"""
import argparse
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

from build_today import CODES, CONTENT, ROOT, london_today

REQUIRED = ('title', 'description', 'h1', 'layout', 'updated', 'path')
SHORTCODES = {'tip', 'indie', 'challenge', 'qa', 'worksheets', 'cards', 'card', 'try'}
WEEKDAYS = ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')


class Fragment(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors, self.links = [], [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in SHORTCODES:
            if tag in {'worksheets', 'try'}:
                self.errors.append(f'<{tag}> must be self-closing')
            else:
                self.stack.append(tag)
                required = ('q',) if tag in {'challenge', 'qa'} else ('href', 'title') if tag == 'card' else ()
                for key in required:
                    if not attrs.get(key): self.errors.append(f'<{tag}> missing {key}')
        if tag in {'a', 'card'} and attrs.get('href'):
            link = urlsplit(attrs['href'])
            if not link.scheme and not link.netloc and link.path.startswith('/learn/'):
                self.links.append(unquote(link.path))

    def handle_endtag(self, tag):
        if tag in SHORTCODES:
            if not self.stack or self.stack[-1] != tag:
                self.errors.append(f'unbalanced </{tag}>')
            else:
                self.stack.pop()

    def handle_startendtag(self, tag, attrs):
        if tag in SHORTCODES and tag not in {'worksheets', 'try'}:
            self.errors.append(f'<{tag}/> needs a closing tag')
        elif tag not in {'worksheets', 'try'}:
            self.handle_starttag(tag, attrs)


def parse(source):
    match = re.match(r'---\n(.*?)\n---\n', source, re.S)
    if not match: raise ValueError('missing or malformed front matter')
    meta = {}
    for line in match[1].splitlines():
        field = re.fullmatch(r'([a-z][a-z0-9_]*):(?: (.*))?', line)
        if not field: raise ValueError(f'malformed front-matter line: {line}')
        key, value = field.group(1), field.group(2) or ''
        if key in meta: raise ValueError(f'duplicate front-matter field: {key}')
        meta[key] = value
    missing = [key for key in REQUIRED if not meta.get(key, '').strip()]
    if missing: raise ValueError('missing fields: ' + ', '.join(missing))
    if meta['layout'] not in {'article', 'hub'}: raise ValueError('layout must be article or hub')
    for key in ('updated', 'published', 'reviewed'):
        if key in meta:
            try:
                if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', meta[key]): raise ValueError()
                date.fromisoformat(meta[key])
            except ValueError: raise ValueError(f'{key} must be a valid YYYY-MM-DD date')
    path = meta['path']
    if not re.fullmatch(r'(?:[a-z0-9]+(?:-[a-z0-9]+)*/)*[a-z0-9]+(?:-[a-z0-9]+)*\.html', path):
        raise ValueError('path must be a relative Learn .html path (no traversal)')
    if path == 'pack.html': raise ValueError('pack.html is a teachers page, not a Learn queue path')
    body = source[match.end():]
    fragment = Fragment(); fragment.feed(body); fragment.close()
    if fragment.stack: fragment.errors.append('unclosed shortcodes: ' + ', '.join(fragment.stack))
    if fragment.errors: raise ValueError('; '.join(fragment.errors))
    return meta, body, fragment.links


def learn_url(path):
    return '/learn/' + path.removesuffix('index.html')


def publish(queue, day, *, dry_run=False, root=ROOT):
    queue, root = Path(queue), Path(root)
    days = json.loads((ROOT / 'tools/publish_days.json').read_text())
    if not queue.exists():
        print(f'No queue at {queue}')
        return 0
    records, errors = {}, {}
    for langdir in sorted(queue.iterdir()):
        if not langdir.is_dir(): continue
        for file in sorted(langdir.glob('*.html')):
            try:
                if langdir.name not in CODES: raise ValueError(f'unknown language: {langdir.name}')
                match = re.fullmatch(r'(\d{4}-\d{2}-\d{2})__([a-z0-9]+(?:-[a-z0-9]+)*)\.html', file.name)
                if not match: raise ValueError('filename must be YYYY-MM-DD__slug.html')
                queued = date.fromisoformat(match[1])
                if queued > day: continue
                weekday = WEEKDAYS[queued.weekday()]
                if weekday not in days[langdir.name]:
                    print(f'WARNING {file}: {weekday} is outside {langdir.name} publication days ({", ".join(days[langdir.name])})')
                if file.is_symlink(): raise ValueError('queued sources must not be symlinks')
                source = file.read_text(encoding='utf-8')
                meta, body, links = parse(source)
                if not meta.get('published'): meta['published'] = queued.isoformat()
                contents = '---\n' + '\n'.join(f'{k}: {v}' for k, v in meta.items()) + '\n---\n' + body
                src = root / 'learn-src' if langdir.name == 'en' else root / 'learn-i18n' / langdir.name
                dest = src / meta['path']
                if not dest.resolve().is_relative_to(src.resolve()): raise ValueError('destination escapes its Learn source tree')
                # Older English articles use their built file as the authoritative source.
                existing = dest if dest.exists() else root / 'learn' / meta['path'] if langdir.name == 'en' else dest
                if existing.exists() and (existing != dest or existing.read_text(encoding='utf-8') != contents):
                    raise ValueError(f'path clashes with an existing different page: {meta["path"]}')
                records[file] = {'code': langdir.name, 'meta': meta, 'links': links, 'dest': dest, 'contents': contents, 'source': source}
            except (ValueError, OSError) as error:
                errors[file] = [str(error)]
    targets = {}
    for file, record in records.items(): targets.setdefault(record['dest'], []).append(file)
    for dest, files in targets.items():
        if len(files) > 1:
            for file in files: errors[file] = [f'duplicate queued path: {dest.relative_to(root)}']
    # Remove invalid dependencies until no valid page points to a rejected same-batch page.
    while True:
        new_errors = {}
        for file, record in records.items():
            if file in errors: continue
            code = record['code']; src = root / 'learn-src' if code == 'en' else root / 'learn-i18n' / code
            have = {learn_url(p.relative_to(src).as_posix()) for p in src.rglob('*.html')}
            if code == 'en': have |= {learn_url(p.relative_to(root / 'learn').as_posix()) for p in (root / 'learn').rglob('*.html')}
            have |= {learn_url(r['meta']['path']) for f, r in records.items() if f not in errors and r['code'] == code}
            missing = sorted(set(record['links']) - have)
            if missing: new_errors[file] = ['unresolved internal Learn links: ' + ', '.join(missing)]
        if not new_errors: break
        errors.update(new_errors)
    for file, record in records.items():
        if file in errors: continue
        dest = record['dest']
        if dry_run:
            print(f'Would publish {file} -> {dest.relative_to(root)}')
            continue
        try:
            # Check identity again so concurrent queue edits cannot be silently removed.
            if file.read_text(encoding='utf-8') != record['source']: raise ValueError('queue file changed during validation')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                if dest.read_text(encoding='utf-8') != record['contents']: raise ValueError('destination changed during validation')
            else:
                with dest.open('x', encoding='utf-8') as out: out.write(record['contents'])
            file.unlink()
            print(f'Published {file} -> {dest.relative_to(root)}')
        except (OSError, ValueError) as error:
            errors[file] = [str(error)]
    for file, messages in sorted(errors.items()):
        for message in messages: print(f'ERROR {file}: {message}')
    return 1 if errors else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--date', type=date.fromisoformat, default=london_today())
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--queue', type=Path, default=CONTENT / 'queue')
    args = parser.parse_args()
    return publish(args.queue, args.date, dry_run=args.dry_run)


if __name__ == '__main__':
    raise SystemExit(main())

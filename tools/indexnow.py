#!/usr/bin/env python3
"""Submit sitemap changes to IndexNow. --dry-run never accesses the network."""
import argparse
import http.client
from datetime import date
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

from sitemap_dates import london_today

ROOT = Path(__file__).resolve().parents[1]
CODES = 'en fr es de pt it nl pl sv da no fi tr ja ko'.split()
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
ENDPOINT = 'https://api.indexnow.org/indexnow'


def sitemap_urls(file, host, seen=None):
    file = Path(file).resolve()
    seen = set() if seen is None else seen
    if file in seen: raise ValueError(f'sitemap cycle: {file}')
    seen.add(file)
    tree = ET.parse(file)
    urls = {}
    for entry in tree.findall('s:url', NS):
        url = entry.findtext('s:loc', namespaces=NS)
        modified = entry.findtext('s:lastmod', namespaces=NS)
        if urlsplit(url).scheme != 'https' or urlsplit(url).netloc != host:
            raise ValueError(f'URL belongs to another host: {url}')
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', modified or ''):
            raise ValueError(f'missing or invalid lastmod: {url}')
        date.fromisoformat(modified)
        urls[url] = modified
    for entry in tree.findall('s:sitemap', NS):
        url = entry.findtext('s:loc', namespaces=NS)
        if urlsplit(url).netloc != host: raise ValueError(f'sitemap belongs to another host: {url}')
        urls.update(sitemap_urls(file.parent / urlsplit(url).path.lstrip('/'), host, seen))
    return urls


def save_state(file, state):
    file.parent.mkdir(parents=True, exist_ok=True)
    temp = file.with_name(file.name + '.tmp')
    temp.write_text(json.dumps(state, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    temp.replace(file)


def main(argv=None, *, root=ROOT, today=None):
    root = Path(root)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--all', action='store_true', help='submit every sitemap URL')
    parser.add_argument('--dry-run', action='store_true', help='print JSON payloads without GET/POST or state writes')
    parser.add_argument('--state', type=Path, default=root.parent / 'logs/indexnow-state.json', help='successful-submission state path')
    args = parser.parse_args(argv)
    day = today or london_today()
    try:
        key = json.loads((root / 'tools/indexnow.json').read_text(encoding='utf-8'))['key']
        if not isinstance(key, str) or not re.fullmatch(r'[0-9a-f]{32}', key): raise ValueError('key must be 32 hex characters')
        state = json.loads(args.state.read_text(encoding='utf-8')) if args.state.exists() else {'key': key, 'hosts': {}}
        if state.get('key') != key: state = {'key': key, 'hosts': {}}
        if not isinstance(state.get('hosts'), dict): raise ValueError('invalid state hosts')
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f'IndexNow configuration/state error: {error}', file=sys.stderr)
        return 1
    failed = False
    for code in CODES:
        host = 'beequation.com' if code == 'en' else f'{code}.beequation.com'
        site = root if code == 'en' else root / 'dist' / code
        try:
            current = sitemap_urls(site / 'sitemap.xml', host)
            # The verification file is public, but never a search resource.
            current.pop(f'https://{host}/{key}.txt', None)
            previous = state['hosts'].get(host, {})
            urls = {u for u, modified in current.items() if args.all or previous.get(u) != modified}
            urls.update(f'https://{host}{path}' for path in
                        ['/today/', f'/today/{day:%Y-%m}/', '/blog/', '/blog/feed.xml'])
            urls = sorted(urls)
            location = f'https://{host}/{key}.txt'
            payloads = [{'host': host, 'key': key, 'keyLocation': location, 'urlList': urls[i:i + 10000]}
                        for i in range(0, len(urls), 10000)]
            if args.dry_run:
                for payload in payloads: print(json.dumps(payload, ensure_ascii=False))
                continue
            try:
                with urllib.request.urlopen(urllib.request.Request(location), timeout=20) as response:
                    live = response.read().decode('utf-8') == key
                    print(f'{host}: key GET HTTP {response.status}')
                if not live:
                    print(f'{host}: key not live (body differs); skipping host')
                    failed = True
                    continue
            except (OSError, urllib.error.URLError, http.client.HTTPException, UnicodeError) as error:
                print(f'{host}: key not live; skipping host: {error}')
                if isinstance(error, urllib.error.HTTPError): error.close()
                failed = True
                continue
            success = True
            for payload in payloads:
                request = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode('utf-8'),
                                                 headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
                try:
                    with urllib.request.urlopen(request, timeout=20) as response:
                        status = response.status
                        print(f'{host}: POST {len(payload["urlList"])} URLs: HTTP {status}')
                        if status not in (200, 202): success = False
                except (OSError, urllib.error.URLError, http.client.HTTPException) as error:
                    print(f'{host}: POST {len(payload["urlList"])} URLs failed: {error}')
                    if isinstance(error, urllib.error.HTTPError): error.close()
                    success = False
            if success:
                state['hosts'][host] = current
                save_state(args.state, state)
            else:
                failed = True
        except (OSError, ValueError, TypeError, ET.ParseError) as error:
            print(f'{host}: IndexNow failed: {error}')
            failed = True
    return int(failed)


if __name__ == '__main__': sys.exit(main())

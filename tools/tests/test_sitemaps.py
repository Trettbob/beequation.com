"""Offline sitemap and IndexNow contracts. No live network calls or publication."""
from contextlib import redirect_stdout
from datetime import date, datetime
import importlib
import http.client
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
CODES = 'en fr es de pt it nl pl sv da no fi tr ja ko in hi'.split()
CODES += [c for c in ('id', 'vi', 'th', 'uk', 'ar') if (ROOT / 'dist' / c / 'sitemap.xml').is_file()]
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
KEY = '0123456789abcdef0123456789abcdef'


def module(name):
    if not (ROOT / 'tools' / (name + '.py')).exists():
        raise AssertionError(name + ' implementation missing')
    return importlib.import_module(name)


class SitemapTests(unittest.TestCase):
    def test_every_url_has_nonfuture_date_and_key_is_published_but_not_indexed(self):
        today = datetime.now(ZoneInfo('Europe/London')).date()
        self.assertTrue((ROOT / 'tools/indexnow.json').exists(), 'IndexNow key missing')
        key = json.loads((ROOT / 'tools/indexnow.json').read_text())['key']
        self.assertRegex(key, r'^[0-9a-f]{32}$')
        for code in CODES:
            root = ROOT if code == 'en' else ROOT / 'dist' / code
            with self.subTest(code=code):
                self.assertEqual((root / (key + '.txt')).read_text(), key)
                tree = ET.parse(root / 'sitemap.xml')
                urls = tree.findall('s:url', NS)
                self.assertTrue(urls)
                for entry in urls:
                    loc = entry.findtext('s:loc', namespaces=NS)
                    modified = entry.findtext('s:lastmod', namespaces=NS)
                    self.assertNotIn(key, loc)
                    self.assertRegex(modified or '', r'^\d{4}-\d{2}-\d{2}$', loc)
                    self.assertLessEqual(date.fromisoformat(modified), today, loc)
                for entry in tree.findall('s:sitemap', NS):
                    self.assertLessEqual(date.fromisoformat(entry.findtext('s:lastmod', namespaces=NS)), today)

    def test_unchanged_committed_learn_page_uses_source_git_date(self):
        source = 'learn-src/parents/helping-at-home.html'
        self.assertEqual(subprocess.check_output(['git', 'status', '--porcelain', '--', source], cwd=ROOT), b'')
        expected = subprocess.check_output(['git', 'log', '-1', '--format=%cs', '--', source], cwd=ROOT, text=True).strip()
        urls = {u.findtext('s:loc', namespaces=NS): u.findtext('s:lastmod', namespaces=NS)
                for u in ET.parse(ROOT / 'sitemap.xml').findall('s:url', NS)}
        self.assertEqual(urls['https://beequation.com/learn/parents/helping-at-home.html'], expected)

    def test_blog_post_uses_reviewed_date_and_index_uses_newest_publication(self):
        import build_blog
        from test_blog import load, source
        learn = load('build-learn.py')
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            root = Path(td)
            (root / 'blog-src').mkdir()
            (root / 'blog-src/a.html').write_text(source('published: 2026-10-01\nreviewed: 2026-10-10\n'))
            _, urls = build_blog.build(source_root=root, output=root, learn=learn, chrome=lambda text, *args: text)
            self.assertEqual(dict(urls)['/blog/a.html'], '2026-10-10')
            self.assertEqual(dict(urls)['/blog/'], '2026-10-01')

    def test_cached_git_dates_use_sources_dirty_files_and_pragmatic_translation_max(self):
        dates = module('sitemap_dates')
        log = '\x1e2026-10-10\n\nindex.html\ni18n/fr.json\nlearn-src/worksheets/a.json\n\x1e2026-10-01\n\nlearn-src/guide.html\nlearn-src/worksheets/a.html\nindex.html\nassets/a.pdf\n'
        commands = []
        def run(args, **kwargs):
            commands.append(args)
            return subprocess.CompletedProcess(args, 0, log if args[1] == 'log' else ' M learn-src/dirty.html\0?? learn-src/new.html\0')
        with patch.object(dates.subprocess, 'run', side_effect=run):
            cache = dates.GitDates(ROOT, today=date(2026, 10, 12))
            self.assertEqual(cache.files(['learn-src/guide.html']), '2026-10-01')
            self.assertEqual(cache.files(['learn-src/worksheets/a.html', 'learn-src/worksheets/a.json']), '2026-10-10')
            self.assertEqual(cache.files(['learn-src/dirty.html']), '2026-10-12')
            self.assertEqual(cache.files(['learn-src/new.html']), '2026-10-12')
            self.assertEqual(cache.root_page('index.html', 'fr'), '2026-10-10')
            self.assertEqual(cache.files(['assets/a.pdf']), '2026-10-01')
        self.assertEqual(sum(c[1] == 'log' for c in commands), 1)


class Response:
    def __init__(self, code=200, body=KEY): self.status, self.body = code, body.encode()
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self): return self.body


class IndexNowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir='/private/tmp')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'site'
        (self.root / 'tools').mkdir(parents=True)
        (self.root / 'tools/indexnow.json').write_text(json.dumps({'key': KEY}))
        self.state = Path(self.tmp.name) / 'state.json'
        self.write_sites()

    def write_sites(self, count=1):
        for code in CODES:
            root = self.root if code == 'en' else self.root / 'dist' / code
            root.mkdir(parents=True, exist_ok=True)
            host = 'beequation.com' if code == 'en' else code + '.beequation.com'
            entries = ''.join(f'<url><loc>https://{host}/p{i}.html</loc><lastmod>2026-10-01</lastmod></url>' for i in range(count))
            (root / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + '</urlset>')

    def invoke(self, flags, opener):
        now = module('indexnow')
        out = io.StringIO()
        with patch.object(now.urllib.request, 'urlopen', side_effect=opener), redirect_stdout(out):
            result = now.main([*flags, '--state', str(self.state)], root=self.root, today=date(2026, 10, 12))
        return result, out.getvalue()

    def test_dry_run_payloads_are_host_scoped_batched_and_never_network(self):
        self.write_sites(10001)
        def forbidden(*args, **kwargs): raise AssertionError('dry-run made a network request')
        result, output = self.invoke(['--all', '--dry-run'], forbidden)
        self.assertEqual(result, 0)
        payloads = [json.loads(line) for line in output.splitlines() if line.startswith('{')]
        self.assertEqual(len(payloads), 34)
        for payload in payloads:
            self.assertEqual(set(payload), {'host', 'key', 'keyLocation', 'urlList'})
            self.assertEqual(payload['key'], KEY)
            self.assertEqual(payload['keyLocation'], f'https://{payload["host"]}/{KEY}.txt')
            self.assertLessEqual(len(payload['urlList']), 10000)
            self.assertTrue(payload['urlList'])
            self.assertTrue(all(urlsplit(u).netloc == payload['host'] for u in payload['urlList']))
        self.assertEqual(sum(len(p['urlList']) for p in payloads), 17 * 10005)
        self.assertFalse(self.state.exists())

    def test_successful_hosts_advance_state_failed_hosts_retry_and_all_hosts_are_attempted(self):
        sent, gets = [], []
        def opener(req, timeout):
            self.assertEqual(timeout, 20)
            if req.get_method() == 'GET':
                gets.append(urlsplit(req.full_url).netloc)
                return Response()
            self.assertEqual(req.full_url, 'https://api.indexnow.org/indexnow')
            self.assertEqual(req.get_header('Content-type'), 'application/json; charset=utf-8')
            payload = json.loads(req.data); sent.append(payload)
            if payload['host'] == 'fr.beequation.com':
                raise HTTPError(req.full_url, 429, 'rate limited', {}, io.BytesIO(b'slow down'))
            return Response(202, '')
        result, output = self.invoke([], opener)
        self.assertEqual(result, 1)
        self.assertEqual(len(gets), 17); self.assertEqual(len(sent), 17)
        self.assertIn('429', output); self.assertIn('202', output)
        state = json.loads(self.state.read_text())
        self.assertIn('beequation.com', state['hosts']); self.assertNotIn('fr.beequation.com', state['hosts'])
        sent.clear()
        result, _ = self.invoke([], opener)
        english = next(p for p in sent if p['host'] == 'beequation.com')
        self.assertEqual(set(english['urlList']), {'https://beequation.com/today/', 'https://beequation.com/today/2026-10/', 'https://beequation.com/blog/', 'https://beequation.com/blog/feed.xml'})
        french = next(p for p in sent if p['host'] == 'fr.beequation.com')
        self.assertIn('https://fr.beequation.com/p0.html', french['urlList'])
        sitemap = self.root / 'sitemap.xml'
        sitemap.write_text(sitemap.read_text().replace('2026-10-01', '2026-10-02'))
        sent.clear(); self.invoke([], opener)
        self.assertIn('https://beequation.com/p0.html', next(p for p in sent if p['host'] == 'beequation.com')['urlList'])

    def test_unavailable_or_wrong_key_skips_post_logs_errors_and_keeps_state(self):
        posts = []
        def opener(req, timeout):
            if req.get_method() == 'POST': posts.append(req); return Response()
            if 'fr.beequation.com' in req.full_url: raise URLError('offline')
            return Response(body=KEY + '\n')
        result, output = self.invoke([], opener)
        self.assertEqual(result, 1)
        self.assertFalse(posts); self.assertFalse(self.state.exists())
        self.assertIn('offline', output); self.assertIn('not live', output)

    def test_http_transport_errors_are_logged_without_stopping_other_hosts(self):
        attempted = []
        def opener(req, timeout):
            if req.get_method() == 'GET': return Response()
            host = json.loads(req.data)['host']
            attempted.append(host)
            if host == 'beequation.com': raise http.client.IncompleteRead(b'partial')
            if host == 'fr.beequation.com': return Response(503, '')
            return Response()
        result, output = self.invoke([], opener)
        self.assertEqual(result, 1)
        self.assertEqual(len(attempted), 17)
        self.assertIn('IncompleteRead', output); self.assertIn('503', output)
        state = json.loads(self.state.read_text())['hosts']
        self.assertNotIn('beequation.com', state)
        self.assertNotIn('fr.beequation.com', state)
        self.assertIn('ko.beequation.com', state)

    def test_failed_batch_does_not_advance_host_snapshot(self):
        self.write_sites(10001)
        def opener(req, timeout):
            if req.get_method() == 'GET': return Response()
            payload = json.loads(req.data)
            if len(payload['urlList']) < 10000: raise URLError('batch failed')
            return Response()
        result, output = self.invoke(['--all'], opener)
        self.assertEqual(result, 1); self.assertIn('batch failed', output)
        self.assertFalse(self.state.exists())


if __name__ == '__main__': unittest.main()

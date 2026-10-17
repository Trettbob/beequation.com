"""Local blog, queue and RSS contracts; fixtures never publish to the real site."""
from datetime import date
from email.utils import parsedate_to_datetime
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
import publish_queue


def load(filename):
    spec = importlib.util.spec_from_file_location(filename.replace('-', '_'), ROOT / 'tools' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def source(extra='', body='<p>A &amp; B</p>'):
    return ('---\ntype: news\ntitle: News & notes\ndescription: A < B & C\n'
            'h1: News & notes\nupdated: 2026-10-12\n' + extra + '---\n' + body)


class BlogTests(unittest.TestCase):
    def test_news_queue_defaults_dates_and_preserves_invalid_and_collisions(self):
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            base = Path(td); queue = base / 'queue/en'; queue.mkdir(parents=True)
            target = base / 'site'
            good = queue / '2026-10-12__news.html'; good.write_text(source())
            bad = queue / '2026-10-12__bad.html'; bad.write_text(source('path: bad.html\n'))
            image = queue / '2026-10-12__image.html'; image.write_text(source('image: javascript:alert(1)\n'))
            broken = queue / '2026-10-12__broken.html'; broken.write_text(source(body='<tip>open'))
            self.assertEqual(publish_queue.publish(base / 'queue', date(2026, 10, 12), root=target), 1)
            dest = target / 'blog-src/news.html'
            self.assertTrue(dest.exists(), 'valid news should publish without Learn path/layout')
            self.assertIn('published: 2026-10-12', dest.read_text())
            self.assertFalse(good.exists())
            for file in [bad, image, broken]: self.assertTrue(file.exists())
            good.write_text(source(body='<p>Different</p>'))
            self.assertEqual(publish_queue.publish(base / 'queue', date(2026, 10, 12), root=target), 1)
            self.assertTrue(good.exists())
            self.assertNotIn('Different', dest.read_text())

    def test_news_dependencies_use_valid_learn_batch_and_translation_destinations(self):
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            base = Path(td); q = base / 'queue/fr'; q.mkdir(parents=True)
            (q / '2026-10-12__news.html').write_text(source(body='<a href="/learn/guide.html">Guide</a>'))
            (q / '2026-10-12__guide.html').write_text(source().replace('type: news\n', 'layout: article\npath: guide.html\n'))
            self.assertEqual(publish_queue.publish(base / 'queue', date(2026, 10, 12), root=base / 'site'), 0)
            self.assertTrue((base / 'site/blog-i18n/fr/news.html').exists())
            (q / '2026-10-12__missing.html').write_text(source(body='<a href="/learn/missing.html">Missing</a>'))
            self.assertEqual(publish_queue.publish(base / 'queue', date(2026, 10, 12), root=base / 'site'), 1)
            self.assertTrue((q / '2026-10-12__missing.html').exists())

    def builder(self):
        self.assertTrue((ROOT / 'tools/build_blog.py').exists(), 'blog builder missing')
        return load('build_blog.py')

    def validate_feed(self, path, host, count):
        rss = ET.parse(path).getroot()
        self.assertEqual(rss.tag, 'rss'); self.assertEqual(rss.get('version'), '2.0')
        channel = rss.find('channel')
        for key in ['title', 'link', 'description', 'language', 'lastBuildDate']:
            self.assertTrue(channel.findtext(key), key)
        self.assertEqual(channel.findtext('link'), host + '/blog/')
        self.assertIsNotNone(parsedate_to_datetime(channel.findtext('lastBuildDate')).tzinfo)
        atom = channel.find('{http://www.w3.org/2005/Atom}link')
        self.assertEqual(atom.get('rel'), 'self'); self.assertEqual(atom.get('href'), host + '/blog/feed.xml')
        items = channel.findall('item'); self.assertEqual(len(items), count)
        for item in items:
            for key in ['title', 'link', 'guid', 'pubDate', 'description', '{http://purl.org/dc/elements/1.1/}creator']:
                self.assertTrue(item.findtext(key), key)
            link, guid = item.findtext('link'), item.find('guid')
            self.assertEqual(urlsplit(link).scheme, 'https'); self.assertEqual(urlsplit(link).netloc, urlsplit(host).netloc)
            self.assertEqual(link, guid.text + '?utm_source=rss'); self.assertEqual(guid.get('isPermaLink'), 'true')
            self.assertIsNotNone(parsedate_to_datetime(item.findtext('pubDate')).tzinfo)
            enclosure = item.find('enclosure'); media = item.find('{http://search.yahoo.com/mrss/}content')
            self.assertIn(urlsplit(enclosure.get('url')).scheme, ['https', 'http'])
            self.assertGreaterEqual(int(enclosure.get('length')), 0); self.assertTrue(enclosure.get('type').startswith('image/'))
            self.assertEqual(media.get('url'), enclosure.get('url')); self.assertEqual(media.get('medium'), 'image')
        return items

    def test_mixed_listing_pagination_news_metadata_feed_and_idempotency(self):
        blog = self.builder(); learn = load('build-learn.py'); langs = load('build-langs.py')
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            base = Path(td); (base / 'blog-src').mkdir(); (base / 'learn-src').mkdir()
            (base / 'assets').mkdir(); (base / 'assets/og-image.png').write_bytes(b'image')
            (base / 'assets/custom.png').write_bytes(b'custom-image')
            for i in range(21):
                (base / f'blog-src/post-{i:02}.html').write_text(source(f'published: 2026-10-{i + 1:02}\nauthor: A & B\nauthor_role: Writer\nimage: /assets/custom.png\n'))
            (base / 'learn-src/guide.html').write_text(source('published: 2026-10-22\n').replace('type: news\n', 'layout: article\n'))
            (base / 'learn-src/unpublished.html').write_text(source().replace('type: news\n', 'layout: article\n'))
            (base / 'learn').mkdir()
            (base / 'learn/guide.html').write_text('<meta property="og:image" content="/assets/custom.png">')
            out = base / 'built'
            _, urls = blog.build('en', source_root=base, output=out, learn=learn, chrome=langs.chrome)
            index = (out / 'blog/index.html').read_text(); second = (out / 'blog/page/2/index.html').read_text()
            self.assertLess(index.index('href="/learn/guide.html"'), index.index('href="/blog/post-20.html"'))
            self.assertNotIn('unpublished.html', index)
            self.assertIn('/blog/page/2/', index); self.assertIn('href="/blog/"', second)
            self.assertIn('/blog/page/2/', [u for u, _ in urls]); self.assertIn('/blog/post-00.html', [u for u, _ in urls])
            self.assertNotIn('noindex', index); self.assertIn('22 October 2026', index)
            self.assertIn('src="/assets/custom.png"', index)
            listing_ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', index)[1])
            self.assertEqual(listing_ld['@type'], 'CollectionPage'); self.assertEqual(len(listing_ld['mainEntity']['itemListElement']), 20)
            post = (out / 'blog/post-00.html').read_text()
            self.assertIn('By A &amp; B, Writer', post); self.assertNotIn('hreflang=', re.sub(r'<!--header-->.*?<!--/header-->', '', post, flags=re.S))
            ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', post)[1])
            self.assertEqual(ld['@type'], 'BlogPosting'); self.assertEqual(ld['datePublished'], '2026-10-01')
            self.assertEqual(ld['dateModified'], '2026-10-12'); self.assertEqual(ld['author']['name'], 'A & B')
            self.assertEqual(ld['image'], 'https://beequation.com/assets/custom.png'); self.assertEqual(ld['publisher']['@id'], 'https://beequation.com/#org')
            self.assertIn('BreadcrumbList', post)
            items = self.validate_feed(out / 'blog/feed.xml', 'https://beequation.com', 20)
            self.assertEqual(items[0].findtext('guid'), 'https://beequation.com/learn/guide.html')
            self.assertEqual(items[0].find('enclosure').get('length'), '12')
            self.assertEqual(items[0].findtext('title'), 'News & notes')
            before = {p.relative_to(out): hashlib.sha256(p.read_bytes()).hexdigest() for p in out.rglob('*') if p.is_file()}
            blog.build('en', source_root=base, output=out, learn=learn, chrome=langs.chrome)
            self.assertEqual(before, {p.relative_to(out): hashlib.sha256(p.read_bytes()).hexdigest() for p in out.rglob('*') if p.is_file()})
            for p in (base / 'blog-src').glob('*.html'): p.unlink()
            (base / 'learn-src/guide.html').unlink()
            _, urls = blog.build('en', source_root=base, output=out, learn=learn, chrome=langs.chrome)
            self.assertEqual(urls, []); self.assertFalse((out / 'blog/page/2/index.html').exists()); self.assertFalse((out / 'blog/post-00.html').exists())
            self.assertIn('noindex', (out / 'blog/index.html').read_text())
            self.validate_feed(out / 'blog/feed.xml', 'https://beequation.com', 0)

    def test_localized_posts_alternates_external_image_and_empty_feeds(self):
        blog = self.builder(); learn = load('build-learn.py'); langs = load('build-langs.py')
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            base = Path(td)
            for code in ['fr', 'ja']:
                src = base / 'blog-i18n' / code; src.mkdir(parents=True)
                (src / 'shared.html').write_text(source('published: 2026-10-12\nimage: https://example.com/photo.jpg\n'))
            for code, lang, localized in [('fr', 'fr', '12 octobre 2026'), ('ja', 'ja', '2026年10月12日')]:
                out = base / 'out' / code
                blog.build(code, source_root=base, output=out, learn=learn, chrome=langs.chrome)
                page = (out / 'blog/shared.html').read_text()
                self.assertIn(f'<html lang="{lang}">', page); self.assertIn(localized, page)
                self.assertIn('hreflang="fr" href="https://fr.beequation.com/blog/shared.html"', page)
                self.assertIn('hreflang="ja" href="https://ja.beequation.com/blog/shared.html"', page)
                self.assertNotIn('hreflang="en-GB" href="https://beequation.com/blog/shared.html"', page)
                self.assertNotIn('src="https://example.com', (out / 'blog/index.html').read_text())
                items = self.validate_feed(out / 'blog/feed.xml', f'https://{code}.beequation.com', 1)
                self.assertEqual(items[0].find('enclosure').get('length'), '0')
            for code in [c for c in blog.CODES if (ROOT / 'dist' / c / 'about.html').is_file() or c == 'en']:
                out = base / 'empty' / code
                blog.build(code, source_root=base / 'empty-sources', output=out, learn=learn, chrome=langs.chrome)
                self.validate_feed(out / 'blog/feed.xml', 'https://beequation.com' if code == 'en' else f'https://{code}.beequation.com', 0)

    def test_rss_discovery_replaced_on_rebuild_and_excluded_from_play(self):
        langs = load('build-langs.py')
        src = (ROOT / 'about.html').read_text()
        for code in ['en', 'fr', 'ja']:
            page = langs.chrome(src, code, 'about.html')
            self.assertIn('type="application/rss+xml"', page)
            self.assertEqual(page.count('href="/blog/feed.xml"'), 1)
            self.assertEqual(langs.chrome(page, code, 'about.html'), page)
            self.assertIn('href="/blog/"', page)
            self.assertNotIn('application/rss+xml', langs.chrome(page, code, 'play.html'))

    def test_queue_cli_and_real_builds_add_and_remove_posts_and_catalogues(self):
        self.builder()
        with tempfile.TemporaryDirectory(prefix='bee-blog-cli-', dir='/private/tmp') as td:
            base = Path(td); site = base / 'site'
            shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns('.git', 'dist', '__pycache__', 'node_modules', '.agents', '.codex'))
            q = base / 'queue'
            def run(*args):
                result = subprocess.run([sys.executable, *args], cwd=site, text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stdout[-2000:] + result.stderr[-2000:])
                return result.stdout
            def snapshot():
                return {p.relative_to(site): hashlib.sha256(p.read_bytes()).hexdigest()
                        for p in site.rglob('*') if p.is_file() and p.suffix in {'.html', '.xml', '.txt'}}
            for code in ['en', 'fr', 'ja']:
                (q / code).mkdir(parents=True)
                (q / code / '2026-10-12__blog-test-news.html').write_text(source('author: Test Writer\n'))
                (q / code / '2026-10-12__blog-test-learn.html').write_text(source('published: 2026-10-11\nlayout: article\npath: parents/blog-test-learn.html\n').replace('type: news\n', ''))
            run('tools/publish_queue.py', '--queue', str(q), '--date', '2026-10-12')
            run('tools/build-learn.py')
            for code in ['en', 'fr', 'ja']: self.assertIn('all translated', run('tools/build-langs.py', '--lang', code))
            for code in ['en', 'fr', 'ja']:
                out = site if code == 'en' else site / 'dist' / code
                index = (out / 'blog/index.html').read_text()
                self.assertIn('/blog/blog-test-news.html', index); self.assertIn('/learn/parents/blog-test-learn.html', index)
                sitemap = (out / 'sitemap.xml').read_text()
                self.assertIn('/blog/</loc>', sitemap); self.assertIn('/blog/blog-test-news.html</loc>', sitemap)
                self.validate_feed(out / 'blog/feed.xml', 'https://beequation.com' if code == 'en' else f'https://{code}.beequation.com', 2)
                for page in list(out.glob('*.html')) + list((out / 'learn').rglob('*.html')) + list((out / 'today').rglob('*.html')) + list((out / 'blog').rglob('*.html')):
                    self.assertEqual(page.read_text().count('type="application/rss+xml"'), 0 if page.name == 'play.html' else 1, str(page))
            llms = (site / 'llms.txt').read_text()
            self.assertIn('https://beequation.com/blog/', llms); self.assertIn('https://beequation.com/blog/blog-test-news.html', llms)
            before = snapshot()
            run('tools/build-learn.py')
            for code in ['en', 'fr', 'ja']: run('tools/build-langs.py', '--lang', code)
            self.assertTrue(before == snapshot(), 'repeated full builds must produce identical bytes')
            for code in ['en', 'fr', 'ja']:
                news = site / 'blog-src' if code == 'en' else site / 'blog-i18n' / code
                learn = site / 'learn-src' if code == 'en' else site / 'learn-i18n' / code
                (news / 'blog-test-news.html').unlink(); (learn / 'parents/blog-test-learn.html').unlink()
                if code == 'en': (site / 'learn/parents/blog-test-learn.html').unlink()
            run('tools/build-learn.py')
            for code in ['en', 'fr', 'ja']: run('tools/build-langs.py', '--lang', code)
            for code in ['en', 'fr', 'ja']:
                out = site if code == 'en' else site / 'dist' / code
                self.assertFalse((out / 'blog/blog-test-news.html').exists())
                self.assertNotIn('/blog/', (out / 'sitemap.xml').read_text())
                self.assertIn('noindex', (out / 'blog/index.html').read_text())
                self.validate_feed(out / 'blog/feed.xml', 'https://beequation.com' if code == 'en' else f'https://{code}.beequation.com', 0)
            self.assertNotIn('blog-test-news', (site / 'llms.txt').read_text())


if __name__ == '__main__':
    unittest.main()

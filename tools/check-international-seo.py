#!/usr/bin/env python3
"""Check the built sites. Run build-learn.py then build-langs.py first."""
import json
import re
import unittest
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
LANGS = {'en': 'en-GB', 'fr': 'fr', 'es': 'es', 'de': 'de', 'pt': 'pt-BR',
         'it': 'it', 'nl': 'nl', 'pl': 'pl', 'sv': 'sv', 'da': 'da', 'no': 'nb',
         'fi': 'fi', 'tr': 'tr', 'ja': 'ja', 'ko': 'ko'}
GUIDES = ['mental-maths-strategies.html', 'times-tables-practice.html',
          'daily-maths-puzzle-for-adults.html', 'number-bonds-to-20.html']
def host(code):
    return 'https://beequation.com' if code == 'en' else f'https://{code}.beequation.com'
def root(code):
    return ROOT if code == 'en' else ROOT / 'dist' / code
def pages(code):
    return sorted(root(code).glob('*.html')) + sorted((root(code) / 'learn').rglob('*.html'))
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.links = []; self.meta = {}; self.title = ''; self.in_title = False
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('link', 'a'): self.links.append(a)
        if tag == 'meta': self.meta[a.get('name', a.get('property'))] = a.get('content', '')
        if tag == 'title': self.in_title = True
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title += data

class InternationalSEO(unittest.TestCase):
    def test_reciprocal_guides_and_accessibility(self):
        for rel in ['learn/' + g for g in GUIDES] + ['accessibility.html']:
            expected = {v: host(k) + '/' + rel for k, v in LANGS.items()}
            expected['x-default'] = host('en') + '/' + rel
            for code in LANGS:
                with self.subTest(code=code, page=rel):
                    p = root(code) / rel
                    self.assertTrue(p.is_file(), str(p))
                    links = [a for a in Page(p).links if a.get('rel') == 'alternate' and a.get('hreflang')]
                    self.assertEqual(len(links), 16)
                    self.assertEqual({a['hreflang']: a['href'] for a in links}, expected)
    def test_local_accessibility_and_recovery(self):
        for code in LANGS.keys() - {'en'}:
            for p in pages(code):
                with self.subTest(page=str(p)):
                    self.assertFalse(any(a.get('href', '').startswith(host('en') + '/accessibility.html')
                                         for a in Page(p).links if a.get('rel') != 'alternate' and a.get('data-lang') != 'en'))
            self.assertIn('/play.html', [a.get('href') for a in Page(root(code) / '404.html').links])
    def test_learn_footer_is_localized(self):
        for code in LANGS.keys() - {'en'}:
            expected = re.search(r'<footer[^>]*>.*?</footer>', (root(code) / 'about.html').read_text(), re.S)[0]
            for p in [root(code) / 'teachers.html'] + sorted((root(code) / 'learn').rglob('*.html')):
                with self.subTest(page=str(p)):
                    actual = re.search(r'<footer[^>]*>.*?</footer>', p.read_text(), re.S)[0]
                    self.assertEqual(actual, expected)
                    self.assertIn('Trett Labs Limited', actual)
                    self.assertIn('17310137', actual)
                    self.assertIn('The 1812 Building, Wheatley Park, Mirfield, West Yorkshire, WF14 8HE, United Kingdom', actual)
    def test_metadata_lengths(self):
        for code in LANGS.keys() - {'ja', 'ko'}:
            for p in pages(code):
                with self.subTest(page=str(p)):
                    page = Page(p)
                    self.assertLessEqual(len(page.title), 60, page.title)
                    self.assertLessEqual(len(page.meta.get('description', '')), 160, page.meta.get('description'))
    def test_pdf_sitemaps(self):
        for code in LANGS:
            with self.subTest(code=code):
                tree = ET.parse(root(code) / 'sitemap.xml')
                urls = [e.text for e in tree.findall('.//{*}loc')]
                self.assertEqual(len(urls), len(set(urls)))
                pdfs = list((root(code) / 'assets').rglob('*.pdf'))
                self.assertTrue(pdfs)
                for p in pdfs:
                    self.assertIn(host(code) + '/' + p.relative_to(root(code)).as_posix(), urls)
                self.assertIn(host(code) + '/accessibility.html', urls)
    def test_homepage_website_identity(self):
        for code, language in LANGS.items():
            with self.subTest(code=code):
                objects = []
                for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', (root(code) / 'index.html').read_text(), re.S):
                    data = json.loads(raw)
                    objects.extend(data.get('@graph', [data]) if isinstance(data, dict) else data)
                website = next(x for x in objects if x.get('@type') == 'WebSite')
                self.assertEqual((website['url'], website['@id'], website['inLanguage']),
                                 (host(code) + '/', host(code) + '/#website', language))
                org = next(x for x in objects if x.get('@type') == 'Organization')
                self.assertEqual(org['@id'], 'https://beequation.com/#org')

    def test_india_previews(self):
        """India's sites (dist/in, dist/hi) are previews until live: right language and links on their own pages, and
        not yet linked from any live site."""
        for code, lang, hreflang in [('in', 'en-IN', 'en-IN'), ('hi', 'hi', 'hi-IN')]:
            if not (root(code) / 'index.html').is_file(): continue   # not built (words still being written)
            for rel in ['index.html', 'support.html', 'play.html', 'accessibility.html', 'easy-read/privacy.html']:
                with self.subTest(code=code, page=rel):
                    text = (root(code) / rel).read_text()
                    self.assertIn(f'<html lang="{lang}"', text)
                    self.assertIn(f'<link rel="canonical" href="{host(code)}/' + ('' if rel == 'index.html' else rel) + '">', text)
                    alt = {a['hreflang']: a['href'] for a in Page(root(code) / rel).links if a.get('rel') == 'alternate' and a.get('hreflang')}
                    self.assertEqual(alt[hreflang], host(code) + '/' + ('' if rel == 'index.html' else rel))
                    self.assertEqual(alt['x-default'], host('en') + '/' + ('' if rel == 'index.html' else rel))
            self.assertIn(f'{host(code)}/', (root(code) / 'sitemap.xml').read_text())
            if code == 'in':
                for p in pages(code):
                    with self.subTest(page=str(p)):
                        page = Page(p)
                        self.assertLessEqual(len(page.title), 60, page.title)
                        self.assertLessEqual(len(page.meta.get('description', '')), 160)
        for code in LANGS:
            for p in [root(code) / 'index.html', root(code) / 'support.html', root(code) / 'sitemap.xml']:
                with self.subTest(live=str(p)):
                    text = p.read_text()
                    self.assertNotIn('in.beequation.com', text); self.assertNotIn('hi.beequation.com', text)

if __name__ == '__main__':
    unittest.main(verbosity=2)

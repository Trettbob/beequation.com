"""Share row and Hive certificate: generated-HTML contracts. Never publishes; reads built output where noted."""
import importlib.util
import re
import sys
import unittest
from html import unescape
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
spec = importlib.util.spec_from_file_location('langs_sharing', ROOT / 'tools/build-langs.py')
B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)

ARTICLE = ('<html><head><meta charset="utf-8"><link rel="canonical" href="{host}/learn/topics/fractions.html"></head><body>'
           '<!--header--><!--/header--><main class="wrap"><article class="doc"><h1>Fractions &amp; halves</h1><p>Text</p></article></main>'
           '<!--footer--><!--/footer--></body></html>')


class ShareRowTests(unittest.TestCase):
    def row(self, page):
        return re.search(r'<!--share-->(.*?)<!--/share-->', page, re.S)

    def test_article_row_is_localised_tagged_external_and_idempotent(self):
        for code in B.LANGS:
            with self.subTest(code=code):
                words = B.site_text(code, 'share', B.SHARE_TEXT)
                page = B.chrome(ARTICLE.format(host=B.site(code)), code, 'learn/topics/fractions.html')
                self.assertEqual(page.count('<!--share-->'), 1)
                self.assertEqual(page.count('<!--share-css-->'), 1)
                self.assertEqual(page, B.chrome(page, code, 'learn/topics/fractions.html'))
                row = self.row(page).group(1)
                self.assertLess(page.index('<!--share-->'), page.index('</article>'))
                self.assertIn(f'>{words["heading"]}</h2>', row)
                links = dict(re.findall(r'<a href="([^"]+)" aria-label="([^"]+)"', row))
                self.assertEqual(len(links), 5)
                for href, label in links.items():
                    href = unescape(href)
                    if href.startswith('mailto:'):
                        self.assertNotIn('target=', row[row.index('mailto:'):row.index('</a>', row.index('mailto:'))])
                        continue
                    host = urlsplit(href).netloc
                    self.assertIn(host, {'wa.me', 'www.facebook.com', 'x.com', 'bsky.app'})
                    self.assertIn(B.NEW_TAB_TEXT[code], label)   # the existing external-link rule: new tab, said aloud
                    shared = ' '.join(v for values in parse_qs(urlsplit(href).query).values() for v in values)
                    self.assertIn(f'{B.site(code)}/learn/topics/fractions.html?utm_source=share&utm_medium=', shared)
                self.assertIn('Fractions & halves', unescape(row))
                self.assertIn('data-bq-copy="' + B.site(code) + '/learn/topics/fractions.html?utm_source=share&amp;utm_medium=copy"', row)
                self.assertRegex(row, r'<li hidden><button type="button" data-bq-native=')   # only shown when navigator.share exists
                self.assertNotRegex(row, r'<script[^>]+src=|<iframe|<img')                     # links only, nothing loads from the networks

    def test_every_language_names_its_buttons(self):
        for code in B.LANGS:
            words = B.site_text(code, 'share', B.SHARE_TEXT)
            with self.subTest(code=code):
                self.assertEqual(set(words), set(B.SHARE_TEXT['en']))
                self.assertIn(words['email'].casefold(), words['email_label'].casefold())
                for name, key in (('WhatsApp', 'whatsapp'), ('Facebook', 'facebook'), ('X', 'x'), ('Bluesky', 'bluesky')):
                    self.assertIn(name, words[key])
                if code != 'en': self.assertNotEqual(words['today'], B.SHARE_TEXT['en']['today'])

    def test_only_share_pages_get_a_row(self):
        hub = ARTICLE.replace('<article class="doc">', '<article class="doc hub">')
        self.assertNotIn('<!--share-->', B.chrome(hub.format(host=B.MAIN), 'en', 'learn/topics/index.html'))
        self.assertNotIn('<!--share-->', B.chrome(ARTICLE.format(host=B.MAIN), 'en', 'about.html'))
        self.assertNotIn('<!--share-->', B.chrome(ARTICLE.format(host=B.MAIN), 'en', 'blog/index.html'))
        self.assertIn('<!--share-->', B.chrome(ARTICLE.format(host=B.MAIN), 'en', 'blog/news.html'))

    def test_built_pages(self):
        """Run build-learn.py and build-langs.py first."""
        today = (ROOT / 'today/index.html').read_text()
        self.assertIn('https%3A%2F%2Fbeequation.com%2Ftoday%2F%3Futm_source%3Dshare%26utm_medium%3Dwhatsapp', today)
        for code in B.LANGS:
            base = ROOT if code == 'en' else ROOT / 'dist' / code
            with self.subTest(code=code):
                for page in ['today/index.html', 'teachers.html', 'learn/worksheets/' + next(p.name for p in sorted((base / 'learn/worksheets').glob('*.html')) if p.name != 'index.html')]:
                    self.assertEqual((base / page).read_text().count('class="bq-share"'), 1, page)
                self.assertNotIn('class="bq-share"', (base / 'learn/index.html').read_text())


class CertificateTests(unittest.TestCase):
    def test_built_certificates_are_noindex_private_translated_and_not_in_sitemaps(self):
        """Run build-langs.py first."""
        for code in B.LANGS:
            base = ROOT if code == 'en' else ROOT / 'dist' / code
            with self.subTest(code=code):
                page = (base / 'certificate.html').read_text()
                words = B.site_text(code, 'certificate', B.CERT_TEXT)
                self.assertIn('<meta name="robots" content="noindex">', page)
                self.assertIn(f'<html lang="{B.HTML_LANG[code]}"', page)
                self.assertIn(f'<title>{B.esc(words["title"])}</title>', page)
                self.assertIn(B.esc(words['privacy']), page)
                self.assertNotIn('certificate', (base / 'sitemap.xml').read_text())
                self.assertNotIn('<!--ga-->', page)        # no analytics where a child's name can be typed
                self.assertNotIn('<!--consent-->', page)
                self.assertNotIn('<form', page)
                self.assertRegex(page, r'<label for="cert-name">[^<]+</label>\s*<input id="cert-name"')
                self.assertIn('@media print', page)
                self.assertNotRegex(page, r'localStorage\.setItem\([^)]*cert|fetch\(|sendBeacon|XMLHttpRequest')
                if code != 'en': self.assertNotEqual(words['h1'], B.CERT_TEXT['en']['h1'])

    def test_certificate_reads_numbers_only(self):
        script = B.CERT_JS
        self.assertIn("num('w',6)", script)
        self.assertIn("num('s',999)", script)
        self.assertIn(r'/^(0|[1-9]\d{0,3})$/', script)
        self.assertIn('textContent', script)
        self.assertNotIn('innerHTML', script)


if __name__ == '__main__':
    unittest.main()

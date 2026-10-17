"""Live locale routing and RTL boundaries."""
import importlib.util
from pathlib import Path
import re
import sys
import unittest
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
spec = importlib.util.spec_from_file_location('live_build', ROOT / 'tools/build-langs.py')
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)


class LiveLocales(unittest.TestCase):
    def test_live_routes_are_offered(self):
        for code in ('id', 'vi', 'th', 'uk', 'ar'):
            with self.subTest(code=code):
                self.assertIn(code, B.LANGS)
                self.assertIn(f'hreflang="{code}" href="https://{code}.beequation.com/"', B.alternates('index.html', code))
                self.assertIn(f'{code}.beequation.com', B.alternates('index.html'))
                self.assertIn(f'{code}.beequation.com', ''.join(B.lang_links('en', 'index.html')))
                self.assertIn(code, B.LIVE)
                self.assertIn(code, B._learn().LEARN_LIVE)
                self.assertIn(f'{code}.beequation.com', B.suggestion('support.html'))

    def test_arabic_decorator_is_shared_by_every_page_type(self):
        self.assertTrue(hasattr(B, 'locale_output'), 'Missing language-only output decoration')
        src = '<html lang="en-GB"><head></head><body><p style="text-align:left;margin-left:8px">مرحبا</p><svg class="board"></svg><code>14 + 6 = 20</code></body></html>'
        out = B.locale_output(src, 'ar')
        self.assertIn('<html lang="ar" dir="rtl">', out)
        self.assertIn('text-align:start;margin-inline-start:8px', out)
        self.assertIn('<svg class="board" dir="ltr">', out)
        self.assertIn('<code dir="ltr">', out)
        self.assertEqual(B.locale_output(src, 'en'), src)
        self.assertEqual(B.locale_output(out, 'ar'), out)

    def test_untranslated_blog_shell_needs_no_learn_or_braille_translation(self):
        self.assertIn('ar', B.LANGS)
        with tempfile.TemporaryDirectory() as empty, patch.object(B._learn(), 'I18N', empty):
            S = B._learn().Site('ar')
        self.assertEqual(S.w['html_lang'], 'ar')
        self.assertEqual(S.topics, [])

    def test_arabic_maths_and_calendar_digits(self):
        from a11y_math import spoken_fraction, WORDS
        from build_today import format_date
        from datetime import date
        self.assertIn('ar', WORDS)
        self.assertEqual(spoken_fraction('3', '4', 'ar'), '3 على 4')
        self.assertEqual(format_date(date(2026, 10, 17), {
            'date_format': '{day} {month} {year}', 'months': ['أكتوبر'] * 12,
        }), '17 أكتوبر 2026')

    def test_arabic_dynamic_game_and_certificate_use_western_digits(self):
        self.assertTrue(hasattr(B, 'locale_output'))
        for name in ('play.html', 'certificate.html'):
            out = B.locale_output((ROOT / name).read_text(), 'ar')
            scripts = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', out, re.S))
            self.assertIn("new Intl.DateTimeFormat('ar-u-nu-latn',", scripts)
            if name == 'play.html':
                self.assertIn('<svg class="board" dir="ltr" role="grid"', scripts)

    def test_signed_equations_keep_spoken_operators_inside_ltr_run(self):
        from a11y_math import accessible_math
        expression = accessible_math('−3 × 4 = −12', 'ar')
        src = '<html><head></head><body><p>' + expression + '</p><p>x + 5 = 12</p><svg id="board"></svg></body></html>'
        out = B.locale_output(src, 'ar')
        self.assertIn('<p><bdi dir="ltr">' + expression + '</bdi></p>', out)
        self.assertIn('<svg id="board" dir="ltr">', out)
        self.assertIn('<p><bdi dir="ltr">x + 5 = 12</bdi></p>', out)

    def test_built_arabic_pages_are_rtl(self):
        pages = list((ROOT / 'dist/ar').rglob('*.html'))
        self.assertTrue(pages, 'Live Arabic pages must be built')
        for p in pages:
            with self.subTest(page=p.relative_to(ROOT)):
                self.assertRegex(p.read_text(), r'<html\b[^>]*lang="ar"[^>]*dir="rtl"')


if __name__ == '__main__':
    unittest.main()

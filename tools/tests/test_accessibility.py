"""Behavioural and generated-HTML regression checks; never runs publishing or daily.sh."""
import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

B = load('langs_a11y', 'tools/build-langs.py')
L = B._learn()

class AccessibilityTests(unittest.TestCase):
    maxDiff = 1200

    def test_chrome_adds_localized_dialog_before_paint_and_is_idempotent(self):
        source = '<html><head><meta charset="utf-8"><style>body{font:18px/1.5 sans-serif}h1{font-size:40px}</style></head><body><!--header--><!--/header--><main><h1>Privacy</h1>Text</main><!--footer--><!--/footer--></body></html>'
        for code in B.LANGS:
            with self.subTest(code=code):
                page = B.chrome(source, code, 'privacy.html')
                self.assertIn('id="bq-a11y"', page)
                self.assertEqual(__import__('re').findall(r'<button[^>]*data-bq-a11y-open', page).__len__(), 2)
                self.assertIn('<dialog', page)
                self.assertLess(page.index('<!--a11y-head-->'), page.index('<style>body'))
                self.assertIn('/easy-read/privacy.html', page)
                self.assertEqual(page, B.chrome(page, code, 'privacy.html'))
        self.assertNotIn('bq-a11y', B.chrome(source, 'en', 'play.html'))

    def test_chrome_labels_maths_on_older_learn_pages(self):
        source = '<html><head><meta charset="utf-8"></head><body><!--header--><!--/header--><main><p>½ × 6</p></main><!--footer--><!--/footer--></body></html>'
        result = B.chrome(source, 'en', 'learn/number-bonds-to-20.html')
        self.assertIn('aria-label="1 half"', result)
        self.assertIn('aria-label="times"', result)
        self.assertEqual(result, B.chrome(result, 'en', 'learn/number-bonds-to-20.html'))

    def test_larger_text_scales_fluid_headings_and_preserves_translation_source(self):
        source = '<style>h1{font-size:clamp(38px,6vw,56px)}p{font-size:1.2rem}</style>'
        scaled = B.scalable_text(source)
        self.assertIn('calc(6vw * var(--bq-text-scale,1))', scaled)
        self.assertIn('calc(1.2rem * var(--bq-text-scale,1))', scaled)
        self.assertEqual(scaled, B.scalable_text(scaled))
        self.assertEqual(source, B.strip_markers(scaled))

    def test_turkish_uncommon_denominator_keeps_the_fraction_value(self):
        source = '<span class="fr"><b>3</b><i>12</i></span>'
        self.assertIn('aria-label="üç bölü 12"', L.accessible_math(source, 'tr'))
        blank = '<span class="fr"><b>3</b><i><span class="bx">□</span></i></span>'
        self.assertIn('aria-label="üç bölü boş kutu"', L.accessible_math(blank, 'tr'))

    def test_math_preserves_escaped_text_and_attributes(self):
        source = '<p title="×">&#60;b&#62; &amp; 3 &#215; 4</p>'
        output = L.accessible_math(source, 'en')
        self.assertIn('&#60;b&#62; &amp; 3', output)
        self.assertIn('title="×"', output)
        self.assertIn('aria-label="times"', output)

    def test_easy_read_sitemap_has_language_alternates(self):
        self.assertTrue(hasattr(B, 'easy_sitemap_entry'), 'Easy Read needs sitemap entries')
        for code in B.LANGS:
            entry = B.easy_sitemap_entry('easy-read/privacy.html', code)
            self.assertIn('<loc>' + B.site(code) + '/easy-read/privacy.html</loc>', entry)
            self.assertEqual(entry.count('xhtml:link'), 16)

    def test_math_has_one_spoken_name_in_the_local_language(self):
        sample = '<p><span class="fr"><b>3</b><i>4</i></span> × 2 ÷ 1 − 1</p><svg><text>×</text></svg>'
        self.assertTrue(hasattr(L, 'accessible_math'), 'Learn builder needs spoken maths')
        expected = {'en': '3 quarters', 'fr': '3 quarts', 'de': 'drei Viertel', 'ja': '4分の3'}
        for code in B.LANGS:
            output = L.accessible_math(sample, code)
            self.assertIn('role="math"', output)
            self.assertIn('aria-hidden="true"><b>3</b><i>4</i>', output)
            self.assertEqual(output.count('class="math-op"'), 3)
            self.assertIn('<svg><text>×</text></svg>', output)
            self.assertEqual(output, L.accessible_math(output, code))
            if code in expected:
                self.assertIn('aria-label="' + expected[code] + '"', output)

    def test_easy_read_pages_translate_and_preserve_canonical_and_alternates(self):
        for slug in ('how-to-play', 'privacy', 'terms'):
            path = 'easy-read/' + slug + '.html'
            self.assertIn(path, B.PAGES)
            self.assertTrue((ROOT / path).exists())
            for code in B.LANGS:
                import json
                T = json.loads((ROOT / 'i18n' / (code + '.json')).read_text()) if code != 'en' else {}
                page, missing = B.translate(B.rd(path), code, path, T) if code != 'en' else (B.rd(path), [])
                self.assertEqual(missing, [], (code, path, missing))
                output = B.chrome(B.localise(page, code, path) if code != 'en' else page, code, path)
                self.assertEqual(output.count('hreflang="x-default"'), 1)
                self.assertIn(B.site(code) + '/' + path, output)
                self.assertIn('class="easy-point"', output)

if __name__ == '__main__':
    unittest.main()

"""India's two sites: in (Indian English, in.beequation.com) and hi (Hindi, hi.beequation.com).

They are wired everywhere a language list exists, build into dist/in and dist/hi for previews, and stay out of every
live site (menus, hreflang, suggestion banner, IndexNow) until they are added to LIVE / LEARN_LIVE."""
import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(ROOT / 'tools' / 'braille'))


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


BUILD = load('india_build_langs', 'tools/build-langs.py')
LEARN = BUILD._learn()
PAGE = ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>T</title></head><body>'
        '<!--header--><!--/header--><main><p>Hi</p></main><!--footer--><!--/footer--></body></html>')


class IndiaLocalesTests(unittest.TestCase):
    def test_preview_locales_are_registered_but_not_live(self):
        self.assertEqual(BUILD.LANGS['in'], 'English (India)')
        self.assertEqual(BUILD.LANGS['hi'], 'हिन्दी')
        self.assertEqual(BUILD.HTML_LANG['in'], 'en-IN')
        self.assertEqual(BUILD.HTML_LANG['hi'], 'hi')
        self.assertEqual((BUILD.hreflang('in'), BUILD.hreflang('hi'), BUILD.hreflang('en'), BUILD.hreflang('no')), ('en-IN', 'hi-IN', 'en-GB', 'nb'))
        self.assertEqual((BUILD.site('in'), BUILD.site('hi')), ('https://in.beequation.com', 'https://hi.beequation.com'))
        for code in ('in', 'hi'):
            self.assertNotIn(code, BUILD.LIVE)
            self.assertNotIn(code, LEARN.LEARN_LIVE)

    def test_live_sites_do_not_offer_india_yet(self):
        menu = ''.join(BUILD.lang_links('en', 'index.html'))
        self.assertNotIn('in.beequation.com', menu)
        self.assertNotIn('hi.beequation.com', menu)
        for code in ('en', 'fr'):
            tags = BUILD.alternates('support.html', code)
            self.assertNotIn('en-IN', tags); self.assertNotIn('hi-IN', tags)
        self.assertNotIn('in.beequation.com', BUILD.suggestion('support.html'))
        self.assertNotIn('hreflang="hi-IN"', BUILD.easy_sitemap_entry('easy-read/privacy.html', 'fr'))
        # a preview site lists itself, with its regional hreflang
        self.assertIn('hreflang="hi-IN" href="https://hi.beequation.com/support.html"', BUILD.alternates('support.html', 'hi'))
        self.assertIn('hreflang="en-IN" href="https://in.beequation.com/support.html"', BUILD.alternates('support.html', 'in'))

    def test_suggestion_offers_india_to_en_in_browsers_once_live(self):
        before = set(BUILD.LIVE)
        try:
            BUILD.LIVE.update({'in', 'hi'})
            script = BUILD.suggestion('support.html')
        finally:
            BUILD.LIVE.clear(); BUILD.LIVE.update(before)
        self.assertIn('"in": {"lang": "en-IN", "url": "https://in.beequation.com/support.html"', script)
        self.assertIn('"hi": {"lang": "hi", "url": "https://hi.beequation.com/support.html"', script)
        self.assertIn("if(c==='in')continue;if(c==='en'){if(/^en-IN$/i.test(ls[i])){pick='in';break;}return;}", script)
        self.assertNotIn("if(c==='in')continue", BUILD.suggestion('support.html'))

    def test_devanagari_fonts_only_on_hindi_pages(self):
        hi, fr = BUILD.chrome(PAGE, 'hi', 'about.html'), BUILD.chrome(PAGE, 'fr', 'about.html')
        self.assertIn('<!--deva-fonts-->', hi)
        self.assertNotIn('NotoSansDevanagari', fr)
        self.assertIn("font-family:'Noto Sans Devanagari'", hi)
        self.assertIn("font-family:Fredoka;font-style:normal;font-weight:700;font-display:swap;src:url('/assets/fonts/NotoSansDevanagari-Bold.ttf')", hi)
        self.assertIn('unicode-range:U+0900-097F', hi)
        self.assertEqual(BUILD.strip_markers(hi).count('deva-fonts'), 0)
        for f in ['NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari-Medium.ttf', 'NotoSansDevanagari-SemiBold.ttf', 'NotoSansDevanagari-Bold.ttf']:
            self.assertTrue((ROOT / 'assets/fonts' / f).is_file(), f)

    def test_word_tables_cover_india(self):
        for table in (BUILD.FOOTER_TEXT, BUILD.NEW_TAB_TEXT):
            self.assertIn('in', table); self.assertIn('hi', table)
        self.assertEqual(BUILD.FOOTER_TEXT['in'], BUILD.FOOTER_TEXT['en'])
        a11y_math = load('india_a11y_math', 'tools/a11y_math.py')
        self.assertEqual(a11y_math.spoken_fraction('3', '4', 'in'), '3 quarters')
        self.assertEqual(a11y_math.spoken_fraction('3', '4', 'hi'), '3 बटा 4')
        today = load('india_today', 'tools/build_today.py')
        self.assertEqual(today.LANGUAGE.get('in'), 'en-IN')
        self.assertIn('in', today.CODES); self.assertIn('hi', today.CODES)
        days = json.loads((ROOT / 'tools/publish_days.json').read_text())
        self.assertTrue(set(today.CODES) <= set(days))

    def test_word_files_exist_and_in_is_complete(self):
        for code in ('in', 'hi'):
            for rel in (f'i18n/{code}.json', f'i18n/play/{code}.js', f'i18n/today/{code}.json', f'i18n/blog/{code}.json',
                        f'tools/braille/{code}.json', f'learn-i18n/{code}/site.json', f'learn-i18n/{code}/worksheets.mjs'):
                self.assertTrue((ROOT / rel).is_file(), rel)
        # Indian English is the English text, kept complete by tools/i18n-identity.py, with a few adaptations
        run = subprocess.run([sys.executable, str(ROOT / 'tools/i18n-identity.py'), 'in', '--check'], text=True, capture_output=True)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        data = json.loads((ROOT / 'i18n/in.json').read_text())
        self.assertTrue(any('rupees' in v for v in data.values() if isinstance(v, str)))
        self.assertEqual(data['__site__']['nav'], BUILD.NAV_TEXT['en'])

    def test_learn_sites_use_classes_1_to_5(self):
        english = [t[0] for t in LEARN.TOPICS]
        for code, name, lang, hreflang in (('in', 'Class 3', 'en-IN', 'en-IN'), ('hi', 'कक्षा 3', 'hi', 'hi-IN')):
            S = LEARN.site_of(code)
            self.assertEqual([y[0] for y in S.years], [f'class-{n}' for n in range(1, 6)])
            self.assertEqual(S.years[2][1], name)
            self.assertEqual([t[0] for t in S.topics], english)
            self.assertEqual(dict((t[0], t[2]) for t in S.topics)['money'], '₹')
            self.assertEqual((S.w['html_lang'], S.hreflang), (lang, hreflang))
            self.assertFalse(set(LEARN.WORDS) - set(S.w))
            manifest = ROOT / f'learn-i18n/{code}/worksheets.json'
            if manifest.exists():
                years = {y for sheet in json.loads(manifest.read_text()) for y in sheet['years']}
                self.assertTrue(years <= {y[0] for y in S.years}, years)

    def test_braille_and_indexnow(self):
        common = load('india_braille_common', 'tools/braille/common.py')
        self.assertEqual((common.TABLES['in'], common.TABLES['hi']), ('en-ueb-g1.ctb', 'hi-in-g1.utb'))
        self.assertEqual(common.normalise('₹20 − ₹5', 'hi'), 'रु 20 - रु 5')
        self.assertEqual(common.normalise('₹20', 'in'), 'Rs 20')
        indexnow = load('india_indexnow', 'tools/indexnow.py')
        self.assertNotIn('in', indexnow.CODES); self.assertNotIn('hi', indexnow.CODES)
        self.assertEqual(indexnow.live_codes(), BUILD.LIVE)


if __name__ == '__main__':
    unittest.main()

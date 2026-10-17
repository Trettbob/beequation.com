"""Exercise the five downloadable-asset pipelines without launching Chrome."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile

from generator_fixture import preserve_generator_outputs

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/braille'))
import common

CODES = ('id', 'vi', 'th', 'uk', 'ar')
PUP = '/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core'


class NewLanguageAssets(unittest.TestCase):
    def test_html_only_builds_every_sheet_and_accessible_download(self):
        for code in CODES:
            with self.subTest(code=code), tempfile.TemporaryDirectory() as tmp:
                preserve_generator_outputs(self, ROOT, code)
                run = subprocess.run(['node', 'tools/make-worksheets.mjs', PUP,
                                      '--lang', code, '--html-only'], cwd=ROOT,
                                     env={**os.environ, 'HTML_DIR': tmp}, capture_output=True, text=True)
                self.assertEqual(run.returncode, 0, run.stderr[-4000:])
                source = ROOT / 'learn-i18n' / code
                manifest = json.loads((source / 'worksheets.json').read_text())
                self.assertGreater(len(manifest), 20)
                for sheet in manifest:
                    sid = sheet['id']
                    data = json.loads((source / 'worksheets' / (sid + '.json')).read_text())
                    for variant in ('', '-large', '-easy-read') + (('-tactile',) if data['hasTactile'] else ()):
                        markup = (Path(tmp) / (sid + variant + '.html')).read_text()
                        self.assertNotRegex(markup, r'[٠-٩۰-۹๐-๙]')
                        if code in ('ar', 'th'):
                            self.assertIn('Geeza Pro' if code == 'ar' else 'Thonburi', markup)
                        if code == 'ar':
                            self.assertIn('dir="rtl"', markup)
                            if sid in ('column-subtraction', 'multiplication-grid', 'number-bonds-to-10') or variant == '-tactile':
                                self.assertTrue('dir="ltr"' in markup, f'{sid}{variant}: maths must stay LTR')
                    brf = (source / 'assets/worksheets' / (sid + '.brf')).read_text()
                    uni = (source / 'assets/worksheets' / (sid + '-braille.txt')).read_text()
                    self.assertRegex(brf, r'^[\x20-\x5f\n\f]+$')
                    self.assertRegex(uni, r'^[\u2800-\u283f\n\f]+$')
                    self.assertEqual(len(brf), len(uni))
                with zipfile.ZipFile(source / 'assets' / f'beequation-worksheets-{code}.epub') as z:
                    for name in z.namelist():
                        if name.endswith(('.xml', '.opf', '.xhtml')):
                            doc = ET.fromstring(z.read(name))
                            if code == 'ar' and name.endswith('.xhtml'):
                                self.assertEqual(doc.attrib.get('dir'), 'rtl')
                                if name == 'EPUB/column-subtraction.xhtml':
                                    questions = doc.findall('.//{http://www.w3.org/1999/xhtml}li')
                                    self.assertTrue(questions)
                                    self.assertTrue(all(q.attrib.get('dir') == 'ltr' for q in questions))

    def test_currency_and_bidi_controls_translate_to_six_dot_braille(self):
        for code, plain, expanded in [('vi', '500 ₫', '500 đồng'),
                                       ('uk', '5 ₴', '5 грн'),
                                       ('ar', '\u20665.00\u2069 ﷼', '5.00 ريال')]:
            with self.subTest(code=code):
                self.assertIn(code, common.LANGS)
                translator = common.Translator(code)
                try:
                    self.assertEqual(translator.translate([plain]), translator.translate([expanded]))
                finally:
                    translator.close()


if __name__ == '__main__':
    unittest.main()

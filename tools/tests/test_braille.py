"""Artifact and consumer tests: malformed braille, omitted downloads and broken EPUBs fail."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from unittest.mock import patch
import tempfile
import unittest
from generator_fixture import preserve_generator_outputs
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
LANGS = 'en fr es de pt it nl pl sv da no fi tr ja ko'.split()
NODE = '/Volumes/External SSD/Projects/devtools/node/bin/node'
PUP = '/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core'
PICTURES = {'2d-shapes', 'counting-coins', 'what-fraction-is-shaded', 'perimeter-and-area',
            'reading-bar-charts', 'multiplication-grid', 'time-oclock-and-half-past',
            'time-quarter-past-and-to', 'time-to-5-minutes'}


def source(code):
    return ROOT / ('learn-src' if code == 'en' else f'learn-i18n/{code}')


def assets(code):
    return ROOT / 'assets' if code == 'en' else source(code) / 'assets'


class BrailleTests(unittest.TestCase):
    def test_generators_exist(self):
        for name in ('make-braille.py', 'make-epub.py'):
            self.assertTrue((ROOT / 'tools/braille' / name).is_file(), name)

    def test_text_keeps_fraction_and_describes_all_shape_geometry(self):
        sys.path.insert(0, str(ROOT / 'tools/braille'))
        import common
        self.assertEqual(common.text('<span class="fr"><b>3</b><span>/</span><i>4</i></span>', 'en'), '3/4')
        circle = '<svg aria-label="Shape 7"><circle cx="50" cy="50" r="44"/></svg>'
        rectangle = '<svg aria-label="Shape 3"><rect width="88" height="52"/></svg>'
        self.assertIn('curved', common.text(circle, 'en'))
        self.assertIn('two longer', common.text(rectangle, 'en'))
        col = '<span class="column-expression">345 + 278 = □</span><table class="col"><tr><td>3</td></tr></table>'
        self.assertEqual(common.text(col, 'en'), '345 + 278 = blank')

    def test_every_table_preserves_distinct_maths_operators_and_fraction(self):
        sys.path.insert(0, str(ROOT / 'tools/braille'))
        import common
        for code in LANGS:
            if code == 'ja': continue
            t = common.Translator(code)
            try:
                rows=t.translate(['1 2','1 + 2','1 − 2','1 × 2','1 ÷ 2','1 = 2','34','3/4'])
                compact=lambda s:s.replace('⠀','')
                base=compact(rows[0])
                ops=[compact(row) for row in rows[1:6]]
                self.assertEqual(len(set(ops)),5,code)
                self.assertTrue(all(len(row)>len(base) for row in ops),code)
                self.assertNotEqual(compact(rows[6]),compact(rows[7]),code)
                brf=t.translate(['1 + 2 − 3 × 4 ÷ 5 = 3/4'],'brf')[0]
                self.assertTrue(brf,code)
            finally: t.close()

    def test_real_translation_maths_and_alternate_layout(self):
        sys.path.insert(0, str(ROOT / 'tools/braille'))
        import common
        spec = importlib.util.spec_from_file_location('make_braille', ROOT / 'tools/braille/make-braille.py')
        maker = importlib.util.module_from_spec(spec); spec.loader.exec_module(maker)
        t = common.Translator('en')
        try:
            self.assertEqual(t.translate(['123 + 45 − 6 × 7 ÷ 2 = 3/4'])[0],
                '⠼⠁⠃⠉⠀⠐⠖⠀⠼⠙⠑⠀⠐⠤⠀⠼⠋⠀⠐⠦⠀⠼⠛⠀⠐⠌⠀⠼⠃⠀⠐⠶⠀⠼⠉⠸⠌⠼⠙')
            with tempfile.TemporaryDirectory() as tmp, patch.object(maker, 'assets', return_value=Path(tmp)):
                data = json.loads((source('en') / 'worksheets/multiplication-grid.json').read_text())
                maker.generate(data,'en',t,40,25)
                file = Path(tmp) / 'worksheets/multiplication-grid.brf'
                before = file.read_bytes()
                maker.generate(data,'en',t,40,25)
                self.assertEqual(file.read_bytes(), before)
                for page in before.decode().strip().split('\f'):
                    lines = page.strip('\n').split('\n')
                    self.assertLessEqual(len(lines),25)
                    self.assertTrue(all(len(line)<=40 for line in lines))
        finally: t.close()

    def test_all_braille_files_have_matching_bounded_layout(self):
        for code in LANGS:
            for file in sorted((source(code) / 'worksheets').glob('*.json')):
                base = assets(code) / 'worksheets' / file.stem
                if code == 'ja':
                    self.assertFalse(base.with_suffix('.brf').exists())
                    self.assertFalse(Path(str(base) + '-braille.txt').exists())
                    continue
                brf = base.with_suffix('.brf').read_text()
                uni = Path(str(base) + '-braille.txt').read_text()
                self.assertRegex(brf, r'^[\x20-\x5f\n\f]+$')
                self.assertRegex(uni, r'^[\u2800-\u28ff\n\f]+$')
                self.assertEqual(len(brf), len(uni))
                self.assertEqual([i for i,c in enumerate(brf) if c in '\n\f'],
                                 [i for i,c in enumerate(uni) if c in '\n\f'])
                self.assertGreaterEqual(len(brf.split('\f')), 2)
                for page in brf.rstrip('\n').split('\f'):
                    lines = page.strip('\n').split('\n')
                    self.assertLessEqual(len(lines), 27)
                    self.assertTrue(all(len(line) <= 30 for line in lines))

    def test_downloads_and_braille_pages_in_every_language(self):
        for code in LANGS:
            site = ROOT if code == 'en' else ROOT / 'dist' / code
            page = (site / 'learn/braille.html').read_text()
            self.assertIn(f'/assets/beequation-worksheets-{code}.epub', page)
            self.assertIn('/learn/braille.html</loc>', (site / 'sitemap.xml').read_text())
            self.assertEqual(len(re.findall(r'<link rel="alternate" hreflang="', page)), 16)
            for file in (source(code) / 'worksheets').glob('*.json'):
                web = (site / 'learn/worksheets' / (file.stem + '.html')).read_text()
                for ext in ('.brf', '-braille.txt'):
                    self.assertEqual(f'/assets/worksheets/{file.stem}{ext}' in web, code != 'ja')
                self.assertEqual(f'/assets/worksheets/{file.stem}-tactile.pdf' in web,
                                 file.stem in PICTURES)
                self.assertIn('/learn/braille.html', web)
                self.assertIn('https://creativecommons.org/licenses/by/4.0/', web)
            self.assertIn('/learn/braille.html', (site / 'accessibility.html').read_text())
            if code == 'ja':
                self.assertFalse(list((site / 'assets/worksheets').glob('*.brf')))
                self.assertFalse(list((site / 'assets/worksheets').glob('*-braille.txt')))
            self.assertIn('/learn/braille.html', (site / 'learn/worksheets/index.html').read_text())

    def test_epub_is_valid_xml_with_accessibility_metadata_and_local_references(self):
        for code in LANGS:
            with zipfile.ZipFile(assets(code) / f'beequation-worksheets-{code}.epub') as z:
                self.assertEqual(z.infolist()[0].filename, 'mimetype')
                self.assertEqual(z.infolist()[0].compress_type, zipfile.ZIP_STORED)
                self.assertEqual(z.read('mimetype'), b'application/epub+zip')
                container = ET.fromstring(z.read('META-INF/container.xml'))
                opf_path = next(e.attrib['full-path'] for e in container.iter() if e.tag.endswith('rootfile'))
                opf = ET.fromstring(z.read(opf_path))
                ns = {'opf':'http://www.idpf.org/2007/opf','dc':'http://purl.org/dc/elements/1.1/'}
                self.assertTrue(opf.find('opf:metadata/dc:language', ns).text)
                self.assertIn('CC BY 4.0', opf.find('opf:metadata/dc:rights', ns).text)
                props = {e.attrib.get('property'): e.text for e in opf.findall('opf:metadata/opf:meta', ns)}
                for key in ('accessMode', 'accessibilityFeature', 'accessibilityHazard', 'accessibilitySummary'):
                    self.assertIn('schema:' + key, props)
                self.assertEqual(props['schema:accessibilityHazard'], 'none')
                manifest = opf.findall('opf:manifest/opf:item', ns)
                self.assertEqual(len([x for x in manifest if 'nav' in x.attrib.get('properties','')]), 1)
                sheets = list((source(code) / 'worksheets').glob('*.json'))
                self.assertEqual(len(opf.findall('opf:spine/opf:itemref', ns)), len(sheets))
                ids = {x.attrib['id'] for x in manifest}
                for x in opf.findall('opf:spine/opf:itemref', ns):
                    self.assertIn(x.attrib['idref'], ids)
                for entry in z.namelist():
                    if entry.endswith(('.xml', '.opf', '.xhtml')):
                        doc = ET.fromstring(z.read(entry))
                        for el in doc.iter():
                            href = el.attrib.get('href')
                            if href and not href.startswith(('https:', '#')):
                                target = str(Path(entry).parent / href.split('#')[0])
                                self.assertIn(target, z.namelist())
                for file in sheets:
                    doc = ET.fromstring(z.read(f'EPUB/{file.stem}.xhtml'))
                    self.assertEqual(doc.attrib['{http://www.w3.org/XML/1998/namespace}lang'],
                                     json.loads(file.read_text())['htmlLang'])
                    self.assertTrue(doc.findall('.//{http://www.w3.org/1999/xhtml}ol'))

    def test_coin_tactile_labels_keep_the_currency_unit(self):
        preserve_generator_outputs(self, ROOT)
        with tempfile.TemporaryDirectory() as tmp:
            run = subprocess.run([NODE,str(ROOT/'tools/make-worksheets.mjs'),PUP,
                                  '--html-only','counting-coins'],cwd=ROOT,
                                 env={**os.environ,'HTML_DIR':tmp},capture_output=True,text=True)
            self.assertEqual(run.returncode,0,run.stderr)
            s=(Path(tmp)/'counting-coins-tactile.html').read_text()
            # The first seeded purse contains 2p and 1p, not 2 pounds and 1 pound.
            self.assertTrue('aria-label="⠼⠃⠏"' in s, '2p braille label lost its pence unit')
            self.assertTrue('aria-label="⠼⠁⠏"' in s, '1p braille label lost its pence unit')

    def test_tactile_renders_are_monochrome_and_clocks_have_twelve_ticks(self):
        preserve_generator_outputs(self, ROOT)
        with tempfile.TemporaryDirectory() as tmp:
            run = subprocess.run([NODE, str(ROOT / 'tools/make-worksheets.mjs'), PUP,
                                  '--html-only', 'time-oclock-and-half-past', 'what-fraction-is-shaded',
                                  'number-bonds-to-10', 'multiplication-grid'], cwd=ROOT,
                                 env={**os.environ, 'HTML_DIR':tmp}, capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertFalse((Path(tmp) / 'number-bonds-to-10-tactile.html').exists())
            for sid in ('time-oclock-and-half-past', 'what-fraction-is-shaded', 'multiplication-grid'):
                file = Path(tmp) / f'{sid}-tactile.html'
                self.assertTrue(file.exists(), f'Missing {file.name}')
                s = file.read_text()
                self.assertNotRegex(s, r'#[0-9a-fA-F]{3,8}\b')
                self.assertRegex(s, r'[\u2800-\u28ff]')
                self.assertIn('Print at 100%', s)
                if sid.startswith('time-'):
                    self.assertEqual(s.count('class="tick"'), 12 * 9)
                    self.assertEqual(s.count('class="minute-hand"'), 9)


if __name__ == '__main__':
    unittest.main()

"""Accessible worksheet output: real generated data and built English/French/Japanese pages."""
from html.parser import HTMLParser
import html
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest
from generator_fixture import preserve_generator_outputs

ROOT = Path(__file__).resolve().parents[2]
NODE = '/Volumes/External SSD/Projects/devtools/node/bin/node'
PUP = '/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core'
LANGS = ('en', 'fr', 'es', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'tr', 'ja', 'ko', 'in', 'hi')
LANGS = list(LANGS) + [c for c in ('id', 'vi', 'th', 'uk', 'ar') if (ROOT / f'learn-i18n/{c}/worksheets.mjs').is_file()]
PREVIEW = {'id', 'vi', 'th', 'uk', 'ar'}   # Learn sections are still in progress
CLOCK_SHEETS = ('time-oclock-and-half-past', 'time-quarter-past-and-to', 'time-to-5-minutes')


def vocabulary(code):
    # Read the real vocabulary, including English's defaults, without running a PDF build.
    script = r'''
      import fs from 'node:fs';
      const code = process.argv[1];
      let L;
      if (code === 'en') {
        const src = fs.readFileSync('tools/make-worksheets.mjs', 'utf8');
        const clockAlt = src.match(/clockAlt: ([\s\S]*?),\n  (?:shapeAlt|fractionAlt):/)[1];
        const shapes = src.match(/shapes: (\{[^\n]+\})/)[1];
        L = {clockAlt: eval('(' + clockAlt + ')'), shapes: eval('(' + shapes + ')')};
      } else L = (await import('./learn-i18n/' + code + '/worksheets.mjs')).default;
      console.log(JSON.stringify({shapes: Object.values(L.shapes),
        clocks: [[3,0], [3,15], [12,0], [12,55], [0,30], [15,45]].map(([h,m]) => L.clockAlt(h,m))}));
    '''
    run = subprocess.run([NODE, '--input-type=module', '-e', script, code], cwd=ROOT,
                         capture_output=True, text=True, check=True)
    return json.loads(run.stdout)


class Pictures(HTMLParser):
    def __init__(self):
        super().__init__()
        self.pictures = []

    def handle_starttag(self, tag, attrs):
        if tag == 'svg':
            self.pictures.append(dict(attrs))


def text(markup):
    # Keep the fraction bar in the answer string; concatenating numerator and denominator
    # would test a different number, and could miss an answer exposed as "3/4".
    markup = re.sub(r'</b><i>', '/', markup)
    return html.unescape(re.sub(r'<[^>]+>', '', markup)).strip()


class WorksheetTests(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 1000

    def test_clock_descriptions_use_face_numbers_and_wrap_after_12(self):
        expected = ([12, 3], [3, 3, 4], [12, 12], [11, 12, 1], [6, 12, 1], [9, 3, 4])
        for code in LANGS:
            for label, numbers in zip(vocabulary(code)['clocks'], expected):
                with self.subTest(lang=code, label=label):
                    self.assertEqual([int(n) for n in re.findall(r'\d+', label)], numbers)
        self.assertEqual(vocabulary('en')['clocks'][:2], [
            'Clock: the minute hand points to 12 and the hour hand points to 3',
            'Clock: the minute hand points to 3 and the hour hand is between 3 and 4',
        ])

    def test_question_clock_and_shape_labels_do_not_reveal_answers(self):
        for code in LANGS:
            src = ROOT / ('learn-src' if code == 'en' else f'learn-i18n/{code}')
            site = ROOT if code == 'en' else ROOT / 'dist' / code
            shapes = vocabulary(code)['shapes']
            preserve_generator_outputs(self, ROOT, code)
            with tempfile.TemporaryDirectory() as tmp:
                run = subprocess.run([NODE, str(ROOT / 'tools/make-worksheets.mjs'), PUP,
                                      '--lang', code, '--html-only', *CLOCK_SHEETS, '2d-shapes'],
                                     env={**os.environ, 'HTML_DIR': tmp}, capture_output=True, text=True)
                self.assertEqual(run.returncode, 0, run.stderr)
                for sid in (*CLOCK_SHEETS, '2d-shapes'):
                    data = json.loads((src / 'worksheets' / (sid + '.json')).read_text())
                    versions = [''.join(it['q'] for it in data['items'])]
                    if code not in PREVIEW:
                        web = (site / 'learn/worksheets' / (sid + '.html')).read_text()
                        versions.insert(0, re.search(r'<ol class="worksheet-questions"[^>]*>(.*?)</ol>', web, re.S)[1])
                    for suffix in ('', '-large', '-easy-read'):
                        markup = (Path(tmp) / (sid + suffix + '.html')).read_text()
                        versions.append(markup.split('<section class="page answers">')[0].split('</style>')[-1])
                    for index, markup in enumerate(versions):
                        with self.subTest(lang=code, id=sid, version=index):
                            pics = Pictures(); pics.feed(markup)
                            pictures = [pic for pic in pics.pictures if pic.get('aria-hidden') != 'true']
                            self.assertEqual(len(pictures), len(data['items']))
                            for n, pic in enumerate(pictures, 1):
                                label = pic['aria-label']
                                if sid in CLOCK_SHEETS:
                                    # Covers colon, full-stop and French "3 h 15" digital notation.
                                    self.assertNotRegex(label, r'\d{1,2}\s*[:.h]\s*\d{2}')
                                else:
                                    for shape in shapes:
                                        self.assertNotIn(shape.casefold(), label.casefold())
                                    self.assertEqual(re.findall(r'\d+', label), [str(n)])

    def test_web_question_cards_keep_number_picture_and_text_together(self):
        spec = importlib.util.spec_from_file_location('build_learn', ROOT / 'tools/build-learn.py')
        builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
        for code in LANGS:
            site = builder.site_of(code)
            pages = builder.worksheet_sources(site)
            _, body = pages['worksheets/2d-shapes.html']
            cards = re.findall(r'<li><span class="worksheet-number" aria-hidden="true">(\d+)</span><div class="worksheet-question">(.*?)</div></li>', body, re.S)
            self.assertEqual(len(cards), 9, code)
            self.assertEqual([n for n, _ in cards], [str(n) for n in range(1, 10)])
            for _, question in cards:
                self.assertIn('<svg ', question)
                self.assertIn('class="ansline wide"', question)
            for _, page_body in pages.values():
                self.assertIn('<ol class="worksheet-questions" role="list">', page_body)

    def test_every_sheet_has_accessible_page_downloads_and_metadata(self):
        for code in ('en', 'fr', 'ja'):
            src = ROOT / ('learn-src' if code == 'en' else f'learn-i18n/{code}')
            site = ROOT if code == 'en' else ROOT / 'dist' / code
            for sheet in json.loads((src / 'worksheets.json').read_text()):
                with self.subTest(lang=code, id=sheet['id']):
                    p = site / 'learn/worksheets' / (sheet['id'] + '.html')
                    self.assertTrue(p.exists(), f'Missing accessible worksheet page: {p}')
                    page = p.read_text()
                    # Spoken-maths wrappers retain the exact original visible HTML.
                    def original_visual(markup):
                        return re.sub(r'<span class="(fr|math-op|math-fraction)" role="math" aria-label="[^"]*"><span aria-hidden="true">(.*?)</span></span>',
                                      lambda m: '<span class="fr">' + m[2] + '</span>' if m[1] == 'fr' else m[2], markup, flags=re.S)
                    self.assertIn('<h1>' + html.escape(sheet['title'], quote=True) + '</h1>', original_visual(page))
                    questions = re.search(r'<ol class="worksheet-questions"[^>]*>(.*?)</ol>', page, re.S)
                    self.assertIsNotNone(questions)
                    answers = re.search(r'<details class="worksheet-answers">.*?<ol>(.*?)</ol>.*?</details>', page, re.S)
                    self.assertIsNotNone(answers)
                    data = json.loads((src / 'worksheets' / (sheet['id'] + '.json')).read_text())
                    self.assertEqual(questions.group(1).count('<li>'), len(data['items']))
                    self.assertEqual(answers.group(1).count('<li>'), len(data['items']))
                    for suffix in ('', '-large', '-easy-read'):
                        href = f'/assets/worksheets/{sheet["id"]}{suffix}.pdf'
                        self.assertTrue(f'href="{href}"' in page, f"Missing local download: {href}")
                        if not suffix:
                            self.assertTrue((site / href.lstrip('/')).is_file(), href)
                        # Variants are produced by the owner's Chrome run, not --html-only.
                    ld = [json.loads(s) for s in re.findall(r'<script type="application/ld\+json">(.*?)</script>', page, re.S)]
                    resource = next((x for x in ld if x.get('@type') == 'LearningResource'), None)
                    self.assertIsNotNone(resource)
                    self.assertEqual(resource['name'], sheet['title'])
                    self.assertEqual(resource['learningResourceType'], 'Worksheet')
                    self.assertTrue(resource['isAccessibleForFree'])
                    self.assertEqual(len(resource['encoding']), 3 + (0 if code == 'ja' else 2) + (1 if data.get('hasTactile') else 0))
                    self.assertEqual(resource['license'], 'https://creativecommons.org/licenses/by/4.0/')
                    self.assertEqual(resource['inLanguage'], data['htmlLang'])
                    self.assertNotIn('tableOfContents', resource['accessibilityFeature'])
                    self.assertIn('PDF', page)
                    self.assertTrue(any(x.get('@type') == 'BreadcrumbList' for x in ld))
                    # Accessibility wrappers may change markup; the complete original visual
                    # question and answer (including SVG and fraction bars) must remain intact.
                    for item in data['items']:
                        self.assertIn(item['q'], original_visual(questions.group(1)))
                        self.assertIn(item['a'], original_visual(answers.group(1)))
                        pics = Pictures(); pics.feed(item['q'])
                        for picture in pics.pictures:
                            self.assertEqual(picture.get('role'), 'img')
                            self.assertTrue(picture.get('aria-label'))
                            self.assertNotIn(text(item['a']), picture['aria-label'])
                    pics = Pictures(); pics.feed(questions.group(1))
                    for picture in pics.pictures:
                        self.assertEqual(picture.get('role'), 'img')
                        self.assertTrue(picture.get('aria-label'))
                    if data.get('chart'):
                        shared = Pictures(); shared.feed(data['chart'])
                        self.assertIn(data['chartTable'], page)
                        for picture in shared.pictures:
                            self.assertEqual(picture.get('role'), 'img')
                            self.assertTrue(picture.get('aria-label'))
                            for item in data['items']:
                                self.assertNotIn(text(item['a']), picture['aria-label'])
                    self.assertIn(f'/learn/worksheets/{sheet["id"]}.html</loc>', (site / 'sitemap.xml').read_text())

    def test_print_variants_reuse_questions_and_keep_answers_separate(self):
        preserve_generator_outputs(self, ROOT)
        with tempfile.TemporaryDirectory() as tmp:
            run = subprocess.run([NODE, str(ROOT / 'tools/make-worksheets.mjs'), PUP,
                                  '--html-only', 'what-fraction-is-shaded', 'multiplication-grid'],
                                 env={**os.environ, 'HTML_DIR': tmp}, capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            for sid in ('what-fraction-is-shaded', 'multiplication-grid'):
                data_file = ROOT / 'learn-src/worksheets' / (sid + '.json')
                self.assertTrue(data_file.exists(), 'Missing reusable worksheet question data')
                data = json.loads(data_file.read_text())
                for suffix in ('', '-large', '-easy-read'):
                    file = Path(tmp) / (sid + suffix + '.html')
                    self.assertTrue(file.exists(), f'Missing render: {file}')
                    markup = file.read_text()
                    for item in data['items']:
                        if data['kind'] != 'whole' or suffix != '-large':
                            self.assertIn(item['q'], markup)
                            self.assertIn(item['a'], markup)
                    if data['kind'] == 'whole':
                        self.assertIn('<td>144</td>', markup)
                        self.assertEqual(markup.count('<td>'), 288)
                    if suffix == '-large':
                        self.assertGreater(markup.count('class="page questions"'), 1)
                    question_pages = markup.split('<section class="page answers">')[0].split('</style>')[-1]
                    pics = Pictures(); pics.feed(question_pages)
                    for picture in pics.pictures:
                        if picture.get('aria-hidden') != 'true':
                            self.assertEqual(picture.get('role'), 'img')
                            self.assertTrue(picture.get('aria-label'))


if __name__ == '__main__':
    unittest.main()

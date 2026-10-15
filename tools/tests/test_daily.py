"""Behavior checks for daily puzzles, Learn metadata and queue publication."""
import importlib.util
import json
from pathlib import Path
import re
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import date

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
NODE = '/Volumes/External SSD/Projects/devtools/node/bin/node'


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class DailyTests(unittest.TestCase):
    def test_engine_matches_pro_launch_and_product(self):
        result = subprocess.run([NODE, str(ROOT / 'tools/today_data.mjs'), '2026-11-01', '2026-11-03'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        puzzles = json.loads(result.stdout)
        for day, op, a, b, answer, hive in [('2026-11-01', 'add', 102, 20, 122, 1), ('2026-11-03', 'mul', 7, 9, 63, 3)]:
            p = puzzles[day]
            self.assertEqual(p['op'], op)
            self.assertEqual(sorted(int(p['cells'][i]) for i in p['pair']), sorted([a, b]))
            self.assertEqual(p['cells'][p['answer']], str(answer))
            self.assertEqual(p['hive'], hive)

    def test_today_hides_solution_and_archives_exclude_today(self):
        self.assertTrue((ROOT / 'tools/build_today.py').exists(), 'daily builder missing')
        today = load('build_today', 'build_today.py')
        data = today.puzzle_data(date(2026, 11, 5))
        for code in ['en', 'fr', 'ja']:
            with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
                today.build(code, date(2026, 11, 5), output=Path(td), data=data, decorate=False)
                page = (Path(td) / 'today/index.html').read_text()
                current = re.search(r'<section class="today-puzzle".*?</section>', page, re.S).group()
                self.assertNotRegex(current, r'answer|pair|correct|equation|#FFB020')
                self.assertNotIn('"answer"', page)
                self.assertIn('/play.html?app=pro&amp;daily=1', page)
                archive = (Path(td) / 'today/2026-11/index.html').read_text()
                self.assertIn('datetime="2026-11-04"', archive)
                self.assertNotIn('datetime="2026-11-05"', archive)
                october = (Path(td) / 'today/2026-10/index.html').read_text()
                self.assertIn('datetime="2026-10-19"', october)
                self.assertNotIn('datetime="2026-10-18"', october)
                self.assertIn('#FFB020', archive)

    def test_footer_marker_removal_preserves_source_whitespace(self):
        langs = load('build_langs_test', 'build-langs.py')
        original = '<footer><p>Copyright</p>\n</footer>'
        decorated = original.replace('</footer>', '<!--today-footer--><a href="/today/">Today</a><!--/today-footer--></footer>')
        self.assertEqual(langs.strip_markers(decorated), original)

    def test_learn_byline_and_article_metadata(self):
        learn = load('build_learn_test', 'build-learn.py')
        meta = {'title': 'Test', 'description': 'Test', 'h1': 'Test', 'layout': 'article', 'updated': '2026-10-01', 'author': 'Lee Trett', 'author_role': 'founder', 'reviewer': 'A Reader', 'reviewer_role': 'teacher', 'published': '2026-10-02', 'reviewed': '2026-10-03'}
        output = learn.page('parents/test.html', meta, '<p>Body</p>', ('', '', ''), {})
        self.assertIn('By Lee Trett, founder', output)
        self.assertIn('Reviewed by A Reader, teacher', output)
        article = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', output).group(1))
        self.assertEqual(article['author'], {'@type': 'Person', 'name': 'Lee Trett', 'jobTitle': 'founder'})
        self.assertEqual(article['datePublished'], '2026-10-02')
        self.assertEqual(article['dateModified'], '2026-10-03')
        self.assertIn('/support.html?about=%2Flearn%2Fparents%2Ftest.html', output)
        meta['layout'] = 'hub'
        self.assertNotIn('Report an error', learn.page('index.html', meta, '', ('', '', ''), {}))

    def test_daily_script_stops_on_dirty_tree_and_failed_build(self):
        self.assertTrue((ROOT / 'tools/daily.sh').exists(), 'daily scheduler missing')
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            base = Path(td); site = base / 'site'; (site / 'tools').mkdir(parents=True)
            shutil.copy(ROOT / 'tools/daily.sh', site / 'tools/daily.sh')
            bin = base / 'bin'; bin.mkdir(); log = base / 'log'
            (bin / 'git').write_text('#!/bin/bash\nprintf "%s\\n" "$*" >> "$CALL_LOG"\nif [ "$1" = status ] && [ "$DIRTY" = yes ]; then echo " M unrelated.txt"; fi\n')
            (bin / 'python3').write_text('#!/bin/bash\nprintf "%s\\n" "$*" >> "$CALL_LOG"\nif [[ "$*" == *publish_queue.py* ]] && [ "$FAIL_QUEUE" = yes ]; then exit 7; fi\nif [ "$1" = -c ]; then echo 2026-11-05; fi\n')
            for command in bin.iterdir(): command.chmod(0o755)
            env = {**os.environ, 'PATH': str(bin) + ':' + os.environ['PATH'], 'CALL_LOG': str(log), 'DIRTY': 'yes', 'FAIL_QUEUE': 'no'}
            result = subprocess.run(['bash', str(site / 'tools/daily.sh'), '--date', '2026-11-05'], env=env, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('unrelated.txt', result.stdout + result.stderr)
            self.assertNotIn('publish_queue.py', log.read_text())
            self.assertNotIn('push', log.read_text())
            log.write_text(''); env.update(DIRTY='no', FAIL_QUEUE='yes')
            result = subprocess.run(['bash', str(site / 'tools/daily.sh'), '--date', '2026-11-05'], env=env, text=True, capture_output=True)
            self.assertEqual(result.returncode, 7)
            self.assertNotIn('build-learn.py', log.read_text())
            self.assertNotIn('push', log.read_text())

    def test_initial_router_opens_daily_with_pro_home_beneath(self):
        html = (ROOT / 'play.html').read_text()
        table = re.search(r'/\*T\*/([\s\S]*?)/\*/T\*/', html)
        router = re.search(r'// ---------- router ----------([\s\S]*?)(?=\bconst\s+go\s*=)', html)
        self.assertIsNotNone(table)
        self.assertIsNotNone(router)
        engine = html[html.index('// ---- engine:'):html.index('// ---- end engine ----')]
        helpers = html[html.index('// ---------- helpers ----------'):html.index('// ---------- router ----------')]
        script = '\n'.join([table.group(1), engine, helpers, router.group(1), 'JSON.stringify(stack)'])
        js = ('const vm=require("node:vm"); console.log(vm.runInNewContext(' + json.dumps(script) +
              ', {URLSearchParams, URL, location:{search:process.argv[1]}, '
              'document:{getElementById:()=>({})}, localStorage:{getItem:()=>null}, navigator:{}}));')
        for query, expected in [('?app=pro&daily=1', [{'name':'a_home'}, {'name':'a_game','mode':'mixed','tier':5,'kind':'daily'}]), ('?app=pro', [{'name':'a_home'}]), ('?app=kids&daily=1', [{'name':'k_home'}]), ('', [{'name':'choose'}])]:
            result = subprocess.run([NODE, '-e', js, query], capture_output=True, text=True, check=True)
            self.assertEqual(json.loads(result.stdout), expected)

    def test_queue_validates_batch_and_preserves_invalid_files(self):
        self.assertTrue((ROOT / 'tools/publish_queue.py').exists(), 'queue publisher missing')
        queue = load('publish_queue', 'publish_queue.py')
        with tempfile.TemporaryDirectory(dir='/private/tmp') as td:
            base = Path(td); q = base / 'queue/en'; q.mkdir(parents=True)
            target = base / 'site'; (target / 'learn-src').mkdir(parents=True)
            def put(name, path, body):
                p = q / name
                p.write_text(f'---\ntitle: Test\ndescription: Test\nh1: Test\nlayout: article\nupdated: 2026-10-20\npath: {path}\n---\n{body}\n')
                return p
            good = put('2026-10-20__a.html', 'parents/a.html', '<p><a href="/learn/parents/b.html">B</a></p>')
            other = put('2026-10-20__b.html', 'parents/b.html', '<tip>Good</tip>')
            bad = put('2026-10-20__bad.html', 'parents/bad.html', '<tip>Unclosed')
            self.assertEqual(queue.publish(base / 'queue', date(2026, 10, 20), root=target, dry_run=True), 1)
            self.assertTrue(good.exists()); self.assertFalse((target / 'learn-src/parents/a.html').exists())
            self.assertEqual(queue.publish(base / 'queue', date(2026, 10, 20), root=target), 1)
            self.assertFalse(good.exists()); self.assertFalse(other.exists()); self.assertTrue(bad.exists())
            self.assertIn('published: 2026-10-20', (target / 'learn-src/parents/a.html').read_text())
            collision = put('2026-10-20__collision.html', 'parents/a.html', '<p>Different</p>')
            missing = put('2026-10-20__missing.html', 'parents/missing.html', '<a href="/learn/missing.html">Missing</a>')
            self.assertEqual(queue.publish(base / 'queue', date(2026, 10, 20), root=target), 1)
            self.assertTrue(collision.exists()); self.assertTrue(missing.exists())


if __name__ == '__main__':
    unittest.main()

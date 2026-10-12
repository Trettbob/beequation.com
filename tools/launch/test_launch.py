"""Integration tests: real source fixtures and CLI, no external service or app writes."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
APPS = Path('/Volumes/External SSD/Projects/Beequation/beequation')


def fake_config():
    c = json.loads((ROOT / 'tools/launch/launch.example.json').read_text())
    c['app_store_provider_token'] = '123456'
    for name, appid in [('kids', '1111111111'), ('pro', '2222222222')]:
        a = c['apps'][name]
        a['ios_app_id'] = appid
        a['family_offer_codes'] = {'ios': name.upper() + 'IOS', 'android': name.upper() + 'ANDROID'}
        a['submit']['ios'] = {'appleId': 'launch@example.com', 'ascAppId': appid, 'appleTeamId': 'ABCDE12345'}
    return c


def snapshot(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file()}


class LaunchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='bee-launch-test-', dir='/private/tmp')
        self.base = Path(self.temp.name)
        self.web = self.base / 'web'
        self.web.mkdir()
        for p in ROOT.glob('*.html'):
            shutil.copy2(p, self.web / p.name)
        for d in ['i18n', 'get', 'tools/launch']:
            shutil.copytree(ROOT / d, self.web / d, ignore=shutil.ignore_patterns('__pycache__'))
        self.apps = self.base / 'apps-copy'
        for app in ['kids', 'adult']:
            for rel in ['src/catalog.ts', 'src/purchases.ts', 'eas.json']:
                dest = self.apps / 'apps' / app / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(APPS / 'apps' / app / rel, dest)
        self.config = fake_config()
        self.config_path = self.base / 'config.json'

    def tearDown(self):
        self.temp.cleanup()

    def run_switch(self, *flags):
        self.config_path.write_text(json.dumps(self.config))
        return subprocess.run([sys.executable, str(self.web / 'tools/launch/launch.py'),
                               '--config', str(self.config_path), '--apps-root', str(self.apps), *flags],
                              text=True, capture_output=True)

    # Catches accidental writes in the default dry-run and missing app diffs.
    def test_default_dry_run_is_read_only(self):
        before = snapshot(self.web), snapshot(self.apps)
        r = self.run_switch()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('FAMILY_CODE', r.stdout)
        self.assertIn('1111111111', r.stdout)
        self.assertEqual(before, (snapshot(self.web), snapshot(self.apps)))

    # Catches wrong-app codes/IDs, missing source changes, and repeated rewrites.
    def test_apply_and_idempotency(self):
        r = self.run_switch('--apply')
        self.assertEqual(r.returncode, 0, r.stderr)
        home = (self.web / 'index.html').read_text()
        self.assertNotIn('coming soon', home)
        self.assertNotIn('soon-tag', home)
        self.assertIn('https://apps.apple.com/app/id1111111111', home)
        self.assertIn('https://play.google.com/store/apps/details?id=com.trettlabs.beequation', home)
        self.assertNotIn('coming soon', (self.web / 'teachers.html').read_text())
        for p in (self.web / 'get').rglob('*.html'):
            self.assertIn('"ios": true', p.read_text())
            self.assertIn('123456', p.read_text())
        for p in (self.web / 'i18n').glob('*.json'):
            translations = json.loads(p.read_text())
            self.assertFalse(any('coming soon' in k.lower() for k in translations))
            self.assertIn('App Store', p.read_text())
            self.assertIn('Google Play', p.read_text())
        kids = self.apps / 'apps/kids'
        adult = self.apps / 'apps/adult'
        self.assertIn('PROIOS', (kids / 'src/catalog.ts').read_text())
        self.assertIn('PROANDROID', (kids / 'src/catalog.ts').read_text())
        self.assertIn('KIDSIOS', (adult / 'src/catalog.ts').read_text())
        self.assertIn('2222222222', (kids / 'src/purchases.ts').read_text())
        self.assertIn('1111111111', (adult / 'src/purchases.ts').read_text())
        self.assertEqual(json.loads((kids / 'eas.json').read_text())['submit']['production'], self.config['apps']['kids']['submit'])
        self.assertIn('browser demo', (self.web / 'play.html').read_text())
        before = snapshot(self.web), snapshot(self.apps)
        r = self.run_switch('--apply')
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('No changes', r.stdout)
        self.assertEqual(before, (snapshot(self.web), snapshot(self.apps)))

    # Catches links to a disabled store, including on config changes after launch.
    def test_changed_config_and_partial_launch(self):
        self.assertEqual(self.run_switch('--apply').returncode, 0)
        self.config['stores_live']['ios'] = False
        self.config['apps']['pro']['family_offer_codes']['android'] = 'NEWPRO'
        r = self.run_switch('--apply')
        self.assertEqual(r.returncode, 0, r.stderr)
        for p in [self.web / 'index.html', self.web / 'teachers.html', self.web / 'play.html']:
            self.assertNotIn('https://apps.apple.com/app/id', p.read_text())
            self.assertIn('https://play.google.com/store/apps/details?', p.read_text())
        for p in (self.web / 'i18n').glob('*.json'):
            self.assertNotIn('https://apps.apple.com/app/id', p.read_text())
        self.assertIn('NEWPRO', (self.apps / 'apps/kids/src/catalog.ts').read_text())
        self.assertIn('No changes', self.run_switch('--apply').stdout)

    # Catches malformed config or source drift causing partial application.
    def test_validation_precedes_all_writes(self):
        for bad in ['placeholder', 'bool', 'mismatch', 'source']:
            with self.subTest(bad=bad):
                c = fake_config()
                if bad == 'placeholder': c['apps']['kids']['ios_app_id'] = '[KIDS_APP_ID]'
                if bad == 'bool': c['stores_live']['ios'] = 'false'
                if bad == 'mismatch': c['apps']['pro']['submit']['ios']['ascAppId'] = '9999999999'
                if bad == 'source': (self.apps / 'apps/kids/src/catalog.ts').write_text('unexpected source')
                self.config = c
                before = snapshot(self.web), snapshot(self.apps)
                r = self.run_switch('--apply')
                self.assertNotEqual(r.returncode, 0)
                self.assertEqual(before, (snapshot(self.web), snapshot(self.apps)))


if __name__ == '__main__':
    unittest.main()

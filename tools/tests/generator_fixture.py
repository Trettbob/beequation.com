"""Keep local worksheet-generator tests from changing other tests' source inputs."""
from pathlib import Path


def preserve_generator_outputs(test, root, code='en'):
    root = Path(root)
    source = root / ('learn-src' if code == 'en' else f'learn-i18n/{code}')
    assets = root / 'assets' if code == 'en' else source / 'assets'
    def files():
        return ({source / 'worksheets.json'} | set((source / 'worksheets').glob('*.json')) |
                set((assets / 'worksheets').glob('*.brf')) |
                set((assets / 'worksheets').glob('*-braille.txt')) |
                set(assets.glob('beequation-worksheets-*.epub')))
    before = {p: p.read_bytes() for p in files() if p.exists()}
    def restore():
        for p in files() - before.keys():
            if p.exists(): p.unlink()
        for p, data in before.items():
            if not p.exists() or p.read_bytes() != data: p.write_bytes(data)
    test.addCleanup(restore)

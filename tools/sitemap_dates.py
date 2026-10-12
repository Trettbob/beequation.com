"""Source dates for sitemaps: one Git history/status snapshot per builder process."""
from datetime import datetime
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]


def london_today():
    return datetime.now(ZoneInfo('Europe/London')).date()


class GitDates:
    def __init__(self, root=ROOT, *, today=None):
        self.root = Path(root)
        self.today = (today or london_today()).isoformat()
        self.dates, self.dirty = {}, set()
        # Copied test/preview trees without Git use the uncommitted-source rule.
        if not (self.root / '.git').exists():
            return
        history = subprocess.run(['git', 'log', '--name-only', '--format=%x1e%cs'],
                                 cwd=self.root, text=True, capture_output=True, check=True).stdout
        for commit in history.split('\x1e')[1:]:
            lines = commit.splitlines()
            for name in lines[1:]:
                if name:
                    self.dates.setdefault(name, lines[0])
        status = subprocess.run(['git', 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
                                cwd=self.root, text=True, capture_output=True, check=True).stdout
        records = iter(status.split('\0'))
        for record in records:
            if not record: continue
            self.dirty.add(record[3:])
            if 'R' in record[:2] or 'C' in record[:2]:
                self.dirty.add(next(records))

    def files(self, sources):
        names = [Path(p).relative_to(self.root).as_posix() if Path(p).is_absolute()
                 else Path(p).as_posix() for p in sources]
        return max((self.today if p in self.dirty else self.dates.get(p, self.today)
                    for p in names), default=self.today)

    def root_page(self, page, code='en'):
        sources = [page]
        if code != 'en': sources.append(f'i18n/{code}.json')
        return self.files(sources)

    def learn_page(self, rel, code='en'):
        base = 'learn-src' if code == 'en' else f'learn-i18n/{code}'
        source = f'{base}/{rel}'
        sources = [source] if (self.root / source).exists() else []
        worksheet = f'{base}/{rel.removesuffix(".html")}.json'
        if rel.startswith('worksheets/') and (self.root / worksheet).exists():
            sources.append(worksheet)
        # Four legacy English articles are maintained directly in learn/.
        return self.files(sources or [f'learn/{rel}' if code == 'en' else source])

    def url(self, url, code='en'):
        path = unquote(urlsplit(url).path).lstrip('/')
        if path.endswith('/') or not path: path += 'index.html'
        if path.startswith('learn/'):
            return self.learn_page(path[6:], code)
        if path == 'teachers.html' and code != 'en' and (self.root / f'learn-i18n/{code}/pack.html').exists():
            return self.learn_page('pack.html', code)
        if path.startswith('assets/'):
            source = f'learn-i18n/{code}/{path}'
            return self.files([source if code != 'en' and (self.root / source).exists() else path])
        return self.root_page(path, code)


_CACHES = {}


def git_dates(root=ROOT):
    root = Path(root).resolve()
    if root not in _CACHES: _CACHES[root] = GitDates(root)
    return _CACHES[root]


def refresh_sitemap(file, code='en', *, root=ROOT):
    """Keep XML formatting/hreflang; date every static entry from its source."""
    file = Path(file)
    cache = git_dates(root)
    text = file.read_text(encoding='utf-8')
    def entry(match):
        value = match[0]
        url = re.search(r'<loc>(.*?)</loc>', value)[1]
        # Today and Blog builders supply their content dates, not Git dates.
        if urlsplit(url).path.startswith(('/today/', '/blog/')):
            return value
        value = re.sub(r'<lastmod>.*?</lastmod>', '', value)
        return value.replace('</loc>', f'</loc><lastmod>{cache.url(url, code)}</lastmod>', 1)
    text = re.sub(r'<url>.*?</url>', entry, text, flags=re.S)
    def index_entry(match):
        value = match[0]
        url = re.search(r'<loc>(.*?)</loc>', value)[1]
        child = file.parent / urlsplit(url).path.lstrip('/')
        if child.resolve() == file.resolve(): raise ValueError('sitemap index references itself')
        refresh_sitemap(child, code, root=root)
        dates = re.findall(r'<lastmod>(.*?)</lastmod>', child.read_text(encoding='utf-8'))
        modified = max(dates) if dates else cache.files([child])
        value = re.sub(r'<lastmod>.*?</lastmod>', '', value)
        return value.replace('</loc>', f'</loc><lastmod>{modified}</lastmod>', 1)
    text = re.sub(r'<sitemap>.*?</sitemap>', index_entry, text, flags=re.S)
    file.write_text(text, encoding='utf-8')

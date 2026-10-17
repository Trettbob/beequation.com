#!/usr/bin/env python3
"""Build each site's blog and RSS locally; called by build-langs.py.

News fragments live in blog-src/ or blog-i18n/<code>/; dated Learn sources
also appear in the index/feed, keeping their existing /learn/ URLs.
"""
from datetime import date, datetime, time, timezone
from email.utils import format_datetime
import html
from html.parser import HTMLParser
import json
import mimetypes
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
BLOG_START = '2026-10-12'   # when the blog went live: the empty feed's lastBuildDate

from build_today import CODES, ROOT, format_date, words as today_words
from publish_queue import parse
from locale_output import locale_output

MAIN = 'https://beequation.com'
GENERATED = '<!--blog-built-->'
PAGE_SIZE = 20
CSS = '''
.blog-list{list-style:none!important;padding:0!important;margin:24px 0!important}
.blog-entry{display:grid;grid-template-columns:104px minmax(0,1fr);gap:18px;padding:20px 0;border-bottom:1px solid var(--line)}
.blog-entry img{width:104px;height:78px;object-fit:cover;border-radius:12px;background:var(--card)}
.blog-entry h2{font-size:21px;margin:0 0 5px}.blog-entry h2 a{color:var(--ink)}
.blog-entry time{font-size:14px;color:var(--mute)}
.blog-entry p{margin:6px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.blog-pages{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;margin:24px 0}
@media(max-width:480px){.blog-entry{grid-template-columns:72px minmax(0,1fr);gap:12px}.blog-entry img{width:72px;height:60px}}
'''


def words(code):
    # Month names are shared with /today/ and Learn's bylines.
    return {**today_words(code), **json.loads((ROOT / 'i18n/blog' / f'{code}.json').read_text(encoding='utf-8'))}


def source_dir(root, tree, code):
    return root / f'{tree}-src' if code == 'en' else root / f'{tree}-i18n' / code


def host(code):
    return MAIN if code == 'en' else f'https://{code}.beequation.com'


def image_url(image, code):
    return host(code) + image if image.startswith('/') else image


class OGImage(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.image = None; self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('property') == 'og:image' and not self.image:
            self.image = attrs.get('content')


def posts(root, code, learn, output):
    entries, news = [], []
    for tree in ['learn', 'blog']:
        src = source_dir(root, tree, code)
        for file in sorted(src.rglob('*.html')):
            text = file.read_text(encoding='utf-8')
            meta, body = parse(text)[:2] if tree == 'blog' else learn.front(text)
            if tree == 'learn' and not meta.get('published'): continue
            rel = file.relative_to(src).as_posix()
            if tree == 'blog':
                if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*\.html', rel) or file.stem in {'index', 'feed', 'page'}:
                    raise ValueError(f'invalid or reserved news slug: {file}')
                if meta.get('type') != 'news': raise ValueError(f'news source needs type: news: {file}')
                url = '/blog/' + rel
            else:
                url = learn.url_of(rel)
            published = meta.get('published') or meta['updated']
            date.fromisoformat(published)
            image = meta.get('image') or '/assets/og-image.png'
            if tree == 'learn':
                native = root if code == 'en' else root / 'dist' / code
                page = output / url.lstrip('/')
                if url.endswith('/'): page /= 'index.html'
                if not page.exists(): page = native / page.relative_to(output)
                if page.exists(): image = OGImage(page.read_text(encoding='utf-8')).image or image
            entry = {'meta': meta, 'body': body, 'url': url, 'rel': rel,
                     'published': published, 'modified': meta.get('reviewed') or meta.get('updated') or published,
                     'image': image_url(image, code), 'news': tree == 'blog'}
            entries.append(entry)
            if tree == 'blog': news.append(entry)
    entries.sort(key=lambda p: (p['published'], p['url']), reverse=True)
    return entries, news


def news_alternates(root, rel, learn):
    have = [c for c in CODES if (source_dir(root, 'blog', c) / rel).is_file()]
    if len(have) < 2: return ''
    tags = [f'<link rel="alternate" hreflang="{learn.site_of(c).hreflang}" href="{host(c)}/blog/{rel}">' for c in have]
    default = 'en' if 'en' in have else have[0]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{host(default)}/blog/{rel}">')
    return '\n'.join(tags)


def structured(data):
    # A title containing </script> must stay inside its JSON string.
    text = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    return f'<script type="application/ld+json">{text}</script>'


def template(code, url, title, description, content, ld, learn, *, image=None, alternates='', empty=False, article=False):
    S = learn.site_of(code); css, nav, foot = learn.base_parts(code)
    esc = html.escape; absolute = host(code) + url
    image = image or host(code) + '/assets/og-image.png'
    return locale_output(f'''<!doctype html>
{GENERATED}
<html lang="{S.w['html_lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title if 'Beequation' in title else title + ' | Beequation')}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{absolute}">
{alternates}
{'<meta name="robots" content="noindex,follow">' if empty else ''}
<meta property="og:type" content="{'article' if article else 'website'}">
<meta property="og:site_name" content="Beequation">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{absolute}">
<meta property="og:image" content="{esc(image)}">
<meta name="twitter:card" content="summary_large_image">
{''.join(structured(x) for x in ld)}
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#12161F">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>{css}{learn.LEARN_CSS}{CSS}</style>
</head>
<body>
{nav}
<main class="wrap"><article class="doc">{content}</article></main>
{foot}
{learn.NAV_JS}
</body></html>
''', code)


def news_page(post, code, root, learn, w):
    meta = post['meta']; S = learn.site_of(code); url = host(code) + post['url']
    author = ({'@type': 'Person', 'name': meta['author'],
               **({'jobTitle': meta['author_role']} if meta.get('author_role') else {})}
              if meta.get('author') else {'@type': 'Organization', 'name': 'Beequation', 'url': MAIN + '/'})
    trail = [(S.w['home'], '/'), (w['heading'], '/blog/'), (meta['h1'], post['url'])]
    ld = [{'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': meta['h1'],
           'description': meta['description'], 'url': url, 'mainEntityOfPage': url,
           'datePublished': post['published'], 'dateModified': post['modified'],
           'author': author, 'image': post['image'], 'publisher': {'@id': MAIN + '/#org'},
           'inLanguage': S.w['html_lang']},
          {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
              {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': host(code) + p}
              for i, (n, p) in enumerate(trail)]}]
    meta = {**meta, 'published': post['published']}
    body = learn.shortcodes(post['body'], [], S)
    content = (f'<p class="crumbs"><a href="/blog/">{html.escape(w["heading"])}</a> › {html.escape(meta["h1"])}</p>'
               f'<h1>{html.escape(meta["h1"])}</h1>{learn.byline(meta, S)}{body}')
    return template(code, post['url'], meta['title'], meta['description'], content, ld, learn,
                    image=post['image'], alternates=news_alternates(root, post['rel'], learn), article=True)


def index_url(n):
    return '/blog/' if n == 1 else f'/blog/page/{n}/'


def index_page(entries, code, n, total, learn, w):
    esc = html.escape; listed = entries[(n - 1) * PAGE_SIZE:n * PAGE_SIZE]
    title = w['heading'] if n == 1 else w['heading'] + ' · ' + w['page'].format(n=n)
    content = f'<h1>{esc(title)}</h1>'
    if not entries:
        content += f'<p>{esc(w["coming_soon"])}</p>'
    else:
        content += '<ul class="blog-list">'
        for p in listed:
            # External OG images remain metadata/feed references. Never introduce
            # a third-party browser request through a listing thumbnail.
            image = p['image'] if urlsplit(p['image']).netloc in {urlsplit(host(c)).netloc for c in CODES} else host(code) + '/assets/og-image.png'
            if image.startswith(host(code) + '/'): image = image[len(host(code)):]   # same site: a local path
            content += (f'<li class="blog-entry"><img src="{esc(image)}" width="104" height="78" alt="" loading="lazy">'
                        f'<div><h2><a href="{p["url"]}">{esc(p["meta"]["title"])}</a></h2>'
                        f'<time datetime="{p["published"]}">{esc(format_date(date.fromisoformat(p["published"]), w))}</time>'
                        f'<p>{esc(p["meta"]["description"])}</p></div></li>')
        content += '</ul>'
        if total > 1:
            content += f'<nav class="blog-pages" aria-label="{esc(w["heading"])}">'
            if n > 1: content += f'<a rel="prev" href="{index_url(n - 1)}">{esc(w["newer"])}</a>'
            content += f'<span>{esc(w["page"].format(n=n))}</span>'
            if n < total: content += f'<a rel="next" href="{index_url(n + 1)}">{esc(w["older"])}</a>'
            content += '</nav>'
    ld = [{'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': title,
           'description': w['feed_description'], 'url': host(code) + index_url(n),
           'inLanguage': learn.site_of(code).w['html_lang'],
           'mainEntity': {'@type': 'ItemList', 'itemListElement': [
               {'@type': 'ListItem', 'position': (n - 1) * PAGE_SIZE + i + 1,
                'name': p['meta']['title'], 'url': host(code) + p['url']} for i, p in enumerate(listed)]}}]
    return template(code, index_url(n), title, w['feed_description'], content, ld, learn, empty=not entries)


def rfc822(day):
    return format_datetime(datetime.combine(date.fromisoformat(day), time(), timezone.utc))


def image_info(url, code, root, output):
    parsed = urlsplit(url); path = unquote(parsed.path).lstrip('/')
    own = next((c for c in CODES if parsed.netloc == urlsplit(host(c)).netloc), None)
    size = 0
    if own is not None:
        native = root if own == 'en' else root / 'dist' / own
        locations = ([output] if own == code else []) + [native]
        if path.startswith('assets/'):
            if own != 'en': locations.append(root / 'learn-i18n' / own)
            locations.append(root)
        for base in locations:
            file = base / path
            if file.resolve().is_relative_to(base.resolve()) and file.is_file():
                size = file.stat().st_size; break
    mime = mimetypes.guess_type(parsed.path)[0] or 'image/png'
    return str(size), mime


def feed(entries, code, root, output, w, learn):
    rss = ET.Element('rss', {'version': '2.0', 'xmlns:atom': 'http://www.w3.org/2005/Atom',
                            'xmlns:dc': 'http://purl.org/dc/elements/1.1/', 'xmlns:media': 'http://search.yahoo.com/mrss/'})
    channel = ET.SubElement(rss, 'channel')
    def field(parent, tag, value): ET.SubElement(parent, tag).text = value
    for tag, value in [('title', w['feed_title']), ('link', host(code) + '/blog/'),
                       ('description', w['feed_description']), ('language', learn.site_of(code).w['html_lang']),
                       ('lastBuildDate', rfc822(max([p[k] for p in entries for k in ['published', 'modified']], default=BLOG_START)))]:
        field(channel, tag, value)
    ET.SubElement(channel, 'atom:link', {'href': host(code) + '/blog/feed.xml', 'rel': 'self', 'type': 'application/rss+xml'})
    for p in entries[:PAGE_SIZE]:
        item = ET.SubElement(channel, 'item'); url = host(code) + p['url']
        for tag, value in [('title', p['meta']['title']), ('link', url + '?utm_source=rss'),
                           ('pubDate', rfc822(p['published'])), ('description', p['meta']['description']),
                           ('dc:creator', p['meta'].get('author') or 'Beequation')]:
            field(item, tag, value)
        ET.SubElement(item, 'guid', {'isPermaLink': 'true'}).text = url
        size, mime = image_info(p['image'], code, root, output)
        ET.SubElement(item, 'enclosure', {'url': p['image'], 'length': size, 'type': mime})
        ET.SubElement(item, 'media:content', {'url': p['image'], 'medium': 'image'})
    ET.indent(rss)
    return ET.tostring(rss, encoding='utf-8', xml_declaration=True).decode('utf-8') + '\n'


def build(code='en', *, source_root=ROOT, output=None, learn=None, chrome=None):
    if learn is None or chrome is None:
        import importlib.util
        spec = importlib.util.spec_from_file_location('blog_chrome', ROOT / 'tools/build-langs.py')
        langs = importlib.util.module_from_spec(spec); spec.loader.exec_module(langs)
        learn = learn or langs._learn(); chrome = chrome or langs.chrome
    root = Path(source_root); output = Path(output) if output is not None else root if code == 'en' else root / 'dist' / code
    w = words(code); entries, news = posts(root, code, learn, output)
    pages = {p['url'].lstrip('/'): news_page(p, code, root, learn, w) for p in news}
    total = max(1, (len(entries) + PAGE_SIZE - 1) // PAGE_SIZE)
    for n in range(1, total + 1):
        pages[index_url(n).lstrip('/') + 'index.html'] = index_page(entries, code, n, total, learn, w)
    for file in (output / 'blog').rglob('*.html'):
        if file.relative_to(output).as_posix() not in pages and GENERATED in file.read_text(encoding='utf-8'):
            file.unlink()
    for rel, text in pages.items():
        file = output / rel; file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(chrome(text, code, rel), encoding='utf-8')
    (output / 'blog/feed.xml').write_text(feed(entries, code, root, output, w, learn), encoding='utf-8')
    urls = [(p['url'], p['modified']) for p in news]
    if entries:
        modified = max(p['published'] for p in entries)
        urls += [(index_url(n), modified) for n in range(1, total + 1)]
    return list(pages), urls


def english_catalog(root=ROOT):
    """Replace only blog sitemap entries and the generated Blog llms section."""
    root = Path(root)
    import importlib.util
    spec = importlib.util.spec_from_file_location('blog_catalog_learn', ROOT / 'tools/build-learn.py')
    learn = importlib.util.module_from_spec(spec); spec.loader.exec_module(learn)
    entries, news = posts(root, 'en', learn, root)
    sitemap = root / 'sitemap.xml'
    if sitemap.exists():
        text = re.sub(r'  <url><loc>https://beequation\.com/blog/[^<]*</loc>.*?</url>\n', '', sitemap.read_text(encoding='utf-8'))
        urls = [(p['url'], p['modified']) for p in news]
        if entries:
            urls += [(index_url(n), max(p['published'] for p in entries))
                     for n in range(1, (len(entries) + PAGE_SIZE - 1) // PAGE_SIZE + 1)]
        add = ''.join(f'  <url><loc>{MAIN}{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in sorted(urls))
        sitemap.write_text(text.replace('</urlset>', add + '</urlset>'), encoding='utf-8')
    llms = root / 'llms.txt'
    if llms.exists():
        text = llms.read_text(encoding='utf-8').split('\n## Blog\n')[0].rstrip('\n')
        w = words('en')
        text += f'\n\n## Blog\n\n- [{w["heading"]}]({MAIN}/blog/): {w["feed_description"]}\n'
        text += ''.join(f'- [{p["meta"]["title"]}]({MAIN}{p["url"]}): {p["meta"]["description"]}\n' for p in news)
        llms.write_text(text, encoding='utf-8')

# Finds the translatable pieces of an English page: the title, meta/alt/aria text, the inner HTML of text blocks,
# text-only links, and the homepage demo's JavaScript strings. Shared by extract and build.
import re, html

PAGES = ['index.html', 'how-to-play.html', 'about.html', 'support.html', 'privacy.html', 'terms.html', '404.html']
BLOCK = re.compile(r'<(p|li|h1|h2|h3|figcaption|summary|button|dt|dd)(\s[^>]*)?>(.*?)</\1>', re.S)
SPAN = re.compile(r'<(span|b) (class="(?:soon|soon-tag)"|id="(?:try-h|count)")>(.*?)</\1>', re.S)
LINK = re.compile(r'<a ([^>]*)>([^<>]+)</a>')
ATTR = re.compile(r'\b(content|alt|aria-label)="([^"]+)"')
TITLE = re.compile(r'<title>(.*?)</title>', re.S)
JS = ['Puzzle ${i + 1} of ${P.length}', "add up' : 'multiply", 'Tap the number two others ${', ' to.`', "'Next puzzle'", "'Play the full game'", "'Not that one. Try again.'"]
SKIP_ATTR = re.compile(r'^(width=|initial-scale|#|summary_large_image|website|article|Beequation$|https?:|light dark|noindex|\d)')

def norm(s): return re.sub(r'\s+', ' ', s).strip()

def segments(src):
    for m in ('lang-menu', 'hreflang', 'lang-redirect', 'lang-remember', 'bee'):
        src = re.sub(rf'\n?<!--{m}-->.*?<!--/{m}-->', '', src, flags=re.S)
    head, body = src.split('</head>', 1)
    out = []
    for m in TITLE.finditer(head): out.append(norm(m.group(1)))
    for m in ATTR.finditer(src):
        v = m.group(2)
        if not SKIP_ATTR.search(v) and not re.fullmatch(r'[\d,./ −-]+', v): out.append(norm(html.unescape(v)) if False else norm(v))
    body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<svg.*?</svg>', '', body, flags=re.S)
    for m in BLOCK.finditer(body):
        t = norm(m.group(3))
        if t and re.search('[A-Za-z]', re.sub(r'<[^>]+>', '', t)): out.append(t)
    for m in SPAN.finditer(body): out.append(norm(m.group(3)))
    for m in LINK.finditer(body):
        t = norm(m.group(2))
        if re.search('[A-Za-z]', t) and not t.startswith('@') and t not in ('Beequation', 'Instagram', 'TikTok', 'YouTube', 'X', 'Facebook'): out.append(t)
    seen, uniq = set(), []
    for t in out:
        if t not in seen: seen.add(t); uniq.append(t)
    return uniq

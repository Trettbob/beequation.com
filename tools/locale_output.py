"""Language-only presentation. English source/output bytes pass through unchanged.

Physical CSS in source pages stays stable; Arabic output uses logical properties.
SVG coordinates, animation physics and board keyboard navigation stay physical/LTR.
"""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML_LANG = {'en': 'en-GB', 'no': 'nb', 'pt': 'pt-BR', 'in': 'en-IN'}


def logical_css(css):
    # Only declaration names, never selectors, URLs, JavaScript or SVG geometry.
    names = {'left': 'inset-inline-start', 'right': 'inset-inline-end'}
    for side, logical in [('left', 'start'), ('right', 'end')]:
        for prefix in ('margin', 'padding', 'border'):
            names[f'{prefix}-{side}'] = f'{prefix}-inline-{logical}'
        for suffix in ('width', 'style', 'color'):
            names[f'border-{side}-{suffix}'] = f'border-inline-{logical}-{suffix}'
    def declaration(m):
        prop, value = m[2], m[3]
        # Centered overlays pair this physical anchor with translateX(-50%).
        if prop in ('left', 'right') and value.strip() == '50%':
            return m[0]
        if prop == 'text-align':
            value = re.sub(r'\bleft\b', 'start', value)
            value = re.sub(r'\bright\b', 'end', value)
        # Four-value shorthand needs logical sides too (pill, tabs, bubbles).
        if prop in ('padding', 'margin', 'border-radius'):
            important = '!important' if '!important' in value else ''
            parts = re.findall(r'(?:[^\s()]+|\([^()]*\))+', value.replace('!important', '').strip())
            if len(parts) == 4 and '/' not in value:
                a, b, c, d = parts
                if prop == 'border-radius':
                    props = ('border-start-start-radius', 'border-start-end-radius', 'border-end-end-radius', 'border-end-start-radius')
                    return m[1] + ';'.join(f'{p}:{v}{important}' for p, v in zip(props, (a, b, c, d)))
                return f'{m[1]}{prop}-block:{a} {c}{important};{prop}-inline:{d} {b}{important}'
        return m[1] + names.get(prop, prop) + ':' + value
    return re.sub(r'(^|[;{]\s*)([a-z-]+)\s*:([^;{}]+)', declaration, css)


LTR_CLASSES = {'board', 'puzzle-board', 'eqline', 'math', 'math-fraction', 'math-symbol',
               'fr', 'big-num', 'k-clock', 'hex-grid', 'honeycomb', 'equation'}


class IsolateMath(HTMLParser):
    """Keep numbers/equations in text nodes together; never touch scripts or labels."""
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.out, self.stack = [], []

    def handle_starttag(self, tag, attrs):
        raw, a = self.get_starttag_text(), dict(attrs)
        isolate = (tag in ('code', 'pre', 'math') or a.get('id') == 'board'
                   or bool(set(a.get('class', '').split()) & LTR_CLASSES))
        if isolate and 'dir' not in a:
            raw = raw[:-1] + ' dir="ltr">'
        self.out.append(raw)
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append((tag, isolate or a.get('dir') == 'ltr'))

    def handle_endtag(self, tag):
        self.out.append(f'</{tag}>')
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_startendtag(self, tag, attrs):
        self.out.append(self.get_starttag_text())

    def handle_data(self, data):
        if not any(t in ('script', 'style', 'svg', 'bdi', 'textarea', 'title', 'option') or isolated for t, isolated in self.stack):
            op = r'(?:[+×÷=−–-]|\ue000[0-9]+\ue001)'
            number = r'(?:[+−-]|\ue000[0-9]+\ue001)?[0-9]+(?:[.,:/][0-9]+)*%?'
            atom = r'(?:' + number + r'[A-Za-z]?|\b[A-Za-z]\b)'
            expression = atom + r'(?:\s*' + op + r'\s*' + atom + r')+'
            # Only equations and signed numbers need isolating: plain numbers (35, 2.5, 3/4) already read left to
            # right inside Arabic text, and wrapping them would split flex list items into separate columns.
            signed = r'(?:[+−-]|\ue000[0-9]+\ue001)[0-9]+(?:[.,:/][0-9]+)*%?'
            data = re.sub(expression + '|' + signed,
                          lambda m: '<bdi dir="ltr">' + m[0] + '</bdi>', data)
        self.out.append(data)

    def handle_entityref(self, name): self.out.append('&' + name + ';')
    def handle_charref(self, name): self.out.append('&#' + name + ';')
    def handle_comment(self, data): self.out.append('<!--' + data + '-->')
    def handle_decl(self, decl): self.out.append('<!' + decl + '>')


def locale_output(s, lang):
    if lang not in ('ar', 'th'):
        return s
    if '<!--locale-output-->' in s:
        return s
    font = ('"Noto Sans Arabic","Geeza Pro",Tahoma' if lang == 'ar'
            else '"Noto Sans Thai",Thonburi,Tahoma')
    # Font shorthands in dynamic UI otherwise replace inherited fallbacks.
    css = f'html:lang({lang}) body,html:lang({lang}) body *{{font-family:{font},system-ui,sans-serif!important}}'
    if lang == 'ar':
        def root(m):
            tag = re.sub(r'\s(?:lang|dir)="[^"]*"', '', m[0])
            return tag[:-1] + ' lang="ar" dir="rtl">'
        s = re.sub(r'<html\b[^>]*>', root, s, count=1)
        s = re.sub(r'(<style\b[^>]*>)(.*?)(</style>)', lambda m: m[1] + logical_css(m[2]) + m[3], s, flags=re.S)
        # Also matches inline styles inside the game's JS template strings.
        s = re.sub(r'\bstyle="([^"]*)"', lambda m: 'style="' + logical_css(m[1]) + '"', s)
        s = s.replace('new Intl.DateTimeFormat(T.locale,', "new Intl.DateTimeFormat('ar-u-nu-latn',")
        s = s.replace('new Intl.DateTimeFormat(document.documentElement.lang,', "new Intl.DateTimeFormat('ar-u-nu-latn',")
        s = s.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'))
        # JS-generated board SVGs are parsed as script text, so annotate separately.
        s = s.replace('<svg class="board" role=', '<svg class="board" dir="ltr" role=')
        # accessible_math inserts labelled spans for operators. Temporarily treat
        # those spans as tokens so a whole equation stays one bidi run, keeping
        # its spoken labels intact (including a leading negative sign).
        operators = []
        def operator(m):
            operators.append(m[0])
            return f'\ue000{len(operators) - 1}\ue001'
        parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<svg\b.*?</svg>)', s, flags=re.S)
        s = ''.join(part if part.startswith(('<script', '<style', '<svg')) else re.sub(
            r'<span class="math-op"[^>]*><span aria-hidden="true">[×÷−]</span></span>', operator, part)
            for part in parts)
        parser = IsolateMath(); parser.feed(s); parser.close()
        s = ''.join(parser.out)
        for i, markup in enumerate(operators):
            s = s.replace(f'\ue000{i}\ue001', markup)
        css += (ROOT / 'assets/rtl.css').read_text(encoding='utf-8')
    return s.replace('</head>', '<!--locale-output--><style>' + css + '</style><!--/locale-output-->\n</head>', 1)

"""Shared local-only worksheet text and liblouis translation. No browser or dependencies."""
from functools import cache
import html
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
LANGS = 'en fr es de pt it nl pl sv da no fi tr ja ko'.split()
LOUIS = Path(os.environ.get('LIBLOUIS_BIN', '/Volumes/External SSD/Projects/devtools/liblouis/bin'))
TABLEPATH = Path(os.environ.get('LOUIS_TABLEPATH', '/Volumes/External SSD/Projects/devtools/liblouis/share/liblouis/tables'))
TABLES = dict(zip([c for c in LANGS if c != 'ja'], '''en-ueb-g1.ctb fr-bfu-comp6.utb es-g1.ctb de-g0.utb pt-pt-g1.utb it-it-comp6.utb nl-NL-g0.utb Pl-Pl-g1.utb sv-g0.utb da-dk-g16.ctb no-no-g0.utb fi.utb tr-g1.ctb ko-g1.ctb'''.split()))
LICENSE = 'https://creativecommons.org/licenses/by/4.0/'


@cache
def words(code):
    return json.loads((Path(__file__).parent / f'{code}.json').read_text())


def source(code):
    return ROOT / ('learn-src' if code == 'en' else f'learn-i18n/{code}')


def assets(code):
    return ROOT / 'assets' if code == 'en' else source(code) / 'assets'


def worksheets(code):
    return [json.loads(p.read_text()) for p in sorted((source(code) / 'worksheets').glob('*.json'))]


def text(markup, code):
    """Keep picture alternatives and fraction slashes; omit duplicate column tables."""
    w = words(code)
    def picture(m):
        svg = m[0]
        alt = re.search(r'aria-label="([^"]+)"', svg)
        label = html.unescape(alt[1]) if alt else ''
        if '<polygon ' in svg and 'coins' not in markup:
            pts = re.search(r'<polygon[^>]*points="([^"]+)"', svg)
            label += ' ' + w['outline'].format(n=len(pts[1].split()))
        elif label and not ('coins' in markup or 'class="clock"' in svg) and ('viewBox="0 0 100 100"' in svg or 'viewBox=' not in svg):
            if '<circle' in svg and '<path' not in svg:
                label += ' ' + w['circle']
            elif '<rect' in svg:
                label += ' ' + w['rectangle']
        return ' ' + label + ' '
    markup = re.sub(r'<svg\b.*?</svg>', picture, markup, flags=re.S)
    markup = re.sub(r'<table class="col">.*?</table>', '', markup, flags=re.S)
    markup = re.sub(r'</b><i>', '/', markup)
    markup = re.sub(r'<[^>]+>', ' ', markup)
    value = html.unescape(markup).replace('□', w['empty'])
    # Remove spacing introduced between a fraction's numerator, slash and denominator.
    value = re.sub(r'(\d)\s*/\s*(\d)', r'\1/\2', value)
    return re.sub(r'\s+', ' ', value).strip()


def items(data, code):
    if data['id'] == 'multiplication-grid':
        # A blank visual matrix becomes equivalent independent linear questions.
        mul = text(re.search(r'<th>(.*?)</th>', data['items'][0]['q'])[1], code)
        return [(f'{r} {mul} {c} = {words(code)["empty"]}', str(r*c))
                for r in range(1, 13) for c in range(1, 13)]
    return [(text(it['q'], code), text(it['a'], code)) for it in data['items']]


def context(data, code):
    if not data.get('chart'):
        return ''
    return text(data['chart'], code) + ' ' + '; '.join(
        text(row, code) for row in re.findall(r'<tr>(.*?)</tr>', data['chartTable'], re.S))


def normalise(value, code):
    value = unicodedata.normalize('NFC', value).replace('□', words(code)['empty']).replace('cm²', ' ' + words(code)['squared']).replace('≈', ' ' + words(code)['approximately'] + ' ')
    value = value.translate(str.maketrans({'\u00a0':' ', '\u202f':' ', '’':"'", '‘':"'", '„':'"', '«':'"', '»':'"', '“':'"', '”':'"',
                                         '–':'-', '—':'-', '→':' = ', '…':'...', 'º':'o', 'ª':'a'}))
    if code in ('es', 'it', 'ko'):
        value = value.replace('−', '-')
    if code == 'it':
        value = value.replace('×', '*').replace('·', '*')
    return value


class Translator:
    def __init__(self, code):
        self.code = code
        self.table = TABLES[code]
        self.env = {**os.environ, 'LOUIS_TABLEPATH':str(TABLEPATH)}
        self.tmp = tempfile.TemporaryDirectory(prefix='beequation-louis-')
        self.displays = {'brf':'en-us-brf.dis', 'unicode':'unicode.dis'}
        if code == 'nl':
            # Dutch uses virtual dots 9..f to distinguish digits etc. Its official
            # nl-unicode.dis maps these to physical cells. Extend the requested
            # display tables with exactly those shipped mappings, never drop dots.
            brf = {}
            for char, dots in re.findall(r'^display (\S+) ([0-9]+)', (TABLEPATH/'en-us-brf.dis').read_text(), re.M):
                mask = sum(1 << (int(d)-1) for d in dots if d != '0')
                brf[mask] = char
            maps = re.findall(r'^display \\x(28[0-9A-Fa-f]{2}) ([0-9a-f]+)', (TABLEPATH/'nl-unicode.dis').read_text(), re.M)
            for kind, base in self.displays.copy().items():
                lines = [f'include {base}']
                for cell, dots in maps:
                    mask = int(cell,16)-0x2800
                    if mask < 64 and any(d in dots for d in '9abcdef'):
                        char = brf[mask] if kind == 'brf' else '\\x'+cell
                        lines.append(f'display {char} {dots}')
                p = Path(self.tmp.name)/f'nl-{kind}.dis'; p.write_text('\n'.join(lines)+'\n')
                self.displays[kind] = str(p)
        self.check()

    def close(self):
        self.tmp.cleanup()

    def check(self):
        subprocess.run([str(LOUIS/'lou_checktable'),self.table], env=self.env,
                       check=True, capture_output=True, text=True)

    def translate(self, lines, kind='unicode'):
        lines = [normalise(line,self.code) for line in lines]
        run = subprocess.run([str(LOUIS/'lou_translate'), '-d', self.displays[kind], self.table],
                             input='\n'.join(lines)+'\n', env=self.env, capture_output=True, text=True)
        if run.returncode or run.stderr.strip():
            raise ValueError(f'{self.code}/{self.table}: {run.stderr.strip()}')
        output = run.stdout.rstrip('\n').split('\n')
        if len(output) != len(lines):
            raise ValueError(f'{self.code}: lost lines in translation')
        valid = (lambda c: ' ' <= c <= '_') if kind == 'brf' else (lambda c: '\u2800' <= c <= '\u283f')
        for plain, braille in zip(lines,output):
            if any(not valid(c) for c in braille):
                raise ValueError(f'{self.code}: non-six-dot/undefined character in {plain!r}: {braille!r}')
        return output

#!/usr/bin/env python3
"""Generate deterministic six-dot BRF and Unicode braille, without Chrome."""
import argparse
import json
from pathlib import Path
import sys
from common import LANGS, TABLES, Translator, assets, context, items, words, worksheets


def wrap(line, cells):
    rows = []
    while len(line) > cells:
        boundary = line.rfind('\u2800', 0, cells+1)
        if boundary <= 0:
            boundary = cells
        rows.append(line[:boundary])
        line = line[boundary:].lstrip('\u2800')
    rows.append(line)
    return rows


def paginate(translated, cells, lines):
    pages, page = [], []
    for line in translated:
        for row in wrap(line,cells):
            if len(page) == lines:
                pages.append(page); page = []
            page.append(row)
    if page:
        pages.append(page)
    return pages


def generate(data, code, translator, cells=30, lines=27):
    w = words(code)
    pairs = items(data,code)
    lead = [data['title'], w['warning'], '', data['how']]
    if data['id'] in ('column-addition','column-subtraction','short-multiplication'):
        lead.append(w['columnNote'])
    if code in ('pt', 'id'):
        lead.append(w['tableNote'])
    if context(data,code):
        lead.append(context(data,code))
    questions = lead + [''] + [f'{n}. {q}' for n,(q,a) in enumerate(pairs,1)]
    answers = [w['answers'], data['title'], ''] + [f'{n}. {a}' for n,(q,a) in enumerate(pairs,1)]
    uni = translator.translate(questions+answers)
    brf = translator.translate(questions+answers,'brf')
    # Derive a one-to-one display mapping from the same translated cells; wrap only
    # once so both formats always have exactly the same hard breaks.
    mapping = {}
    for u,b in zip(uni,brf):
        if len(u)!=len(b):
            raise ValueError(f'{code}: display tables disagree')
        for uc,bc in zip(u,b):
            if uc in mapping and mapping[uc] != bc:
                raise ValueError(f'{code}: inconsistent BRF mapping')
            mapping[uc] = bc
    pages = paginate(uni[:len(questions)],cells,lines) + paginate(uni[len(questions):],cells,lines)
    unicode_file = '\f'.join('\n'.join(p) for p in pages)+'\n'
    brf_file = ''.join(mapping[c] if c not in '\n\f' else c for c in unicode_file)
    out = assets(code)/'worksheets'; out.mkdir(parents=True,exist_ok=True)
    (out/(data['id']+'.brf')).write_text(brf_file,encoding='ascii')
    (out/(data['id']+'-braille.txt')).write_text(unicode_file,encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lang', choices=LANGS)
    parser.add_argument('--cells',type=int,default=30)
    parser.add_argument('--lines',type=int,default=27)
    parser.add_argument('--labels',type=int,help='write JSON Unicode numeral labels 1..N (Japanese uses UEB digits)')
    parser.add_argument('--label-text', action='append', help='translate a label (repeatable)')
    args = parser.parse_args()
    if args.cells<8 or args.lines<8:
        parser.error('cells and lines must be at least 8')
    if args.labels or args.label_text:
        t=Translator('en' if args.lang=='ja' else args.lang or 'en')
        try: print(json.dumps(t.translate(args.label_text or [str(n) for n in range(1,args.labels+1)]),ensure_ascii=False))
        finally: t.close()
        return
    for code in [args.lang] if args.lang else LANGS:
        if code=='ja':
            print('ja: skipped (no standard children’s Japanese kana braille table); tactile PDFs and EPUB available')
            continue
        t=Translator(code)
        try:
            for data in worksheets(code):
                generate(data,code,t,args.cells,args.lines)
            probe = t.translate(['123 + 45 − 6 × 7 ÷ 2 = 3/4'])[0]
            print(f'{code}: {len(worksheets(code))} worksheets, {t.table}; maths probe: {probe}')
        finally: t.close()


if __name__=='__main__':
    main()

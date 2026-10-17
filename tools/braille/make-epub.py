#!/usr/bin/env python3
"""Build deterministic accessible EPUB 3 collections from worksheet JSON, without Chrome."""
import argparse
import html
from pathlib import Path
import re
import zipfile
from common import LANGS, LICENSE, assets, context, items, words, worksheets


def esc(s):
    return html.escape(str(s),quote=True)


def list_item(value, code):
    # Text alternatives have no visual markup left. Keep complete calculations,
    # including the translated blank, LTR within the Arabic reading order.
    numeric = code == 'ar' and not re.search(r'[\u0600-\u06ff]', value.replace(words(code)['empty'], ''))
    direction = ' dir="ltr"' if numeric else ''
    return f'<li{direction}>{esc(value)}</li>'


def xhtml(title, lang, body):
    direction = ' dir="rtl"' if lang == 'ar' else ''
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="{esc(lang)}" lang="{esc(lang)}"{direction}>
<head><title>{esc(title)}</title><meta charset="utf-8"/></head><body>{body}</body></html>'''


def build(code):
    w = words(code); sheets = worksheets(code)
    if not sheets:
        raise ValueError(f'{code}: no worksheets; run make-worksheets --html-only first')
    lang = sheets[0]['htmlLang']
    contents = {'META-INF/container.xml': '''<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'''}
    nav = f'<nav epub:type="toc" id="toc"><h1>{esc(w["epub"])}</h1><ol>'
    manifest = '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
    spine = ''
    for n,d in enumerate(sheets,1):
        pairs = items(d,code)
        body = f'<main><h1>{esc(d["title"])}</h1><p>{esc(d["how"])}</p>'
        if context(d,code): body += f'<p>{esc(context(d,code))}</p>'
        if d['id'] in ('column-addition','column-subtraction','short-multiplication'):
            body += f'<p>{esc(w["columnNote"])}</p>'
        body += '<ol>' + ''.join(list_item(q, code) for q,a in pairs) + '</ol>'
        body += f'<section id="answers"><h2>{esc(w["answers"])}</h2><ol>'
        body += ''.join(list_item(a, code) for q,a in pairs) + '</ol></section>'
        body += f'<p>{esc(w["license"])} <a href="{LICENSE}">CC BY 4.0</a></p></main>'
        contents[f'EPUB/{d["id"]}.xhtml'] = xhtml(d['title'],lang,body)
        nav += f'<li><a href="{d["id"]}.xhtml">{esc(d["title"])}</a></li>'
        manifest += f'<item id="w{n}" href="{d["id"]}.xhtml" media-type="application/xhtml+xml"/>'
        spine += f'<itemref idref="w{n}"/>'
    contents['EPUB/nav.xhtml'] = xhtml(w['epub'],lang,nav+'</ol></nav>')
    contents['EPUB/package.opf'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="{lang}" prefix="schema: http://schema.org/">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:beequation:worksheets:{code}</dc:identifier><dc:title>Beequation: {esc(w['epub'])}</dc:title><dc:creator>Beequation</dc:creator><dc:language>{lang}</dc:language>
<dc:rights>{esc(w['license'])} {LICENSE}</dc:rights>
<meta property="dcterms:modified">2026-10-12T00:00:00Z</meta>
<meta property="schema:accessMode">textual</meta>
<meta property="schema:accessModeSufficient">textual</meta>
<meta property="schema:accessibilityFeature">structuralNavigation</meta>
<meta property="schema:accessibilityFeature">tableOfContents</meta>
<meta property="schema:accessibilityFeature">readingOrder</meta>
<meta property="schema:accessibilityFeature">alternativeText</meta>
<meta property="schema:accessibilityHazard">none</meta>
<meta property="schema:accessibilitySummary">{esc(w['summary'])}</meta>
</metadata><manifest>{manifest}</manifest><spine>{spine}</spine></package>'''
    out = assets(code)/f'beequation-worksheets-{code}.epub'; out.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(out,'w') as z:
        for name,value in [('mimetype','application/epub+zip'), *contents.items()]:
            info = zipfile.ZipInfo(name,date_time=(2026,10,12,0,0,0))
            info.compress_type = zipfile.ZIP_STORED if name=='mimetype' else zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info,value.encode('utf-8'))
    print(f'{code}: {len(sheets)} worksheets → {out.relative_to(Path(__file__).resolve().parents[2])}')


def main():
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--lang',choices=LANGS); args=p.parse_args()
    for code in [args.lang] if args.lang else LANGS: build(code)


if __name__=='__main__': main()

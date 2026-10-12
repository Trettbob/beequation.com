"""Spoken maths for HTML only. Worksheet JSON and all PDF generators stay untouched."""
import html
import re
from html.parser import HTMLParser

# Denominator names (2 through 10). Numeric fallback remains intelligible for larger or unknown parts.
FRACTIONS = {
'en': 'half/halves third/thirds quarter/quarters fifth/fifths sixth/sixths seventh/sevenths eighth/eighths ninth/ninths tenth/tenths',
'fr': 'demi/demis tiers/tiers quart/quarts cinquième/cinquièmes sixième/sixièmes septième/septièmes huitième/huitièmes neuvième/neuvièmes dixième/dixièmes',
'es': 'medio/medios tercio/tercios cuarto/cuartos quinto/quintos sexto/sextos séptimo/séptimos octavo/octavos noveno/novenos décimo/décimos',
'de': 'Halb/Halbe Drittel/Drittel Viertel/Viertel Fünftel/Fünftel Sechstel/Sechstel Siebtel/Siebtel Achtel/Achtel Neuntel/Neuntel Zehntel/Zehntel',
'pt': 'meio/meios terço/terços quarto/quartos quinto/quintos sexto/sextos sétimo/sétimos oitavo/oitavos nono/nonos décimo/décimos',
'it': 'mezzo/mezzi terzo/terzi quarto/quarti quinto/quinti sesto/sesti settimo/settimi ottavo/ottavi nono/noni decimo/decimi',
'nl': 'helft/helften derde/derden kwart/kwarten vijfde/vijfden zesde/zesden zevende/zevenden achtste/achtsten negende/negenden tiende/tienden',
'sv': 'halv/halvor tredjedel/tredjedelar fjärdedel/fjärdedelar femtedel/femtedelar sjättedel/sjättedelar sjundedel/sjundedelar åttondel/åttondelar niondel/niondelar tiondel/tiondelar',
'da': 'halv/halve tredjedel/tredjedele fjerdedel/fjerdedele femtedel/femtedele sjettedel/sjettedele syvendedel/syvendedele ottendedel/ottendedele niendedel/niendedele tiendedel/tiendedele',
'no': 'halv/halve tredel/tredeler firedel/firedeler femdel/femdeler seksdel/seksdeler sjudel/sjudeler åttedel/åttedeler nidel/nideler tidel/tideler',
'fi': 'puolikas/puolikasta kolmasosa/kolmasosaa neljäsosa/neljäsosaa viidesosa/viidesosaa kuudesosa/kuudesosaa seitsemäsosa/seitsemäsosaa kahdeksasosa/kahdeksasosaa yhdeksäsosa/yhdeksäsosaa kymmenesosa/kymmenesosaa',
'pl': 'druga/drugie trzecia/trzecie czwarta/czwarte piąta/piąte szósta/szóste siódma/siódme ósma/ósme dziewiąta/dziewiąte dziesiąta/dziesiąte',
}
# ×, ÷, −, blank, generic fraction format
WORDS = {
'en': ('times', 'divided by', 'minus', 'blank', '{n} over {d}'),
'fr': ('fois', 'divisé par', 'moins', 'case vide', '{n} sur {d}'),
'es': ('por', 'dividido entre', 'menos', 'casilla vacía', '{n} sobre {d}'),
'de': ('mal', 'geteilt durch', 'minus', 'Lücke', '{n} durch {d}'),
'pt': ('vezes', 'dividido por', 'menos', 'espaço em branco', '{n} sobre {d}'),
'it': ('per', 'diviso', 'meno', 'casella vuota', '{n} su {d}'),
'nl': ('maal', 'gedeeld door', 'min', 'leeg vakje', '{n} gedeeld door {d}'),
'pl': ('razy', 'podzielone przez', 'minus', 'puste pole', '{n} przez {d}'),
'sv': ('gånger', 'delat med', 'minus', 'tom ruta', '{n} genom {d}'),
'da': ('gange', 'divideret med', 'minus', 'tomt felt', '{n} over {d}'),
'no': ('ganger', 'delt på', 'minus', 'tom rute', '{n} over {d}'),
'fi': ('kertaa', 'jaettuna', 'miinus', 'tyhjä ruutu', '{n} jaettuna luvulla {d}'),
'tr': ('çarpı', 'bölü', 'eksi', 'boş kutu', '{n} bölü {d}'),
'ja': ('かける', 'わる', 'マイナス', '空欄', '{d}分の{n}'),
'ko': ('곱하기', '나누기', '마이너스', '빈칸', '{d}분의 {n}'),
}
GERMAN = 'null ein zwei drei vier fünf sechs sieben acht neun zehn elf zwölf'.split()
TURKISH = 'sıfır bir iki üç dört beş altı yedi sekiz dokuz on'.split()
POLISH_NUM = 'zero jedna dwie trzy cztery pięć sześć siedem osiem dziewięć dziesięć'.split()
POLISH_GEN = 'drugich trzecich czwartych piątych szóstych siódmych ósmych dziewiątych dziesiątych'.split()

def spoken_fraction(n, d, lang):
    words = WORDS[lang]
    clean = lambda s: html.unescape(re.sub('<[^>]+>', '', s)).strip()
    n, d = clean(n), clean(d)
    n = words[3] if not n.isdecimal() else n
    d = words[3] if not d.isdecimal() else d
    if lang == 'tr':
        if n.isdecimal() and int(n) < len(TURKISH): n = TURKISH[int(n)]
        # Turkish says the denominator first: dörtte üç, ikide bir.
        denominator = {2:'ikide',3:'üçte',4:'dörtte',5:'beşte',6:'altıda',7:'yedide',8:'sekizde',9:'dokuzda',10:'onda'}
        if d.isdecimal() and int(d) in denominator: return denominator[int(d)] + ' ' + n
    if lang in FRACTIONS and n.isdecimal() and d.isdecimal() and 2 <= int(d) <= 10:
        singular, plural = FRACTIONS[lang].split()[int(d)-2].split('/')
        count = int(n)
        denominator = singular if count == 1 else plural
        if lang == 'de':
            if count == 1 and int(d) == 2: return 'ein Halb'
            n = GERMAN[count] if count < len(GERMAN) else n
        elif lang == 'pl':
            if count != 1 and (count % 10 not in (2,3,4) or 12 <= count % 100 <= 14): denominator = POLISH_GEN[int(d)-2]
            n = POLISH_NUM[count] if count < len(POLISH_NUM) else n
        return f'{n} {denominator}'
    return words[4].format(n=n, d=d)

FR = re.compile(r'<span\b([^>]*\bclass="[^"]*\bfr\b[^"]*"[^>]*)>\s*<b>(.*?)</b>\s*(?:<span class="fraction-slash">/</span>\s*)?<i>(.*?)</i>\s*</span>', re.S)
UNICODE = dict(zip('½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒', [(1,2),(1,3),(2,3),(1,4),(3,4),(1,5),(2,5),(3,5),(4,5),(1,6),(5,6),(1,7),(1,8),(3,8),(5,8),(7,8),(1,9),(1,10)]))
DIGITS = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉', '01234567890123456789')
MATH_PATTERN = re.compile(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+⁄[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]+|[' + ''.join(UNICODE) + r'×÷−]')

def math_label(visual, label, cls='math-fraction'):
    return f'<span class="{cls}" role="math" aria-label="{html.escape(label, quote=True)}"><span aria-hidden="true">{visual}</span></span>'

class MathsHTML(HTMLParser):
    """Transform only text nodes; leave attributes, SVG, existing labels and code alone."""
    def __init__(self, lang):
        super().__init__(convert_charrefs=False)
        self.lang, self.out, self.stack = lang, [], []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        protected = tag in ('svg','script','style','code','pre') or 'aria-label' in a or a.get('aria-hidden') == 'true'
        if tag not in ('br','hr','img','input','link','meta','wbr','source','area','embed'):
            self.stack.append((tag, protected or bool(self.stack and self.stack[-1][1])))
        self.out.append(self.get_starttag_text())
    def handle_startendtag(self, tag, attrs): self.out.append(self.get_starttag_text())
    def handle_endtag(self, tag):
        self.out.append(f'</{tag}>')
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0] == tag: del self.stack[i:]; break
    def handle_data(self, data):
        if self.stack and self.stack[-1][1]: self.out.append(data); return
        def token(m):
            v=m.group()
            if v in '×÷−': return math_label(v, WORDS[self.lang]['×÷−'.index(v)], 'math-op')
            if v in UNICODE: n,d=UNICODE[v]
            else: n,d=v.translate(DIGITS).split('⁄')
            return math_label(v, spoken_fraction(str(n),str(d),self.lang))
        self.out.append(MATH_PATTERN.sub(token,data))
    def handle_entityref(self, name): self.handle_data(html.unescape('&'+name+';')) if name in ('times','divide','minus','frac12','frac14','frac34') else self.out.append('&'+name+';')
    def handle_charref(self, name):
        value = html.unescape('&#'+name+';')
        if MATH_PATTERN.fullmatch(value): self.handle_data(value)
        else: self.out.append('&#'+name+';')
    def handle_comment(self, data): self.out.append('<!--'+data+'-->')

def accessible_math(body, lang='en'):
    def fraction(m):
        if 'aria-label=' in m[1]: return m[0]
        visual = re.search(r'>(.*)</span>$', m[0], re.S)[1]
        label = spoken_fraction(m[2],m[3],lang)
        return f'<span{m[1]} role="math" aria-label="{html.escape(label,quote=True)}"><span aria-hidden="true">{visual}</span></span>'
    parser=MathsHTML(lang)
    parser.feed(FR.sub(fraction,body));parser.close()
    return ''.join(parser.out)

#!/usr/bin/env python3
"""
Import transcripts and extract vocabulary tables from Samsung T5 drive
or re-parse existing transcripts in src/data/transcripts/ into the
Small Talk Café Podcasts website data directory.

Strictly READ-ONLY regarding the external drive.
Generates structured JSON per show under src/data/transcripts/<show-id>.json.

Usage:
  python3 scripts/import_transcripts.py
  python3 scripts/import_transcripts.py --reprocess-existing
  npm run transcripts:import
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

# Mapping between siteConfig show IDs and disk folder names + target language codes
SHOW_CONFIGS: dict[str, dict[str, str]] = {
    'english-german': {
        'folder': 'small_talk_cafe_learn_german_in_minutes',
        'target_lang': 'de',
        'source_lang': 'en',
    },
    'spanish-german': {
        'folder': 'small_talk_cafe_aprende_aleman_en_minutos',
        'target_lang': 'de',
        'source_lang': 'es',
    },
    'french-german': {
        'folder': 'small_talk_cafe_apprenez_l_allemand_en_minutes',
        'target_lang': 'de',
        'source_lang': 'fr',
    },
    'italian-german': {
        'folder': 'small_talk_cafe_impara_il_tedesco_in_minuti',
        'target_lang': 'de',
        'source_lang': 'it',
    },
    'turkish-german': {
        'folder': 'small_talk_cafe_dakikalar_icinde_almanca_ogren',
        'target_lang': 'de',
        'source_lang': 'tr',
    },
    'english-spanish': {
        'folder': 'small_talk_cafe_learn_spanish_in_minutes',
        'target_lang': 'es',
        'source_lang': 'en',
    },
    'english-french': {
        'folder': 'small_talk_cafe_learn_french_in_minutes',
        'target_lang': 'fr',
        'source_lang': 'en',
    },
    'english-italian': {
        'folder': 'small_talk_cafe_learn_italian_in_minutes',
        'target_lang': 'it',
        'source_lang': 'en',
    },
    'english-swedish': {
        'folder': 'small_talk_cafe_learn_swedish_in_minutes',
        'target_lang': 'sv',
        'source_lang': 'en',
    },
    'english-portuguese': {
        'folder': 'small_talk_cafe_learn_brazilian_portuguese_in_minutes',
        'target_lang': 'pt',
        'source_lang': 'en',
    },
    'english-dutch': {
        'folder': 'small_talk_cafe_learn_dutch_in_minutes',
        'target_lang': 'nl',
        'source_lang': 'en',
    },
    'english-japanese': {
        'folder': 'small_talk_cafe_learn_japanese_in_minutes',
        'target_lang': 'ja',
        'source_lang': 'en',
    },
    'english-korean': {
        'folder': 'small_talk_cafe_learn_korean_in_minutes',
        'target_lang': 'ko',
        'source_lang': 'en',
    },
    'english-mandarin': {
        'folder': 'small_talk_cafe_learn_mandarin_in_minutes',
        'target_lang': 'zh',
        'source_lang': 'en',
    },
}

# Generic story transition patterns indicating outro/return to story
STORY_RETURN_REGEX = re.compile(
    r'(?:zurück|retour|torniamo|volvamos|voltar|terug|tillbaka|back|return|weiter|fortsetzen|continue|geri|다시|回到|戻|さあ)'
    r'.*?(?:geschichte|histoire|storia|historia|verhaal|berättelse|story|hikaye|이야기|故事|話|物語)'
    r'|(?:geschichte|histoire|storia|historia|verhaal|berättelse|story|hikaye|이야기|故事|話|物語)'
    r'.*?(?:zurück|retour|torniamo|volvamos|voltar|terug|tillbaka|back|return|weiter|fortsetzen|continue|geri|다시|回到|戻)'
    r'|(?:回到.*?(?:看看|接下来|故事))'
    r'|(?:잘했어요|잘하셨어요|太棒了|非常棒|你做得很好|よくできました|素晴らしい|wunderbar gemacht|super gemacht|gut gemacht|sehr gut gemacht|ausgezeichnet|bravo|fantastique|magnifique|bravissimo|goed gedaan|super gedaan|bra jobbat|çok iyi iş|harika iş)',
    re.IGNORECASE
)



def clean_cjk_example(meaning: str, example: str, target_lang: str) -> tuple[str, str]:
    """Ensure in-context example for CJK languages is purely the target language sentence."""
    if not example or target_lang not in ['ja', 'zh', 'ko']:
        return meaning, example
    # If example starts with ASCII translation notes like 'to be sick, 목이 아파요.'
    m = re.match(r'^([a-zA-Z0-9\s/()\'\"\-]+)[,.]\s+(.*[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7a3].*)$', example)
    if m:
        extra_meaning = m.group(1).strip()
        cjk_sentence = m.group(2).strip()
        meaning = f"{meaning} / {extra_meaning}"
        example = cjk_sentence
    return meaning, example


def is_sentence_target(target: str, target_lang: str, lexical_item: bool = False) -> bool:
    """Check if target represents a complete sentence or conversational utterance.

    When lexical_item is True the target is a vocabulary spotlight entry, so
    Japanese/Korean conjugated endings alone do not make it a sentence.
    """
    t = target.strip()
    # Strip parenthesized pronunciations / readings before analysis
    t_core = re.sub(r'\(.*?\)|（.*?）', '', t).strip()

    # Sentence-ending or conversational punctuation
    if any(p in t_core for p in ['。', '！', '？', '…', '...']) or ('?' in t_core) or ('!' in t_core):
        return True
    if t_core.endswith('.') and not re.search(r'\b(pl|sing|approx|etc|ca)\.$', t_core, re.I):
        return True
    if ('「' in t and '」' in t) or (t.startswith('"') and t.endswith('"')):
        return True

    # Language-specific conversational sentence endings
    if target_lang in ['ja', 'zh', 'ko'] and not (lexical_item and target_lang in ['ja', 'ko']):
        if any(t_core.endswith(end) for end in [
            '입니다', '습니다', 'ㅂ니다', '해요', '했어요', '이에요', '예요',
            '있어요', '없어요', '주세요', '보세요', '까요?', '까요', '네요', '있네요', '없네요', '이죠'
        ]):
            return True
        if any(t_core.endswith(end) for end in [
            'です', 'ます', 'でした', 'ました', 'ません', 'てください', 'ています', 'ましょう', 'たいです', 'たい', 'ね', 'よ'
        ]):
            return True
        if any(p in t_core for p in ['吗', '吧', '呢']) or any(t_core.startswith(p) for p in ['我想要', '我想去', '我喜欢', '请出示', '你可以', '这是您的', '这是我的', '今天天气']):
            return True

    # Space-separated sentences (4 or more words unless beginning with a noun article)
    words = t_core.split()
    articles = [
        'der', 'die', 'das', 'ein', 'eine', 'el', 'la', 'los', 'las', 'un', 'una',
        'le', 'les', 'une', 'il', 'lo', 'o', 'het', 'de', 'en', 'ett'
    ]
    if len(words) >= 4 and not any(t_core.lower().startswith(a + ' ') for a in articles):
        return True

    return False


# Closed-class function words (grammar, not vocabulary) used to read the part of speech
# from how a word is used in its example sentence.
DETERMINERS = {
    'de': ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
           'mein', 'meine', 'meinen', 'meinem', 'meiner', 'dein', 'deine', 'sein', 'seine', 'ihr', 'ihre',
           'unser', 'unsere', 'dieser', 'diese', 'dieses', 'diesen', 'im', 'zum', 'zur', 'vom', 'am', 'ins', 'beim'],
    'nl': ['de', 'het', 'een', 'mijn', 'jouw', 'zijn', 'haar', 'ons', 'onze', 'dit', 'dat', 'deze', 'die'],
    'sv': ['en', 'ett', 'den', 'det', 'de', 'min', 'mitt', 'mina', 'din', 'ditt', 'dina', 'vår', 'vårt', 'våra', 'denna', 'detta'],
    'fr': ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'au', 'aux', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
           'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'ce', 'cet', 'cette', 'ces'],
    'es': ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al', 'mi', 'mis', 'tu', 'tus', 'su', 'sus',
           'nuestro', 'nuestra', 'este', 'esta', 'estos', 'estas'],
    'it': ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'del', 'dello', 'della', 'dei', 'degli', 'delle',
           'nel', 'nello', 'nella', 'sul', 'sulla', 'al', 'alla', 'allo', 'mio', 'mia', 'miei', 'mie', 'tuo', 'tua',
           'suo', 'sua', 'nostro', 'nostra', 'questo', 'questa'],
    'pt': ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
           'ao', 'meu', 'minha', 'meus', 'minhas', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'este', 'esta',
           'esse', 'essa'],
}
ELIDED_DETERMINERS = ["l'", "l’", "un'", "dell'", "all'", "nell'", "sull'", "quest'", "d'", "d’"]
COPULAS = {
    'de': ['ist', 'sind', 'war', 'waren', 'bin', 'bist', 'seid', 'wird', 'werden'],
    'nl': ['is', 'zijn', 'was', 'waren', 'ben', 'bent'],
    'sv': ['är', 'var', 'vara', 'blir'],
    'fr': ['est', 'sont', 'suis', 'êtes', 'es', 'était', 'étaient'],
    'es': ['es', 'son', 'está', 'están', 'estoy', 'soy', 'estaba', 'era', 'eres', 'estás'],
    'it': ['è', 'sono', 'era', 'sei', 'siamo', 'stato'],
    'pt': ['é', 'são', 'está', 'estão', 'estou', 'sou', 'estava', 'era', 'foi'],
}
FUNCTION_WORD_GLOSSES = {
    'maybe', 'perhaps', 'often', 'always', 'never', 'sometimes', 'here', 'there', 'now', 'then', 'today',
    'tomorrow', 'yesterday', 'very', 'also', 'already', 'still', 'again', 'soon', 'together', 'everywhere',
    'under', 'over', 'between', 'behind', 'in', 'on', 'at', 'with', 'without', 'for', 'from', 'to', 'before',
    'after', 'since', 'until', 'since then', 'when', 'where', 'why', 'how', 'because', 'but', 'and', 'or',
    'if', 'while', 'too', 'only', 'almost', 'enough', 'quite', 'a bit', 'a lot', 'much', 'many', 'more',
}
INTENSIFIERS = {
    'de': ['sehr', 'ganz', 'ziemlich', 'besonders', 'richtig', 'total', 'so'],
    'nl': ['heel', 'erg', 'zo', 'best', 'echt'],
    'sv': ['mycket', 'ganska', 'så', 'riktigt', 'väldigt'],
    'fr': ['très', 'trop', 'assez', 'plutôt', 'tellement'],
    'es': ['muy', 'demasiado', 'bastante', 'tan', 'súper'],
    'it': ['molto', 'troppo', 'abbastanza', 'davvero', 'così'],
    'pt': ['muito', 'bastante', 'tão', 'super', 'demais'],
}
SUBJECT_PRONOUNS = {
    'de': ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man'],
    'nl': ['ik', 'je', 'jij', 'hij', 'zij', 'ze', 'wij', 'we', 'jullie', 'u'],
    'sv': ['jag', 'du', 'han', 'hon', 'vi', 'ni', 'de', 'man'],
    'fr': ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', "j'", "j\u2019"],
    'es': ['yo', 'tú', 'él', 'ella', 'nosotros', 'ustedes', 'usted', 'ellos', 'ellas'],
    'it': ['io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro'],
    'pt': ['eu', 'você', 'ele', 'ela', 'nós', 'vocês', 'eles', 'elas'],
}
# Closed-class adverbs/prepositions that can sit between a copula and its adjective
LINKING_ADVERBS = ['nicht', 'auch', 'immer', 'noch', 'schon', 'jetzt', 'heute', 'niet', 'ook', 'altijd', 'nu',
                   'inte', 'också', 'alltid', 'pas', 'aussi', 'toujours', 'maintenant', 'no', 'siempre',
                   'también', 'ahora', 'non', 'anche', 'sempre', 'ora', 'não', 'também', 'agora']
SV_DEFINITE_SUFFIXES = ('n', 't', 'en', 'et', 'na', 'erna', 'arna', 'orna')

CONJUGATED_GLOSS = re.compile(
    r"^(?:i|you|he|she|we|they)\s+(?:(?:would|will|can|have|had|did|do)\s+)?[a-z']+"
    r"(?:\s+(?:to|for|up|down|out|at|on|in|off|over|about))?$"
)


def context_pos(t_core: str, example: str, lang: str) -> str | None:
    """Infer 'noun' or 'adjective' from how the target is used in its example sentence.

    A determiner directly before the word (or a Swedish definite suffix on it) marks a
    noun. An intensifier directly before it, or a sentence-final position after a
    copula, marks a predicate adjective.
    """
    if not example or not t_core or ' ' in t_core:
        return None
    tgt = re.escape(t_core)
    dets = '|'.join(re.escape(d) for d in DETERMINERS.get(lang, []))
    if dets:
        elided = '|'.join(re.escape(d) for d in ELIDED_DETERMINERS)
        if re.search(rf"(?<!\w)(?:(?:{dets})\s+|(?:{elided})\s*){tgt}(?!\w)", example, re.I):
            return 'noun'
    if lang == 'sv':
        suffixes = '|'.join(SV_DEFINITE_SUFFIXES)
        if re.search(rf"(?<!\w){tgt}(?:{suffixes})(?!\w)", example, re.I):
            return 'noun'
    if lang == 'de' and t_core[0].isupper():
        return None  # German nouns are capitalised; adjectives never are mid-sentence
    ints = '|'.join(INTENSIFIERS.get(lang, []))
    if ints and re.search(rf"(?<!\w)(?:{ints})\s+{tgt}(?!\w)", example, re.I):
        return 'adjective'
    cops = '|'.join(re.escape(c) for c in COPULAS.get(lang, []))
    mids = '|'.join(INTENSIFIERS.get(lang, []) + LINKING_ADVERBS)
    if cops and re.search(rf"(?<!\w)(?:{cops})\s+(?:(?:{mids})\s+)?{tgt}(?!\w)", example, re.I):
        return 'adjective'
    prons = '|'.join(re.escape(x) for x in SUBJECT_PRONOUNS.get(lang, []))
    if prons and re.search(rf"(?<!\w)(?:{prons})\s*{tgt}(?!\w)", example, re.I):
        return 'verb'
    return None


def classify_pos(target: str, meaning: str, target_lang: str, example: str = '', source_lang: str = 'en') -> str:
    """Classify a vocabulary entry morphologically into noun, verb, adjective, or phrase."""
    t_raw = target.strip()
    m_raw = meaning.strip()
    # Strip readings like '痒い (かゆい)' -> '痒い'
    t_core = re.sub(r'\(.*?\)|（.*?）', '', t_raw).strip()
    m_core = re.sub(r'\(.*?\)|（.*?）', '', m_raw).strip()
    m_clean = m_core.lower()
    t_clean = t_core.lower()
    words = t_clean.split()
    m_words = m_clean.split()

    # 1. Complete sentence or dialogue utterance
    if is_sentence_target(t_raw, target_lang, lexical_item=True):
        return 'phrase'

    # Fixed conversational greetings and social expressions across languages
    common_greetings = {
        'hello', 'hi', 'goodbye', 'bye', 'good morning', 'good afternoon', 'good evening', 'good night',
        'see you', 'thank you', 'thanks', 'please', "you're welcome", 'excuse me', 'pardon', 'sorry',
        'bonjour', 'buongiorno', 'buenos días', 'guten morgen', 'guten tag', 'auf wiedersehen', 'tschüss',
        'danke', 'bitte', 'de rien', 'grazie', 'prego', 'gracias', 'por favor', 'teşekkürler', 'lütfen',
        'merhaba', 'günaydın', 'pleased to meet you', 'nice to meet you', 'one please', 'could you please',
        '안녕하세요', '감사합니다', '고맙습니다', '죄송합니다', '실례합니다', '주세요', '부탁합니다',
        'hej', 'goedendag', 'alstublieft', 'dank u'
    }
    m_head = re.split(r'[/;,]', m_clean)[0].strip()
    if m_clean in common_greetings or m_head in common_greetings or t_clean in common_greetings:
        return 'phrase'

    # The remaining gloss-shape rules (to-infinitives, 'the/a', -ed/-s endings, pronoun clauses)
    # are English-specific; for other gloss languages rely on the target word and its context.
    if source_lang != 'en':
        m_clean = ''
        m_words = []

    # Japanese / Korean lexical items identified by conjugation endings
    m_is_clause = m_clean.startswith(('i ', 'he ', 'she ', 'we ', 'they ', 'the ', 'it ', "it's ", 'you ', 'there '))
    if target_lang == 'ko' and t_core.endswith('다') and not t_core.endswith('니다'):
        if m_is_clause:
            return 'phrase'
        if m_clean.startswith('to be '):
            return 'adjective'
        if not m_clean.startswith('to ') and len(m_words) == 1 and any(m_clean.endswith(s) for s in ('ful', 'ous', 'able', 'ible', 'ive', 'ic', 'ish', 'less', 'al', 'ant', 'ent', 'ed', 'ing', 'y')):
            return 'adjective'
        return 'verb'
    if target_lang == 'ko' and t_core.endswith('니다') and len(t_core) <= 7 and ' ' not in t_core:
        return 'verb'
    if target_lang == 'ja' and ' ' not in t_core:
        if t_core.endswith(('ました', 'ます', 'ません', 'ています', 'していた', 'した', 'たい')) and len(t_core) <= 6:
            return 'verb'
        if t_core.endswith('ない') and len(t_core) <= 6:
            return 'verb'
        if (t_core.endswith('い') and not t_core.endswith(('行い', 'たい')) and not t_core.startswith(('お', 'ご'))
                and len(t_core) <= 8 and not m_clean.startswith(('the ', 'a ', 'an ', 'to ')) and not m_is_clause):
            return 'adjective'

    # Subject pronoun clause starters in meaning (e.g. 'I wake up', 'you have')
    clause_starters = (
        'i ', "i'm ", "i've ", "i'd ", "i'll ",
        'you ', "you're ",
        'he ', "he's ", 'she ', "she's ",
        'we ', "we're ", 'they ', "they're ",
        "it's ", 'it is ', 'there is ', 'there are ',
        "can't ", 'cannot ', "don't ", 'do not ', "let's ",
    )
    if any(m_clean.startswith(cs) for cs in clause_starters):
        # Subject pronoun + one conjugated verb (+ particle) is a verb form, not a phrase
        if CONJUGATED_GLOSS.match(m_clean) and len(words) <= 3:
            return 'verb'
        return 'phrase'

    # 2. Verbs
    if m_clean.startswith(('to ', 'to\t')):
        m_after = m_clean[3:].strip()
        # 'to be + adjective' expresses an adjectival state
        if m_after.startswith('be '):
            predicate = m_after[3:].split()
            # 'to be thirsty' states a condition; 'to be the center of attention' is a verb phrase
            if len(predicate) <= 2 and predicate and predicate[0] not in ('the', 'a', 'an', 'in', 'on', 'at', 'able', 'going', 'about', 'with', 'for'):
                return 'adjective'
        return 'verb'

    # Past-tense glosses ('moved (past tense)', 'looked at') are verbs, not participial adjectives
    if re.search(r'past', m_raw.lower()) or re.match(r'^[a-z]+ed\s+(?:at|to|for|up|down|out|on|in|off|over|about)$', m_clean):
        return 'verb'

    # Bare past-participle gloss ('stolen', 'tired', 'arrived') is a participial adjective,
    # unless the target is a simple-past verb form (Dutch/Swedish/German -te/-de/-ade)
    if len(m_words) == 1 and len(m_clean) > 4 and (
            re.search(r'[^e]ed$', m_clean) or (m_clean.endswith('en') and 'ge' in t_clean)):
        if len(words) == 1 and not t_clean.startswith('ge') and (
                (target_lang in ('nl', 'de') and t_clean.endswith(('te', 'de', 'ten', 'den')))
                or (target_lang == 'sv' and t_clean.endswith(('ade', 'ede', 'de', 'te')))):
            return 'verb'
        return 'adjective'

    # English adverbs/prepositions/particles (closed class) are not nouns, verbs or adjectives
    if len(m_words) <= 2 and m_words and (
            re.search(r'[a-z]{2,}[^aeilpy]ly$', m_words[-1]) or ' '.join(m_words) in FUNCTION_WORD_GLOSSES):
        return 'other'

    # Plural English gloss ('medicines', 'running shoes') marks a noun even when the
    # target ends like an infinitive (Dutch/German plurals end in -en)
    if m_words and len(m_words[-1]) > 3 and re.search(r'[^sui]s$', m_words[-1]):
        return 'noun'

    # Usage in the example sentence outranks bare word-ending morphology
    ctx = context_pos(t_core, example, target_lang)
    if ctx:
        return ctx

    # Language-specific verb morphology
    if target_lang == 'de' and len(words) == 1 and t_clean.endswith(('en', 'eln', 'ern')) and not t_core[0].isupper():
        return 'verb'
    if target_lang in ['es', 'it', 'pt'] and len(words) == 1 and t_clean.endswith(('ar', 'er', 'ir')):
        return 'verb'
    if target_lang == 'fr' and len(words) == 1 and t_clean.endswith(('er', 'ir', 're')):
        return 'verb'
    if target_lang == 'nl' and len(words) == 1 and t_clean.endswith('en'):
        return 'verb'
    if target_lang == 'sv' and len(words) == 1 and t_clean.endswith('a'):
        return 'verb'
    if target_lang == 'ko' and t_core.endswith('다') and len(t_core) <= 4:
        return 'verb'

    # 3. Adjectives
    adj_suffixes = ('ous', 'less', 'tive', 'sive')
    if len(m_words) == 1:
        if any(m_clean.endswith(s) for s in adj_suffixes) or (m_clean.endswith('ful') and len(m_clean) > 5):
            return 'adjective'
        # Adjectives ending in -y. Skipped for languages that have their own morphology
        # rules below; common noun endings (-ity, -ery, -ory, vowel+y, ...) are excluded.
        if (target_lang in ('zh', 'fr', 'nl', 'sv') and m_clean.endswith('y') and len(m_clean) > 4
                and not re.search(r'(?:[aeiou]y|ity|[aeo]ry|ogy|phy|rty|try|ody|aby|ady|ily|ney)$', m_clean)):
            return 'adjective'
    if m_clean.startswith(('very ', 'too ', 'so ')):
        return 'adjective'

    # Target language adjective morphology
    if target_lang == 'ja' and (t_core.endswith('い') or t_core.endswith('らしい') or t_core.endswith('そう')) and len(t_core) <= 5 and not t_core.endswith('行い'):
        return 'adjective'
    if target_lang == 'de' and len(words) == 1 and not t_core[0].isupper():
        if any(t_clean.endswith(s) for s in ['ig', 'lich', 'isch', 'bar', 'sam', 'haft', 'los']):
            return 'adjective'
    if target_lang in ['es', 'it', 'pt'] and len(words) == 1:
        if any(t_clean.endswith(s) for s in ['oso', 'osa', 'able', 'ible', 'ante', 'ente']):
            return 'adjective'

    # 4. Nouns
    if m_clean.startswith(('the ', 'a ', 'an ')):
        return 'noun'
    all_articles = [
        'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer',
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'le', 'les', 'une', 'il', 'lo', 'gli', 'o', 'os', 'as', 'um', 'uma',
        'het', 'de', 'en', 'ett'
    ]
    if any(t_clean.startswith(a + ' ') for a in all_articles) or t_clean.startswith(("l'", "d'")):
        return 'noun'
    if target_lang == 'de' and t_core[0].isupper() and len(words) == 1:
        return 'noun'

    # German nouns are capitalised, so a bare lowercase German word that matched no
    # verb/adjective cue is an adverb/particle, not a noun
    if target_lang == 'de' and len(words) == 1 and t_core[0].islower():
        return 'other'

    # Fallback
    if len(words) > 2:
        return 'phrase'
    return 'noun'


def clean_sentence_boundary(text: str) -> str:
    """Trim a sentence to its natural terminal boundary, dropping appended host narration."""
    text = text.strip()
    if not text:
        return ''
    # Strip any trailing comma
    text = re.sub(r'[,，]\s*$', '', text).strip()

    # Pattern 1: Quoted utterance followed by optional comma/space and narration
    # Supports ASCII quotes "", Japanese brackets 「」, smart quotes “”, or standalone single quotes
    m_q = re.match(r'^((?:[^\",]*?\"[^\"]+?\"|“[^”]+”|「[^」]+」|^\'[^\']+\')(?:[^\",\']*\))?)\s*[,，]?\s*.*$', text)
    if m_q:
        return m_q.group(1).strip()

    # Pattern 2: Complete sentence ending with terminal punctuation [.!?。！？] (or parenthesized note)
    # followed by optional comma/space and host narration or new clause
    # Look for the last terminal punctuation before a comma/narration
    m_s = re.search(r'([.!?。！？](?:\s*\(.*?\))?(?:[\"\'\)\”\’])?)\s*[,，]\s*[^\W\d_].*$', text)
    if m_s:
        cand = text[:m_s.start(1) + len(m_s.group(1))].strip()
        if not re.search(r'\b(Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e|ca|approx|etc)\.$', cand, re.I):
            return cand

    # Pattern 3: Clean sentence ending at terminal punctuation followed by capitalized remark without space (e.g. ?Gut gemacht!)
    m_c = re.match(r'^(.*?[.!?。！？](?:\s*\(.*?\))?(?:[\"\'\)\”\’])?)\s*([A-Za-z\u00c0-\u024f\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7a3].*)$', text)
    if m_c:
        cand = m_c.group(1).strip()
        rem = m_c.group(2).strip()
        if rem and (rem[0].isupper() or STORY_RETURN_REGEX.search(rem)):
            if not re.search(r'\b(Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e|ca|approx|etc)\.$', cand, re.I):
                return cand

    # Pattern 4: Clean sentence ending at terminal punctuation alone
    m_end = re.match(r'^(.*?[.!?。！？](?:[\"\'\)\”\’])?)\s*$', text)
    if m_end:
        return m_end.group(1).strip()

    return text


def parse_vocabulary(text: str, target_lang: str, source_lang: str = 'en') -> list[dict[str, str]]:
    """
    Parse vocabulary items from an episode transcript.
    Accurately identifies Group 1 (Vocabulary Spotlight words with context examples)
    and Group 2 (Dialogue practice drill phrases), cleaning all host remarks.
    """
    lines = text.split('\n')
    groups: list[list[str]] = []
    current_group: list[str] = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith(('-', '*', '•')):
            current_group.append(stripped)
        else:
            if current_group:
                groups.append(current_group)
                current_group = []
    if current_group:
        groups.append(current_group)

    items: list[dict[str, str]] = []
    seen_targets: set[str] = set()

    for g_idx, group in enumerate(groups):
        # In podcast format, Group 0 is Spotlight vocabulary; Group 1+ is Sentence drills
        is_drill_group = (len(groups) >= 2 and g_idx >= 1)

        for line in group:
            cleaned = re.sub(r'^[\-\*\•]\s*', '', line).strip()
            parts = re.split(r'\s*[\—\–]\s*|\s+-\s+', cleaned, maxsplit=1)
            if len(parts) < 2:
                continue

            target = parts[0].strip()
            rest = parts[1].strip()

            if not target or not rest:
                continue

            # Case and punctuation insensitive deduplication
            norm_key = re.sub(r'\s+', ' ', target.lower().strip('。！!?. '))
            if norm_key in seen_targets:
                continue
            seen_targets.add(norm_key)

            if is_drill_group:
                pos = 'phrase'
                meaning = clean_sentence_boundary(rest)
                example = ''
            else:
                # Group 0: Spotlight word with example sentence
                split_rest = re.split(r'\s*[\—\–]\s*|[,.]\s+', rest, maxsplit=1)
                meaning = split_rest[0].strip()
                example = split_rest[1].strip() if len(split_rest) > 1 else ''

                meaning = clean_sentence_boundary(meaning)
                example = clean_sentence_boundary(example)

                # If example is purely a story return transition remark without the target word
                t_core = re.sub(r'\(.*?\)|（.*?）', '', target).strip().lower()
                if STORY_RETURN_REGEX.search(example) and t_core not in example.lower():
                    example = ''

                meaning, example = clean_cjk_example(meaning, example, target_lang)
                pos = classify_pos(target, meaning, target_lang, example, source_lang)

            items.append({
                'target': target,
                'pos': pos,
                'meaning': meaning,
                'example': example,
            })

    return items


def process_show(
    show_id: str,
    cfg: dict[str, str],
    source_root: Path,
    out_dir: Path
) -> int:
    """Process all episodes of a show from external disk and write consolidated JSON."""
    folder_path = source_root / cfg['folder']
    if not folder_path.exists():
        print(f"⚠️  [{show_id}] Directory not found: {folder_path}")
        return 0

    episodes_data: dict[str, dict] = {}
    target_lang = cfg['target_lang']

    season_dirs = sorted(folder_path.glob('season_*'))
    for s_dir in season_dirs:
        m_s = re.search(r'season_(\d+)', s_dir.name)
        if not m_s:
            continue
        season_num = int(m_s.group(1))

        ep_dirs = sorted(s_dir.glob('episode_*'))
        for ep_dir in ep_dirs:
            m_e = re.search(r'episode_(\d+)', ep_dir.name)
            if not m_e:
                continue
            episode_num = int(m_e.group(1))

            txt_file = ep_dir / 'transcript.txt'
            if not txt_file.exists():
                continue

            try:
                transcript_text = txt_file.read_text(encoding='utf-8').strip()
            except Exception as err:
                print(f"  ❌ Error reading {txt_file}: {err}")
                continue

            title = None
            cefr_level = None
            pkg_file = ep_dir / 'episode_package.json'
            if pkg_file.exists():
                try:
                    pkg_data = json.loads(pkg_file.read_text(encoding='utf-8'))
                    title = pkg_data.get('episode_title')
                    cefr_level = pkg_data.get('cefr_level')
                except Exception:
                    pass

            vocab = parse_vocabulary(transcript_text, target_lang, cfg['source_lang'])

            key = f"s{season_num}e{episode_num}"
            episodes_data[key] = {
                'season': season_num,
                'episode': episode_num,
                'key': key,
                'title': title,
                'cefrLevel': cefr_level,
                'transcript': transcript_text,
                'vocabulary': vocab,
            }

    out_file = out_dir / f"{show_id}.json"
    result_obj = {
        'showId': show_id,
        'totalTranscripts': len(episodes_data),
        'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'episodes': episodes_data,
    }

    out_file.write_text(json.dumps(result_obj, ensure_ascii=False, indent=2), encoding='utf-8')
    return len(episodes_data)


def reprocess_existing(out_dir: Path) -> int:
    """Reprocess vocabulary extraction directly from existing committed transcript JSONs."""
    total = 0
    for show_id, cfg in SHOW_CONFIGS.items():
        json_file = out_dir / f"{show_id}.json"
        if not json_file.exists():
            continue
        data = json.loads(json_file.read_text(encoding='utf-8'))
        episodes = data.get('episodes', {})
        target_lang = cfg['target_lang']

        for ep in episodes.values():
            raw_text = ep.get('transcript', '')
            if raw_text:
                ep['vocabulary'] = parse_vocabulary(raw_text, target_lang, cfg['source_lang'])

        data['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        json_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        total += len(episodes)
        print(f"✅ [{show_id:20}] Re-processed {len(episodes):4d} transcripts")
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="Import podcast transcripts and extract vocabulary.")
    parser.add_argument(
        '--source-dir',
        type=Path,
        default=Path('/media/yeshi/Samsung_T5/Small Talk Cafe Podcasts/Podcasts'),
        help="Path to the external drive containing podcast episode directories."
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path(__file__).resolve().parents[1] / 'src' / 'data' / 'transcripts',
        help="Directory to save the generated JSON files."
    )
    parser.add_argument(
        '--reprocess-existing',
        action='store_true',
        help="Reprocess and re-classify vocabulary directly from existing committed JSON files."
    )
    args = parser.parse_args()

    source_dir: Path = args.source_dir
    output_dir: Path = args.output_dir

    output_dir.mkdir(parents=True, exist_ok=True)
    start_time = time.time()

    if args.reprocess_existing or not source_dir.exists():
        if not source_dir.exists():
            print(f"ℹ️  Source directory {source_dir} not mounted.")
            print("🔄 Processing and updating vocabulary from existing committed transcripts in repository...")
        else:
            print("🔄 Re-processing existing transcripts in repository...")
        print(f"💾 Saving to:    {output_dir}\n")
        total = reprocess_existing(output_dir)
        elapsed = time.time() - start_time
        print(f"\n🎉 Done! Re-processed {total} transcripts across {len(SHOW_CONFIGS)} shows in {elapsed:.2f}s.\n")
        return

    print(f"\n📂 Reading from: {source_dir}")
    print(f"💾 Saving to:    {output_dir}\n")

    total_imported = 0
    for show_id, cfg in SHOW_CONFIGS.items():
        count = process_show(show_id, cfg, source_dir, output_dir)
        total_imported += count
        print(f"✅ [{show_id:20}] Imported {count:4d} transcripts")

    elapsed = time.time() - start_time
    print(f"\n🎉 Done! Imported {total_imported} transcripts across {len(SHOW_CONFIGS)} shows in {elapsed:.2f}s.\n")


if __name__ == '__main__':
    main()

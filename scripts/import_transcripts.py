#!/usr/bin/env python3
"""
Import transcripts and extract vocabulary tables from Samsung T5 drive
into the Small Talk Café Podcasts website data directory.

Strictly READ-ONLY regarding the external drive.
Generates structured JSON per show under src/data/transcripts/<show-id>.json.

Usage:
  python3 scripts/import_transcripts.py
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

COMMON_EN_ADJ = {
    'good', 'bad', 'big', 'small', 'old', 'new', 'beautiful', 'ugly', 'fast', 'slow',
    'early', 'late', 'cold', 'warm', 'hot', 'bright', 'dark', 'delicious', 'cozy', 'important',
    'quiet', 'loud', 'clean', 'dirty', 'expensive', 'cheap', 'easy', 'hard', 'difficult',
    'ready', 'tired', 'sick', 'healthy', 'fresh', 'round', 'blue', 'red', 'green', 'yellow',
    'white', 'black', 'sharp', 'tasty', 'sweet', 'sour', 'bitter', 'salty', 'kind', 'friendly',
    'calm', 'simple', 'helpful', 'wonderful', 'special', 'busy', 'safe', 'correct'
}

TRAIL_REMARKS = [
    r',?\s*Gut gemacht!.*',
    r',?\s*Sehr gut!.*',
    r',?\s*Weiter so!.*',
    r',?\s*Ausgezeichnet!.*',
    r',?\s*Perfekt!.*',
    r',?\s*Toll gemacht!.*',
    r',?\s*Wunderbar!.*',
    r',?\s*Super!.*',
    r',?\s*Klasse!.*',
    r',?\s*Maintenant, retour.*',
    r',?\s*Ahora que tenemos estas palabras.*',
    r',?\s*Ahora que conocemos estas palabras.*',
    r',?\s*Ahora,?\s*volvamos.*',
    r',?\s*Ottimo!.*',
    r',?\s*さあ、物語に戻りましょう.*',
    r',?\s*İyi iş!.*',
    r',?\s*Tudo bem!.*',
    r',?\s*Goed gedaan!.*',
    r',?\s*Bra jobbat!.*',
    r',?\s*Let\'s return to.*',
    r',?\s*Now, let\'s.*',
    r',?\s*Now back to.*',
]
COMBINED_TRAIL = re.compile('|'.join(TRAIL_REMARKS), re.IGNORECASE)


def classify_pos(target: str, meaning: str, target_lang: str) -> str:
    """Classify a vocabulary entry into noun, verb, adjective, or phrase."""
    t_raw = target.strip()
    t_clean = t_raw.lower()
    m_clean = meaning.strip().lower()
    words = t_clean.split()
    m_words = m_clean.split()

    if not words:
        return 'phrase'

    # 1. Questions, greetings, idioms, multi-word phrases
    if '?' in t_raw or '!' in t_raw or len(words) > 3:
        return 'phrase'

    # 2. Verbs
    if m_clean.startswith('to ') or m_clean.startswith('to\t'):
        return 'verb'
    if target_lang == 'de' and len(words) == 1 and (t_clean.endswith('en') or t_clean.endswith('eln') or t_clean.endswith('ern')) and not t_raw[0].isupper():
        return 'verb'
    if target_lang in ['es', 'it', 'pt'] and len(words) == 1 and (t_clean.endswith('ar') or t_clean.endswith('er') or t_clean.endswith('ir')):
        return 'verb'
    if target_lang == 'fr' and len(words) == 1 and (t_clean.endswith('er') or t_clean.endswith('ir') or t_clean.endswith('re')):
        return 'verb'
    if target_lang == 'nl' and len(words) == 1 and t_clean.endswith('en'):
        return 'verb'

    # 3. Adjectives (by target language forms and meaning)
    if target_lang == 'de' and len(words) == 1:
        if any(t_clean.endswith(s) for s in ['ig', 'lich', 'isch', 'bar', 'sam', 'haft', 'los']) and not t_raw[0].isupper():
            return 'adjective'
        if t_clean in {'hungrig', 'durstig', 'müde', 'satt', 'voll', 'leer', 'lecker', 'warm', 'kalt', 'hell', 'dunkel', 'ruhig', 'laut', 'sauber', 'schön'}:
            return 'adjective'
    if target_lang in ['es', 'it', 'pt'] and len(words) == 1:
        if any(t_clean.endswith(s) for s in ['oso', 'osa', 'able', 'ible', 'ante', 'ente']):
            return 'adjective'
        if t_clean in {'fresco', 'fresca', 'rico', 'rica', 'caliente', 'frío', 'fría', 'limpio', 'limpia', 'cansado', 'cansada', 'hambriento', 'hambrienta'}:
            return 'adjective'
    if target_lang == 'fr' and len(words) == 1:
        if any(t_clean.endswith(s) for s in ['eux', 'euse', 'able', 'ible', 'ant', 'ante']):
            return 'adjective'
        if t_clean in {'frais', 'fraîche', 'chaud', 'chaude', 'froid', 'froide', 'propre', 'prêt', 'prête'}:
            return 'adjective'

    if len(m_words) == 1 and (m_words[0] in COMMON_EN_ADJ or any(m_words[0].endswith(s) for s in ['ful', 'ous', 'able', 'ible', 'ive', 'ic', 'ish', 'less', 'al'])):
        return 'adjective'
    if len(m_words) == 2 and m_words[0] in ['very', 'too', 'so', 'more']:
        return 'adjective'

    # 4. Nouns with articles, capitalized, or single concept words
    if target_lang == 'de':
        if any(t_clean.startswith(a + ' ') for a in ['der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer']):
            return 'noun'
        if t_raw[0].isupper() and len(words) == 1:
            return 'noun'

    # Romance and other language articles
    romance_articles = ['el', 'la', 'los', 'las', 'un', 'una', 'le', 'les', 'une', 'il', 'lo', 'gli', 'o', 'os', 'as', 'um', 'uma', 'het', 'de', 'en', 'ett']
    if any(t_clean.startswith(a + ' ') for a in romance_articles):
        return 'noun'
    if t_clean.startswith("l'") or t_clean.startswith("d'"):
        return 'noun'

    # Romance single nouns (e.g. estudio, micrófono, auriculares, volumen, sonido)
    if target_lang in ['es', 'it', 'pt', 'fr'] and len(words) == 1:
        if any(t_clean.endswith(s) for s in ['o', 'a', 'os', 'as', 'es', 'ón', 'ión', 'dad', 'tad', 'or', 'men', 'eur', 'e']):
            return 'noun'

    # 5. Multi-word phrases
    if len(words) > 1:
        return 'phrase'

    # 6. Default fallback
    if t_raw[0].isupper():
        return 'noun'

    return 'noun'


def parse_vocabulary(text: str, target_lang: str) -> list[dict[str, str]]:
    """Parse vocabulary items from the Language Spotlight section of a transcript."""
    items: list[dict[str, str]] = []
    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if not (line.startswith('-') or line.startswith('*') or line.startswith('•')):
            continue

        # Strip initial bullet
        cleaned = re.sub(r'^[\-\*\•]\s*', '', line).strip()
        # Look for dash separator between target and meaning
        parts = re.split(r'\s*[\—\–]\s*|\s+-\s+', cleaned, maxsplit=1)
        if len(parts) < 2:
            continue

        target = parts[0].strip()
        rest = parts[1].strip()

        # Clean trailing teacher transition remarks from the last item
        rest = COMBINED_TRAIL.sub('', rest).strip()

        # Split meaning and example sentence on comma, period, semicolon, or colon
        split_rest = re.split(r'[,.;:]\s+', rest, maxsplit=1)
        meaning = split_rest[0].strip()
        example = split_rest[1].strip() if len(split_rest) > 1 else ''

        # Filter out listener drills (which are full sentences, usually > 6 words in target)
        if len(target.split()) > 6 or target.endswith('.'):
            continue
        if not target or not meaning:
            continue

        pos = classify_pos(target, meaning, target_lang)
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
    """Process all episodes of a show and write a consolidated JSON file."""
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
                # User instruction: ignore episodes missing transcript.txt
                continue

            try:
                transcript_text = txt_file.read_text(encoding='utf-8').strip()
            except Exception as err:
                print(f"  ❌ Error reading {txt_file}: {err}")
                continue

            # Read optional package metadata if available
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

            # Extract vocabulary items
            vocab = parse_vocabulary(transcript_text, target_lang)

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
    args = parser.parse_args()

    source_dir: Path = args.source_dir
    output_dir: Path = args.output_dir

    if not source_dir.exists():
        print(f"❌ Source directory does not exist: {source_dir}")
        print("Please verify the Samsung T5 drive is plugged in and mounted.")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n📂 Reading from: {source_dir}")
    print(f"💾 Saving to:    {output_dir}\n")

    start_time = time.time()
    total_imported = 0

    for show_id, cfg in SHOW_CONFIGS.items():
        count = process_show(show_id, cfg, source_dir, output_dir)
        total_imported += count
        print(f"✅ [{show_id:20}] Imported {count:4d} transcripts")

    elapsed = time.time() - start_time
    print(f"\n🎉 Done! Imported {total_imported} transcripts across {len(SHOW_CONFIGS)} shows in {elapsed:.2f}s.\n")


if __name__ == '__main__':
    main()

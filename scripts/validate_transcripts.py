#!/usr/bin/env python3
"""
Comprehensive Validation Script for Podcast Transcripts and Vocabulary Data.

Audits all transcript JSON datasets under src/data/transcripts/ to ensure:
1. Structural integrity and JSON validity
2. Vocabulary schema compliance (target, meaning, pos, example)
3. Strict POS classification (noun, verb, adjective, phrase)
4. Absence of sentence-level punctuation in nouns/verbs/adjectives
5. Absence of leaked host remarks / praise in examples and meanings
6. Deduplication of vocabulary targets within episodes
7. Statistical distribution health across all shows

Usage:
  python3 scripts/validate_transcripts.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'transcripts'
EXPECTED_SHOWS = {
    'english-german', 'spanish-german', 'french-german', 'italian-german', 'turkish-german',
    'english-spanish', 'english-french', 'english-italian', 'english-swedish',
    'english-portuguese', 'english-dutch', 'english-japanese', 'english-korean', 'english-mandarin'
}

VALID_POS = {'noun', 'verb', 'adjective', 'phrase', 'other'}

SUSPICIOUS_LEAK_PATTERNS = [
    # German praise & transitions
    r'\b(?:gut|sehr gut|toll|super|ausgezeichnet|perfekt|klasse)\s+gemacht\b',
    r'\b(?:weiter so|du hast toll geübt|große fortschritte)\b',
    r'\b(?:zurück|weiter)\s+(?:zur|mit der)\s+geschichte\b',
    # French praise & transitions
    r'\b(?:bien joué|excellent travail|très bien pratiqué|continuez comme ça|vous progressez très bien|magnifique travail)\b',
    r'\b(?:retour à l\'histoire|revenons à l\'histoire)\b',
    # Spanish praise & transitions
    r'\b(?:¡?muy bien!|¡?excelente trabajo!|¡?buen trabajo!|¡?genial!|¡?fantástico!)\b',
    r'\b(?:volvamos a la historia|regresemos a la historia)\b',
    # Italian praise & transitions
    r'\b(?:bravissimo|ottimo lavoro|fantastico lavoro|avete fatto un ottimo lavoro)\b',
    r'\b(?:torniamo alla storia)\b',
    # Portuguese praise & transitions
    r'\b(?:muito bem!|ótimo trabalho!|excelente trabalho!|parabéns!|vocês estão indo muito bem)\b',
    r'\b(?:voltando à história|vamos voltar à história)\b',
    # Dutch praise & transitions
    r'\b(?:(?:goed|super|fantastisch|heel goed)\s+gedaan|mooi zo!|je leert snel)\b',
    r'\b(?:terug naar het verhaal|verdergaan met het verhaal)\b',
    # Swedish praise & transitions
    r'\b(?:bra jobbat|mycket bra gjort|fantastiskt jobbat)\b',
    r'\b(?:tillbaka till berättelsen)\b',
    # Turkish praise & transitions
    r'\b(?:(?:çok iyi|harika)\s+(?:iş|bir başlangıçtı\s*,\s*super)|süper yaptın|tebrikler!)\b',
    r'\b(?:hikayemize geri dönelim|öğrenmeye devam edelim)\b',
    # Asian languages praise & transitions
    r'(?:잘했어요|잘하셨어요|대단해요!|완벽해요!)',
    r'(?:이야기\s*속으로\s*돌아가|계속해서\s*이야기)',
    r'(?:よくできました|素晴らしいです！|素晴らしい！)',
    r'(?:物語に戻りましょう)',
    r'(?:你做得很好|太棒了|非常棒|继续努力)',
    r'(?:回到故事|回到.*看看)',
    # English praise & transitions
    r'\b(?:great job|well done|excellent work|fantastic job)\b',
    r'\b(?:now let\'s return to|now back to the story|back to our story)\b'
]
LEAK_REGEX = re.compile('|'.join(SUSPICIOUS_LEAK_PATTERNS), re.IGNORECASE)


def validate_all_transcripts() -> bool:
    print(f"\n🔍 Auditing all transcript datasets in {DATA_DIR}...\n")
    if not DATA_DIR.exists():
        print(f"❌ Transcripts directory not found: {DATA_DIR}")
        return False

    json_files = sorted(DATA_DIR.glob('*.json'))
    if not json_files:
        print(f"❌ No JSON files found in {DATA_DIR}")
        return False

    found_shows = {f.stem for f in json_files}
    missing_shows = EXPECTED_SHOWS - found_shows
    if missing_shows:
        print(f"❌ Missing expected shows: {missing_shows}")
        return False

    total_episodes = 0
    total_vocab = 0
    pos_totals = {pos: 0 for pos in VALID_POS}
    errors: list[str] = []
    warnings: list[str] = []

    for jf in json_files:
        show_id = jf.stem
        try:
            content = jf.read_text(encoding='utf-8')
            data = json.loads(content)
        except Exception as e:
            errors.append(f"[{show_id}] Invalid JSON format: {e}")
            continue

        if data.get('showId') != show_id:
            errors.append(f"[{show_id}] showId mismatch: expected {show_id}, got {data.get('showId')}")

        episodes = data.get('episodes', {})
        if not episodes:
            warnings.append(f"[{show_id}] Zero episodes found in dataset.")
            continue

        show_vocab_count = 0
        show_pos = {pos: 0 for pos in VALID_POS}

        for ep_key, ep in episodes.items():
            total_episodes += 1
            raw_transcript = ep.get('transcript', '')
            if not raw_transcript:
                warnings.append(f"[{show_id}/{ep_key}] Missing raw transcript text.")

            vocab = ep.get('vocabulary', [])
            seen_targets: set[str] = set()

            for idx, item in enumerate(vocab):
                show_vocab_count += 1
                total_vocab += 1
                target = item.get('target', '').strip()
                meaning = item.get('meaning', '').strip()
                pos = item.get('pos', '').strip()
                example = item.get('example', '').strip()

                # 1. Non-empty target and meaning
                if not target:
                    errors.append(f"[{show_id}/{ep_key} #{idx}] Empty vocabulary target.")
                if not meaning:
                    errors.append(f"[{show_id}/{ep_key} #{idx}] Empty vocabulary meaning.")

                # 2. Valid POS tag
                if pos not in VALID_POS:
                    errors.append(f"[{show_id}/{ep_key} #{idx}] Invalid POS '{pos}' for target '{target}'.")
                else:
                    show_pos[pos] += 1
                    pos_totals[pos] += 1

                # 3. Sentence punctuation in non-phrase POS
                if pos in ['noun', 'verb', 'adjective']:
                    t_core = re.sub(r'\(.*?\)|（.*?）', '', target).strip()
                    if any(p in t_core for p in ['。', '！', '？', '…', '...']) or ('?' in t_core) or ('!' in t_core):
                        errors.append(f"[{show_id}/{ep_key} #{idx}] Sentence punctuation in {pos}: '{target}'.")
                    elif t_core.endswith('.') and not re.search(r'\b(pl|sing|approx|etc|ca)\.$', t_core, re.I):
                        errors.append(f"[{show_id}/{ep_key} #{idx}] Sentence full-stop in {pos}: '{target}'.")

                # 4. Check for leaked teacher narration/praise
                t_lower = target.lower()
                is_dialogue_target = any(phrase in t_lower for phrase in ['gut gemacht', 'bien joué', 'well done', 'bravo', 'ottimo', 'parabéns'])

                if LEAK_REGEX.search(example):
                    errors.append(f"[{show_id}/{ep_key} #{idx}] Leaked host remark in example: '{example}'.")
                if LEAK_REGEX.search(meaning) and not is_dialogue_target:
                    errors.append(f"[{show_id}/{ep_key} #{idx}] Leaked host remark in meaning: '{meaning}'.")

                # 5. Check duplicate targets in same episode
                norm_target = re.sub(r'\s+', ' ', target.lower().strip('。！!?. '))
                if norm_target in seen_targets:
                    warnings.append(f"[{show_id}/{ep_key}] Duplicate target '{target}' in episode vocabulary.")
                seen_targets.add(norm_target)

        print(f"📊 [{show_id:20}] {len(episodes):4d} eps | Vocab: {show_vocab_count:5d} (N: {show_pos['noun']:4d}, V: {show_pos['verb']:4d}, Adj: {show_pos['adjective']:3d}, Phr: {show_pos['phrase']:4d})")

    print("\n" + "=" * 70)
    print("📈 TOTAL VALIDATION SUMMARY:")
    print(f"   Shows Validated:       {len(json_files)} / {len(EXPECTED_SHOWS)}")
    print(f"   Episodes Checked:      {total_episodes}")
    print(f"   Vocabulary Items:      {total_vocab}")
    print(f"   Part-of-Speech Counts: Nouns: {pos_totals['noun']}, Verbs: {pos_totals['verb']}, Adjectives: {pos_totals['adjective']}, Phrases: {pos_totals['phrase']}, Other: {pos_totals['other']}")
    print(f"   Warnings:              {len(warnings)}")
    print(f"   Errors:                {len(errors)}")
    print("=" * 70 + "\n")

    if warnings:
        print(f"⚠️  {len(warnings)} Warnings (first 10):")
        for w in warnings[:10]:
            print(f"   - {w}")
        print()

    if errors:
        print(f"❌ {len(errors)} ERRORS ENCOUNTERED:")
        for err in errors[:25]:
            print(f"   - {err}")
        print()
        return False

    print("🎉 ALL 14 TRANSCRIPT DATASETS PASSED VALIDATION PERFECTLY!\n")
    return True


if __name__ == '__main__':
    success = validate_all_transcripts()
    sys.exit(0 if success else 1)

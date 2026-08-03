# -*- coding: utf-8 -*-
"""
BUILD + VALIDATE  ->  emojimatch_data.json

EMOJI MATCH: se muestran 3 emojis y el jugador elige la palabra
correcta entre 4 opciones. Sin timer, sin vidas.

La dificultad la dan DOS cosas a la vez:
  basic         palabras muy comunes  + distractores de OTRO campo semantico
  intermediate  palabras medias       + distractores del MISMO campo
  advanced      palabras menos comunes+ distractores del MISMO campo, y se
                prefieren los mas parecidos en longitud y letra inicial

Uso:
    python build_emojimatch.py /ruta/a/english11
"""

import json, os, sys, random
from collections import defaultdict

from emojimatch_new_words import NEW_WORDS
from emojimatch_categories import CATEGORIES, MISSING_DEFS
from wordfreq import zipf_frequency as zipf

random.seed(11)
OUT = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else "."

report = []
def log(s=""):
    print(s); report.append(str(s))

OPTIONS       = 4     # 1 correcta + 3 distractores
ROUNDS        = 8     # rondas por partida
MIN_GAMES     = 12    # partidas sin repetir que queremos por nivel

# ------------------------------------------------------------------
# 1. Reunir el pool completo:  palabra -> {emojis, category}
# ------------------------------------------------------------------
word2cat = {}
for cat, words in CATEGORIES.items():
    for w in words:
        word2cat[w] = cat

eb = json.load(open(os.path.join(PROJ, "emojibomb_data.json"), encoding="utf-8"))
pool = {}
sin_categoria = []

for lvl, items in eb["words"]["basico"].items():
    for it in items:
        w = it["word"].upper()
        if w in pool:
            continue
        cat = word2cat.get(w)
        if cat is None:
            sin_categoria.append(w)
            continue
        pool[w] = {"emojis": it["emojis"], "category": cat, "source": "emojibomb"}

for w, (emojis, cat, en, es) in NEW_WORDS.items():
    w = w.upper()
    if w in pool:
        continue
    pool[w] = {"emojis": emojis, "category": cat, "source": "new"}

log("=" * 62)
log("POOL DE PALABRAS")
log("=" * 62)
log(f"reutilizadas de Emoji Bomb : {sum(1 for v in pool.values() if v['source']=='emojibomb')}")
log(f"nuevas A1 creadas          : {sum(1 for v in pool.values() if v['source']=='new')}")
log(f"TOTAL                      : {len(pool)}")
if sin_categoria:
    log(f"!! sin categoria asignada ({len(sin_categoria)}): {sin_categoria}")
log()
by_cat = defaultdict(list)
for w, v in pool.items():
    by_cat[v["category"]].append(w)
for c in sorted(by_cat):
    log(f"  {c:11} {len(by_cat[c]):3}")
log()

# ------------------------------------------------------------------
# 2. Definiciones bilingues
# ------------------------------------------------------------------
defs_file = json.load(open(os.path.join(PROJ, "definitions.json"), encoding="utf-8"))
existing = defs_file["definitions"]

additions = {}
for w, (en, es) in MISSING_DEFS.items():
    if w.upper() not in existing:
        additions[w.upper()] = {"en": en, "es": es}
for w, (emojis, cat, en, es) in NEW_WORDS.items():
    if w.upper() not in existing:
        additions[w.upper()] = {"en": en, "es": es}

have = set(existing) | set(additions)
no_def = sorted(w for w in pool if w not in have)

log("=" * 62)
log("DEFINICIONES")
log("=" * 62)
log(f"ya existian en definitions.json : {sum(1 for w in pool if w in existing)}")
log(f"nuevas a agregar                : {len(additions)}")
log(f"palabras del pool SIN definicion: {len(no_def)}")
if no_def:
    log(f"  {no_def}")
log()

# ------------------------------------------------------------------
# 3. Reparto por nivel segun frecuencia de la palabra
# ------------------------------------------------------------------
ranked = sorted(pool.keys(), key=lambda w: zipf(w.lower(), "en"), reverse=True)
n = len(ranked)
tiers = {
    "basic":        ranked[: int(n * 0.55)],
    "intermediate": ranked[int(n * 0.22): int(n * 0.85)],
    "advanced":     ranked[int(n * 0.45):],
}
# se solapan a proposito: una palabra media puede salir en dos niveles,
# lo que cambia es la dureza de los distractores.

# ------------------------------------------------------------------
# 4. Motor de distractores
# ------------------------------------------------------------------
def similarity(a, b):
    """que tan parecidas se ven dos palabras (0..1) — para advanced"""
    s = 0.0
    if a[0] == b[0]:
        s += 0.5
    s += max(0.0, 1 - abs(len(a) - len(b)) / 6) * 0.5
    return s

def pick_distractors(word, level, candidates):
    cat = pool[word]["category"]
    # Regla anti-ambiguedad: descartar cualquier candidato cuyo propio set
    # de emojis comparta 2+ emojis con el de la respuesta. Si no, la ronda
    # tendria dos respuestas defendibles (ej. PENCIL vs RULER con ✏️📐).
    ans_em = set(pool[word]["emojis"])
    candidates = {w for w in candidates
                  if len(ans_em & set(pool[w]["emojis"])) < 2 or w == word}
    if level == "basic":
        # campos DISTINTOS, y uno por campo para que se eliminen facil
        others = [c for c in by_cat if c != cat]
        random.shuffle(others)
        out = []
        for c in others:
            opts = [w for w in by_cat[c] if w != word and w in candidates]
            if opts:
                out.append(random.choice(opts))
            if len(out) == OPTIONS - 1:
                break
        return out
    # intermediate y advanced: MISMO campo semantico
    same = [w for w in by_cat[cat] if w != word and w in candidates]
    if level == "advanced":
        same.sort(key=lambda w: similarity(word, w), reverse=True)
        same = same[: max(OPTIONS * 3, 9)]      # los mas confundibles
        random.shuffle(same)
    else:
        random.shuffle(same)
    out = same[: OPTIONS - 1]
    if len(out) < OPTIONS - 1:                   # campo pequeno: rellenar
        extra = [w for w in candidates
                 if w != word and w not in out and w not in by_cat[cat]]
        random.shuffle(extra)
        out += extra[: OPTIONS - 1 - len(out)]
    return out

rounds_out = {}
for level, words in tiers.items():
    cands = set(w for w in pool if w in have)
    built = []
    for w in words:
        if w not in have:
            continue
        d = pick_distractors(w, level, cands)
        if len(d) != OPTIONS - 1:
            continue
        opts = [w] + d
        random.shuffle(opts)
        built.append({
            "answer": w,
            "emojis": pool[w]["emojis"],
            "category": pool[w]["category"],
            "options": opts,
        })
    rounds_out[level] = built

# ------------------------------------------------------------------
# 5. Validaciones
# ------------------------------------------------------------------
log("=" * 62)
log("VALIDACION")
log("=" * 62)
errors, warns = [], []

for level, items in rounds_out.items():
    log(f"\n[{level.upper()}]  {len(items)} rondas disponibles")
    games = len(items) // ROUNDS
    log(f"   partidas de {ROUNDS} rondas sin repetir: ~{games}")
    if games < MIN_GAMES:
        warns.append(f"{level}: solo ~{games} partidas sin repetir (queriamos {MIN_GAMES}+)")

    for it in items:
        a, o = it["answer"], it["options"]
        if len(o) != OPTIONS:
            errors.append(f"{level}/{a}: tiene {len(o)} opciones, deben ser {OPTIONS}")
        if len(set(o)) != len(o):
            errors.append(f"{level}/{a}: opciones repetidas {o}")
        if a not in o:
            errors.append(f"{level}/{a}: la respuesta correcta no esta entre las opciones")
        for x in o:
            if x not in have:
                errors.append(f"{level}/{a}: la opcion {x} no tiene definicion")
        if not (2 <= len(it["emojis"]) <= 4):
            errors.append(f"{level}/{a}: {len(it['emojis'])} emojis (esperado 3)")

    # que ninguna opcion incorrecta comparta el set de emojis de la correcta
    for it in items:
        ans_em = set(it["emojis"])
        for x in it["options"]:
            if x == it["answer"]:
                continue
            if x in pool and set(pool[x]["emojis"]) == ans_em:
                errors.append(f"{level}/{it['answer']}: la opcion {x} tiene los mismos emojis")

    # AMBIGUEDAD: un distractor cuyo propio set de emojis se solapa con
    # el de la respuesta hace la ronda dudosa (dos respuestas defendibles)
    ambiguous = []
    for it in items:
        ans_em = set(it["emojis"])
        for x in it["options"]:
            if x == it["answer"] or x not in pool:
                continue
            shared = ans_em & set(pool[x]["emojis"])
            if len(shared) >= 2:
                ambiguous.append((it["answer"], x, "".join(sorted(shared))))
    if ambiguous:
        warns.append(f"{level}: {len(ambiguous)} rondas AMBIGUAS "
                     f"(distractor comparte 2+ emojis con la respuesta)")
        for a, x, sh in ambiguous:
            log(f"   ? AMBIGUA  {a} vs {x}   comparten {sh}")

    # cercania de distractores: en basic deben ser de otro campo
    if level == "basic":
        bad = [it["answer"] for it in items
               if any(x != it["answer"] and pool.get(x, {}).get("category") == it["category"]
                      for x in it["options"])]
        if bad:
            warns.append(f"basic: {len(bad)} rondas tienen un distractor del mismo campo "
                         f"(ej. {bad[:3]}) — el pool de ese campo es grande")
    else:
        same_cnt = sum(
            1 for it in items
            for x in it["options"]
            if x != it["answer"] and pool.get(x, {}).get("category") == it["category"]
        )
        total_d = len(items) * (OPTIONS - 1)
        pct = 100 * same_cnt / total_d if total_d else 0
        log(f"   distractores del MISMO campo: {pct:.0f}%")
        if pct < 70:
            warns.append(f"{level}: solo {pct:.0f}% de distractores son del mismo campo")

log()
log("--- ERRORES ---")
log("  ninguno" if not errors else "")
for e in errors[:25]:
    log(f"  X {e}")
if len(errors) > 25:
    log(f"  ... y {len(errors)-25} mas")
log("--- ADVERTENCIAS ---")
log("  ninguna" if not warns else "")
for w in warns:
    log(f"  ! {w}")
log()

# ------------------------------------------------------------------
# 6. Salidas
# ------------------------------------------------------------------
out = {
    "game": "EMOJI MATCH",
    "version": 1,
    "levels": ["basic", "intermediate", "advanced"],
    "rules": {
        "rounds_per_game": ROUNDS,
        "options_per_round": OPTIONS,
        "timer": False,
        "lives": False,
        "on_wrong": "reveal_correct_and_advance",
        "show_meanings": "end_of_game_clickable",
        "allow_word_reuse_across_games": True,
    },
    "scoring": {"points_per_correct": 1, "max_per_game": ROUNDS},
    "difficulty_design": {
        "basic": "palabras muy comunes; los 3 distractores vienen de campos semanticos DISTINTOS",
        "intermediate": "palabras de frecuencia media; los distractores son del MISMO campo semantico",
        "advanced": "palabras menos frecuentes; distractores del mismo campo y elegidos por parecido de forma",
    },
    "rounds": rounds_out,
}
with open(os.path.join(OUT, "emojimatch_data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "emojimatch_definitions_additions.json"), "w", encoding="utf-8") as f:
    json.dump({
        "file": "emojimatch_definitions_additions.json",
        "purpose": "Definiciones bilingues nuevas para EMOJI MATCH. "
                   "Fusionar dentro de definitions.json -> definitions.",
        "count": len(additions),
        "definitions": dict(sorted(additions.items())),
    }, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "emojimatch_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

log("=" * 62)
log("ARCHIVOS GENERADOS")
log("=" * 62)
log(f"emojimatch_data.json                   ({sum(len(v) for v in rounds_out.values())} rondas)")
log(f"emojimatch_definitions_additions.json  ({len(additions)} definiciones)")
log("emojimatch_report.txt")
log()
log("RESULTADO: " + ("FALLO — hay errores" if errors else "OK — banco valido"))
sys.exit(1 if errors else 0)

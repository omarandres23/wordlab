# -*- coding: utf-8 -*-
"""
BUILD + VALIDATE  ->  realword_data.json v2  (3 niveles)

Uso:
    python build_realword.py /ruta/a/english11

Produce en la carpeta de salida:
    realword_data_v2.json          banco nuevo con 3 niveles
    definitions_additions.json     definiciones bilingues nuevas
    build_report.txt               reporte de validacion

NO sobreescribe nada del proyecto. Solo lee.
"""

import json, os, sys, re
from collections import Counter

from realword_fakes import PAST_REG, ES_SUFFIX, ES_SPELLING, SUBTLE_TYPOS, PSEUDO
from realword_advanced import ADVANCED

# ------------------------------------------------------------------
# Diccionario real de validacion + frecuencias
# ------------------------------------------------------------------
from english_words import get_english_words_set
from wordfreq import zipf_frequency

DICT = get_english_words_set(["web2"], lower=True)
ZIPF_REAL_MIN = 2.0   # una "falsa" con frecuencia alta es sospechosa

OUT = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else "."

report = []
def log(s=""):
    print(s)
    report.append(str(s))

def clean(w):
    """quita la marca _ de candidata sospechosa y normaliza"""
    return w.rstrip("_").strip().upper()

# ------------------------------------------------------------------
# 1. Cargar lo que ya existe
# ------------------------------------------------------------------
old = json.load(open(os.path.join(PROJ, "realword_data.json"), encoding="utf-8"))
defs_file = json.load(open(os.path.join(PROJ, "definitions.json"), encoding="utf-8"))
existing_defs = defs_file["definitions"]

old_real = [w.upper() for w in old["real_words"]]
old_fake = [w.upper() for w in old["fake_words"]]

# Auditoria del banco viejo: quitar "falsas" que en realidad SI existen
purged_old = [w for w in old_fake if w.lower() in DICT]
old_fake = [w for w in old_fake if w.lower() not in DICT]

log("=" * 62)
log("BANCO ACTUAL")
log("=" * 62)
log(f"real_words : {len(old_real)}")
log(f"fake_words : {len(old_fake)}")
log(f"definiciones existentes : {len(existing_defs)}")
if purged_old:
    log()
    log(f"!! AUDITORIA: {len(purged_old)} 'falsas' del banco actual SI son "
        f"palabras reales del ingles y fueron eliminadas:")
    for w in purged_old:
        log(f"   - {w}")
log()

# ------------------------------------------------------------------
# 2. Validar candidatas FALSAS contra diccionario real
# ------------------------------------------------------------------
CATEGORIES = {
    "past_regularized": PAST_REG,
    "es_suffix_trap":   ES_SUFFIX,
    "es_spelling_trap": ES_SPELLING,
    "subtle_typo":      SUBTLE_TYPOS,
    "pseudoword":       PSEUDO,
}

accepted = {}          # categoria -> [palabras]
rejected = []          # (palabra, categoria, motivo)
seen = set(old_real) | set(old_fake)

for cat, words in CATEGORIES.items():
    ok = []
    for raw in words:
        w = clean(raw)
        if not re.fullmatch(r"[A-Z]{4,15}", w):
            rejected.append((w, cat, "formato invalido o longitud fuera de 4-15"))
            continue
        if w in seen:
            rejected.append((w, cat, "duplicada (ya existe en el banco)"))
            continue
        if w.lower() in DICT:
            rejected.append((w, cat, "ES PALABRA REAL en el diccionario web2"))
            continue
        # El filtro de frecuencia solo aplica a categorias INVENTADAS.
        # En las categorias de error ortografico la frecuencia alta es
        # esperada y deseable: significa que la gente comete ese error
        # de verdad, lo que hace la palabra falsa mas creible.
        if cat in ("pseudoword", "es_suffix_trap"):
            z = zipf_frequency(w.lower(), "en")
            if z >= ZIPF_REAL_MIN:
                rejected.append((w, cat, f"inventada pero se usa en textos reales (zipf {z:.2f})"))
                continue
        ok.append(w)
        seen.add(w)
    accepted[cat] = sorted(ok)

log("=" * 62)
log("VALIDACION DE PALABRAS FALSAS NUEVAS")
log("=" * 62)
for cat in CATEGORIES:
    log(f"{cat:20} aceptadas {len(accepted[cat]):4}   descartadas "
        f"{sum(1 for r in rejected if r[1]==cat):3}")
log()
log(f"TOTAL aceptadas   : {sum(len(v) for v in accepted.values())}")
log(f"TOTAL descartadas : {len(rejected)}")
log()
log("--- DESCARTADAS (motivo) ---")
for w, cat, why in sorted(rejected, key=lambda x: (x[1], x[0])):
    log(f"  {w:18} [{cat}]  {why}")
log()

# ------------------------------------------------------------------
# 3. Validar palabras REALES avanzadas
# ------------------------------------------------------------------
adv_ok, adv_bad = {}, []
for w, (en, es) in ADVANCED.items():
    w = w.upper()
    if w in old_real:
        adv_bad.append((w, "ya estaba en real_words"))
        continue
    z = zipf_frequency(w.lower(), "en")
    in_dict = w.lower() in DICT
    if not in_dict and z < 2.5:
        adv_bad.append((w, f"no verificable como palabra real (dict={in_dict}, zipf {z:.2f})"))
        continue
    if not en.strip() or not es.strip():
        adv_bad.append((w, "definicion vacia"))
        continue
    adv_ok[w] = {"en": en, "es": es, "_zipf": round(z, 2)}

log("=" * 62)
log("VALIDACION DE PALABRAS REALES AVANZADAS")
log("=" * 62)
log(f"aceptadas   : {len(adv_ok)}")
log(f"descartadas : {len(adv_bad)}")
for w, why in adv_bad:
    log(f"  {w:18} {why}")
log()

# ------------------------------------------------------------------
# 4. Repartir las reales existentes por frecuencia
# ------------------------------------------------------------------
BASIC_MIN = 4.4
tiers_real = {"basic": [], "intermediate": [], "advanced": sorted(adv_ok.keys())}
for w in old_real:
    z = zipf_frequency(w.lower(), "en")
    (tiers_real["basic"] if z >= BASIC_MIN else tiers_real["intermediate"]).append(w)
tiers_real["basic"].sort()
tiers_real["intermediate"].sort()

# ------------------------------------------------------------------
# 5. Repartir las falsas por nivel
# ------------------------------------------------------------------
tiers_fake = {
    "basic":        sorted(old_fake),
    "intermediate": sorted(accepted["subtle_typo"] + accepted["es_spelling_trap"]),
    "advanced":     sorted(accepted["past_regularized"] + accepted["es_suffix_trap"]
                           + accepted["pseudoword"]),
}

# etiquetas de categoria para poder explicar el error al jugador
fake_meta = {}
for cat, words in accepted.items():
    for w in words:
        fake_meta[w] = cat
for w in old_fake:
    fake_meta.setdefault(w, "misspelling")

# ------------------------------------------------------------------
# 6. Validaciones finales del banco completo
# ------------------------------------------------------------------
log("=" * 62)
log("VALIDACION FINAL DEL BANCO")
log("=" * 62)
errors, warnings = [], []

RULES = old["rules"]
WPG = RULES["words_per_game"]
MAXR = RULES["max_real_per_game"]
MINR = RULES["min_real_per_game"]

for lvl in ("basic", "intermediate", "advanced"):
    R, F = tiers_real[lvl], tiers_fake[lvl]
    log(f"\n[{lvl.upper()}]  reales {len(R)}   falsas {len(F)}")

    # solapamiento
    ov = set(R) & set(F)
    if ov:
        errors.append(f"{lvl}: {len(ov)} palabras estan como real Y falsa: {sorted(ov)[:5]}")

    # duplicados
    for name, lst in (("reales", R), ("falsas", F)):
        dup = [w for w, c in Counter(lst).items() if c > 1]
        if dup:
            errors.append(f"{lvl}: duplicados en {name}: {dup[:5]}")

    # suficiencia para partidas de 8 sin repetir
    games_r = len(R) // MAXR
    games_f = len(F) // (WPG - MINR)
    log(f"   partidas posibles sin repetir: ~{min(games_r, games_f)}")
    if min(games_r, games_f) < 12:
        warnings.append(f"{lvl}: solo ~{min(games_r,games_f)} partidas sin repetir (ideal 12+)")

    # definiciones
    missing = [w for w in R if w not in existing_defs and w not in adv_ok]
    if missing:
        errors.append(f"{lvl}: {len(missing)} reales sin definicion: {missing[:5]}")
    else:
        log("   definiciones bilingues: todas presentes OK")

    # ninguna falsa es real
    bad = [w for w in F if w.lower() in DICT]
    if bad:
        errors.append(f"{lvl}: falsas que SI son palabras reales: {bad[:5]}")
    else:
        log("   ninguna falsa existe en el diccionario OK")

    # longitudes comparables (que el largo no delate la respuesta)
    if R and F:
        ar = sum(map(len, R)) / len(R)
        af = sum(map(len, F)) / len(F)
        log(f"   largo promedio: reales {ar:.1f} / falsas {af:.1f}")
        if abs(ar - af) > 1.5:
            warnings.append(f"{lvl}: diferencia de largo {abs(ar-af):.1f} — "
                            "el jugador podria adivinar por el tamano")

# solapamiento entre niveles de reales (no es error, pero informa)
log()
log(f"reales totales : {sum(len(v) for v in tiers_real.values())}")
log(f"falsas totales : {sum(len(v) for v in tiers_fake.values())}")
log()

log("--- ERRORES ---")
log("  ninguno" if not errors else "")
for e in errors:
    log(f"  X {e}")
log("--- ADVERTENCIAS ---")
log("  ninguna" if not warnings else "")
for w in warnings:
    log(f"  ! {w}")
log()

# ------------------------------------------------------------------
# 7. Escribir salidas
# ------------------------------------------------------------------
out = {
    "game": "IS IT A REAL WORD",
    "version": 2,
    "levels": ["basic", "intermediate", "advanced"],
    "rules": RULES,          # sin cambios: 8 palabras, 6 seg
    "scoring": old["scoring"],
    "words": {
        lvl: {"real": tiers_real[lvl], "fake": tiers_fake[lvl]}
        for lvl in ("basic", "intermediate", "advanced")
    },
    "fake_categories": {
        "misspelling":      "error de tipeo evidente de una palabra real",
        "subtle_typo":      "error de escritura sutil, casi invisible",
        "es_spelling_trap": "error de consonante tipico del hispanohablante",
        "es_suffix_trap":   "sufijo ingles mal aplicado a una raiz espanola",
        "past_regularized": "verbo irregular al que se le pego -ED",
        "pseudoword":       "palabra inventada con morfologia inglesa valida",
    },
    "fake_word_category": {w: fake_meta[w] for lvl in tiers_fake for w in tiers_fake[lvl]},
}

with open(os.path.join(OUT, "realword_data_v2.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

additions = {w: {"en": v["en"], "es": v["es"]} for w, v in sorted(adv_ok.items())}
with open(os.path.join(OUT, "definitions_additions.json"), "w", encoding="utf-8") as f:
    json.dump({
        "file": "definitions_additions.json",
        "purpose": "Definiciones bilingues nuevas para el nivel advanced de IS IT A REAL WORD. "
                   "Fusionar dentro de definitions.json -> definitions.",
        "count": len(additions),
        "definitions": additions,
    }, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "build_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

log("=" * 62)
log("ARCHIVOS GENERADOS")
log("=" * 62)
log(f"realword_data_v2.json       ({sum(len(v['real'])+len(v['fake']) for v in out['words'].values())} palabras)")
log(f"definitions_additions.json  ({len(additions)} definiciones nuevas)")
log("build_report.txt")
log()
log("RESULTADO: " + ("FALLO — hay errores que corregir" if errors else "OK — banco valido"))
sys.exit(1 if errors else 0)

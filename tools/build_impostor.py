# -*- coding: utf-8 -*-
"""
BUILD + VALIDATE  ->  impostor_data_v2.json + impostor_explanations_es_v2.json

1. Elimina TODOS los sets con criterion_type == "grammar"
   (el jugador debe relacionar por SIGNIFICADO, no por categoria gramatical)
2. Fusiona los sets nuevos de impostor_new_sets.py
3. REINDEXA los round_id y regenera los dos archivos en sincronia
   (critico: los round_id son posicionales, "business_basic_0", "_1"...
    si se borra un set del medio se descuadran todas las traducciones)

Uso:
    python build_impostor.py /ruta/a/english11
"""

import json, os, sys
from collections import Counter, defaultdict
from impostor_new_sets import NEW_SETS

OUT = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else "."

report = []
def log(s=""):
    print(s); report.append(str(s))

CATS   = ["business", "travel", "daily", "general"]
LEVELS = ["basic", "intermediate", "advanced"]

# ------------------------------------------------------------------
# 1. Cargar
# ------------------------------------------------------------------
data = json.load(open(os.path.join(PROJ, "impostor_data.json"), encoding="utf-8"))
es_list = json.load(open(os.path.join(PROJ, "impostor_explanations_es.json"), encoding="utf-8"))
es_by_id = {e["round_id"]: e["es"] for e in es_list}

log("=" * 64)
log("BANCO ACTUAL")
log("=" * 64)
old_total = sum(len(data["sets"][c][l]) for c in CATS for l in LEVELS)
types = Counter(s["criterion_type"] for c in CATS for l in LEVELS for s in data["sets"][c][l])
log(f"sets totales: {old_total}")
for t, n in types.most_common():
    log(f"  {t:12} {n:4}  ({100*n/old_total:.0f}%)")
log(f"explicaciones en espanol: {len(es_by_id)}")
log()

# ------------------------------------------------------------------
# 2. Filtrar gramaticales, conservando la traduccion de cada set
# ------------------------------------------------------------------
kept = defaultdict(list)
removed = 0
lost_es = 0

for c in CATS:
    for l in LEVELS:
        for idx, s in enumerate(data["sets"][c][l]):
            rid = f"{c}_{l}_{idx}"
            if s["criterion_type"] == "grammar":
                removed += 1
                continue
            es = es_by_id.get(rid)
            if es is None:
                lost_es += 1
            kept[(c, l)].append({**s, "_es": es or ""})

log("=" * 64)
log("FILTRADO DE CRITERIO GRAMATICAL")
log("=" * 64)
log(f"sets eliminados (grammar): {removed}")
log(f"sets conservados          : {sum(len(v) for v in kept.values())}")
if lost_es:
    log(f"!! {lost_es} sets conservados no tenian traduccion al espanol")
log()

# ------------------------------------------------------------------
# 3. Fusionar los nuevos
# ------------------------------------------------------------------
added, skipped = 0, []
existing_keys = {tuple(sorted(x["words"])) for v in kept.values() for x in v}
for (c, l), items in NEW_SETS.items():
    for words, imp, ctype, en, es in items:
        key = tuple(sorted(w.upper() for w in words))
        if key in existing_keys:
            skipped.append((c, l, imp))
            continue
        existing_keys.add(key)
        kept[(c, l)].append({
            "words": [w.upper() for w in words],
            "impostor": imp.upper(),
            "criterion_type": ctype,
            "explanation": en,
            "level": l,
            "category": c,
            "_es": es,
        })
        added += 1

log("=" * 64)
log("SETS NUEVOS")
log("=" * 64)
log(f"agregados: {added}")
if skipped:
    log(f"omitidos por estar ya en el banco ({len(skipped)}):")
    for c, l, imp in skipped:
        log(f"   - {c}/{l} (impostora {imp})")
log()

# ------------------------------------------------------------------
# 4. Validaciones
# ------------------------------------------------------------------
log("=" * 64)
log("VALIDACION")
log("=" * 64)
errors, warns = [], []
RULES = data["rules"]
WPR = RULES["words_per_round"]        # 5
RPG = RULES["rounds_per_game"]        # 3

seen_global = Counter()
for (c, l), items in sorted(kept.items()):
    for s in items:
        w = s["words"]
        tag = f"{c}/{l}/{s['impostor']}"
        if len(w) != WPR:
            errors.append(f"{tag}: {len(w)} palabras, deben ser {WPR}")
        if len(set(w)) != len(w):
            errors.append(f"{tag}: palabras repetidas dentro del set {w}")
        if s["impostor"] not in w:
            errors.append(f"{tag}: la impostora no esta en la lista de palabras")
        if s["criterion_type"] == "grammar":
            errors.append(f"{tag}: quedo un set gramatical sin filtrar")
        if not s["explanation"].strip():
            errors.append(f"{tag}: sin explicacion en ingles")
        if not s["_es"].strip():
            errors.append(f"{tag}: sin explicacion en espanol")
        if s["level"] != l or s["category"] != c:
            errors.append(f"{tag}: level/category no coinciden con su ubicacion")
        seen_global[tuple(sorted(w))] += 1

dups = [k for k, v in seen_global.items() if v > 1]
if dups:
    warns.append(f"{len(dups)} sets con exactamente las mismas 5 palabras repetidos en el banco")
    for d in dups[:5]:
        log(f"   ! duplicado: {list(d)}")

log()
for c in CATS:
    row = []
    for l in LEVELS:
        n = len(kept[(c, l)])
        row.append(n)
        if n < RPG * 4:
            warns.append(f"{c}/{l}: solo {n} sets (~{n//RPG} partidas sin repetir)")
    log(f"  {c:10} basic {row[0]:3} / inter {row[1]:3} / adv {row[2]:3}   "
        f"partidas sin repetir ~{min(row)//RPG}")

log()
new_types = Counter(s["criterion_type"] for v in kept.values() for s in v)
log("TIPOS DE CRITERIO FINALES:")
tot = sum(new_types.values())
for t, n in new_types.most_common():
    log(f"  {t:12} {n:4}  ({100*n/tot:.0f}%)")
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
# 5. Reindexar y escribir  (los dos archivos EN SINCRONIA)
# ------------------------------------------------------------------
out_sets = {c: {l: [] for l in LEVELS} for c in CATS}
out_es = []

for c in CATS:
    for l in LEVELS:
        for idx, s in enumerate(kept[(c, l)]):
            es = s.pop("_es")
            out_sets[c][l].append(s)
            out_es.append({"round_id": f"{c}_{l}_{idx}", "es": es})

final = {
    "game": data["game"],
    "version": 2,
    "scoring": data["scoring"],
    "rules": data["rules"],
    "criterion_types": {
        "semantic": "las palabras pertenecen al mismo campo o situacion",
        "synonym": "las palabras significan practicamente lo mismo",
    },
    "note": "Los sets de criterio gramatical (verbo vs sustantivo) fueron eliminados. "
            "La relacion entre palabras es siempre de SIGNIFICADO.",
    "sets": out_sets,
}

with open(os.path.join(OUT, "impostor_data_v2.json"), "w", encoding="utf-8") as f:
    json.dump(final, f, ensure_ascii=False, indent=2)
with open(os.path.join(OUT, "impostor_explanations_es_v2.json"), "w", encoding="utf-8") as f:
    json.dump(out_es, f, ensure_ascii=False, indent=2)
with open(os.path.join(OUT, "impostor_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

# verificacion cruzada final: mismo numero de ids en ambos archivos
ids_sets = {f"{c}_{l}_{i}" for c in CATS for l in LEVELS for i in range(len(out_sets[c][l]))}
ids_es = {e["round_id"] for e in out_es}
sync_ok = ids_sets == ids_es

log("=" * 64)
log("ARCHIVOS GENERADOS")
log("=" * 64)
log(f"impostor_data_v2.json             ({sum(len(out_sets[c][l]) for c in CATS for l in LEVELS)} sets)")
log(f"impostor_explanations_es_v2.json  ({len(out_es)} traducciones)")
log("impostor_report.txt")
log()
log(f"round_id sincronizados entre los dos archivos: {'SI' if sync_ok else 'NO'}")
if not sync_ok:
    errors.append("los round_id no coinciden entre data y explicaciones")
log()
log("RESULTADO: " + ("FALLO — hay errores" if errors else "OK — banco valido"))
sys.exit(1 if errors else 0)

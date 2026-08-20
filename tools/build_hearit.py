# -*- coding: utf-8 -*-
"""
BUILD + VALIDATE  ->  hearit_data.json

HEAR IT: el navegador pronuncia una palabra en en-US y el jugador
responde. Tres niveles con MECANICAS distintas:

  basic         4 opciones, escuchas ILIMITADAS, sin tiempo
                >>> al menos una opcion es PAR MINIMO de la respuesta
  intermediate  se ESCRIBE la palabra, 3 escuchas, se muestra el
                numero de letras, sin tiempo
  advanced      se ESCRIBE la palabra, 1 escucha, 10 segundos

Uso:
    python build_hearit.py /ruta/a/english11
"""

import json, os, sys, random
from collections import defaultdict

from hearit_pairs import MINIMAL_PAIRS, HOMOPHONES
from hearit_defs import PAIR_DEFS
from wordfreq import zipf_frequency as zipf
from english_words import get_english_words_set

DICT = get_english_words_set(["web2"], lower=True)
random.seed(21)
OUT = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else "."

report = []
def log(s=""):
    print(s); report.append(str(s))

ROUNDS  = 8
OPTIONS = 4

# ------------------------------------------------------------------
# 0. Homofonos -> conjunto plano de palabras prohibidas al escribir
# ------------------------------------------------------------------
# >>> OJO: HETERONYMS, SOFT_CONTRASTS y HARD_CONTRASTS ya no son solo de
# >>> Hear It. El TEST DE NIVEL los reutiliza via tools/phonetic_rules.py,
# >>> que los tiene COPIADOS (no se pueden importar de aqui sin ejecutar este
# >>> script entero y su dependencia english_words).
# >>>
# >>> Si cambias cualquiera de los tres, build_placement.py FALLA y te dice
# >>> que literal cambio y en que entradas. No es un estorbo: es el candado
# >>> que impide que la copia se desincronice en silencio. Copia el valor
# >>> nuevo a phonetic_rules.py y vuelve a correr. Detalle en tools/README.md.
HETERONYMS = set(['LIVE', 'READ', 'LEAD', 'TEAR', 'WIND', 'BOW', 'CLOSE', 'USE', 'RECORD', 'PRESENT', 'OBJECT', 'DESERT', 'MINUTE', 'WOUND', 'SOW', 'ROW', 'CONTENT', 'CONTRACT', 'REFUSE', 'SUBJECT', 'PROJECT', 'PRODUCE', 'PERMIT', 'CONDUCT', 'CONSOLE', 'INVALID', 'BASS', 'DOVE', 'MOBILE', 'POLISH', 'RESUME', 'SEPARATE', 'MODERATE', 'ESTIMATE', 'DELIBERATE', 'ADVOCATE', 'GRADUATE', 'DUPLICATE', 'ALTERNATE', 'APPROPRIATE', 'ELABORATE'])

HOMO = set()
for grp in HOMOPHONES:
    for w in grp:
        HOMO.add(w.upper().replace("'", ""))
HOMO |= HETERONYMS

log("=" * 62)
log("HOMOFONOS")
log("=" * 62)
log(f"palabras bloqueadas para los niveles de escritura: {len(HOMO)}")
log(f"  de las cuales HETERONIMOS (misma grafia, dos pronunciaciones): {len(HETERONYMS)}")
log("Motivo: si el audio dice /siː/ no hay forma justa de saber si el")
log("jugador debia escribir SEE o SEA. Solo se permiten en el nivel")
log("basic, donde se elige entre opciones y no hay ambiguedad.")
log()

# ------------------------------------------------------------------
# 1. Pares minimos -> validar que ambas palabras existan de verdad
# ------------------------------------------------------------------
pair_of = defaultdict(set)      # palabra -> {sus pares minimos}
contrast_of = {}                # (a,b) -> contraste
bad_pairs = []

for contrast, pairs in MINIMAL_PAIRS.items():
    for a, b in pairs:
        a, b = a.upper(), b.upper()
        missing = [w for w in (a, b) if w.lower() not in DICT and zipf(w.lower(), "en") < 2.5]
        if missing:
            bad_pairs.append((a, b, contrast, f"no existe: {', '.join(missing)}"))
            continue
        pair_of[a].add(b)
        pair_of[b].add(a)
        contrast_of[(a, b)] = contrast
        contrast_of[(b, a)] = contrast

log("=" * 62)
log("PARES MINIMOS")
log("=" * 62)
log(f"contrastes foneticos : {len(MINIMAL_PAIRS)}")
log(f"pares validos        : {sum(len(v) for v in pair_of.values()) // 2}")
log(f"palabras con par     : {len(pair_of)}")
if bad_pairs:
    log(f"pares DESCARTADOS ({len(bad_pairs)}):")
    for a, b, c, why in bad_pairs:
        log(f"  X {a}/{b} [{c}]  {why}")
log()

# ------------------------------------------------------------------
# 2. Vocabulario disponible: todo lo que YA tiene definicion bilingue
# ------------------------------------------------------------------
defs_file = json.load(open(os.path.join(PROJ, "definitions.json"), encoding="utf-8"))
existing = dict(defs_file["definitions"])
# definiciones nuevas de los pares minimos
pair_additions = {w.upper(): {"en": en, "es": es}
                  for w, (en, es) in PAIR_DEFS.items() if w.upper() not in existing}
existing.update(pair_additions)
log("=" * 62)
log("VOCABULARIO")
log("=" * 62)
log(f"palabras con definicion bilingue en el proyecto: {len(existing)}")

def usable(w):
    """una sola palabra, solo letras, largo razonable"""
    return w.isalpha() and 3 <= len(w) <= 13

vocab = {w: zipf(w.lower(), "en") for w in existing if usable(w)}
log(f"utilizables para audio (una palabra, 3-13 letras): {len(vocab)}")

# definiciones que faltan para pares minimos que no esten en el proyecto
need_def = sorted(w for w in pair_of if w not in existing)
log(f"palabras de pares minimos SIN definicion: {len(need_def)}")
log()

# ------------------------------------------------------------------
# 3. Armado de niveles
# ------------------------------------------------------------------
levels = {}

# Contrastes ordenados por dificultad REAL para un hispanohablante.
# Los "duros" son los que el oido hispano practicamente no distingue
# sin entrenamiento: en el nivel BASIC frustran en vez de ensenar.
SOFT_CONTRASTS = {"silent_h", "y_j", "ae_e", "uh_ah", "w_v"}
HARD_CONTRASTS = {"short_long_i", "sh_ch", "s_z", "th", "short_long_u", "b_v"}
PAIR_RATIO = 0.55        # solo ~55% de las rondas de basic llevan par minimo

# ---- BASIC: 4 opciones, escuchas ilimitadas ----
basic_rounds = []
_i = 0
for w in sorted(pair_of):
    if w in HETERONYMS:
        continue
    if w not in existing:
        continue                                    # necesita significado
    # solo pares de contraste SUAVE para el nivel basico
    pairs = [p for p in pair_of[w]
             if p in existing and contrast_of.get((w, p)) in SOFT_CONTRASTS]
    _i += 1
    use_pair = bool(pairs) and (_i % 100) < int(PAIR_RATIO * 100)
    pm = random.choice(pairs) if use_pair else None
    # relleno: palabras comunes que NO sean pares minimos de la respuesta
    need = 2 if pm else 3
    filler_pool = [x for x, z in vocab.items()
                   if z >= 3.6 and x != w and x != pm
                   and x not in pair_of[w] and abs(len(x) - len(w)) <= 3
                   and x not in HETERONYMS]
    if len(filler_pool) < need:
        continue
    # Si la ronda NO tiene par minimo, metemos un distractor que se
    # PAREZCA sin ser un par minimo: misma letra inicial y largo similar.
    # Da duda real sin exigir distinguir un fonema que el espanol no tiene.
    fillers = []
    if not pm:
        near = [x for x in filler_pool
                if x[0] == w[0] and abs(len(x) - len(w)) <= 1]
        if near:
            fillers.append(random.choice(near))
    rest = [x for x in filler_pool if x not in fillers]
    fillers += random.sample(rest, need - len(fillers))
    opts = ([w, pm] if pm else [w]) + fillers
    random.shuffle(opts)
    r = {"answer": w, "options": opts}
    if pm:
        r["minimal_pair"] = pm
        r["contrast"] = contrast_of.get((w, pm), "unknown")
    basic_rounds.append(r)
levels["basic"] = basic_rounds

# ---- INTERMEDIATE: escribir, 3 escuchas, se muestra el n de letras ----
inter = [w for w, z in vocab.items()
         if 3.3 <= z <= 4.8 and 4 <= len(w) <= 8 and w not in HOMO]
inter.sort()
levels["intermediate"] = [{"answer": w, "letters": len(w)} for w in inter]

# ---- ADVANCED: escribir, 1 escucha, 10 segundos ----
adv = [w for w, z in vocab.items()
       if 2.4 <= z <= 4.0 and 8 <= len(w) <= 13 and w not in HOMO]
adv.sort()
levels["advanced"] = [{"answer": w, "letters": len(w)} for w in adv]

# ------------------------------------------------------------------
# 4. Validaciones
# ------------------------------------------------------------------
log("=" * 62)
log("VALIDACION")
log("=" * 62)
errors, warns = [], []

for lvl, items in levels.items():
    log(f"\n[{lvl.upper()}]  {len(items)} rondas")
    log(f"   partidas de {ROUNDS} sin repetir: ~{len(items)//ROUNDS}")
    if len(items) // ROUNDS < 12:
        warns.append(f"{lvl}: solo ~{len(items)//ROUNDS} partidas sin repetir")

    ans = [it["answer"] for it in items]
    dup = {w for w in ans if ans.count(w) > 1}
    if dup:
        errors.append(f"{lvl}: respuestas duplicadas {sorted(dup)[:5]}")

    for it in items:
        if it["answer"] not in existing:
            errors.append(f"{lvl}/{it['answer']}: sin definicion bilingue")

    if lvl == "basic":
        for it in items:
            o = it["options"]
            if len(o) != OPTIONS or len(set(o)) != OPTIONS:
                errors.append(f"basic/{it['answer']}: opciones invalidas {o}")
            if it["answer"] not in o:
                errors.append(f"basic/{it['answer']}: la respuesta no esta entre las opciones")
            if "minimal_pair" in it and it["minimal_pair"] not in o:
                errors.append(f"basic/{it['answer']}: falta el par minimo entre las opciones")
            if it.get("contrast") in HARD_CONTRASTS:
                errors.append(f"basic/{it['answer']}: contraste duro {it['contrast']} en nivel basico")
        npair = sum(1 for it in items if "minimal_pair" in it)
        log(f"   con par minimo: {npair} de {len(items)} ({100*npair/len(items):.0f}%)")
        cs = defaultdict(int)
        for it in items:
            cs[it.get("contrast", "sin par")] += 1
        log("   contrastes cubiertos:")
        for c, n in sorted(cs.items(), key=lambda x: -x[1]):
            log(f"      {c:16} {n}")
    else:
        homo_leak = [it["answer"] for it in items if it["answer"] in HOMO]
        if homo_leak:
            errors.append(f"{lvl}: HOMOFONOS filtrados ({len(homo_leak)}): {homo_leak[:5]}")
        else:
            log("   sin homofonos OK")
        wrong = [it["answer"] for it in items if it["letters"] != len(it["answer"])]
        if wrong:
            errors.append(f"{lvl}: conteo de letras incorrecto en {wrong[:5]}")
        ls = [it["letters"] for it in items]
        log(f"   largo: min {min(ls)} max {max(ls)} prom {sum(ls)/len(ls):.1f}")

# que basic no se solape demasiado con los otros niveles
b = {it["answer"] for it in levels["basic"]}
i = {it["answer"] for it in levels["intermediate"]}
log(f"\nsolape basic/intermediate: {len(b & i)} palabras "
    f"(normal: basic usa palabras cortas con par minimo)")

log()
log("--- ERRORES ---")
log("  ninguno" if not errors else "")
for e in errors[:20]:
    log(f"  X {e}")
log("--- ADVERTENCIAS ---")
log("  ninguna" if not warns else "")
for w in warns:
    log(f"  ! {w}")
log()

# ------------------------------------------------------------------
# 5. Salidas
# ------------------------------------------------------------------
out = {
    "game": "HEAR IT",
    "version": 1,
    "levels": ["basic", "intermediate", "advanced"],
    "audio": {
        "source": "browser_speech_synthesis",
        "lang": "en-US",
        "rate": 0.9,
        "migration_note": "Para migrar a MP3: generar un archivo por palabra en "
                          "assets/audio/hearit/<PALABRA>.mp3 y cambiar SOLO la "
                          "funcion playWord(). El resto del juego no se toca.",
    },
    "rules": {
        "rounds_per_game": ROUNDS,
        "scoring": {"points_per_correct": 1, "max_per_game": ROUNDS},
        "on_wrong": "reveal_correct_and_advance",
        "show_meanings": "end_of_game_clickable",
        "by_level": {
            "basic": {
                "mode": "multiple_choice", "options": OPTIONS,
                "replays": "unlimited", "timer_seconds": None,
                "note": "una de las opciones siempre es par minimo de la respuesta",
            },
            "intermediate": {
                "mode": "type_the_word", "replays": 3,
                "timer_seconds": None, "show_letter_count": True,
            },
            "advanced": {
                "mode": "type_the_word", "replays": 1,
                "timer_seconds": 10, "show_letter_count": True,
            },
        },
    },
    "answer_checking": {
        "case_insensitive": True,
        "trim_whitespace": True,
        "note": "Los homofonos estan excluidos de los niveles de escritura, "
                "asi que cada audio tiene una sola respuesta correcta posible.",
    },
    "phonetic_contrasts": {
        "b_v": "El espanol tiene un solo sonido para B y V",
        "short_long_i": "El espanol no tiene la I corta de ship",
        "ae_e": "El espanol no tiene la vocal de cat",
        "sh_ch": "SH y CH se confunden constantemente",
        "s_z": "El espanol no tiene Z sonora",
        "th": "La TH inglesa no existe en espanol",
        "silent_h": "La H es muda en espanol",
        "uh_ah": "La vocal de cup no existe en espanol",
        "short_long_u": "U corta vs U larga: full/fool",
        "y_j": "Y consonante vs J inglesa",
        "w_v": "El espanol no tiene W consonante",
    },
    "rounds": levels,
}

with open(os.path.join(OUT, "hearit_data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "hearit_definitions_additions.json"), "w", encoding="utf-8") as f:
    json.dump({
        "file": "hearit_definitions_additions.json",
        "purpose": "Definiciones bilingues nuevas para HEAR IT (palabras de pares minimos). "
                   "Fusionar dentro de definitions.json -> definitions.",
        "count": len(pair_additions),
        "definitions": dict(sorted(pair_additions.items())),
    }, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "hearit_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

log("=" * 62)
log("ARCHIVOS GENERADOS")
log("=" * 62)
log(f"hearit_data.json  ({sum(len(v) for v in levels.values())} rondas)")
log(f"hearit_definitions_additions.json  ({len(pair_additions)} definiciones)")
log("hearit_report.txt")
log()
log("RESULTADO: " + ("FALLO — hay errores" if errors else "OK — banco valido"))
sys.exit(1 if errors else 0)

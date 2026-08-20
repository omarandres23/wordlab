# -*- coding: utf-8 -*-
"""
BUILD + VALIDATE  ->  placement_data.json + placement_data.js

Banco de items del TEST DE NIVEL. El contenido vive en placement_items.py;
aqui esta el ensamblado, las validaciones y el reporte.

Escribe a la RAIZ del proyecto, no a tools/, siguiendo a build_achievements.py:
los otros build_*.py dejan la salida en tools/ y alguien la copia a mano, y ese
paso manual es justo el que se olvida.

MODO PILOTO
  Con el banco incompleto (placement_items.IS_PILOT = True) las validaciones de
  COMPLETITUD del banco -- cobertura de la escala, equilibrio formato/dificultad
  y reparto de correct_index -- bajan a advertencia. Las de INTEGRIDAD de cada
  item siguen siendo errores duros: un item mal formado es igual de invalido en
  un piloto que en el banco final.

Uso:
    python build_placement.py ..
    python build_placement.py .. --full     (fuerza modo completo)
"""

import json
import os
import random
import sys
from collections import Counter, defaultdict

from placement_items import ITEMS, IS_PILOT
from phonetic_rules import (
    FORBIDDEN_SPOKEN,
    HARD_CONTRAST_MIN_DIFFICULTY,
    HARD_CONTRAST_POLICY,
    audible_diff_problem,
    check_hearit_sync,
    hard_contrast_allowed,
    hard_contrast_between,
    homophone_conflict,
)

OUT = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else ".."
FULL = "--full" in sys.argv
PILOT = IS_PILOT and not FULL

random.seed(11)  # el barajado de opciones tiene que ser reproducible

# La consola de Windows es cp1252 y no puede imprimir IPA (/ʌ/, /ɪ/, /aʊ/) ni
# acentos, que SI aparecen en las justificaciones de los items de listening.
# Sin esto el generador valida el banco entero correctamente y luego muere con
# UnicodeEncodeError AL IMPRIMIR, devolviendo exit=1 con un reporte que dice
# "errores: ninguno". Es el peor modo de fallo posible: parece un banco invalido
# y en realidad es la codificacion del terminal. El .txt siempre se escribe en
# UTF-8, asi que ahi los simbolos se conservan intactos.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass  # consola que no lo soporta: se degrada, no se rompe

report = []
def log(s=""):
    print(s)
    report.append(str(s))

errors, warns = [], []

def fail(msg):
    """Error duro: rompe el build."""
    errors.append(msg)

def soft(msg, pilot_only=False):
    """Advertencia. Con pilot_only=True es error cuando el banco esta completo."""
    if pilot_only and not PILOT:
        errors.append(msg)
    else:
        warns.append(msg)


# ----------------------------------------------------------------------
# Escala CEFR
# ----------------------------------------------------------------------
# Anclas, no cubetas: `difficulty` es continuo y `cefr` se deriva buscando el
# ancla mas cercana. Existe solo para poder revisar el banco a ojo.
CEFR_ANCHORS = [
    (0, "A1.0"), (5, "A1.5"), (10, "A2.0"), (15, "A2.5"), (20, "B1.0"),
    (25, "B1.5"), (30, "B2.0"), (35, "B2.5"), (40, "C1.0"), (45, "C1.5"),
    (50, "C2"),
]
# bandas anchas para el reporte por tramo
CEFR_BANDS = [("A1", 0, 7.5), ("A2", 7.5, 17.5), ("B1", 17.5, 27.5),
              ("B2", 27.5, 37.5), ("C1", 37.5, 47.5), ("C2", 47.5, 50.01)]

SKILLS = ("vocab", "grammar", "listening")
FORMATS = {
    "vocab": ("definition", "collocation", "synonym"),
    "grammar": ("grammar_gap", "grammar_error", "grammar_best"),
    "listening": ("listen_word", "listen_sentence", "listen_question"),
}
ALL_FORMATS = tuple(f for s in SKILLS for f in FORMATS[s])
OPTIONS = 4


def cefr_for(d):
    return min(CEFR_ANCHORS, key=lambda a: abs(a[0] - d))[1]


def band_for(d):
    for name, lo, hi in CEFR_BANDS:
        if lo <= d < hi:
            return name
    return "C2"


# ----------------------------------------------------------------------
# 0. EL CANDADO FONETICO — antes que nada
# ----------------------------------------------------------------------
# phonetic_rules.py copia tres literales de build_hearit.py porque no se pueden
# importar sin ejecutar ese script (depende de english_words, no instalado).
# Esto compara las copias con el original parseandolo con ast. Si Hear It cambia
# sus reglas y esta copia no, el build se cae aqui en vez de producir items malos.
log("=" * 66)
log("SINCRONIA CON build_hearit.py")
log("=" * 66)
sync_errors = check_hearit_sync(os.path.join(OUT, "build_hearit.py"))
for e in sync_errors:
    fail("[0] " + e)
log("  OK — HETERONYMS, SOFT_CONTRASTS y HARD_CONTRASTS coinciden"
    if not sync_errors else "  FALLO — ver errores")
log(f"  contrastes duros permitidos solo desde difficulty >= {HARD_CONTRAST_MIN_DIFFICULTY}")
log()


# ----------------------------------------------------------------------
# 1. Ensamblado: colocacion BALANCEADA de la respuesta correcta
# ----------------------------------------------------------------------
# La validacion 2 pide que correct_index este repartido entre 0..3. Hacerlo con
# un shuffle aleatorio lo deja al azar; con round-robin queda equilibrado POR
# CONSTRUCCION. El contador es por destreza, que es donde la validacion mide.
#
# Precedente de por que importa: starparty_questions.json tiene correct_index 0
# en sus 90 preguntas. Un jugador que lo note sube su puntuacion sin saber ingles.
rr = defaultdict(int)
built = []

for it in ITEMS:
    skill = it["skill"]
    target = rr[skill] % OPTIONS
    rr[skill] += 1

    others = list(it["distractors"])
    random.shuffle(others)
    opts = others[:]
    opts.insert(target, it["correct"])

    built.append({
        "id": it["id"],
        "skill": skill,
        "difficulty": float(it["difficulty"]),
        "cefr": cefr_for(float(it["difficulty"])),
        "format": it["fmt"],
        "prompt": it["prompt"],
        "speak": it.get("speak"),
        "options": opts,
        "correct_index": opts.index(it["correct"]),
        "source": it.get("source", "authored"),
        "_correct": it["correct"],       # interno, se quita antes de escribir
        "_why": it.get("why", ""),       # interno, solo para el reporte
    })


# ----------------------------------------------------------------------
# 2. Validaciones de INTEGRIDAD (siempre errores duros)
# ----------------------------------------------------------------------
log("=" * 66)
log("VALIDACION")
log("=" * 66)

# --- 4. opciones limpias ---
for it in built:
    o = it["options"]
    if len(o) != OPTIONS:
        fail(f"[4] {it['id']}: {len(o)} opciones, deben ser {OPTIONS}")
    if len(set(map(str.strip, map(str, o)))) != len(o):
        fail(f"[4] {it['id']}: opciones repetidas dentro del item -> {o}")
    if any(not str(x).strip() for x in o):
        fail(f"[4] {it['id']}: hay una opcion vacia")
    if not (0 <= it["correct_index"] < len(o)):
        fail(f"[4] {it['id']}: correct_index fuera de rango")

# --- 6. coherencia cefr <-> difficulty ---
for it in built:
    if not (0.0 <= it["difficulty"] <= 50.0):
        fail(f"[6] {it['id']}: difficulty {it['difficulty']} fuera de 0-50")
    esperado = cefr_for(it["difficulty"])
    if it["cefr"] != esperado:
        fail(f"[6] {it['id']}: cefr {it['cefr']} no corresponde a difficulty "
             f"{it['difficulty']} (deberia ser {esperado})")

# --- estructura por destreza/formato ---
for it in built:
    if it["skill"] not in SKILLS:
        fail(f"[E] {it['id']}: skill desconocida {it['skill']!r}")
    elif it["format"] not in FORMATS[it["skill"]]:
        fail(f"[E] {it['id']}: formato {it['format']!r} no pertenece a {it['skill']}")
    if it["skill"] == "listening":
        if not it["speak"]:
            fail(f"[E] {it['id']}: item de listening sin campo `speak`")
        if it["prompt"]:
            fail(f"[E] {it['id']}: item de listening con `prompt` visible "
                 f"({it['prompt']!r}) — se leeria en pantalla y dejaria de medir oido")
    else:
        if it["speak"]:
            fail(f"[E] {it['id']}: `speak` solo tiene sentido en listening")
        if not it["prompt"]:
            fail(f"[E] {it['id']}: sin enunciado")

# --- 3. sin duplicados ---
ids = [it["id"] for it in built]
for dup in {i for i in ids if ids.count(i) > 1}:
    fail(f"[3] id duplicado: {dup}")

# Que identifica a un item depende del formato, y confundirlo da falsos
# positivos que obligan a empeorar el banco:
#
#   definition/synonym    la PALABRA es el item. Preguntar AMBIGUOUS dos veces
#   grammar_error/best    es medir lo mismo dos veces -> duplicado real.
#   listen_*
#
#   collocation           la respuesta es un verbo basico (make/do/take/have) y
#   grammar_gap           repetirlo es inevitable y deseable: lo que identifica
#                         al item es la COLOCACION entera, o sea el enunciado,
#                         que ya se comprueba aparte. Exigir verbos unicos
#                         obligaria a inventar colocaciones raras solo para no
#                         repetir 'take'.
ANSWER_IDENTIFIES = {"definition", "synonym", "listen_word", "listen_sentence",
                     "listen_question", "grammar_error", "grammar_best"}

by_answer = defaultdict(list)
for it in built:
    if it["format"] in ANSWER_IDENTIFIES:
        # el alcance es la DESTREZA: la misma palabra puede ser respuesta de un
        # item de vocab y de uno de listening sin medir lo mismo
        key = (it["skill"], str(it["_correct"]).strip().upper())
        by_answer[key].append(it["id"])
for (skill, ans), who in by_answer.items():
    if len(who) > 1:
        fail(f"[3] {skill}: la respuesta {ans!r} se repite en {who} — son dos items "
             f"midiendo lo mismo")

by_prompt = defaultdict(list)
for it in built:
    key = (it["prompt"] or it["speak"] or "").strip().lower()
    # los enunciados fijos de grammar_error/grammar_best se repiten a proposito
    if it["format"] in ("grammar_error", "grammar_best"):
        continue
    by_prompt[key].append(it["id"])
for key, who in by_prompt.items():
    if len(who) > 1:
        fail(f"[3] enunciado repetido en {who}: {key[:60]!r}")

# Una palabra que es respuesta en un item y distractor en otro no es un error
# (pasa constantemente y es sano). Solo se avisa en los formatos donde la
# respuesta identifica al item; en collocation/grammar_gap el solapamiento de
# make/do/take/have es el diseno, no un descuido, y avisar solo genera ruido.
for it in built:
    if it["format"] not in ANSWER_IDENTIFIES:
        continue
    for o in it["options"]:
        k = (it["skill"], str(o).strip().upper())
        if k[1] != str(it["_correct"]).strip().upper() and k in by_answer:
            soft(f"[3] {it['id']}: usa {k[1]!r} de distractor y es respuesta de "
                 f"{by_answer[k][0]}")

# --- 5. listening: homofonos y contrastes ---
for it in built:
    if it["skill"] != "listening":
        continue

    if it["format"] == "listen_word":
        spoken = str(it["_correct"]).strip().upper()
        if spoken in FORBIDDEN_SPOKEN:
            fail(f"[5] {it['id']}: la palabra hablada {spoken!r} es homofono o "
                 f"heteronimo — no tiene respuesta unica posible")
        for o in it["options"]:
            k = str(o).strip().upper()
            if k == spoken:
                continue
            if homophone_conflict(spoken, k):
                fail(f"[5] {it['id']}: {k!r} suena igual que la respuesta {spoken!r}")
            hard = hard_contrast_between(spoken, k)
            if hard and not hard_contrast_allowed(it["format"], it["difficulty"]):
                fail(f"[5] {it['id']}: contraste DURO {hard!r} entre {spoken!r} y "
                     f"{k!r}, no permitido en {it['format']} a difficulty "
                     f"{it['difficulty']} (politica: "
                     f"{HARD_CONTRAST_POLICY.get(it['format'], 'never')})")
        # las opciones tampoco pueden ser homofonas ENTRE si
        for i in range(len(it["options"])):
            for j in range(i + 1, len(it["options"])):
                a, b = it["options"][i], it["options"][j]
                if homophone_conflict(a, b):
                    fail(f"[5] {it['id']}: las opciones {a!r} y {b!r} son homofonas")

    else:
        # listen_sentence / listen_question: la regla se aplica a la DIFERENCIA
        for i in range(len(it["options"])):
            for j in range(i + 1, len(it["options"])):
                a, b = it["options"][i], it["options"][j]
                prob = audible_diff_problem(a, b)
                if prob is None:
                    continue
                if prob.startswith("hard:"):
                    cs = prob.split(":", 1)[1]
                    # En los formatos de frase la politica es "never": lo medido
                    # es la gramatica oida, y un fonema dificil la contamina.
                    if not hard_contrast_allowed(it["format"], it["difficulty"]):
                        fail(f"[5] {it['id']}: las opciones {a[:38]!r} y {b[:38]!r} se "
                             f"separan SOLO por un contraste duro ({cs}). En "
                             f"{it['format']} lo medido es la gramatica oida, asi que "
                             f"el contraste es un contaminante, no una dificultad.")
                    else:
                        soft(f"[5] {it['id']}: {a[:34]!r} vs {b[:34]!r} se separan solo "
                             f"por contraste duro ({cs}); permitido a {it['difficulty']}")
                else:
                    fail(f"[5] {it['id']}: opciones {a[:40]!r} vs {b[:40]!r} -> {prob}")


# --- 7. vocabulario contra definitions.json ---
defs_path = os.path.join(PROJ, "definitions.json")
existing = {}
try:
    existing = json.load(open(defs_path, encoding="utf-8"))["definitions"]
except Exception as exc:
    fail(f"[7] no se pudo leer definitions.json -> {exc}")

new_defs = {}
reused = 0
for it in built:
    if it["format"] != "definition":
        continue
    word = str(it["_correct"]).strip().upper()
    if word in existing:
        # la regla de CLAUDE.md es no sobreescribir NUNCA una clave existente.
        # Si el enunciado no coincide con la definicion que ya hay, es que se
        # reescribio una definicion en vez de reutilizarla.
        if it["prompt"].strip().lower() != existing[word]["en"].strip().lower():
            fail(f"[7] {it['id']}: {word} ya tiene definicion en definitions.json "
                 f"({existing[word]['en']!r}) y el item usa otra ({it['prompt']!r}). "
                 f"Reutiliza la existente o cambia de palabra.")
        else:
            reused += 1
    else:
        new_defs[word] = {"en": it["prompt"], "es": ""}
        soft(f"[7] {word} no esta en definitions.json: hay que traducir su `es` "
             f"y fusionarla (ver placement_definitions_additions.json)")

log(f"  definiciones reutilizadas de definitions.json : {reused}")
log(f"  palabras nuevas que necesitan definicion      : {len(new_defs)}")
log()


# ----------------------------------------------------------------------
# 3. Validaciones de COMPLETITUD (advertencia en piloto, error en banco final)
# ----------------------------------------------------------------------
# --- 1. cobertura: ningun hueco > 5 puntos ---
MAX_GAP = 5.0
log("COBERTURA DE LA ESCALA (huecos maximos de 5 puntos)")
for skill in SKILLS:
    ds = sorted(it["difficulty"] for it in built if it["skill"] == skill)
    if not ds:
        soft(f"[1] {skill}: sin items", pilot_only=True)
        continue
    puntos = [0.0] + ds + [50.0]
    huecos = [(puntos[i], puntos[i + 1]) for i in range(len(puntos) - 1)
              if puntos[i + 1] - puntos[i] > MAX_GAP]
    log(f"  {skill:10} n={len(ds):3}  rango {ds[0]:.1f}-{ds[-1]:.1f}  "
        f"huecos>{MAX_GAP:.0f}: {len(huecos)}")
    for lo, hi in huecos[:6]:
        soft(f"[1] {skill}: hueco de {hi - lo:.1f} puntos entre {lo:.1f} y {hi:.1f}",
             pilot_only=True)
    if len(huecos) > 6:
        soft(f"[1] {skill}: y {len(huecos) - 6} huecos mas", pilot_only=True)
log()

# --- 1b. formato vs dificultad ---
# Si dentro de una destreza un formato es sistematicamente mas facil que otro,
# el motor mide el formato y no el nivel.
MAX_FORMAT_SPREAD = 6.0
log("FORMATO vs DIFICULTAD (desvio maximo entre formatos de una destreza: 6 pts)")
for skill in SKILLS:
    medias = {}
    for fmt in FORMATS[skill]:
        ds = [it["difficulty"] for it in built if it["format"] == fmt]
        if ds:
            medias[fmt] = sum(ds) / len(ds)
    if len(medias) < 2:
        continue
    spread = max(medias.values()) - min(medias.values())
    detalle = "  ".join(f"{f}={m:.1f}" for f, m in sorted(medias.items()))
    log(f"  {skill:10} spread={spread:5.1f}   {detalle}")
    if spread > MAX_FORMAT_SPREAD:
        soft(f"[1b] {skill}: los formatos se desvian {spread:.1f} puntos "
             f"({detalle}) — el motor estaria midiendo el formato, no el nivel",
             pilot_only=True)
    faltan = [f for f in FORMATS[skill] if f not in medias]
    if faltan:
        soft(f"[1b] {skill}: sin items de {faltan}", pilot_only=True)
log()

# --- 2. posicion de la respuesta ---
log("REPARTO DE correct_index")
for skill in SKILLS:
    c = Counter(it["correct_index"] for it in built if it["skill"] == skill)
    n = sum(c.values())
    if not n:
        continue
    fila = "  ".join(f"{i}:{c.get(i, 0):3} ({100 * c.get(i, 0) / n:4.1f}%)"
                     for i in range(OPTIONS))
    log(f"  {skill:10} n={n:3}   {fila}")
    peor = max(c.get(i, 0) for i in range(OPTIONS)) / n
    if peor > 0.40:
        soft(f"[2] {skill}: el {100 * peor:.0f}% de las respuestas cae en la misma "
             f"posicion (limite 40%)", pilot_only=True)
log()


# ----------------------------------------------------------------------
# 4. Tabla de recomendaciones
# ----------------------------------------------------------------------
# El mapeo juego->destreza y los EJES REALES de cada juego se leyeron de
# app.js/openIntro, no de la documentacion:
#   noSelectors  = bombword | emojibomb | strands   -> sin fila de dificultad
#   strands y emojibomb tienen su propia fila de MODO
#   waffle tiene dificultad (3) Y modo (normal/deluxe)
#   showCategory hoy es SIEMPRE false: la fila de categoria ya no se muestra
#   para ningun juego, asi que ninguna recomendacion la menciona.
# ⚠️ CORTES CALIBRADOS, NO ALINEADOS AL CEFR
#
# Estaban en (20, 33), que es donde el CEFR pone A2.0 y B2.0. Hoy son (22, 35):
# los dos subidos +2, que es el SESGO GLOBAL MEDIDO del motor (+1.76 sobre 2.000
# jugadores simulados en el escenario N(0,6)), redondeado. O sea, no son un
# numero afinado para que el reparto quede bonito: son la correccion aritmetica
# de un sesgo medido, aplicada en la frontera en vez de en el score.
#
# Que compran: la sobre-recomendacion (mandar a alguien a una dificultad que no
# aguanta, que es la que hace abandonar) baja de 23.6% a 21.9% con poblacion
# realista N(17,8), y mejoran LAS DOS poblaciones — realista +2.9 pp de acierto
# y uniforme +1.5 pp — que es la comprobacion de que no estan sobreajustados a
# un solo perfil.
#
# Que cuestan: la etiqueta ya NO significa exactamente lo que dice el CEFR.
# Significa "lo que este motor, con este banco, llama basico/intermedio/avanzado".
# Es legitimo porque la etiqueta existe para recomendar dificultad de juego, no
# para certificar un nivel — pero si algun dia el banco se recalibra con
# respuestas reales, ESTOS CORTES HAY QUE REVISARLOS, porque el sesgo que
# compensan habra cambiado.
#
# Nota: mover los cortes NO cierra la brecha entre lo que estima el motor y la
# verdad (se mantiene en ~13-14 puntos a cualquier altura), porque los mismos
# cortes se aplican a los dos lados. Solo elige el punto donde el sesgo hace
# menos dano.
LABEL_CUTS = {"basico_max": 22.0, "intermedio_max": 35.0}

GAMES = {
    # listening
    "hearit":      dict(skill="listening", axis="difficulty", priority=1),
    # grammar
    "spot":        dict(skill="grammar", axis="difficulty", priority=1),
    "blanks":      dict(skill="grammar", axis="difficulty", priority=2),
    # vocab
    "wordlinks":   dict(skill="vocab", axis="difficulty", priority=1),
    "wordle":      dict(skill="vocab", axis="difficulty", priority=2),
    "connections": dict(skill="vocab", axis="difficulty", priority=3),
    "impostor":    dict(skill="vocab", axis="difficulty", priority=4),
    "realword":    dict(skill="vocab", axis="difficulty", priority=5),
    "emojimatch":  dict(skill="vocab", axis="difficulty", priority=6),
    "waffle":      dict(skill="vocab", axis="difficulty+mode", priority=7),
    "strands":     dict(skill="vocab", axis="mode_st", priority=8),
    "emojibomb":   dict(skill="vocab", axis="mode_eb", priority=9),
    "bombword":    dict(skill="vocab", axis="none", priority=10),
}

# Cada eje traduce un score 0-50 al ajuste concreto de ESE juego.
AXES = {
    "difficulty": {
        "kind": "difficulty",
        "bands": [{"max": LABEL_CUTS["basico_max"], "value": "basico"},
                  {"max": LABEL_CUTS["intermedio_max"], "value": "intermedio"},
                  {"max": 50.0, "value": "avanzado"}],
    },
    "difficulty+mode": {
        "kind": "difficulty+mode",
        "bands": [{"max": LABEL_CUTS["basico_max"], "value": "basico", "mode": "normal"},
                  {"max": LABEL_CUTS["intermedio_max"], "value": "intermedio", "mode": "normal"},
                  {"max": 50.0, "value": "avanzado", "mode": "deluxe"}],
    },
    # Strands: normal / hardcore. El corte va mas arriba que el de dificultad
    # porque hardcore quita vidas, no solo sube el vocabulario.
    "mode_st": {"kind": "mode",
                "bands": [{"max": 33.0, "value": "normal"},
                          {"max": 50.0, "value": "hardcore"}]},
    "mode_eb": {"kind": "mode",
                "bands": [{"max": 28.0, "value": "basico"},
                          {"max": 50.0, "value": "hardcore"}]},
    # Bomb Word no tiene selector: o se recomienda o no, sin ajuste.
    "none": {"kind": "none", "bands": []},
}

# Politica de seleccion. Vive en el JSON para poder ajustarla sin tocar el motor.
#
# Criterio: la lista corta se arma con la destreza MAS DEBIL primero, porque es
# donde practicar rinde mas, pero nunca solo con ella — un test que devuelve
# unicamente "estas flojo, juega esto" se abandona. Por eso entra tambien un
# juego de la destreza mas fuerte, a su nivel real, que es el que engancha.
# Los "evitar" no son los mas dificiles en abstracto: son los que exigen escribir
# rapido o no dejan bajar la dificultad, que son los que frustran a un principiante.
SELECTION = {
    "recommend_total": 4,
    "from_weakest": 2,
    "from_strongest": 1,
    "from_middle": 1,
    "avoid_max": 3,
    # sin selector de dificultad + hay que teclear contrarreloj: por debajo de
    # este score no hay forma de hacerlo llevadero
    "avoid_if_no_axis_below": 20.0,
    # el modo duro de un juego de dos modos por debajo de esto no se sugiere
    "avoid_hard_mode_below": 33.0,
    "notes": "Los scores por destreza tienen un error de +-7 puntos aprox. "
             "Se usan para ELEGIR dificultad, nunca para mostrarse como numero.",
}

RECOMMENDATIONS = {
    "label_cuts": LABEL_CUTS,
    "skill_of_game": {g: v["skill"] for g, v in GAMES.items()},
    "axis_of_game": {g: v["axis"] for g, v in GAMES.items()},
    "priority_of_game": {g: v["priority"] for g, v in GAMES.items()},
    "axes": AXES,
    "selection": SELECTION,
}

# validacion propia de la tabla: que no invente juegos ni deje ninguno fuera
KNOWN_GAMES = {"wordle", "blanks", "spot", "wordlinks", "impostor", "connections",
               "realword", "bombword", "waffle", "emojibomb", "strands",
               "emojimatch", "hearit"}
faltan = KNOWN_GAMES - set(GAMES)
sobran = set(GAMES) - KNOWN_GAMES
if faltan:
    fail(f"[R] la tabla de recomendaciones no cubre {sorted(faltan)}")
if sobran:
    fail(f"[R] la tabla incluye juegos que no existen: {sorted(sobran)}")
if "starparty" in GAMES:
    fail("[R] Star Party esta desactivado y siempre estuvo fuera de estos sistemas")
for g, v in GAMES.items():
    if v["axis"] not in AXES:
        fail(f"[R] {g}: eje {v['axis']!r} sin definir en AXES")


# ----------------------------------------------------------------------
# 5. Reporte
# ----------------------------------------------------------------------
log("=" * 66)
log("RESUMEN DEL BANCO" + ("   [PILOTO]" if PILOT else ""))
log("=" * 66)
log(f"items totales: {len(built)}")
log()
log(f"{'formato':18} {'n':>3}  {'media':>6}  {'min':>5}  {'max':>5}   dificultades")
for skill in SKILLS:
    for fmt in FORMATS[skill]:
        sel = [it for it in built if it["format"] == fmt]
        if not sel:
            log(f"{fmt:18} {0:3}       —      —      —")
            continue
        ds = sorted(it["difficulty"] for it in sel)
        media = sum(ds) / len(ds)
        log(f"{fmt:18} {len(sel):3}  {media:6.1f}  {ds[0]:5.1f}  {ds[-1]:5.1f}   "
            f"{', '.join(f'{d:.0f}' for d in ds)}")
log()

log("POR BANDA CEFR")
hdr = "  ".join(f"{b:>4}" for b, _, _ in CEFR_BANDS)
log(f"{'destreza':12} {hdr}")
for skill in SKILLS:
    c = Counter(band_for(it["difficulty"]) for it in built if it["skill"] == skill)
    log(f"{skill:12} " + "  ".join(f"{c.get(b, 0):>4}" for b, _, _ in CEFR_BANDS))
log()

log("=" * 66)
log("LOS ITEMS Y SU JUSTIFICACION DE DIFICULTAD")
log("=" * 66)
for skill in SKILLS:
    for fmt in FORMATS[skill]:
        sel = sorted((it for it in built if it["format"] == fmt),
                     key=lambda x: x["difficulty"])
        if not sel:
            continue
        log(f"\n--- {fmt.upper()} ({skill}) ---")
        for it in sel:
            enun = it["speak"] if it["skill"] == "listening" else it["prompt"]
            log(f"  [{it['difficulty']:4.1f} {it['cefr']:5}] {it['id']}")
            log(f"      {'habla' if it['skill'] == 'listening' else 'enunciado'}: {enun}")
            log(f"      opciones: {it['options']}   correcta[{it['correct_index']}]="
                f"{it['_correct']!r}")
            log(f"      por que: {it['_why']}")
log()

log("--- ERRORES ---")
log("  ninguno" if not errors else "")
for e in errors[:30]:
    log(f"  X {e}")
if len(errors) > 30:
    log(f"  ... y {len(errors) - 30} mas")
log("--- ADVERTENCIAS ---")
log("  ninguna" if not warns else "")
for w in warns[:40]:
    log(f"  ! {w}")
if len(warns) > 40:
    log(f"  ... y {len(warns) - 40} mas")
log()


# ----------------------------------------------------------------------
# 6. Salidas
# ----------------------------------------------------------------------
# `_correct` y `_why` no se despliegan: el primero regalaria la respuesta a
# cualquiera que abra el .js, y el segundo es prosa de revision que engordaria
# un banco que DataLoader tiene que descargar.
clean = []
for it in built:
    clean.append({k: v for k, v in it.items() if not k.startswith("_")})

final = {
    "file": "placement_data.json",
    "purpose": "Banco de items del test de nivel. GENERADO por "
               "tools/build_placement.py — no editar a mano.",
    "version": 1,
    "status": "pilot" if PILOT else "complete",
    "scale": {"min": 0, "max": 50, "anchors": {str(v): n for v, n in CEFR_ANCHORS}},
    "skills": list(SKILLS),
    "formats": {s: list(FORMATS[s]) for s in SKILLS},
    "count": len(clean),
    "recommendations": RECOMMENDATIONS,
    "items": clean,
}

if not errors:
    with open(os.path.join(PROJ, "placement_data.json"), "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    with open(os.path.join(PROJ, "placement_data.js"), "w", encoding="utf-8") as f:
        f.write("const PLACEMENT_DATA = " + json.dumps(final, ensure_ascii=False) + ";")
    if new_defs:
        with open(os.path.join(OUT, "placement_definitions_additions.json"),
                  "w", encoding="utf-8") as f:
            json.dump({
                "file": "placement_definitions_additions.json",
                "purpose": "Definiciones nuevas del test de nivel. Traducir `es` y "
                           "fusionar dentro de definitions.json -> definitions. "
                           "NUNCA sobreescribir una clave existente.",
                "count": len(new_defs),
                "definitions": dict(sorted(new_defs.items())),
            }, f, ensure_ascii=False, indent=2)
else:
    log("!! No se escribio ninguna salida: hay errores que corregir primero.")

with open(os.path.join(OUT, "placement_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

log("=" * 66)
log("ARCHIVOS")
log("=" * 66)
if not errors:
    log(f"../placement_data.json / .js   ({len(clean)} items)  <- raiz, se despliega")
    if new_defs:
        log(f"placement_definitions_additions.json  ({len(new_defs)} por traducir)")
log("placement_report.txt")
log()
log("RESULTADO: " + ("FALLO — hay errores" if errors else
                     "OK — banco valido" + ("  (PILOTO, completitud sin exigir)" if PILOT else "")))
sys.exit(1 if errors else 0)

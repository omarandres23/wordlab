# -*- coding: utf-8 -*-
"""
SIMULACION DEL TEST DE NIVEL — 2.000 jugadores sinteticos.

Corre el motor (placement_engine.py, verificado identico a placement.js por
verify_engine_parity.py) sobre jugadores con theta VERDADERO conocido, y mide
cuanto se equivoca.

>>> LO QUE ESTA SIMULACION NO PUEDE DEMOSTRAR <<<
Si se generan las respuestas con las MISMAS dificultades `b` que el motor usa
para estimar, el resultado es circular: demuestra que el estimador recupera
theta SI el banco esta bien calibrado, y las dificultades del banco son juicio
experto a priori, no calibracion empirica con respuestas reales.

Por eso hay tres escenarios de ruido. El motor siempre cree `b`; el jugador
responde segun `b + N(0, sigma)`:

    sigma = 0    optimista: el banco esta perfectamente calibrado
    sigma = 3    calibracion experta buena
    sigma = 6    PESIMISTA REALISTA — es el numero que dice cuanto se puede
                 confiar de verdad en la cifra que ve el jugador

Perfiles: cada jugador tiene TRES thetas, uno por destreza, porque la gente
real llega despareja. Un tercio son perfiles con listening MUY por debajo del
resto, que es el patron tipico del hispanohablante y el caso que el desglose
por destreza existe para detectar.

Uso:
    python simulate_placement.py            # 2000 jugadores, los 3 escenarios
    python simulate_placement.py --n 300    # mas rapido para iterar
"""

import json
import math
import os
import sys

import numpy as np

from placement_engine import (GUESS, PRIOR_MEAN, PRIOR_SD, S, SKILLS, Session,
                              estimate, label_for, load_bank)

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = os.path.dirname(os.path.abspath(__file__))
N_PLAYERS = 2000
for i, a in enumerate(sys.argv):
    if a == "--n" and i + 1 < len(sys.argv):
        N_PLAYERS = int(sys.argv[i + 1])

NOISE_SCENARIOS = [
    (0.0, "sin ruido (optimista, circular)"),
    (3.0, "N(0,3) — calibracion experta buena"),
    (6.0, "N(0,6) — PESIMISTA REALISTA"),
]

CEFR_BANDS = [("A1", 0, 7.5), ("A2", 7.5, 17.5), ("B1", 17.5, 27.5),
              ("B2", 27.5, 37.5), ("C1", 37.5, 47.5), ("C2", 47.5, 50.01)]

report = []
def log(s=""):
    print(s)
    report.append(str(s))


def band_of(x):
    for name, lo, hi in CEFR_BANDS:
        if lo <= x < hi:
            return name
    return "C2"


def make_players(n, rng):
    """Tres thetas por jugador. Un tercio con listening hundido a proposito."""
    players = []
    for i in range(n):
        base = rng.uniform(0, 50)
        v = np.clip(base + rng.normal(0, 4), 0, 50)
        g = np.clip(base + rng.normal(0, 4), 0, 50)
        uneven = (i % 3 == 0)  # exactamente un tercio, no al azar
        if uneven:
            l = np.clip(base - rng.uniform(8, 18), 0, 50)
        else:
            l = np.clip(base + rng.normal(0, 4), 0, 50)
        players.append({"vocab": float(v), "grammar": float(g), "listening": float(l),
                        "uneven": uneven})
    return players


def make_offsets(items, sigma, seed):
    """
    Error de CALIBRACION: un desvio FIJO por item, no un ruido nuevo en cada
    respuesta.

    Esto es una correccion de fondo sobre la primera version de este script.
    Sortear ruido nuevo cada vez que se sirve un item modela ruido de MEDICION,
    que se promedia entre los 24 items y casi no mueve el resultado — de hecho
    daba el mismo MAE con sigma 0 y con sigma 6, que era la senal de que estaba
    midiendo la cosa equivocada.

    Que el banco este mal calibrado significa otra cosa: que la dificultad real
    de un item concreto es distinta de la que dice el banco, SIEMPRE, para todos
    los jugadores. Ese error no se promedia, se arrastra.
    """
    if sigma <= 0:
        return {it["id"]: 0.0 for it in items}
    r = np.random.default_rng(seed)
    return {it["id"]: float(r.normal(0, sigma)) for it in items}


def run_session(items, player, offsets, rng, listening=True):
    s = Session(items, listening=listening)
    while not s.is_done():
        it = s.current
        if it is None:
            break
        b_true = it["difficulty"] + offsets.get(it["id"], 0.0)
        theta = player[it["skill"]]
        p = GUESS + (1 - GUESS) / (1 + math.exp(-(theta - b_true) / S))
        s.answer(rng.random() < p)
    return s.result()


def summarize(rows, title, listening=True):
    """rows: lista de (true_overall, est_overall, player, result)"""
    log("-" * 70)
    log(title)
    log("-" * 70)

    err = np.array([r[1] - r[0] for r in rows])
    mae = float(np.mean(np.abs(err)))
    bias = float(np.mean(err))
    log(f"  MAE global            : {mae:5.2f} puntos      (objetivo < 4)")
    log(f"  Sesgo global          : {bias:+5.2f} puntos")

    # sesgo por tramo: el fallo tipico es sobrestimar a los de nivel bajo
    log(f"  {'tramo':6} {'n':>5} {'MAE':>7} {'sesgo':>8}")
    for name, lo, hi in CEFR_BANDS:
        sel = [(t, e) for t, e, _, _ in rows if lo <= t < hi]
        if not sel:
            continue
        e = np.array([x[1] - x[0] for x in sel])
        log(f"  {name:6} {len(sel):5} {np.mean(np.abs(e)):7.2f} {np.mean(e):+8.2f}")

    # banda CEFR equivocada: el numero que se traduce en una mala recomendacion
    wrong = sum(1 for t, e, _, _ in rows if band_of(t) != band_of(e))
    log(f"  Banda CEFR equivocada : {100*wrong/len(rows):5.1f}%  ({wrong}/{len(rows)})")

    # etiquetas por destreza: LO QUE DE VERDAD SE MUESTRA
    log("  Acierto de ETIQUETA por destreza (basico/intermedio/avanzado):")
    skills = SKILLS if listening else ["vocab", "grammar"]
    for sk in skills:
        ok = tot = 0
        for _, _, pl, res in rows:
            got = res["skills"].get(sk)
            if got is None:
                continue
            tot += 1
            if got["label"] == label_for(pl[sk]):
                ok += 1
        if tot:
            log(f"     {sk:10} {100*ok/tot:5.1f}%   ({ok}/{tot})")

    # el caso que mas importa: detectar al que lee bien y escucha mal
    if listening:
        ok = tot = 0
        for _, _, pl, res in rows:
            if not pl["uneven"]:
                continue
            got = res["skills"].get("listening")
            if got is None:
                continue
            tot += 1
            if got["label"] == label_for(pl["listening"]):
                ok += 1
        if tot:
            log(f"  Etiqueta de LISTENING en perfiles desparejos: {100*ok/tot:5.1f}%  ({ok}/{tot})")
            # y lo que de verdad se le pide al desglose: verlo mas bajo que el resto
            seen = 0
            for _, _, pl, res in rows:
                if not pl["uneven"]:
                    continue
                l = res["skills"].get("listening")
                v = res["skills"].get("vocab")
                if l and v and l["score"] < v["score"]:
                    seen += 1
            log(f"  ...y detectado POR DEBAJO de vocab en:        {100*seen/tot:5.1f}%")
    log()
    return {"mae": mae, "bias": bias, "wrong_band": 100 * wrong / len(rows)}


def main():
    bank = load_bank()
    items = bank["items"]
    cuts = bank["recommendations"]["label_cuts"]

    log("=" * 70)
    log(f"SIMULACION — {N_PLAYERS} jugadores sinteticos")
    log("=" * 70)
    log(f"  motor  : placement_engine.py (identico a placement.js, ver paridad)")
    log(f"  modelo : Rasch 1PL, S={S}, suelo de azar c={GUESS}")
    log(f"  prior  : N({PRIOR_MEAN}, {PRIOR_SD})")
    log(f"  cortes : basico <{cuts['basico_max']}  intermedio <={cuts['intermedio_max']}  avanzado >")
    log(f"  perfiles: 3 thetas por jugador; 1 de cada 3 con listening hundido 8-18 pts")
    log()

    resumen = {}
    for sigma, nombre in NOISE_SCENARIOS:
        rng = np.random.default_rng(20240819)  # misma poblacion en los 3 escenarios
        players = make_players(N_PLAYERS, rng)
        offsets = make_offsets(items, sigma, seed=555)
        rows = []
        for pl in players:
            res = run_session(items, pl, offsets, rng, listening=True)
            true_overall = (pl["vocab"] + pl["grammar"] + pl["listening"]) / 3.0
            rows.append((true_overall, res["overall"], pl, res))
        resumen[nombre] = summarize(rows, f"ESCENARIO: {nombre}", listening=True)

    # ---- el caso sin voces: 12 vocab + 12 grammar ----
    rng = np.random.default_rng(20240819)
    players = make_players(N_PLAYERS, rng)
    rows = []
    offsets = make_offsets(items, 3.0, seed=555)
    for pl in players:
        res = run_session(items, pl, offsets, rng, listening=False)
        # CORREGIDO: comparar siempre contra el nivel REAL del jugador
        # (promedio de las TRES destrezas), no contra el promedio de las dos
        # que el test sin voces pudo medir. Comparar contra (v+g)/2 media lo
        # bien que el motor estima lo que midio, no lo bien que estima al
        # jugador, y eso infla el numero: la primera version de este script
        # daba MAE 3.14 (mejor que el caso completo), que era el sintoma de
        # que algo estaba mal. Con el blanco correcto sale 3.92 (peor).
        true_overall = (pl["vocab"] + pl["grammar"] + pl["listening"]) / 3.0
        rows.append((true_overall, res["overall"], pl, res))
    sin_voces = summarize(rows, "SIN VOCES DE INGLES — 12 vocab + 12 grammar, ruido N(0,3)",
                          listening=False)

    # ---- el sesgo del prior en los extremos, con seleccion adaptativa real ----
    log("-" * 70)
    log("SESGO DEL PRIOR EN LOS EXTREMOS")
    log("-" * 70)
    log(f"  El prior N({PRIOR_MEAN:.0f},{PRIOR_SD:.0f}) impide que 24/24 devuelva infinito. La")
    log("  pregunta es cuanto encoge los extremos. Medido con seleccion ADAPTATIVA real:")
    rng = np.random.default_rng(7)
    for etiqueta, always in (("acierta las 24", True), ("falla las 24", False)):
        s = Session(items, listening=True)
        while not s.is_done():
            if s.current is None:
                break
            s.answer(always)
        r = s.result(cuts=cuts)
        log(f"    {etiqueta:16} -> overall {r['overall']:5.1f}   display {r['display']:3}"
            f"   cefr {r['cefr']:5}   SE {r['standardError']}")
    log("  Techo y suelo EFECTIVOS del test, medidos, no supuestos.")
    log("  Nota: con items fijos en b=25 el mismo prior devuelve 45.7 y 2.9. Que")
    log("  aqui llegue a los extremos es merito de la seleccion adaptativa, que")
    log("  arrastra los items hasta b=50 y b=1 y acumula evidencia suficiente")
    log("  para dominar al prior. Sin adaptacion el techo si se quedaria corto.")
    log()

    # ---- distribucion esperada de cubetas ----
    log("-" * 70)
    log("DISTRIBUCION ESPERADA DE ETIQUETAS")
    log("-" * 70)
    log("  Sobre la poblacion simulada (theta uniforme 0-50). Si el 85% cayera en")
    log("  una sola cubeta las etiquetas no informarian aunque los cortes sean")
    log("  correctos. OJO: esta poblacion es uniforme por construccion, no es una")
    log("  muestra real de estudiantes hispanohablantes — ver limitaciones.")
    rng = np.random.default_rng(20240819)
    players = make_players(N_PLAYERS, rng)
    counts = {"basico": 0, "intermedio": 0, "avanzado": 0}
    per_skill = {sk: {"basico": 0, "intermedio": 0, "avanzado": 0} for sk in SKILLS}
    offsets = make_offsets(items, 3.0, seed=555)
    for pl in players:
        res = run_session(items, pl, offsets, rng, listening=True)
        counts[label_for(res["overall"], cuts)] += 1
        for sk in SKILLS:
            g = res["skills"].get(sk)
            if g:
                per_skill[sk][g["label"]] += 1
    log(f"  global    : " + "  ".join(f"{k} {100*v/N_PLAYERS:5.1f}%" for k, v in counts.items()))
    for sk in SKILLS:
        tot = sum(per_skill[sk].values()) or 1
        log(f"  {sk:10}: " + "  ".join(f"{k} {100*v/tot:5.1f}%" for k, v in per_skill[sk].items()))
    log()

    log("=" * 70)
    log("RESUMEN")
    log("=" * 70)
    log(f"  {'escenario':40} {'MAE':>6} {'sesgo':>7} {'banda mal':>10}")
    for nombre, r in resumen.items():
        log(f"  {nombre:40} {r['mae']:6.2f} {r['bias']:+7.2f} {r['wrong_band']:9.1f}%")
    log(f"  {'sin voces (12+12), N(0,3)':40} {sin_voces['mae']:6.2f} "
        f"{sin_voces['bias']:+7.2f} {sin_voces['wrong_band']:9.1f}%")

    with open(os.path.join(OUT, "placement_simulation_report.txt"), "w",
              encoding="utf-8") as f:
        f.write("\n".join(report))
    log()
    log("escrito: placement_simulation_report.txt")


if __name__ == "__main__":
    main()

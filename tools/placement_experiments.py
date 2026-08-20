# -*- coding: utf-8 -*-
"""
CUATRO EXPERIMENTOS SOBRE EL MOTOR + la correccion del caso sin voces.

1. AZAR vs PRIOR — de donde sale el sesgo de +3.57 en A1.
   El argumento de la simetria no era concluyente: arriba hay censura de escala
   (no hay items sobre 50) y abajo el sospechoso es la adivinanza, y que los
   dos sesgos se parezcan no prueba que compartan causa. Se dirime generando
   respuestas SIN azar y viendo si el sesgo se desploma.

2. PRIOR MAS DEBIL — si el prior esta haciendo menos trabajo del temido,
   aflojarlo deberia bajar el sesgo de los principiantes sin romper nada.

3. DESGLOSE DEL ERROR DE BANDA — un tercio de bandas mal no significa nada sin
   saber si son de ±1 banda (tolerable) o de ±2 (no).

4. POBLACION REALISTA — la uniforme 0-50 no predice nada sobre alumnos reales.

+ CORRECCION: el caso sin voces se comparaba contra el promedio de las DOS
  destrezas medidas en vez del de las tres. Eso infla el resultado: mide lo
  bien que estima lo que midio, no lo bien que estima al jugador.

Uso:  python placement_experiments.py [--n 2000]
"""

import math
import os
import sys

import numpy as np

import placement_engine as PE
from placement_engine import SKILLS, Session, label_for, load_bank

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = os.path.dirname(os.path.abspath(__file__))
N = 2000
for i, a in enumerate(sys.argv):
    if a == "--n" and i + 1 < len(sys.argv):
        N = int(sys.argv[i + 1])

BANDS = [("A1", 0, 7.5), ("A2", 7.5, 17.5), ("B1", 17.5, 27.5),
         ("B2", 27.5, 37.5), ("C1", 37.5, 47.5), ("C2", 47.5, 50.01)]
BAND_IDX = {b[0]: i for i, b in enumerate(BANDS)}

report = []
def log(s=""):
    print(s)
    report.append(str(s))


def band_of(x):
    for name, lo, hi in BANDS:
        if lo <= x < hi:
            return name
    return "C2"


def make_players(n, rng, dist="uniform"):
    players = []
    for i in range(n):
        if dist == "uniform":
            base = rng.uniform(0, 50)
        else:  # secundaria hispanohablante: N(17, 8) truncada
            base = float(np.clip(rng.normal(17, 8), 0, 50))
        v = float(np.clip(base + rng.normal(0, 4), 0, 50))
        g = float(np.clip(base + rng.normal(0, 4), 0, 50))
        uneven = (i % 3 == 0)
        l = float(np.clip(base - rng.uniform(8, 18), 0, 50)) if uneven \
            else float(np.clip(base + rng.normal(0, 4), 0, 50))
        players.append({"vocab": v, "grammar": g, "listening": l, "uneven": uneven})
    return players


def make_offsets(items, sigma, seed=555):
    if sigma <= 0:
        return {it["id"]: 0.0 for it in items}
    r = np.random.default_rng(seed)
    return {it["id"]: float(r.normal(0, sigma)) for it in items}


def run(items, player, offsets, rng, listening=True, c_gen=0.25):
    """c_gen es el azar con el que RESPONDE el jugador. El motor usa PE.GUESS,
    que puede ser distinto: asi se separa 'hay azar' de 'el motor lo modela'."""
    s = Session(items, listening=listening)
    while not s.is_done():
        it = s.current
        if it is None:
            break
        b = it["difficulty"] + offsets.get(it["id"], 0.0)
        th = player[it["skill"]]
        p = c_gen + (1 - c_gen) / (1 + math.exp(-(th - b) / PE.S))
        s.answer(rng.random() < p)
    return s.result()


def sweep(items, sigma, c_gen=0.25, listening=True, dist="uniform", n=None):
    n = n or N
    rng = np.random.default_rng(20240819)
    players = make_players(n, rng, dist)
    offsets = make_offsets(items, sigma)
    rows = []
    for pl in players:
        res = run(items, pl, offsets, rng, listening=listening, c_gen=c_gen)
        # SIEMPRE contra el nivel real del jugador: promedio de las TRES
        # destrezas, tambien cuando el test solo pudo medir dos.
        true_all3 = (pl["vocab"] + pl["grammar"] + pl["listening"]) / 3.0
        true_meas = (pl["vocab"] + pl["grammar"]) / 2.0
        rows.append((true_all3, true_meas, res["overall"], pl, res))
    return rows


def band_bias(rows, key=0):
    out = []
    for name, lo, hi in BANDS:
        sel = [(r[key], r[2]) for r in rows if lo <= r[key] < hi]
        if not sel:
            continue
        e = np.array([b - a for a, b in sel])
        out.append((name, len(sel), float(np.mean(np.abs(e))), float(np.mean(e))))
    return out


def mae_bias(rows, key=0):
    e = np.array([r[2] - r[key] for r in rows])
    return float(np.mean(np.abs(e))), float(np.mean(e))


def extremes(items):
    """24/24 y 0/24 con seleccion adaptativa real, con el prior que este puesto."""
    out = []
    for always in (True, False):
        s = Session(items, listening=True)
        while not s.is_done():
            if s.current is None:
                break
            s.answer(always)
        r = s.result()
        out.append((r["overall"], r["display"], r["cefr"]))
    return out


def main():
    bank = load_bank()
    items = bank["items"]
    cuts = bank["recommendations"]["label_cuts"]

    log("=" * 74)
    log(f"EXPERIMENTOS SOBRE EL MOTOR — {N} jugadores por corrida")
    log("=" * 74)
    log()

    # ================================================================
    # 0. CORRECCION — el caso sin voces contra el blanco correcto
    # ================================================================
    log("-" * 74)
    log("0. CORRECCION: el caso SIN VOCES estaba comparado contra el blanco")
    log("   equivocado (promedio de las 2 destrezas medidas, no de las 3).")
    log("-" * 74)
    rows_nv = sweep(items, 3.0, listening=False)
    mae_bad, bias_bad = mae_bias(rows_nv, key=1)   # contra (v+g)/2  <- lo viejo
    mae_ok, bias_ok = mae_bias(rows_nv, key=0)     # contra (v+g+l)/3 <- correcto
    rows_full = sweep(items, 3.0, listening=True)
    mae_full, bias_full = mae_bias(rows_full, key=0)
    log(f"   completo (3 destrezas), contra (v+g+l)/3 : MAE {mae_full:5.2f}  sesgo {bias_full:+5.2f}")
    log(f"   sin voces, contra (v+g)/2   [INFLADO]    : MAE {mae_bad:5.2f}  sesgo {bias_bad:+5.2f}")
    log(f"   sin voces, contra (v+g+l)/3 [CORRECTO]   : MAE {mae_ok:5.2f}  sesgo {bias_ok:+5.2f}")
    log(f"   degradacion real por no medir listening  : {mae_ok - mae_full:+5.2f} puntos de MAE")
    log()

    # ================================================================
    # 1. AZAR vs PRIOR
    # ================================================================
    log("-" * 74)
    log("1. DE DONDE SALE EL SESGO DE A1: azar o prior")
    log("-" * 74)
    base = sweep(items, 6.0, c_gen=0.25)                    # motor c=.25, jugador c=.25
    noguess_same = sweep(items, 6.0, c_gen=0.0)             # jugador SIN azar, motor igual
    PE.GUESS = 0.0
    noguess_both = sweep(items, 6.0, c_gen=0.0)             # sin azar en ninguno
    PE.GUESS = 0.25

    log(f"   {'tramo':6} {'A: azar normal':>16} {'B: jugador sin azar':>21} {'C: sin azar en nada':>21}")
    log(f"   {'':6} {'(motor c=.25)':>16} {'(motor c=.25)':>21} {'(motor c=0)':>21}")
    ba, bb, bc = band_bias(base), band_bias(noguess_same), band_bias(noguess_both)
    da = {x[0]: x for x in ba}; db = {x[0]: x for x in bb}; dc = {x[0]: x for x in bc}
    for name, _, _ in BANDS:
        if name not in da:
            continue
        log(f"   {name:6} {da[name][3]:+16.2f} {db.get(name,(0,0,0,float('nan')))[3]:+21.2f}"
            f" {dc.get(name,(0,0,0,float('nan')))[3]:+21.2f}")
    for lbl, rws in (("A", base), ("B", noguess_same), ("C", noguess_both)):
        m, b = mae_bias(rws)
        log(f"   {lbl}: MAE global {m:5.2f}   sesgo global {b:+5.2f}")
    log()

    # ================================================================
    # 2. PRIOR MAS DEBIL
    # ================================================================
    log("-" * 74)
    log("2. AFLOJAR EL PRIOR (escenario N(0,6))")
    log("-" * 74)
    log(f"   {'prior':22} {'MAE':>6} {'sesgo':>7} {'A1':>7} {'A2':>7}   24/24    0/24")
    orig_sd = PE.PRIOR_SD
    for sd, nombre in ((15.0, "N(25,15)  actual"), (40.0, "N(25,40)  debil"),
                       (1e9, "practicamente ninguno")):
        PE.PRIOR_SD = sd
        rws = sweep(items, 6.0)
        m, b = mae_bias(rws)
        bb_ = {x[0]: x[3] for x in band_bias(rws)}
        ex = extremes(items)
        log(f"   {nombre:22} {m:6.2f} {b:+7.2f} {bb_.get('A1', float('nan')):+7.2f}"
            f" {bb_.get('A2', float('nan')):+7.2f}   {ex[0][1]:>3}     {ex[1][1]:>3}")
    PE.PRIOR_SD = orig_sd
    log()

    # ================================================================
    # 3. DESGLOSE DEL ERROR DE BANDA
    # ================================================================
    log("-" * 74)
    log("3. ERROR DE BANDA CEFR: ±1 vs ±2 o mas")
    log("-" * 74)
    log(f"   {'escenario':28} {'exacta':>8} {'±1':>8} {'±2 o mas':>10}")
    for sigma, nombre in ((0.0, "sin ruido"), (3.0, "N(0,3)"), (6.0, "N(0,6) pesimista")):
        rws = sweep(items, sigma)
        d = [abs(BAND_IDX[band_of(r[0])] - BAND_IDX[band_of(r[2])]) for r in rws]
        n = len(d)
        ex = sum(1 for x in d if x == 0)
        one = sum(1 for x in d if x == 1)
        two = sum(1 for x in d if x >= 2)
        log(f"   {nombre:28} {100*ex/n:7.1f}% {100*one/n:7.1f}% {100*two/n:9.1f}%")
    log()

    # ================================================================
    # 4. POBLACION REALISTA
    # ================================================================
    log("-" * 74)
    log("4. REPARTO DE CUBETAS CON POBLACION REALISTA")
    log("-" * 74)
    log("   theta ~ N(17, 8) truncada a [0,50]  (A2.5 de media: secundaria")
    log("   hispanohablante), frente a la uniforme 0-50 del reporte anterior.")
    log(f"   {'poblacion':22} {'destreza':11} {'basico':>9} {'intermedio':>12} {'avanzado':>10}")
    for dist, nombre in (("uniform", "uniforme 0-50"), ("realista", "N(17,8) truncada")):
        rws = sweep(items, 3.0, dist=dist)
        for sk in ("vocab",):
            c = {"basico": 0, "intermedio": 0, "avanzado": 0}
            for r in rws:
                g = r[4]["skills"].get(sk)
                if g:
                    c[g["label"]] += 1
            t = sum(c.values()) or 1
            log(f"   {nombre:22} {sk:11} {100*c['basico']/t:8.1f}% "
                f"{100*c['intermedio']/t:11.1f}% {100*c['avanzado']/t:9.1f}%")
        # y el reparto VERDADERO, para separar el error del motor del de los cortes
        ct = {"basico": 0, "intermedio": 0, "avanzado": 0}
        for r in rws:
            ct[label_for(r[3]["vocab"], cuts)] += 1
        t = sum(ct.values()) or 1
        log(f"   {'  (reparto VERDADERO)':22} {'vocab':11} {100*ct['basico']/t:8.1f}% "
            f"{100*ct['intermedio']/t:11.1f}% {100*ct['avanzado']/t:9.1f}%")
    log()

    with open(os.path.join(OUT, "placement_experiments_report.txt"), "w",
              encoding="utf-8") as f:
        f.write("\n".join(report))
    log("escrito: placement_experiments_report.txt")


if __name__ == "__main__":
    main()

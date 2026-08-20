# -*- coding: utf-8 -*-
"""
REIMPLEMENTACION EN PYTHON DEL MOTOR DE placement.js

No hay `node` instalado en esta maquina, asi que la simulacion no puede llamar
al JS real. La alternativa honesta es reimplementarlo aqui y DEMOSTRAR que las
dos versiones dan el mismo resultado sobre casos fijos, que es lo que hace
tools/verify_engine_parity.py.

>>> ESTE ARCHIVO ES UNA COPIA. <<<
Si se toca placement.js hay que tocarlo aqui y volver a correr la paridad. No
hay candado automatico como el de phonetic_rules.py porque no se puede parsear
JS con `ast`; el candado es el test de paridad, y por eso tiene que correrse
siempre despues de cambiar el motor.

Detalles que parecen pedanteria y NO lo son — sin ellos la paridad se rompe
en el ultimo decimal y el test deja de servir:

  * La rejilla se construye ACUMULANDO (t += 0.1), igual que el bucle de JS.
    Con numpy.arange o con i*0.1 los puntos no son los mismos flotantes.
  * JS redondea .5 hacia arriba (Math.round(2.5) == 3); Python usa redondeo
    bancario (round(2.5) == 2). Se replica el de JS con floor(x + 0.5).
  * El orden del banco importa: `filter` en JS y la lista de Python conservan
    el orden del JSON, y el desempate de pickItem depende de ese orden.
"""

import json
import math
import os

import numpy as np

# ---------------------------------------------------------------- constantes
SCALE_MIN = 0.0
SCALE_MAX = 50.0
S = 6.0
GUESS = 0.25
PRIOR_MEAN = 25.0
# 15 -> 40: ver la justificacion medida en el comentario de placement.js.
# Si se cambia aqui hay que cambiarlo ALLI tambien y re-correr la paridad.
PRIOR_SD = 40.0
GRID_STEP = 0.1
TOTAL = 24
PER_SKILL = 8
LOCATE_N = 6
LOCATE_STEPS = [12.0, 8.0, 5.0, 3.5, 2.5, 2.0]
LOCATE_START = 25.0
NEAR_POOL = 6
SKILLS = ["vocab", "grammar", "listening"]

# (20,33) -> (22,35): cortes calibrados, no alineados al CEFR. La justificacion
# completa esta en build_placement.py (LABEL_CUTS) y en placement.js. La copia
# que manda es la del banco; esta es solo el respaldo.
FALLBACK_CUTS = {"basico_max": 22.0, "intermedio_max": 35.0}
FALLBACK_ANCHORS = {0: "A1.0", 5: "A1.5", 10: "A2.0", 15: "A2.5", 20: "B1.0",
                    25: "B1.5", 30: "B2.0", 35: "B2.5", 40: "C1.0", 45: "C1.5",
                    50: "C2"}


def js_round(x):
    """Math.round de JS: los .5 van hacia +infinito, no al par mas cercano."""
    return math.floor(x + 0.5)


def clamp(x):
    return max(SCALE_MIN, min(SCALE_MAX, x))


# La rejilla se construye UNA vez, acumulando exactamente como el for de JS.
def _build_grid():
    g = []
    t = SCALE_MIN
    while t <= SCALE_MAX + 1e-9:
        g.append(t)
        t += GRID_STEP
    return g


GRID = _build_grid()
GRID_NP = np.array(GRID, dtype=np.float64)


def prob(theta, b):
    return GUESS + (1.0 - GUESS) / (1.0 + math.exp(-(theta - b) / S))


def log_post_scalar(theta, responses):
    """Version escalar, identica al JS instruccion por instruccion."""
    ll = 0.0
    for b, correct in responses:
        p = prob(theta, b)
        pc = min(0.999999, max(0.000001, p))
        ll += math.log(pc) if correct else math.log(1.0 - pc)
    z = (theta - PRIOR_MEAN) / PRIOR_SD
    return ll - 0.5 * z * z


def _log_post_grid(responses):
    """Version vectorizada para el bulk. Devuelve logPost sobre toda la rejilla."""
    if not responses:
        z = (GRID_NP - PRIOR_MEAN) / PRIOR_SD
        return -0.5 * z * z
    bs = np.array([r[0] for r in responses], dtype=np.float64)
    ok = np.array([1.0 if r[1] else 0.0 for r in responses], dtype=np.float64)
    p = GUESS + (1.0 - GUESS) / (1.0 + np.exp(-(GRID_NP[:, None] - bs[None, :]) / S))
    pc = np.clip(p, 0.000001, 0.999999)
    ll = (ok[None, :] * np.log(pc) + (1.0 - ok[None, :]) * np.log(1.0 - pc)).sum(axis=1)
    z = (GRID_NP - PRIOR_MEAN) / PRIOR_SD
    return ll - 0.5 * z * z


def estimate(responses, exact=False):
    """
    responses: lista de (b, correct).
    exact=True usa la ruta escalar (para el test de paridad); por defecto usa
    numpy, que da el mismo resultado una vez redondeado a 0.1.
    """
    if not responses:
        return {"theta": PRIOR_MEAN, "se": PRIOR_SD, "n": 0}

    if exact:
        best_theta, best_val = PRIOR_MEAN, -math.inf
        for t in GRID:
            v = log_post_scalar(t, responses)
            if v > best_val:
                best_val, best_theta = v, t
    else:
        vals = _log_post_grid(responses)
        idx = int(np.argmax(vals))
        best_theta, best_val = GRID[idx], float(vals[idx])

    h = 0.5
    lo, hi = clamp(best_theta - h), clamp(best_theta + h)
    second = (log_post_scalar(hi, responses) - 2.0 * best_val
              + log_post_scalar(lo, responses)) / (h * h)
    info = -second if second < 0 else 1.0 / (PRIOR_SD * PRIOR_SD)
    return {
        "theta": js_round(best_theta * 10) / 10.0,
        "se": js_round((1.0 / math.sqrt(info)) * 10) / 10.0,
        "n": len(responses),
    }


def cefr_for(score, anchors=None):
    a = anchors or FALLBACK_ANCHORS
    best, best_d = None, math.inf
    for k in a:
        d = abs(float(k) - score)
        if d < best_d:
            best_d, best = d, a[k]
    return best


def label_for(score, cuts=None):
    c = cuts or FALLBACK_CUTS
    if score < c["basico_max"]:
        return "basico"
    if score <= c["intermedio_max"]:
        return "intermedio"
    return "avanzado"


def build_schedule(use_listening):
    skills = SKILLS if use_listening else ["vocab", "grammar"]
    out = []
    while len(out) < TOTAL:
        for s in skills:
            if len(out) >= TOTAL:
                break
            out.append(s)
    return out


def pick_item(pool, theta, format_counts):
    """Mismo desempate que JS: sort estable por distancia, ventana NEAR_POOL,
    y dentro de ella el formato menos usado con comparacion ESTRICTA (<), que
    conserva el primero — o sea el mas cercano — en caso de empate."""
    if not pool:
        return None
    dec = sorted(((abs(it["difficulty"] - theta), i, it) for i, it in enumerate(pool)),
                 key=lambda x: (x[0], x[1]))
    near = dec[:min(NEAR_POOL, len(dec))]
    best = near[0][2]
    best_count = math.inf
    for _, _, it in near:
        c = format_counts.get(it["format"], 0)
        if c < best_count:
            best_count = c
            best = it
    return best


class Session:
    """Equivalente de Placement.create()."""

    def __init__(self, items, seen_ids=None, listening=True):
        seen = set(seen_ids or [])
        self.available = [it for it in items if it["id"] not in seen]
        listening_pool = [it for it in self.available if it["skill"] == "listening"]
        self.use_listening = listening and len(listening_pool) >= PER_SKILL
        self.schedule = build_schedule(self.use_listening)
        self.used = set()
        self.responses = []          # (b, correct)
        self.items_seen = []
        self.items_failed = []
        self.by_skill = {s: [] for s in SKILLS}
        self.format_counts = {s: {} for s in SKILLS}
        self.theta = LOCATE_START
        self.current = None
        self._advance()

    def _pool_for(self, skill):
        return [it for it in self.available
                if it["skill"] == skill and it["id"] not in self.used]

    def _advance(self):
        if len(self.responses) >= TOTAL:
            self.current = None
            return
        skill = self.schedule[len(self.responses)]
        pool = self._pool_for(skill)
        if not pool:
            alt = None
            for s in SKILLS:
                p = self._pool_for(s)
                if p:
                    alt = p
                    break
            if not alt:
                self.current = None
                return
            self.current = pick_item(alt, self.theta, self.format_counts[alt[0]["skill"]])
        else:
            self.current = pick_item(pool, self.theta, self.format_counts[skill])
        if self.current:
            self.used.add(self.current["id"])

    def answer(self, correct):
        it = self.current
        if it is None:
            return
        self.responses.append((it["difficulty"], correct))
        self.by_skill[it["skill"]].append((it["difficulty"], correct))
        fc = self.format_counts[it["skill"]]
        fc[it["format"]] = fc.get(it["format"], 0) + 1
        self.items_seen.append(it["id"])
        if not correct:
            self.items_failed.append(it["id"])

        if len(self.responses) <= LOCATE_N:
            step = LOCATE_STEPS[min(len(self.responses) - 1, len(LOCATE_STEPS) - 1)]
            self.theta = clamp(self.theta + (step if correct else -step))
        else:
            self.theta = estimate(self.responses)["theta"]
        self._advance()

    def is_done(self):
        return len(self.responses) >= TOTAL or self.current is None

    def result(self, cuts=None, anchors=None):
        overall = estimate(self.responses)
        skills = {}
        for sk in SKILLS:
            rs = self.by_skill[sk]
            if not rs:
                skills[sk] = None
                continue
            e = estimate(rs)
            skills[sk] = {"score": e["theta"], "label": label_for(e["theta"], cuts),
                          "se": e["se"], "n": e["n"]}
        return {
            "overall": overall["theta"],
            "cefr": cefr_for(overall["theta"], anchors),
            "display": js_round(overall["theta"]),
            "skills": skills,
            "standardError": overall["se"],
            "itemsSeen": list(self.items_seen),
            "itemsFailed": list(self.items_failed),
            "answered": len(self.responses),
            "listeningMeasured": self.use_listening and len(self.by_skill["listening"]) > 0,
        }


def load_bank(proj=".."):
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), proj,
                        "placement_data.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)

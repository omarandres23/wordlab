# -*- coding: utf-8 -*-
"""
PARIDAD placement.js  <->  placement_engine.py

placement_engine.py es una COPIA en Python del motor. Una copia que no se
verifica es una mentira a plazo, asi que esto genera un conjunto de casos
FIJOS, imprime lo que devuelve la version Python, y escribe el snippet de JS
equivalente para correr en el navegador y comparar.

Los casos son deterministas a proposito: la regla de respuesta es
"acierta si difficulty <= umbral", que no depende de ningun RNG y por tanto
no exige que los generadores de aleatorios coincidan entre lenguajes. Asi se
comparan las DOS cosas que importan: el estimador y la seleccion de items.

Uso:
    python verify_engine_parity.py            # imprime resultados Python + el JS
    python verify_engine_parity.py --js       # solo el snippet JS
"""

import json
import sys

from placement_engine import Session, estimate, load_bank, prob

# ------------------------------------------------------------------ casos
# A) estimate() sobre listas de respuestas fijas
EST_CASES = [
    ("todo correcto en b=25", [(25.0, True)] * 24),
    ("todo fallado en b=25", [(25.0, False)] * 24),
    ("mitad y mitad, escalera", [(float(b), b <= 25) for b in range(2, 50, 2)]),
    ("un solo item", [(30.0, True)]),
    ("patron irregular", [(10.0, True), (40.0, False), (22.5, True), (33.0, True),
                          (5.0, False), (47.0, False), (28.0, True), (18.0, True)]),
]

# B) sesiones completas con regla determinista
SESSION_CASES = [
    ("umbral 20, con listening", 20.0, True),
    ("umbral 35, con listening", 35.0, True),
    ("umbral 30, SIN listening", 30.0, False),
]


def run_python():
    bank = load_bank()
    items = bank["items"]
    cuts = bank["recommendations"]["label_cuts"]
    anchors = {int(k): v for k, v in bank["scale"]["anchors"].items()}

    out = {"estimates": {}, "sessions": {}}

    for name, resp in EST_CASES:
        e = estimate(resp, exact=True)
        out["estimates"][name] = [e["theta"], e["se"]]

    for name, thr, listening in SESSION_CASES:
        s = Session(items, listening=listening)
        served = []
        while not s.is_done():
            it = s.current
            if it is None:
                break
            served.append(it["id"])
            s.answer(it["difficulty"] <= thr)
        r = s.result(cuts=cuts, anchors=anchors)
        out["sessions"][name] = {
            "served": served,
            "overall": r["overall"],
            "cefr": r["cefr"],
            "display": r["display"],
            "se": r["standardError"],
            "skills": {k: (None if v is None else [v["score"], v["label"]])
                       for k, v in r["skills"].items()},
            "listeningMeasured": r["listeningMeasured"],
        }
    return out


JS_SNIPPET = """
(() => {
  const EST_CASES = %s;
  const SESSION_CASES = %s;
  const out = { estimates: {}, sessions: {} };

  EST_CASES.forEach(([name, resp]) => {
    const e = Placement.estimate(resp.map(([b, c]) => ({ b, correct: c })));
    out.estimates[name] = [e.theta, e.se];
  });

  SESSION_CASES.forEach(([name, thr, listening]) => {
    const s = Placement.create({ listening });
    const served = [];
    while (!s.isDone()) {
      const it = s.current();
      if (!it) break;
      served.push(it.id);
      const correct = it.difficulty <= thr;
      s.answer(correct ? it.correct_index : (it.correct_index + 1) %% 4);
    }
    const r = s.result();
    out.sessions[name] = {
      served,
      overall: r.overall, cefr: r.cefr, display: r.display, se: r.standardError,
      skills: Object.fromEntries(Object.entries(r.skills).map(
        ([k, v]) => [k, v === null ? null : [v.score, v.label]])),
      listeningMeasured: r.listeningMeasured,
    };
  });
  return JSON.stringify(out);
})()
"""


def js_snippet():
    est = json.dumps([[n, [[b, c] for b, c in r]] for n, r in EST_CASES])
    ses = json.dumps([[n, t, l] for n, t, l in SESSION_CASES])
    return JS_SNIPPET % (est, ses)


if __name__ == "__main__":
    if "--js" in sys.argv:
        print(js_snippet())
    else:
        res = run_python()
        print(json.dumps(res, ensure_ascii=False, sort_keys=True))

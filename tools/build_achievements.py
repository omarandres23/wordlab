# -*- coding: utf-8 -*-
"""
BUILD + VALIDATE  ->  achievements.json + achievements.js

El banco de logros NO se escribe a mano. Si hay que cambiar un logro, se
cambia la MATRIZ de aqui abajo y se vuelve a correr el script.

La matriz son 48 badges en cuatro rangos (bronce -> plata -> oro -> platino)
que se reclaman en ese orden estricto. Regla base: bronce = basico,
plata = intermedio, oro = avanzado, platino = avanzado x5. Los juegos que no
tienen tres dificultades se ajustan: dos ejes -> plata y oro (sin bronce);
un solo eje -> oro directo.

Valida de verdad contra el proyecto, no contra si mismo:
  1. ids duplicados
  2. juego que no existe en GAME_INFO (se lee de app.js)
  3. dificultad o modo que no existe en el banco REAL de ese juego
     (se leen los *_data.json / *_data.js y se comprueba)
  4. un logro que no es el primero de su cadena sin `requires`, o con un
     `requires` que apunta a un id inexistente
  5. ciclos, cadenas huerfanas o cadenas bifurcadas
  6. un logro sin su string en ui_strings_en.json Y ui_strings_es.json
  7. el total no da exactamente 48

Uso:
    python build_achievements.py /ruta/a/english11
"""

import json, os, re, sys
from collections import Counter, defaultdict

OUT = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else ".."

report = []
def log(s=""):
    print(s); report.append(str(s))

TIERS = ["bronze", "silver", "gold", "platinum"]
LEVELS = ["basic", "intermediate", "advanced"]
EXPECTED_TOTAL = 48

# los bancos de wordle, blanks y spot estan indexados en ESPANOL; los otros
# diez en ingles. Se normaliza todo a ingles, que es la clave que usan las
# condiciones (progress.js convierte con WL_LEVEL_KEYS antes de guardar).
ES_TO_EN = {"basico": "basic", "intermedio": "intermediate", "avanzado": "advanced"}

# ------------------------------------------------------------------
# LA MATRIZ
# ------------------------------------------------------------------
# nueve juegos con tres dificultades: la regla base sin excepciones
STANDARD = ["wordle", "blanks", "spot", "wordlinks", "impostor",
            "connections", "realword", "emojimatch", "hearit"]

def standard_chain(game):
    return [
        ("bronze",   None,       {"key": f"{game}:basic",        "count": 1}),
        ("silver",   "bronze",   {"key": f"{game}:intermediate", "count": 1}),
        ("gold",     "silver",   {"key": f"{game}:advanced",     "count": 1}),
        ("platinum", "gold",     {"key": f"{game}:advanced",     "count": 5}),
    ]

# Waffle es el unico con dos ejes cruzados: cada tier exige la MISMA dificultad
# en los dos modos, y el platino 5 victorias en avanzado de cada modo.
def waffle_chain():
    def both(level, count):
        return {"all": [
            {"key": f"waffle:{level}:normal", "count": count},
            {"key": f"waffle:{level}:deluxe", "count": count},
        ]}
    return [
        ("bronze",   None,     both("basic", 1)),
        ("silver",   "bronze", both("intermediate", 1)),
        ("gold",     "silver", both("advanced", 1)),
        ("platinum", "gold",   both("advanced", 5)),
    ]

# sin dificultades: sus dos modos ocupan plata y oro, y no hay bronce.
# OJO: las claves de modo de Emoji Bomb en su banco son "basico"/"hardcore".
def two_mode_chain(game, easy, hard):
    return [
        ("silver",   None,     {"key": f"{game}:{easy}", "count": 1}),
        ("gold",     "silver", {"key": f"{game}:{hard}", "count": 1}),
        ("platinum", "gold",   {"key": f"{game}:{hard}", "count": 5}),
    ]

# Bomb Word no tiene ningun selector: un solo eje -> oro directo
def bombword_chain():
    return [
        ("gold",     None,   {"key": "bombword", "count": 1}),
        ("platinum", "gold", {"key": "bombword", "count": 5}),
    ]

MATRIX = {g: standard_chain(g) for g in STANDARD}
MATRIX["waffle"] = waffle_chain()
MATRIX["emojibomb"] = two_mode_chain("emojibomb", "basico", "hardcore")
MATRIX["strands"] = two_mode_chain("strands", "normal", "hardcore")
MATRIX["bombword"] = bombword_chain()

# ------------------------------------------------------------------
# TEXTOS (se emiten listos para fusionar en ui_strings_*)
# ------------------------------------------------------------------
GAME_LABEL = {
    "wordle": ("Word Game", "Word Game"),
    "blanks": ("Fill in the Blanks", "Fill in the Blanks"),
    "spot": ("Spot the Error", "Spot the Error"),
    "wordlinks": ("Word Links", "Word Links"),
    "impostor": ("Impostor", "Impostor"),
    "connections": ("Connections", "Connections"),
    "realword": ("Is It a Real Word?", "Is It a Real Word?"),
    "emojimatch": ("Emoji Match", "Emoji Match"),
    "hearit": ("Hear It", "Hear It"),
    "waffle": ("Waffle", "Waffle"),
    "emojibomb": ("Emoji Bomb", "Emoji Bomb"),
    "strands": ("Strands", "Strands"),
    "bombword": ("Bomb Word", "Bomb Word"),
}
TIER_LABEL = {"bronze": ("Bronze", "Bronce"), "silver": ("Silver", "Plata"),
              "gold": ("Gold", "Oro"), "platinum": ("Platinum", "Platino")}
LEVEL_LABEL = {"basic": ("Basic", "Básico"), "intermediate": ("Intermediate", "Intermedio"),
               "advanced": ("Advanced", "Avanzado")}
MODE_LABEL = {"normal": ("Normal", "Normal"), "deluxe": ("Deluxe", "Deluxe"),
              "basico": ("Basic", "Básico"), "hardcore": ("Hardcore", "Hardcore")}

# que hay que hacer para "pasar" cada juego, en las mismas palabras que la
# tabla de condiciones de progress.js
BEAT = {
    "wordle": ("Solve {lvl} without using a hint", "Resuelve {lvl} sin usar pista"),
    "blanks": ("Get every sentence right on {lvl}", "Acierta todas las oraciones en {lvl}"),
    "spot": ("Get a perfect score on {lvl}", "Consigue el puntaje perfecto en {lvl}"),
    "wordlinks": ("Score 9/9 on {lvl}", "Consigue 9/9 en {lvl}"),
    "impostor": ("Score 9/9 on {lvl}", "Consigue 9/9 en {lvl}"),
    "connections": ("Solve {lvl} with 3 mistakes or fewer", "Resuelve {lvl} con 3 errores o menos"),
    "realword": ("Score 8/8 on {lvl}", "Consigue 8/8 en {lvl}"),
    "emojimatch": ("Score 8/8 on {lvl}", "Consigue 8/8 en {lvl}"),
    "waffle": ("Win {lvl} in both modes", "Gana en {lvl} en los dos modos"),
    "emojibomb": ("Beat {mode} mode", "Supera el modo {mode}"),
    "strands": ("Solve a puzzle in {mode} mode", "Resuelve un puzzle en modo {mode}"),
    "bombword": ("Complete all 4 levels", "Completa los 4 niveles"),
}

def goal_text(game, tier, cond, lang):
    i = 0 if lang == "en" else 1
    parts = cond["all"] if "all" in cond else [cond]
    count = max(p.get("count", 1) for p in parts)
    seg = parts[0]["key"].split(":")
    level = next((s for s in seg[1:] if s in LEVELS), None)
    mode = next((s for s in seg[1:] if s in MODE_LABEL), None)

    if game == "hearit":
        # los niveles de escritura permiten un fallo; basico tiene que ser perfecto
        base = ("Score 8/8 on {lvl}", "Consigue 8/8 en {lvl}") if level == "basic" \
            else ("Score at least 7/8 on {lvl}", "Consigue al menos 7/8 en {lvl}")
    else:
        base = BEAT[game]
    txt = base[i].format(
        lvl=LEVEL_LABEL.get(level, ("", ""))[i],
        mode=MODE_LABEL.get(mode, ("", ""))[i],
    )
    if count > 1:
        if game == "waffle":
            txt = (f"Win Advanced {count} times in each mode" if lang == "en"
                   else f"Gana {count} veces en Avanzado en cada modo")
        else:
            # como clausula aparte: pegar "5 times" al final de una frase que ya
            # lleva complemento ("...without using a hint 5 times") se lee mal
            txt += f" — {count} times" if lang == "en" else f" — {count} veces"
    return txt

def strings_for(badge):
    g, tier, cond = badge["game"], badge["tier"], badge["condition"]
    out = {}
    for lang, i in (("en", 0), ("es", 1)):
        out[lang] = {
            "name": f"{GAME_LABEL[g][i]} — {TIER_LABEL[tier][i]}",
            "goal": goal_text(g, tier, cond, lang),
        }
    return out

# ------------------------------------------------------------------
# LECTURA DEL PROYECTO REAL
# ------------------------------------------------------------------
def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def read_js_bank(path, const_name):
    """los *_data.js son el mismo JSON envuelto en `const X = {...};`"""
    with open(path, encoding="utf-8") as f:
        src = f.read()
    src = re.sub(r"^\s*const\s+" + const_name + r"\s*=\s*", "", src, count=1)
    return json.loads(src.rstrip().rstrip(";"))

def game_info_keys(app_js):
    with open(app_js, encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"const GAME_INFO = \{(.*?)\n\};", src, re.S)
    if not m:
        return None
    return re.findall(r"^  ([a-zA-Z]+):\s*\{", m.group(1), re.M)

def _keys(node):
    return sorted(node.keys()) if isinstance(node, dict) else []

def _under_first_category(node):
    """niveles que viven un nivel por debajo de un mapa de categorias
       (wordle, blanks, impostor): vocab -> travel -> basico"""
    if not isinstance(node, dict) or not node:
        return {}
    return next(iter(node.values()))

# de donde salen las dificultades y los modos REALES de cada juego
SOURCES = {
    "wordle":      ("data.js", "GAME_DATA"),
    "blanks":      ("data.js", "GAME_DATA"),
    "spot":        ("spot_data.js", "SPOT_DATA"),
    "wordlinks":   ("word_links_data.json", None),
    "impostor":    ("impostor_data.json", None),
    "connections": ("connections_data.json", None),
    "realword":    ("realword_data.json", None),
    "emojimatch":  ("emojimatch_data.json", None),
    "hearit":      ("hearit_data.json", None),
    "waffle":      ("waffle_data.json", None),
    "emojibomb":   ("emojibomb_data.json", None),
    "strands":     ("strands_data.json", None),
    "bombword":    ("bombword_data.json", None),
}

PROBES = {
    "wordle":      lambda d: (_keys(_under_first_category(d["vocab"])), []),
    "blanks":      lambda d: (_keys(_under_first_category(d["blanks"])), []),
    "spot":        lambda d: (_keys(d), []),
    "wordlinks":   lambda d: (_keys(d["words"]), []),
    "impostor":    lambda d: (_keys(_under_first_category(d["sets"])), []),
    "connections": lambda d: (_keys(d["puzzles"]), []),
    "realword":    lambda d: (_keys(d["words"]), []),
    "emojimatch":  lambda d: (_keys(d["rounds"]), []),
    "hearit":      lambda d: (_keys(d["rounds"]), []),
    "waffle":      lambda d: (_keys(_under_first_category(d["puzzles"])), _keys(d["modes"])),
    "emojibomb":   lambda d: ([], _keys(d["modes"])),
    "strands":     lambda d: ([], _keys(d["modes"])),
    "bombword":    lambda d: ([], []),   # sin ningun selector
}

def real_axes(game):
    # un juego que no esta declarado aqui no puede validarse: se reporta como
    # error en vez de reventar, para que el report igual se escriba
    if game not in SOURCES or game not in PROBES:
        return None, None, "no esta declarado en SOURCES/PROBES de este script"
    fname, const = SOURCES[game]
    path = os.path.join(PROJ, fname)
    if not os.path.exists(path):
        return None, None, f"no existe {fname}"
    try:
        data = read_js_bank(path, const) if const else read_json(path)
        levels, modes = PROBES[game](data)
    except Exception as exc:
        return None, None, f"{fname}: {exc}"
    # normalizar los bancos en espanol a las claves inglesas de las condiciones
    return sorted({ES_TO_EN.get(l, l) for l in levels}), modes, None

# ------------------------------------------------------------------
# CONSTRUCCION
# ------------------------------------------------------------------
badges = []
for game, chain in MATRIX.items():
    for tier, requires, cond in chain:
        badges.append({
            "id": f"{game}:{tier}",
            "game": game,
            "tier": tier,
            **({"requires": f"{game}:{requires}"} if requires else {}),
            "condition": cond,
        })

log("=" * 64)
log("MATRIZ")
log("=" * 64)
per_game = Counter(b["game"] for b in badges)
for g in MATRIX:
    log(f"  {g:12} {per_game[g]}  ({', '.join(b['tier'] for b in badges if b['game'] == g)})")
log(f"total: {len(badges)}")
log()

# ------------------------------------------------------------------
# VALIDACION
# ------------------------------------------------------------------
log("=" * 64)
log("VALIDACION")
log("=" * 64)
errors, warns = [], []
ids = [b["id"] for b in badges]
by_id = {b["id"]: b for b in badges}

# --- 1. ids duplicados ---
dupes = [i for i, n in Counter(ids).items() if n > 1]
for d in dupes:
    errors.append(f"[1] id duplicado: {d}")

# --- 2. juego inexistente en GAME_INFO ---
known_games = game_info_keys(os.path.join(PROJ, "app.js"))
if known_games is None:
    errors.append("[2] no se pudo leer GAME_INFO de app.js")
    known_games = []
else:
    log(f"GAME_INFO tiene {len(known_games)} juegos: {', '.join(sorted(known_games))}")
    for b in badges:
        if b["game"] not in known_games:
            errors.append(f"[2] {b['id']}: '{b['game']}' no existe en GAME_INFO")

# --- 3. dificultad / modo que no existe en el banco real ---
log()
log("EJES REALES (leidos de cada banco):")
axes = {}
for game in MATRIX:
    levels, modes, err = real_axes(game)
    if err:
        errors.append(f"[3] {game}: no se pudo leer su banco -> {err}")
        axes[game] = ([], [])
        continue
    axes[game] = (levels, modes)
    log(f"  {game:12} dificultades={levels or '-'}  modos={modes or '-'}")

def check_key(badge, key):
    seg = key.split(":")
    game = seg[0]
    if game != badge["game"]:
        errors.append(f"[3] {badge['id']}: la clave '{key}' apunta a otro juego")
        return
    levels, modes = axes.get(game, ([], []))
    rest = seg[1:]
    expected = (1 if levels else 0) + (1 if modes else 0)
    if len(rest) != expected:
        errors.append(
            f"[3] {badge['id']}: la clave '{key}' tiene {len(rest)} segmento(s) y "
            f"{game} admite {expected} (dificultades={levels or '-'}, modos={modes or '-'})")
        return
    if levels and rest[0] not in levels:
        errors.append(f"[3] {badge['id']}: dificultad '{rest[0]}' no existe en el banco de {game} {levels}")
    if modes:
        m = rest[-1]
        if m not in modes:
            errors.append(f"[3] {badge['id']}: modo '{m}' no existe en el banco de {game} {modes}")

for b in badges:
    cond = b["condition"]
    parts = cond["all"] if isinstance(cond, dict) and "all" in cond else [cond]
    if not parts:
        errors.append(f"[3] {b['id']}: condicion vacia")
    for p in parts:
        if not isinstance(p, dict) or not p.get("key"):
            errors.append(f"[3] {b['id']}: condicion sin 'key'")
            continue
        if not isinstance(p.get("count", 1), int) or p.get("count", 1) < 1:
            errors.append(f"[3] {b['id']}: 'count' invalido en {p['key']}")
        check_key(b, p["key"])

# --- 4. requires ausente o roto ---
chains = defaultdict(list)
for b in badges:
    chains[b["game"]].append(b)
for game, chain in chains.items():
    for pos, b in enumerate(chain):
        if pos == 0:
            if b.get("requires"):
                errors.append(f"[4] {b['id']}: es el primero de su cadena y aun asi tiene requires")
        else:
            if not b.get("requires"):
                errors.append(f"[4] {b['id']}: no es el primero de su cadena y no tiene requires")
            elif b["requires"] not in by_id:
                errors.append(f"[4] {b['id']}: requires apunta a un id inexistente ({b['requires']})")

# --- 5. ciclos, huerfanas y bifurcaciones ---
required_by = Counter(b["requires"] for b in badges if b.get("requires"))
for target, n in required_by.items():
    if n > 1:
        errors.append(f"[5] cadena bifurcada: {n} logros dependen de {target}")

for b in badges:
    seen, node, steps = {b["id"]}, b, 0
    while node.get("requires"):
        nxt = node["requires"]
        if nxt in seen:
            errors.append(f"[5] ciclo en la cadena de {b['id']} (vuelve a {nxt})")
            break
        if nxt not in by_id:
            break  # ya reportado en [4]
        seen.add(nxt)
        node = by_id[nxt]
        steps += 1
        if steps > len(badges):
            errors.append(f"[5] cadena sin fin desde {b['id']}")
            break
    else:
        if by_id[b["id"]]["game"] != node["game"]:
            errors.append(f"[5] cadena huerfana: {b['id']} termina en otro juego ({node['id']})")

# --- 6. strings en los dos idiomas ---
missing_strings = {"en": [], "es": []}
ui = {}
for lang in ("en", "es"):
    p = os.path.join(PROJ, f"ui_strings_{lang}.json")
    try:
        ui[lang] = read_json(p)
    except Exception as exc:
        errors.append(f"[6] no se pudo leer ui_strings_{lang}.json -> {exc}")
        ui[lang] = {}
for b in badges:
    for lang in ("en", "es"):
        node = ui[lang].get("achievements", {}).get("badges", {}).get(b["id"])
        if not isinstance(node, dict) or not node.get("name") or not node.get("goal"):
            missing_strings[lang].append(b["id"])
            errors.append(f"[6] {b['id']}: falta su string en ui_strings_{lang}.json")

# --- 7. total exacto ---
if len(badges) != EXPECTED_TOTAL:
    errors.append(f"[7] el total es {len(badges)}, deben ser exactamente {EXPECTED_TOTAL}")

log()
log("--- ERRORES ---")
log("  ninguno" if not errors else "")
for e in errors[:30]:
    log(f"  X {e}")
if len(errors) > 30:
    log(f"  ... y {len(errors) - 30} mas")
log("--- ADVERTENCIAS ---")
log("  ninguna" if not warns else "")
for w in warns:
    log(f"  ! {w}")
log()

# ------------------------------------------------------------------
# SALIDAS
# ------------------------------------------------------------------
final = {
    "file": "achievements.json",
    "purpose": "Banco de logros de wordlab Games. GENERADO por tools/build_achievements.py — no editar a mano.",
    "version": 1,
    "tiers": TIERS,
    "count": len(badges),
    "badges": badges,
}

# el banco SI se despliega, asi que se escribe directo en la raiz del proyecto
# (los otros build_*.py dejan su salida en tools/ y alguien la copia a mano; ese
# paso manual es justo el que se olvida). El report y el bloque de strings, que
# no se despliegan, si se quedan aqui en tools/.
with open(os.path.join(PROJ, "achievements.json"), "w", encoding="utf-8") as f:
    json.dump(final, f, ensure_ascii=False, indent=2)
with open(os.path.join(PROJ, "achievements.js"), "w", encoding="utf-8") as f:
    f.write("const ACHIEVEMENTS = " + json.dumps(final, ensure_ascii=False) + ";")

# bloque listo para fusionar en ui_strings_*, mismo patron que
# hearit_definitions_additions.json
merge = {lang: {b["id"]: strings_for(b)[lang] for b in badges} for lang in ("en", "es")}
with open(os.path.join(OUT, "achievements_strings.json"), "w", encoding="utf-8") as f:
    json.dump({
        "file": "achievements_strings.json",
        "purpose": "Fusionar cada idioma dentro de ui_strings_<lang>.json -> achievements.badges",
        "count": len(badges),
        "strings": merge,
    }, f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT, "achievements_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

log("=" * 64)
log("ARCHIVOS GENERADOS")
log("=" * 64)
log(f"../achievements.json / .js     ({len(badges)} logros)  <- raiz, se despliega")
log(f"achievements_strings.json      ({len(badges)} x 2 idiomas)")
log("achievements_report.txt")
if missing_strings["en"] or missing_strings["es"]:
    log()
    log(f"!! faltan {len(missing_strings['en'])} strings en EN y {len(missing_strings['es'])} en ES:")
    log("   fusiona achievements_strings.json dentro de ui_strings_*.json y vuelve a correr")
log()
log("RESULTADO: " + ("FALLO — hay errores" if errors else "OK — banco valido"))

with open(os.path.join(OUT, "achievements_report.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(report))

sys.exit(1 if errors else 0)

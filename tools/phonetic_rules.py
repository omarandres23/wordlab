# -*- coding: utf-8 -*-
"""
REGLAS FONETICAS COMPARTIDAS  —  Hear It  <->  Test de nivel

El test de nivel tiene items de listening que el navegador pronuncia con
`speechSynthesis`, exactamente como HEAR IT. Los mismos problemas aplican:
un homofono no tiene respuesta justa, y un contraste que el oido hispano no
distingue mide la voz del navegador en vez de medir ingles.

En vez de reinventar esas reglas, este modulo las CENTRALIZA:

  * MINIMAL_PAIRS y HOMOPHONES se IMPORTAN de hearit_pairs.py. Fuente unica
    de verdad, sin copia: si alguien agrega un par, lo ve tambien el test.

  * HETERONYMS, SOFT_CONTRASTS y HARD_CONTRASTS son literales que hoy viven
    DENTRO de tools/build_hearit.py (~L41 y ~L124-125), no en hearit_pairs.py,
    asi que no hay forma de importarlos sin ejecutar ese script entero — que
    a su vez depende de `english_words`, un paquete que no esta instalado.
    Se copian aqui abajo.

    >>> LA COPIA ESTA PROTEGIDA. <<<
    build_placement.py lee build_hearit.py como TEXTO, lo parsea con `ast`
    (nunca lo importa ni lo ejecuta) y compara sus tres literales con estas
    copias. Si divergen, el build FALLA diciendo que literal cambio y en que
    entradas. Ver check_hearit_sync() abajo.

    Es la misma trampa que CLAUDE.md ya documenta en otros sitios: una copia
    silenciosa que se desincroniza no rompe nada visible, solo empieza a
    producir items malos. Aqui no puede pasar sin avisar.

Uso desde el generador:

    from phonetic_rules import (
        FORBIDDEN_SPOKEN, hard_contrast_between, homophone_conflict,
        audible_diff_problem, check_hearit_sync,
    )
"""

import ast
import os
import re

# datos compartidos de verdad: sin copia, importados del modulo de Hear It
from hearit_pairs import MINIMAL_PAIRS, HOMOPHONES

# ----------------------------------------------------------------------
# COPIAS VIGILADAS  (origen: tools/build_hearit.py)
# ----------------------------------------------------------------------
# build_hearit.py L41
HETERONYMS = set(['LIVE', 'READ', 'LEAD', 'TEAR', 'WIND', 'BOW', 'CLOSE', 'USE', 'RECORD', 'PRESENT', 'OBJECT', 'DESERT', 'MINUTE', 'WOUND', 'SOW', 'ROW', 'CONTENT', 'CONTRACT', 'REFUSE', 'SUBJECT', 'PROJECT', 'PRODUCE', 'PERMIT', 'CONDUCT', 'CONSOLE', 'INVALID', 'BASS', 'DOVE', 'MOBILE', 'POLISH', 'RESUME', 'SEPARATE', 'MODERATE', 'ESTIMATE', 'DELIBERATE', 'ADVOCATE', 'GRADUATE', 'DUPLICATE', 'ALTERNATE', 'APPROPRIATE', 'ELABORATE'])

# build_hearit.py L124-125.
# "Suave" y "duro" NO significan facil y dificil en abstracto: significan si el
# oido hispano los distingue SIN entrenamiento. Los duros no estan prohibidos en
# el test de nivel — estan prohibidos ABAJO. Ver HARD_CONTRAST_MIN_DIFFICULTY.
SOFT_CONTRASTS = {"silent_h", "y_j", "ae_e", "uh_ah", "w_v"}
HARD_CONTRASTS = {"short_long_i", "sh_ch", "s_z", "th", "short_long_u", "b_v"}

# Umbral propio del test de nivel, no de Hear It.
#
# build_hearit.py falla el build si un contraste duro se cuela en BASIC, y ahi
# la regla termina, porque Hear It tiene tres niveles discretos. El test de
# nivel tiene una escala continua 0-50, asi que la regla equivalente es un
# corte: un contraste duro por debajo de B1.5 frustra igual que en basic, pero
# por encima mide una destreza real que un B2 deberia tener. Prohibirlos del
# todo dejaria el listening alto sin sus items mas discriminantes.
HARD_CONTRAST_MIN_DIFFICULTY = 25.0

# ----------------------------------------------------------------------
# El contraste duro es SENAL o RUIDO segun el formato
# ----------------------------------------------------------------------
# Esta es la regla que faltaba y que se estaba aplicando a ojo. Parece
# incoherente aceptar ship/sheep en listen_word y rechazar /z/ vs /d/ en
# listen_sentence, siendo el segundo mas grueso. No lo es, porque no miden
# lo mismo:
#
#   listen_word      el contraste fonetico ES lo que se mide. Que cueste
#                    distinguirlo es la pregunta, no un defecto. Se permite
#                    por encima del umbral.
#
#   listen_sentence  lo que se mide es GRAMATICA OIDA. Si dos transcripciones
#   listen_question  se separan por un fonema dificil, el item deja de medir
#                    la gramatica y pasa a medir el oido — o peor, la calidad
#                    de la voz. Ahi el contraste duro es un CONTAMINANTE, no
#                    una dificultad legitima, y se prohibe a cualquier nivel.
HARD_CONTRAST_POLICY = {
    "listen_word": "above_threshold",
    "listen_sentence": "never",
    "listen_question": "never",
}


def hard_contrast_allowed(fmt, difficulty):
    """True si este formato admite un contraste duro a esta dificultad."""
    policy = HARD_CONTRAST_POLICY.get(fmt, "never")
    if policy == "above_threshold":
        return float(difficulty) >= HARD_CONTRAST_MIN_DIFFICULTY
    return False


# Contracciones auxiliares que se separan por UN SOLO fonema.
#
# No estan en MINIMAL_PAIRS y no es un olvido: Hear It pronuncia palabras
# SUELTAS, donde estas formas no aparecen nunca. Solo existen dentro de una
# frase, o sea exactamente en listen_sentence, y son la trampa mas facil de
# escribir sin darse cuenta: "He's been working" vs "He'd been working" se
# separan solo por /z/ vs /d/ en una silaba atona.
#
# Se tratan como contraste duro, asi que la politica de arriba las prohibe en
# los dos formatos de frase. Sin esta lista la regla seria letra muerta: el
# validador no tendria con que detectarlas.
AUX_CONTRACTION_PAIRS = [
    ("HES", "HED"), ("SHES", "SHED"), ("ITS", "ITD"),
    ("IM", "ID"), ("ID", "ILL"), ("IVE", "ID"),
    ("WERE", "WED"), ("WEVE", "WED"), ("WELL", "WED"),
    ("THEYRE", "THEYD"), ("THEYVE", "THEYD"), ("THEYLL", "THEYD"),
    ("YOURE", "YOUD"), ("YOUVE", "YOUD"), ("YOULL", "YOUD"),
    ("HELL", "HED"), ("SHELL", "SHED"), ("HES", "HELL"),
    ("WHOS", "WHOD"), ("THERES", "THERED"),
]

# ----------------------------------------------------------------------
# Derivados
# ----------------------------------------------------------------------
def _norm(w):
    """Normaliza para comparar: mayusculas, sin apostrofes ni puntuacion."""
    return re.sub(r"[^A-Z]", "", str(w).upper())


# palabra -> conjunto de palabras que suenan igual
HOMOPHONE_OF = {}
for _grp in HOMOPHONES:
    _clean = [_norm(w) for w in _grp]
    for _w in _clean:
        HOMOPHONE_OF.setdefault(_w, set()).update(x for x in _clean if x != _w)

# palabra -> {otra palabra: contraste}
CONTRAST_OF = {}
for _contrast, _pairs in MINIMAL_PAIRS.items():
    for _a, _b in _pairs:
        _a, _b = _norm(_a), _norm(_b)
        CONTRAST_OF.setdefault(_a, {})[_b] = _contrast
        CONTRAST_OF.setdefault(_b, {})[_a] = _contrast

# Las contracciones entran al mismo mapa con su propio nombre de contraste.
#
# OJO: NO se meten dentro de HARD_CONTRASTS. Ese conjunto es la copia literal de
# build_hearit.py y check_hearit_sync() lo compara caracter por caracter — meterle
# un elemento propio del test de nivel haria fallar el candado para siempre.
# El conjunto extendido, que es el que usa la logica de aqui, va aparte.
AUX_CONTRAST = "aux_contraction"
HARD_CONTRASTS_ALL = set(HARD_CONTRASTS) | {AUX_CONTRAST}
for _a, _b in AUX_CONTRACTION_PAIRS:
    CONTRAST_OF.setdefault(_a, {})[_b] = AUX_CONTRAST
    CONTRAST_OF.setdefault(_b, {})[_a] = AUX_CONTRAST

# Palabras que NUNCA pueden ser la respuesta de un item hablado:
# los heteronimos tienen dos pronunciaciones para la misma grafia (READ es
# /riːd/ o /rɛd/) y los homofonos tienen dos grafias para el mismo sonido.
# En ambos casos el jugador no puede acertar por saber ingles.
FORBIDDEN_SPOKEN = set(HETERONYMS) | set(HOMOPHONE_OF)


def homophone_conflict(a, b):
    """True si a y b suenan igual (o son la misma palabra)."""
    a, b = _norm(a), _norm(b)
    if not a or not b:
        return False
    return a == b or b in HOMOPHONE_OF.get(a, ())


def hard_contrast_between(a, b):
    """Devuelve el nombre del contraste DURO entre a y b, o None.

    Incluye aux_contraction, que no esta en la copia sincronizada de
    HARD_CONTRASTS sino en HARD_CONTRASTS_ALL — ver la nota de arriba.
    """
    c = CONTRAST_OF.get(_norm(a), {}).get(_norm(b))
    return c if c in HARD_CONTRASTS_ALL else None


def contrast_between(a, b):
    """Cualquier contraste (suave o duro) entre a y b, o None."""
    return CONTRAST_OF.get(_norm(a), {}).get(_norm(b))


# ----------------------------------------------------------------------
# Validacion de listen_sentence: la regla se aplica a la DIFERENCIA
# ----------------------------------------------------------------------
# En listen_word el riesgo esta en las palabras. En listen_sentence esta en lo
# que SEPARA a las cuatro transcripciones: si dos opciones se distinguen por
# algo que el TTS no articula, el item no mide gramatica oida, mide la voz.
def _tokens(sentence):
    return [t for t in re.split(r"\s+", str(sentence).strip()) if t]


def audible_diff_problem(opt_a, opt_b):
    """
    Compara dos transcripciones y devuelve un motivo (str) si su diferencia
    NO es audible de forma fiable, o None si el par esta bien.

    Tres casos, de peor a menos malo:
      1. suenan identicas -> el item no tiene respuesta unica
      2. difieren solo en palabras homofonas -> idem
      3. difieren solo por un contraste duro -> se permite, pero el llamador
         decide segun la dificultad del item (devuelve "hard:<contraste>")
    """
    ta, tb = _tokens(opt_a), _tokens(opt_b)

    # Alineacion posicional simple. Suficiente porque estas opciones son
    # variantes de LA MISMA frase: mismo largo casi siempre, y cuando cambia
    # el largo la diferencia ya es audible por si sola.
    if len(ta) != len(tb):
        return None  # distinto numero de palabras = claramente audible

    diffs = [(x, y) for x, y in zip(ta, tb) if _norm(x) != _norm(y)]

    if not diffs:
        # misma cadena de sonidos palabra por palabra
        return "identicas al oido"

    # si TODAS las diferencias son homofonas, el audio es el mismo
    if all(homophone_conflict(x, y) for x, y in diffs):
        return "solo difieren en homofonos: " + ", ".join(f"{x}/{y}" for x, y in diffs)

    hard = [hard_contrast_between(x, y) for x, y in diffs]
    if all(h is not None for h in hard):
        return "hard:" + ",".join(sorted(set(hard)))

    return None


# ----------------------------------------------------------------------
# EL CANDADO: comparar las copias contra build_hearit.py sin ejecutarlo
# ----------------------------------------------------------------------
_WATCHED = ("HETERONYMS", "SOFT_CONTRASTS", "HARD_CONTRASTS")


def _literal_sets_from_source(path):
    """
    Extrae los literales vigilados de un .py leyendolo como TEXTO.

    Deliberadamente con `ast` y NO con import: build_hearit.py importa
    `english_words` (no instalado) y ademas escribe archivos al ejecutarse.
    Parsearlo es riesgo cero y no arrastra dependencias.
    """
    with open(path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=path)

    found = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):
            continue
        names = [t.id for t in node.targets if isinstance(t, ast.Name)]
        for name in names:
            if name not in _WATCHED:
                continue
            v = node.value
            # caso `X = set([...])`
            if isinstance(v, ast.Call) and isinstance(v.func, ast.Name) \
                    and v.func.id == "set" and len(v.args) == 1:
                found[name] = set(ast.literal_eval(v.args[0]))
            # caso `X = {...}` / `[...]` / `(...)`
            elif isinstance(v, (ast.Set, ast.List, ast.Tuple)):
                found[name] = set(ast.literal_eval(v))
    return found


def check_hearit_sync(build_hearit_path):
    """
    Devuelve una lista de errores (vacia = todo sincronizado).

    Cada error dice QUE literal cambio y QUE entradas concretas bailan, para
    que arreglarlo sea copiar y pegar, no ir a buscar la diferencia a mano.
    """
    errors = []
    if not os.path.exists(build_hearit_path):
        return [f"no se encontro {build_hearit_path} para verificar las copias fonéticas"]

    try:
        src = _literal_sets_from_source(build_hearit_path)
    except Exception as exc:
        return [f"no se pudo parsear build_hearit.py con ast -> {exc}"]

    here = {
        "HETERONYMS": set(HETERONYMS),
        "SOFT_CONTRASTS": set(SOFT_CONTRASTS),
        "HARD_CONTRASTS": set(HARD_CONTRASTS),
    }

    for name in _WATCHED:
        if name not in src:
            errors.append(
                f"{name}: ya no existe como literal en build_hearit.py. "
                f"Si se movio de sitio, actualiza phonetic_rules.py para importarlo."
            )
            continue
        only_there = sorted(src[name] - here[name])
        only_here = sorted(here[name] - src[name])
        if only_there or only_here:
            detalle = []
            if only_there:
                detalle.append(f"en build_hearit.py y NO aqui: {only_there}")
            if only_here:
                detalle.append(f"aqui y NO en build_hearit.py: {only_here}")
            errors.append(
                f"{name} se desincronizo con build_hearit.py -> " + " | ".join(detalle)
                + ". Copia el literal actualizado a phonetic_rules.py."
            )
    return errors

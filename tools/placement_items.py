# -*- coding: utf-8 -*-
"""
TEST DE NIVEL — contenido de los items.

Separado del generador por la misma razon que hearit_pairs.py o
impostor_new_sets.py: aqui vive el CONTENIDO (que se revisa a ojo y se
discute), en build_placement.py vive el ENSAMBLADO y la validacion.

>>> ESTADO: BANCO COMPLETO — 216 items. <<<
  vocab      72 items, en placement_vocab.py
  grammar    72 items, en placement_grammar.py
  listening  72 items, en placement_listening.py

Se produjo por tandas y no de una sentada: 216 items seguidos es donde la
calidad se cae al final sin que nadie lo note. Con las tres cerradas,
IS_PILOT pasa a False y las validaciones de COBERTURA del banco vuelven a
ser ERRORES DUROS — huecos de mas de 5 puntos, desequilibrio entre formatos
y sesgo de correct_index rompen el build.

CAMPOS
  id           unico
  skill        vocab | grammar | listening
  fmt          uno de los nueve formatos
  difficulty   continuo 0-50. ES EL NUMERO QUE MANDA; `cefr` se deriva de el.
  prompt       lo que se MUESTRA en pantalla ("" en listening)
  speak        lo que se PRONUNCIA (None fuera de listening)
  correct      la opcion correcta
  distractors  las otras tres
  source       procedencia, para auditar despues
  why          por que ESA dificultad. No se despliega: se imprime en el
               reporte del generador. El banco desplegado no lleva prosa.

`correct` y `distractors` van SEPARADOS a proposito: el generador coloca la
respuesta por round-robin y baraja el resto, de modo que el reparto de
correct_index queda equilibrado por construccion y no por suerte. Ver
build_placement.py. Nunca escribas aqui un `options` ya ordenado.

En listening, `prompt` va vacio y el texto vive en `speak`: si el enunciado
se mostrara en pantalla el item mediria lectura, no oido.
"""

from placement_grammar import GRAMMAR_ITEMS
from placement_listening import LISTENING_ITEMS
from placement_vocab import VOCAB_ITEMS

# marcador que lee build_placement.py para decidir si exige cobertura completa.
# Con las tres tandas cerradas ya no hay excusa: las validaciones de banco
# completo son errores duros.
IS_PILOT = False


ITEMS = list(VOCAB_ITEMS) + list(GRAMMAR_ITEMS) + list(LISTENING_ITEMS)


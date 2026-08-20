# tools/ — generadores y validadores de bancos de datos

Scripts que **generan y validan** los bancos de datos de los juegos.
No forman parte del sitio: Netlify no los usa, nunca se cargan en el
navegador. Viven aquí para no perder las decisiones de diseño que
codifican.

Requisitos: `pip install wordfreq english-words --break-system-packages`

Cada script se corre desde esta carpeta pasándole la raíz del proyecto:

```
python build_realword.py ..
```

Todos escriben su salida y un `*_report.txt` con el detalle de la
validación, y **devuelven código de error si algo falla**.

---

## Por juego

| Script | Genera | Datos que usa |
|---|---|---|
| `build_realword.py` | `realword_data_v2.json` + definiciones nuevas | `realword_fakes.py`, `realword_advanced.py` |
| `build_emojimatch.py` | `emojimatch_data.json` + definiciones nuevas | `emojimatch_new_words.py`, `emojimatch_categories.py` |
| `build_hearit.py` | `hearit_data.json` + definiciones nuevas | `hearit_pairs.py`, `hearit_defs.py` |
| `build_impostor.py` | `impostor_data_v2.json` + `impostor_explanations_es_v2.json` | `impostor_new_sets.py` |

---

## Decisiones de diseño que estos scripts protegen

No son detalles de implementación. Son reglas que se descubrieron
probando y que, si se rompen, generan bugs **invisibles al jugar**.

### IS IT A REAL WORD

- Las palabras falsas se validan contra un diccionario real (Webster's
  web2, 234k palabras). Una "falsa" que en realidad existe le enseña
  algo incorrecto al alumno. Ya pasó: `COIX` y `VESTRAL` estaban en el
  banco original y son palabras reales.
- El filtro de frecuencia **solo** aplica a las categorías inventadas
  (pseudopalabras y sufijos españoles). En las categorías de error
  ortográfico la frecuencia alta es deseable: significa que la gente
  comete ese error de verdad.
- Categorías de falsas: typo evidente, typo sutil, error de consonante
  típico del hispanohablante, sufijo inglés mal aplicado a raíz
  española, verbo irregular regularizado con -ED, pseudopalabra.

### HEAR IT

- **Homófonos prohibidos** en los niveles donde se escribe. Si el audio
  dice /siː/ no hay forma justa de saber si era `SEE` o `SEA`.
- **Heterónimos prohibidos** también: `LIVE` es /lɪv/ o /laɪv/, `READ`
  es /riːd/ o /rɛd/. El navegador elige una y el jugador no puede
  adivinar cuál.
- Los contrastes fonéticos están separados en **suaves y duros**. Los
  duros (`ship/sheep`, `sheep/cheap`, `rice/rise`, `think/sink`,
  `full/fool`, `berry/very`) el oído hispano no los distingue sin
  entrenamiento: en el nivel básico frustran en vez de enseñar. El
  script **falla el build** si alguno se cuela en basic.
- En basic, `minimal_pair` y `contrast` son campos **opcionales**: solo
  el 24% de las rondas los lleva. El código no debe asumir que existen.

- ⚠️ **Estas reglas ya no son solo de Hear It.** El TEST DE NIVEL las
  reutiliza para sus ítems de listening, vía `phonetic_rules.py`.
  `MINIMAL_PAIRS` y `HOMOPHONES` se importan de `hearit_pairs.py` (fuente
  única, sin copia), pero `HETERONYMS`, `SOFT_CONTRASTS` y `HARD_CONTRASTS`
  son literales dentro de `build_hearit.py` y están **copiados** en
  `phonetic_rules.py`, porque importarlos exigiría ejecutar el script entero
  y su dependencia `english_words`.

  **Si cambias uno de esos tres literales, `build_placement.py` falla.**
  No es un efecto secundario molesto: es el candado. Compara las copias con
  el original parseando `build_hearit.py` con `ast` (sin importarlo ni
  ejecutarlo) y te dice qué literal cambió y en qué entradas. Copia el valor
  nuevo a `phonetic_rules.py` y vuelve a correr. Así la copia no puede
  divergir en silencio y producir ítems de listening malos.

### EMOJI MATCH

- Ningún distractor puede compartir **2 o más emojis** con la respuesta.
  Si no, la ronda tiene dos respuestas defendibles: `PENCIL` vs `RULER`
  con ✏️📐 era imposible de resolver.
- La dificultad la dan los distractores, no la palabra: basic usa
  campos semánticos distintos, intermediate y advanced el mismo campo.

### IMPOSTOR

- **Cero criterios gramaticales.** Las palabras se relacionan siempre
  por significado, nunca por ser verbo o sustantivo.
- Los `round_id` son **posicionales** (`business_basic_0`, `_1`, `_2`).
  `impostor_data.json`, `impostor_explanations_es.json` e
  `impostor_labels.json` se indexan así. Si borras un set del medio de
  un array, **todas las traducciones y etiquetas siguientes quedan
  pegadas a las palabras equivocadas**. Nunca edites uno solo de esos
  tres archivos: regenéralos juntos con el script.

---

## Regla general

Si vas a tocar un banco de datos, **modifica el script y vuelve a
correrlo**. No edites los JSON a mano: pierdes las validaciones y los
bugs que atrapan no se ven jugando.

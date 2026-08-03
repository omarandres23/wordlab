# wordlab Games

Portal estático (sin backend) de juegos para aprender inglés, en `english11/`
dentro de `Transcript videos/` (la carpeta padre tiene una herramienta de
transcripción sin relación — nunca tocarla). Deploy tipo Netlify/Vercel,
SPA sin build step: `index.html` + `app.js` + `styles.css`, cada juego es un
`<main id="screen-X" class="screen">` que se activa/desactiva con
`showScreen("#screen-X")`.

## Archivos que lo componen

- **`app.js`** — toda la lógica. Un bloque por juego, marcado con comentarios
  `GAME N — NOMBRE`.
- **`styles.css`** — todo el CSS del sitio, morado oscuro consistente.
- **`index.html`** — markup de las 14 pantallas + portada. Scripts al final
  del `<body>`, cada uno con `?v=spXX` de cache-busting (bumpear al tocar
  ese archivo).
- **`sfx.js`** — gestor de sonido, cargado antes que `app.js`.
- **`<juego>_data.json` + `<juego>_data.js`** — el `.js` es el mismo JSON
  envuelto en `const NOMBRE_DATA = {...};` (window global, sin `import`).
  Ejemplos: `waffle_data.json/.js`, `strands_data.json/.js`,
  `emojimatch_data.json/.js`, `hearit_data.json/.js`, etc. **Si se edita el
  `.json`, hay que regenerar el `.js` a mano** (ver sección definitions).
- **`definitions.json` / `definitions.js`** — banco compartido de
  significados bilingües, usado por varios juegos (ver abajo).
- **`ui_strings_en.json/.js`**, **`ui_strings_es.json/.js`** — todos los
  textos de UI. Misma relación json→js.

## `tools/` — generadores de los bancos de datos

Los bancos de Impostor, Hear It, Real Word y Emoji Match (sus `.json` en
la raíz) fueron producidos por scripts Python en `tools/`, no escritos a
mano. `tools/README.md` documenta qué genera cada script y las reglas de
diseño que cada uno protege (homófonos y contrastes fonéticos duros
prohibidos en Hear It, distractores sin emoji compartido en Emoji Match,
validación contra diccionario real en Real Word, sincronía posicional de
`round_id` entre los tres archivos de Impostor).

**Si hay que cambiar uno de estos bancos, se modifica el script
correspondiente y se vuelve a correr — nunca se edita el `.json` a
mano.** Editarlo a mano pierde las validaciones (el script falla el
build si algo queda mal) y puede romper el enlace posicional entre
`impostor_data.json`, `impostor_explanations_es.json` e
`impostor_labels.json`. `tools/` no se sube al sitio — Netlify nunca lo
toca, no está referenciado desde `index.html` — vive en el repo solo
para no perder el porqué de cada banco.

## Juegos: función principal y prefijo

| Juego | `start...()` | Prefijo de variables/funciones |
|---|---|---|
| Word Game (Wordle) | `startWordle(category, level)` | sin prefijo fijo (`answer`, `currentGuess`, `currentRow`, `wordleActive`) |
| Fill in the Blanks | `startBlanks(category, level)` | `blanks` |
| Spot the Error | `startSpot(level)` | `spot` |
| Word Links | `startWordLinks(level)` | `wl` |
| Impostor | `startImpostor(category, level)` | `imp` |
| Connections | `startConnections(level)` | `conn` |
| Is It a Real Word? | `startRealword(level)` | `rw` |
| Bomb Word | `startBombword()` | `bw` |
| Waffle | `startWaffle(mode, level)` | `wf` |
| Emoji Bomb | `startEmojiBomb(mode)` | `eb` |
| Strands | `startStrands(mode)` | `st` |
| Emoji Match | `startEmojiMatch(level)` | `em` |
| Hear It | `startHearIt(level)` | `hi` |

Todos comparten helpers globales: `$`/`$$` (querySelector), `shuffle()`,
`randomItem()`, `interp()` (interpolación de strings `${...}`), `t()`/`ts()`
(lookup en ui_strings), `lookupDefinition(word)` (respeta `selectedLanguage`).

## Sistema de niveles

El modal de inicio (`openIntro(game)`, ~línea 273) es **compartido por todos
los juegos** — un solo modal, se ajusta según el juego. `showCategory` /
`hideDifficulty` deciden qué filas mostrar (`#category-row`,
`#difficulty-row`) por juego. Los radios de dificultad usan valores en
español (`basico`/`intermedio`/`avanzado`); el banco de datos usa claves en
inglés (`basic`/`intermediate`/`advanced`). La conversión es siempre vía:

```js
const WL_LEVEL_KEYS = { basico: "basic", intermedio: "intermediate", avanzado: "advanced" };
```
Reutilizado por todos los juegos nuevos — no crear un mapeo propio.

Patrón estándar para agregar niveles a un juego: guardar `xxLevelRaw` (valor
del radio, para PLAY AGAIN) y `xxLevel` (clave del banco, vía
`WL_LEVEL_KEYS[xxLevelRaw]`), leer `DATA.rounds[xxLevel]` / `DATA.words[xxLevel]`.

## `definitions.json` / `.js`

Estructura: `{ file, purpose, style, count, definitions: { PALABRA: {en, es} } }`.
Claves siempre en MAYÚSCULAS. Usado por Real Word, Waffle, Connections, Fill
in the Blanks, Strands, Emoji Match, Hear It vía `lookupDefinition(word)`
(respeta el idioma elegido en el modal, sin botón de traducción — ya se
retiró ese sistema).

**Al fusionar definiciones nuevas: nunca sobreescribir una clave existente**
sin avisar — puede tener acentos/matices que la nueva versión no tiene.
Regeneración del `.js` tras editar el `.json` (patrón usado en toda la
conversación):

```python
import json
meta = json.load(open('definitions.json', encoding='utf-8'))
open('definitions.js', 'w', encoding='utf-8').write(
    'const DEFINITIONS = ' + json.dumps(meta['definitions'], ensure_ascii=False) + ';'
)
```

## Gestor de sonido (`sfx.js`)

Motor Web Audio API (`AudioBufferSourceNode` → `GainNode` por sonido →
`GainNode` maestro → destino), con fallback automático a
`HTMLAudioElement` por sonido si Web Audio no está disponible o un archivo
puntual no decodificó a tiempo.

**API pública** (nada más en el proyecto crea `Audio()` ni toca
`AudioContext` directamente):
```js
SFX.play(name)       // dispara una vez, reinicia si ya estaba sonando (nunca apila)
SFX.loop(name)        // igual, pero con loop=true (tick, tick_soft)
SFX.stop(name)
SFX.stopAll()         // se llama SIEMPRE al salir al menú (handler global de [data-back])
SFX.isMuted() / setMuted(v) / toggleMuted()
SFX.getVolume() / setVolume(v)   // v entre 0 y 1, persistido en localStorage
```
Volumen final = `VOLUMES[name] × globalVolume`. Mute pone la ganancia
maestra en 0 (no destruye nada). El control de volumen (ícono + slider
desplegable) vive **únicamente en el header de la portada** — se oculta en
cualquier otra pantalla vía `showScreen()` (clase `.hidden` en
`#home-sfx-control`), no existe control propio por juego.

```js
const VOLUMES = {
  tick: 0.45, tick_soft: 0.45,     // fondo, deben quedar por debajo de todo
  letter_move: 0.55,               // suena muy seguido
  victory: 0.75,                   // celebración larga, no debe abrumar
  correct: 1.0, wrong: 1.0, success: 1.0, fail: 1.0,
  explosion: 1.0, level: 1.0, hint: 1.0,
  impostor_ok: 1.0, letter_correct: 1.0,
};
```

### Tabla de disparadores

| Sonido | Dónde suena |
|---|---|
| `level` | Pantalla de "NIVEL X" (Bomb Word, Emoji Bomb) |
| `tick` (loop) | Cronómetro corriendo (Bomb Word, Emoji Bomb, Real Word). **Hear It NO usa tick** en ningún nivel: su cronómetro de advanced es solo la barra visual `#hi-timer` |
| `tick_soft` (loop) | Cronómetro de Fill in the Blanks |
| `correct` | Acierto genérico (Word Links, Real Word, Emoji Match, Hear It, Spot fase 1 y 2, Impostor al ganar ronda, Strands palabra extra no-temática, Fill in the Blanks) |
| `wrong` | Fallo genérico, incluye timeouts que cuentan como fallo (mismos juegos que `correct`; en Hear It el timeout de advanced entra por acá porque fuerza `correct=false`, + Impostor al clickear la impostora) |
| `success` | **Fin de partida** (ver sección siguiente); categoría acertada en Connections; victoria en Waffle |
| `fail` | Categoría fallada en Connections (incluye el caso "3 de 4"), derrota en Waffle |
| `explosion` | Fin de partida por derrota en Bomb Word / Emoji Bomb (nunca en victoria ni al salir voluntariamente) |
| `letter_move` | Letra ingresada en Word Game (teclado físico o en pantalla, no en backspace/enter), palabra seleccionada en Connections (solo al agregar, no al deseleccionar), swap sin acierto en Waffle |
| `letter_correct` | Swap en Waffle que deja una letra en su posición correcta (reemplaza a `letter_move`, nunca suenan ambos en la misma jugada) |
| `hint` | Pista usada en Word Links, Impostor, Word Game; palabra del tema en Strands (50/50 con `strand_word`) |
| `impostor_ok` | Palabra correcta en Impostor (NO en el click que gana la ronda automáticamente — ahí solo suena `correct`) |
| `strand_word` | Palabra del tema en Strands (50/50 con `hint`) |
| `victory` | Spangram en Strands |

**Regla de oro al agregar un gancho nuevo:** revisar si esa acción puede
disparar DOS sonidos en el mismo click (ej. la última palabra de Impostor
gana la ronda Y sería "correcta" — solo debe sonar uno). Siempre parar
loops (`tick`/`tick_soft`) ANTES de reproducir el sonido de cierre, nunca
después.

### `success` al mostrar la pantalla final

Suena al revelarse el panel de fin de partida, gane o pierda el jugador,
en: **Word Game, Fill in the Blanks, Spot the Error, Word Links, Impostor,
Real Word, Emoji Match, Hear It**, y en la **victoria** de Bomb Word y
Emoji Bomb (`bwWin()` / `ebWin()` — la derrota va por `bwGameOver()` /
`ebGameOver()` y se queda con `explosion` sola).

Cuatro excepciones, todas por la regla de "un solo sonido por momento":

| Juego | Por qué no se agregó |
|---|---|
| **Waffle** | `wfFinish()` ya reproducía `success`/`fail`. Agregar otro sonaría doble |
| **Connections** | Ya suena `success` al resolver el 4º grupo, y `connFinish()` corre en el mismo tick |
| **Strands** | Si el **spangram** cierra el puzzle, `victory` (~2-3s) sigue sonando cuando `stFinish` llega 900ms después. La bandera `stEndedWithSpangram` suprime `success` solo en ese caso; en los demás finales (rendirse, sin vidas, última palabra normal) sí suena |
| **Star Party** | Fuera del sistema, no se toca |

## Animación de fin de partida — `endPop`

Los 13 paneles finales comparten la estructura
`.end-panel > p.end-title, p.end-word, [contenido], div.end-actions`
(máximo 6 hijos), así que la animación es **100% CSS y global** — ningún
juego necesita una línea de JS para adherirse:

```css
@keyframes endPop { from { opacity:0; transform: translateY(10px) scale(0.85); } to { … } }
.end-panel > * { animation: endPop 0.35s ease both; }   /* + delays de 60ms por nth-child */
#sp-end .end-panel > * { animation: none; }             /* Star Party excluido */
@media (prefers-reduced-motion: reduce) { .end-panel > * { animation: none; } }
```

Generalizada desde `chipIn` de Connections (que se aplicaba solo a
`.conn-group`, sin escalonar). Se re-dispara sola en cada partida porque
los paneles pasan de `display:none` a visible.

**Ojo:** Star Party **también usa `.end-panel`** con el mismo markup
(`#sp-end`). Sin esa regla de exclusión explícita heredaría la cascada.

## Tarjetas de portada — preview por imagen

Sistema opt-in vía clase `.card-art-asset` en `.card-art`, con un
`<img class="card-art-img">` adentro (`object-fit: contain`,
`loading="lazy"`, alt descriptivo). Todas las tarjetas comparten la misma
altura de caja (190px desktop / auto+min-height:150px móvil) para que
imagen y CSS-dibujadas se vean iguales.

```css
.card-art-img {
  transform: translateY(var(--art-shift-y, 0%)) scale(var(--art-scale, 1));
}
.card-art-NOMBREJUEGO { --art-shift-y: 7%; --art-scale: 0.85; }
```
- **`--art-scale`** — zoom uniforme centrado. `1` = tamaño que
  `object-fit:contain` calcula solo. Bajarlo si el arte se ve muy grande o
  se pisa con el badge/PLAY; subirlo con cuidado (`.card-art` tiene
  `overflow:hidden`, puede recortar).
- **`--art-shift-y`** — corrimiento vertical dentro de la misma caja
  (positivo = abajo). Útil cuando el contenido real del PNG no está
  centrado en su propio canvas.
- Si una imagen 404 (portada no subida todavía), un handler en `app.js`
  le agrega `.card-art-img-failed` (`display:none`) — la tarjeta muestra
  solo el degradado morado, sin romper el layout. No hace falta nada
  especial al declarar una tarjeta nueva sin imagen todavía.

**`--art-scale` solo alcanza a las tarjetas con imagen.** Varias portadas
siguen dibujadas con CSS (Fill in the Blanks `.fib-logo`, Word Links
`.mini-wl`, Impostor `.mini-impo`, Real Word, Connections…): ahí no hay
`.card-art-img`, así que la variable no aplica y hay que escalar el
lockup directo. Precedente en la media query de 480px:

```css
.fib-logo { transform: scale(0.85); }   /* 165px de logo en una caja de 158px */
```
Al diagnosticar un recorte, **medir primero si es horizontal o vertical**:
el de Fill in the Blanks era horizontal (las puntas de FILL IN / BLANKS
por el `letter-spacing: 4px`), aunque a simple vista parecía que no cabía
de alto. En ≤480px la caja baja a 158px de ancho; de 481px para arriba se
mantiene en 228px y casi nada se recorta.

## Convenciones

- **Nombres de archivo sensibles a mayúsculas** — el deploy es tipo
  Netlify, case-sensitive. Verificar `ls` real antes de escribir un `src`,
  nunca asumir. Evitar espacios en nombres de archivo.
- **Rutas relativas siempre** (`assets/games/...`, `assets/audios/...`),
  nunca absolutas.
- **Breakpoints móviles: `768px` y `480px`.** Los ajustes de teléfono van
  **dentro** de esas media queries — nunca tocar las reglas de escritorio
  para arreglar mobile. `scrollbar-gutter: stable both-edges` en `html`
  evita el drift de centrado por la scrollbar.
- Cache-busting: bumpear el sufijo `?v=spXX` en `index.html` de cualquier
  `.js`/`.css` que se edite (todas las referencias a la vez, con regex).
- El idioma elegido en el modal (`selectedLanguage`) es la única fuente de
  verdad para significados — nunca agregar botones de traducción por
  palabra, ese sistema ya se retiró a propósito.

## Flujo de trabajo

1. **Investigar el código real antes de proponer nada** — nunca inventar
   funciones/líneas/estructura de datos sin haberlas leído.
2. **Reportar antes de editar**: qué archivos se van a tocar, en qué
   función/línea exacta engancha cada cambio, qué ambigüedades hay (sin
   inventar la respuesta), y esperar aprobación explícita.
3. Implementar, y **verificar en navegador de verdad** (no solo leer el
   CSS/JS) — medir con `getBoundingClientRect`, interceptar `SFX.play` etc.
   para confirmar que el disparador real ocurre donde se espera, en varios
   anchos (360/390/768/1440 típico).
4. Reportar resultados con transparencia, incluyendo cualquier desviación
   de lo pedido y por qué.
5. **Commit + push solo cuando el usuario lo pide explícitamente**, nunca
   de forma proactiva.

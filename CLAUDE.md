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

## ⚠️ Carga bajo demanda de los bancos (`DataLoader`)

La portada **solo carga 7 scripts** (~275 KB). Los bancos de datos (~2,1 MB)
los inyecta `DataLoader`, al principio de `app.js`, cuando el jugador pincha
una tarjeta. Antes se descargaban los 29 de golpe: 2.403 KB.

Cada banco sigue siendo un `.js` que declara una global (`WORDLINKS_DATA`…);
lo único que cambia es **cuándo** se inserta su `<script>`. Los trece bloques
de juego no se tocaron.

**Al añadir un juego o un banco nuevo hay que registrarlo en el mapa `NEEDS`
de `DataLoader`.** Si no, la global llega indefinida al pulsar START.

**`NEEDS` no es solo para bancos.** La entrada `level` carga dos archivos:
`placement.js` (el motor del test de nivel) y `placement_data.js` (su banco).
El motor estuvo un tiempo cargado eager, con el argumento de que la portada
tenía que poder mostrar el nivel guardado; se midió y el argumento no se
sostenía — la portada y la pantalla de entrada pintan ese dato leyendo **solo
`Progress`**, así que el motor (21 KB) se fue a `NEEDS` y la portada volvió a
sus 7 scripts. Regla general: si un `.js` solo se usa después de un click,
va en `NEEDS`, sea banco o no.

- La caché es **por archivo**, no por juego: `definitions.js` lo comparten
  **ocho** juegos (Real Word, Waffle, Connections, Fill in the Blanks,
  Strands, Emoji Match, Hear It **e Impostor**) y solo se descarga una vez.
- `ASSET_V` en `app.js` **tiene que coincidir** con el `?v=` de `index.html`.
  El bump por regex actualiza los dos; si se desincronizan, los bancos se
  piden con una versión vieja y se sirven cacheados.

### 🚨 Nada de nivel superior puede tocar un banco

`app.js` se ejecuta **antes** que cualquier banco. Si una línea de nivel
superior lee una global de datos, lanza `ReferenceError` y **aborta el resto
del archivo** — el juego no falla al abrirse, falla todo lo que venga después
en `app.js` (así se descubrió: los logros dejaron de inicializarse).

Patrones seguros e inseguros:

```js
const wlRules = () => WORDLINKS_DATA.rules;        // OK: se lee al llamarla
const BW_DICTIONARY = new Set(BOMBWORD_DATA.dict); // ROMPE: se lee al cargar
```

Ya hubo que arreglar tres casos, dos de ellos `new Set(...)` inmediatos
(`BW_DICTIONARY`, `ST_DICTIONARY`, ahora perezosos) y uno **transitivo**:
`hiInitVoices()` se llama al final de `app.js` y por dentro leía
`HEARIT_DATA.audio.lang`.

**Buscar estos casos con `grep` de columna 0 no basta** — no ve las llamadas
transitivas. La forma fiable de comprobarlo es en el navegador:

```js
window.addEventListener('error', e => console.log(e.message, e.lineno));
```
puesto en un `<script>` inline **antes** de `app.js`, y recargar. Si `app.js`
se cortó, las `const` del final quedan en TDZ (`typeof` da error).

## ⚠️ Star Party — DESACTIVADO TEMPORALMENTE (no borrado)

La tarjeta de Star Party está **comentada** en `index.html` (dentro de
`.card-grid`). Eso es lo único que lo desactiva, y alcanza: su **única** puerta
de entrada es el handler de `.game-card` en `app.js` (~L446), que llama a
`spOpenSetup()`. Sin tarjeta en el DOM, `showScreen("#screen-starparty")` no se
ejecuta nunca. (`#sp-again-btn` también llama a `spOpenSetup()`, pero vive
*dentro* del panel final de Star Party, así que es inalcanzable sin haber
entrado antes.)

**Para reactivarlo: descomentar ese bloque. Nada más.**

### 🚨 `starparty_minigames.js` NO es huérfano

**Fill in the Blanks usa `spFibInitialReveal()`**, que vive ahí, para calcular
cuántas letras revela al empezar cada palabra. Por eso `DataLoader` lo carga
**junto con Fill in the Blanks**, no con Star Party:

```js
blanks: ["data.js", "starparty_minigames.js", "definitions.js"],
```

Se puede cargar solo, sin ningún banco de Star Party: sus referencias a
`BOMBWORD_DATA`, `EMOJIBOMB_DATA`, `GAME_DATA` y `WORDLINKS_DATA` están todas
dentro de `spMgBuildPools()`, que solo llaman los cinco minijuegos. Si alguien
lo quita del mapa `NEEDS` por parecer de Star Party, rompe un juego activo.

`starparty.js`, `starparty_questions.js` y `starparty_wildcards.js` sí están
fuera de la carga (el juego está pausado). Reactivarlo pide devolverlos al
`<script>` de `index.html` **y** registrar sus bancos en `NEEDS` — está
detallado en el comentario de la tarjeta comentada.

Se conservan intactos: `<main id="screen-starparty">`, todo el CSS `.sp-*` /
`.card-art-starparty`, la regla de exclusión de `endPop`
(`#sp-end .end-panel > *`), y los `.js`/`.json` del juego.

Star Party sigue fuera del sistema de logros (los 48 badges nunca lo
incluyeron), del sistema de sonido y de la animación `endPop`.

## Sistema de niveles

El modal de inicio (`openIntro(game)`, ~línea 273) es **compartido por todos
los juegos** — un solo modal, se ajusta según el juego. `hideDifficulty`
decide si se muestra `#difficulty-row`.

**`showCategory` hoy vale `false` siempre** (~L401). Es una lista de
exclusiones que fue creciendo hasta cubrir los 13 juegos: ninguno pide
categoría ya — los que la pedían (Fill in the Blanks, Impostor, Wordle) ahora
mezclan todas y solo preguntan dificultad. `#category-row` y `#category-label`
no se muestran para nadie. La condición se conserva por si vuelve un juego con
categorías, pero **no describe ningún comportamiento vivo**: no razonar sobre
ella como si decidiera algo.

Los radios de dificultad usan valores en
español (`basico`/`intermedio`/`avanzado`); el banco de datos usa claves en
inglés (`basic`/`intermediate`/`advanced`). La conversión es siempre vía:

```js
const WL_LEVEL_KEYS = { basico: "basic", intermedio: "intermediate", avanzado: "advanced" };
```
Reutilizado por todos los juegos nuevos — no crear un mapeo propio.

Patrón estándar para agregar niveles a un juego: guardar `xxLevelRaw` (valor
del radio, para PLAY AGAIN) y `xxLevel` (clave del banco, vía
`WL_LEVEL_KEYS[xxLevelRaw]`), leer `DATA.rounds[xxLevel]` / `DATA.words[xxLevel]`.

## Test de nivel (`placement.js` + `placement_data.js`)

Test adaptativo de 24 preguntas que estima el nivel de inglés del jugador en
una escala 0–50 con etiqueta CEFR. **No es un juego**: no tiene tarjeta en la
grilla, no entra en los 48 badges, nunca llama a `Progress.record()` y **no usa
el modal `openIntro()`**. Su puerta de entrada es propia: la tira
`#level-entry`, encima de `.card-grid` en la portada.

Prefijo de todo su código en `app.js`: `lv` (`lvOpen`, `lvStart`,
`lvRenderQuestion`, `lvFinish`, `lvRenderResult`…), en el bloque del final del
archivo.

### Las tres pantallas

| Pantalla | id | Qué hace |
|---|---|---|
| Entrada | `#screen-level` | Descripción, nivel guardado (`#level-intro.has-level`), aviso de repetición, nota de sin-voces, botón `#level-start-btn` |
| Test | `#screen-level-test` | `#level-progress-fill`, `.level-prompt-zone`, `#level-options` |
| Resultado | `#screen-level-result` | Puntaje, `#level-scale` con anclas CEFR, `.level-skill` por destreza, `#level-recs` |

### Motor vs banco, y cuándo se carga cada uno

- **`placement.js`** — el motor: selección adaptativa de ítems, estimación
  Rasch, `Placement.create()` y `Placement.recommend()`.
- **`placement_data.js`** — el banco: 216 ítems, escala y cortes.

**Los dos van por `DataLoader` (`NEEDS.level`)**, y ninguno existe al cargar la
página. La portada y la pantalla de entrada funcionan sin ellos porque pintan
el nivel guardado leyendo solo `Progress`. `DataLoader.load("level")` se
dispara al abrir la pantalla de entrada (mientras el jugador lee) y otra vez,
esperando su promesa, al pulsar EMPEZAR.

### 🚨 El campo `level` de `Progress` y la trampa de `normalize()`

El resultado vive en `Progress` (`getLevel()` / `setLevel()`), que es el único
sitio autorizado a tocar `localStorage`.

**`normalize()` reconstruye el registro campo por campo desde `blank()` y
descarta todo lo que no esté declarado.** Un campo nuevo que se escriba sin
añadirlo a `blank()` **y** a `normalize()` se guarda bien, sobrevive en
memoria, y **desaparece en la siguiente recarga** — sin error, sin aviso. Así
de silencioso.

Añadir un campo nuevo son tres sitios, siempre los tres:

1. `blank()` — el valor inicial.
2. `normalize()` — copiarlo/sanearlo desde el `raw`.
3. Un `normalizeX()` propio si es un objeto, como `normalizeLevel()`.

Esto se va a repetir en cuanto lleguen la racha o el juego del día. La prueba
que lo caza no es leer el código: es **recargar la página** y comprobar que el
dato sigue ahí.

`setLevel()` sella el `takenAt` por dentro (`Date.now()`) — el store es dueño
del "cuándo", así que no se le pasa desde fuera. Para probar el camino de
"hace más de un día" hay que editar el registro en `localStorage` y recargar.

### Dos decisiones que no se revierten sin pensarlo

- **Las destrezas se muestran como ETIQUETA, nunca como número.** Con 8 ítems
  por destreza el error ronda los ±7 puntos: un número anunciaría una precisión
  que el test no tiene. El puntaje global sí es número porque se apoya en las
  24 respuestas.
- **Los cortes `(22, 35)` están calibrados contra el sesgo del motor**, no
  alineados con el CEFR puro. Salieron de simular 2000 jugadores y minimizar
  las recomendaciones equivocadas, compensando el sesgo que el motor tiene en
  los extremos. **Si el banco se recalibra con respuestas reales, hay que
  revisarlos**: dejan de ser correctos en cuanto cambian las dificultades.
  Viven en el banco (`recommendations.label_cuts`), con un `FALLBACK_CUTS` en
  `placement.js` por si el banco no los trae.

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

  **`ls` desde Git Bash NO sirve para verificar esto.** Windows y Git Bash
  resuelven rutas sin distinguir mayúsculas, así que `ls assets/badges` responde
  igual aunque el directorio se llame `Badges` — y un `fetch()` contra el
  servidor local también devuelve `200`. Ya pasó: los 5 PNG de badges vivían en
  `assets/Badges/` mientras el código pedía `assets/badges/`; en local todo se
  veía bien y en Netlify habrían dado 404 los cinco. Para comprobarlo de verdad
  hay que pedir el nombre **real** al FS:

  ```bash
  powershell.exe -NoProfile -Command "Get-ChildItem -Recurse -File | ForEach-Object { \$_.FullName.Replace((Get-Location).Path + '\', '').Replace('\','/') }"
  ```
  y comparar esa lista con las rutas del código (`grep -rhoE '(assets|img)/[A-Za-z0-9_./-]+\.(png|webp|mp3)'`).
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

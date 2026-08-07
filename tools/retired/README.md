# retired/ — código de juegos que ya no existen

Archivos que **no forman parte del sitio** y no se cargan nunca en el
navegador. Se guardan aquí en vez de borrarlos para no perder el trabajo
que costaron, igual que el resto de `tools/`.

Nada de `index.html` los referencia. Si algún día alguien revive uno de
estos juegos, el banco de datos sigue entero.

---

## CONTEXTO (retirado)

| Archivo | Global que declara | Peso |
|---|---|---|
| `contexto_data.js` | `CONTEXTO_DATA` | 300 KB |
| `contexto_autocomplete.js` | `CONTEXTO_WORDS` | 6 KB |

Era un juego tipo *Contexto* (adivinar una palabra por proximidad
semántica): `CONTEXTO_DATA` guarda, por nivel, cada palabra con su
arquetipo y sus rasgos; `CONTEXTO_WORDS` es la lista de autocompletado.

El juego se retiró de `app.js`, pero sus dos `<script>` se quedaron
cargando en la portada mucho tiempo después — **306 KB descargados y
ejecutados en cada visita para nada**. Se comprobó con un `grep` de las
dos globales en todo el proyecto (`.js`, `.html`, `.json`): cero
referencias fuera de estos dos archivos.

### ⚠️ Ojo: las clases `contexto-*` del CSS SÍ están en uso

En `index.html` y `styles.css` siguen existiendo `contexto-form`,
`contexto-input-row`, `contexto-actions`, `contexto-reveal`… Son **solo
nombres de clase reciclados** por otros juegos que heredaron ese
maquetado. No tienen nada que ver con estos archivos y **no se deben
tocar**.

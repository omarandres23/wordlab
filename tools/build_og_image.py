# -*- coding: utf-8 -*-
"""
BUILD  ->  favicon.ico, apple-touch-icon.png, icon-512.png, assets/og-image.png

Los iconos del sitio NO se dibujan a mano: se derivan del logo que ya existe
(img/wordlab-logo.png) y de los colores REALES de styles.css, para que el dia
que cambie la marca se regeneren corriendo esto.

>>> EL PROBLEMA DEL FAVICON Y COMO SE RESUELVE <<<
El logo es un lockup HORIZONTAL de 1489x372 (ratio 4:1). Reducido a 32x32
quedaria en 32x8 pixeles: ilegible. Pero no hace falta inventar nada, porque
el propio logo ya contiene un simbolo cuadrado: el MATRAZ morado que sustituye
a la "a" de "wordlab", con sus dos burbujas encima. Ese glifo se recorta por
color (es lo unico saturado del PNG, el resto es casi blanco), se centra sobre
el fondo del sitio y sale un icono legible a 16x16.

  bbox del matraz : x 1035-1220, y 22-284  (186x263 px)
  morado medio    : #A03BFF  ~= --accent (#9b30ff) de styles.css

>>> SOBRE og-image.png <<<
Se genera, pero HOY NO SE REFERENCIA desde index.html: las etiquetas Open
Graph necesitan URLs absolutas y el proyecto todavia no tiene dominio de
produccion. Queda lista para que, cuando lo haya, anadir las etiquetas sea
editar el <head> y nada mas.

Uso:
    python build_og_image.py ..
"""

import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

TOOLS = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else ".."
PROJ = os.path.join(TOOLS, PROJ) if not os.path.isabs(PROJ) else PROJ

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# ----------------------------------------------------------------------
# Colores: se LEEN de styles.css, no se escriben a ojo
# ----------------------------------------------------------------------
def read_palette(css_path):
    css = open(css_path, encoding="utf-8").read()
    want = ("bg-1", "bg-2", "accent", "text")
    out = {}
    for name in want:
        m = re.search(r"--%s:\s*(#[0-9a-fA-F]{6})" % re.escape(name), css)
        if not m:
            raise SystemExit(f"no se encontro --{name} en styles.css")
        out[name] = m.group(1)
    return out


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ----------------------------------------------------------------------
# El glifo del matraz, recortado por color
# ----------------------------------------------------------------------
def extract_flask(logo_path):
    """Devuelve el matraz recortado con alpha, sin tocar el resto del logo."""
    im = Image.open(logo_path).convert("RGBA")
    a = np.array(im)
    r, g, b, al = (a[..., 0].astype(int), a[..., 1].astype(int),
                   a[..., 2].astype(int), a[..., 3].astype(int))
    # el matraz es lo unico saturado: R y B altos, G bajo. El resto del
    # lockup es casi blanco (R~G~B), asi que la mascara lo descarta solo.
    purple = (al > 60) & (r > 110) & (b > 160) & (g < 110) & ((r + b) - 2 * g > 120)
    ys, xs = np.where(purple)
    if not len(xs):
        raise SystemExit("no se encontro el glifo morado en el logo")
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    glyph = im.crop((x0, y0, x1 + 1, y1 + 1))
    # fuera todo lo que no sea el glifo (por si el recorte pilla un borde)
    ga = np.array(glyph)
    keep = purple[y0:y1 + 1, x0:x1 + 1]
    ga[..., 3] = np.where(keep, ga[..., 3], 0)
    return Image.fromarray(ga), (int(x0), int(y0), int(x1), int(y1))


def extract_w(logo_path):
    """
    Devuelve la 'w' inicial del lockup, recortada.

    Se eligio esta y NO el matraz despues de mirar los dos a tamano real: el
    matraz aislado deja de leerse como matraz. Dentro del logo funciona porque
    ocupa el hueco de la 'a' y las burbujas suben desde el; solo, es un trapecio
    morado con dos puntos flotando lejos, sin significado ni equilibrio.
    La 'w' es la inicial de Word Lab, esta dibujada en la tipografia de la marca
    y a 16x16 sigue siendo una letra reconocible, que es lo unico que importa a
    ese tamano.
    """
    im = Image.open(logo_path).convert("RGBA")
    a = np.array(im)
    al, r, g, b = (a[..., 3].astype(int), a[..., 0].astype(int),
                   a[..., 1].astype(int), a[..., 2].astype(int))
    letters = (al > 60) & (r > 200) & (g > 200) & (b > 200)
    cols = letters.any(axis=0)
    # primer bloque de columnas con tinta = primera letra
    x0 = int(np.argmax(cols))
    x1 = x0
    while x1 + 1 < len(cols) and cols[x1 + 1]:
        x1 += 1
    ys = np.where(letters[:, x0:x1 + 1].any(axis=1))[0]
    y0, y1 = int(ys.min()), int(ys.max())
    glyph = im.crop((x0, y0, x1 + 1, y1 + 1))
    ga = np.array(glyph)
    ga[..., 3] = np.where(letters[y0:y1 + 1, x0:x1 + 1], ga[..., 3], 0)
    return Image.fromarray(ga), (x0, y0, x1, y1)


def gradient(size, c1, c2, diagonal=True):
    """Degradado del sitio: bg-1 -> bg-2."""
    w, h = size
    top, bot = np.array(hexrgb(c1), float), np.array(hexrgb(c2), float)
    if diagonal:
        yy, xx = np.mgrid[0:h, 0:w]
        t = ((xx / max(w - 1, 1)) * 0.45 + (yy / max(h - 1, 1)) * 0.55)
    else:
        t = np.repeat(np.linspace(0, 1, h)[:, None], w, axis=1)
    img = top[None, None, :] * (1 - t[..., None]) + bot[None, None, :] * t[..., None]
    return Image.fromarray(img.astype(np.uint8), "RGB")


def paste_fit(canvas, art, box_frac, center=(0.5, 0.5)):
    """Encaja `art` dentro de una fraccion del lienzo, conservando proporcion."""
    cw, ch = canvas.size
    maxw, maxh = cw * box_frac[0], ch * box_frac[1]
    s = min(maxw / art.width, maxh / art.height)
    new = art.resize((max(1, int(art.width * s)), max(1, int(art.height * s))),
                     Image.LANCZOS)
    x = int(cw * center[0] - new.width / 2)
    y = int(ch * center[1] - new.height / 2)
    canvas.paste(new, (x, y), new)
    return canvas


def pick_font(size):
    """Fuente del sistema; si no hay, la de PIL (fea pero no rompe el build)."""
    for name in ("segoeuib.ttf", "seguisb.ttf", "arialbd.ttf", "Arial Bold.ttf",
                 "DejaVuSans-Bold.ttf"):
        for d in (r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu",
                  "/Library/Fonts"):
            p = os.path.join(d, name)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    pass
    return ImageFont.load_default()


def kb(path):
    return os.path.getsize(path) / 1024.0


def main():
    pal = read_palette(os.path.join(PROJ, "styles.css"))
    logo_path = os.path.join(PROJ, "img", "wordlab-logo.png")
    flask, fbox = extract_flask(logo_path)     # se mide, para el reporte
    mark, bbox = extract_w(logo_path)          # y se USA esta: ver extract_w()
    logo = Image.open(logo_path).convert("RGBA")

    print("=" * 62)
    print("ICONOS E IMAGEN PARA COMPARTIR")
    print("=" * 62)
    print(f"  paleta leida de styles.css : bg-1 {pal['bg-1']}  bg-2 {pal['bg-2']}"
          f"  accent {pal['accent']}")
    print(f"  logo                       : {logo.size[0]}x{logo.size[1]}"
          f"  (ratio {logo.size[0]/logo.size[1]:.2f}:1 — ilegible a 32x32)")
    print(f"  glifo del matraz           : {flask.size[0]}x{flask.size[1]}"
          f"  desde x{fbox[0]}-{fbox[2]}  -> DESCARTADO (no se lee aislado)")
    print(f"  marca usada: 'w' inicial   : {mark.size[0]}x{mark.size[1]}"
          f"  desde x{bbox[0]}-{bbox[2]} y{bbox[1]}-{bbox[3]}")
    print()

    out = []

    # ---------- iconos cuadrados, todos desde el matraz ----------
    # Se genera UNO grande y se reduce, para que los tamanos pequenos hereden
    # el mismo encuadre en vez de recalcularlo y quedar descentrados entre si.
    master = gradient((512, 512), pal["bg-1"], pal["bg-2"])
    master = paste_fit(master.convert("RGBA"), mark, (0.66, 0.66))

    p512 = os.path.join(PROJ, "icon-512.png")
    master.convert("RGB").save(p512, "PNG", optimize=True)
    out.append(("icon-512.png", p512))

    p180 = os.path.join(PROJ, "apple-touch-icon.png")
    # iOS aplica su propia mascara redondeada, asi que el fondo va a sangre
    master.resize((180, 180), Image.LANCZOS).convert("RGB").save(
        p180, "PNG", optimize=True)
    out.append(("apple-touch-icon.png", p180))

    pico = os.path.join(PROJ, "favicon.ico")
    master.convert("RGB").save(pico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    out.append(("favicon.ico", pico))

    # ---------- imagen para compartir (aun sin referenciar) ----------
    og = gradient((1200, 630), pal["bg-1"], pal["bg-2"]).convert("RGBA")
    og = paste_fit(og, logo, (0.62, 0.34), center=(0.5, 0.42))
    d = ImageDraw.Draw(og)
    # texto corto y grande: en el preview del movil esto se ve en miniatura
    msg = "Juegos para aprender inglés"
    f = pick_font(52)
    try:
        tw = d.textlength(msg, font=f)
    except Exception:
        tw = len(msg) * 26
    d.text((600 - tw / 2, 400), msg, font=f, fill=hexrgb(pal["text"]))
    assets = os.path.join(PROJ, "assets")
    os.makedirs(assets, exist_ok=True)
    pog = os.path.join(assets, "og-image.png")
    og.convert("RGB").save(pog, "PNG", optimize=True)
    if kb(pog) > 300:  # el limite del prompt; PNG de degradado puede pasarse
        og.convert("RGB").save(pog.replace(".png", ".jpg"), "JPEG", quality=88,
                               optimize=True)
        os.remove(pog)
        pog = pog.replace(".png", ".jpg")
    out.append((os.path.basename(pog), pog))

    print("  ARCHIVO                    TAMANO")
    for name, path in out:
        print(f"  {name:26} {kb(path):7.1f} KB")
    print()
    print("  NOTA: og-image no se referencia todavia en index.html — las")
    print("  etiquetas Open Graph necesitan URL absoluta y no hay dominio aun.")


if __name__ == "__main__":
    main()

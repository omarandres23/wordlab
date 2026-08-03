# -*- coding: utf-8 -*-
"""
Etiquetado por campo semantico de las 120 palabras del banco 'basico'
de Emoji Bomb, para poder elegir distractores CERCANOS (mismo campo)
o LEJANOS (campo distinto) segun el nivel.

Y las 45 definiciones bilingues que faltaban.
"""

# ------------------------------------------------------------------
# CATEGORIAS  (campo semantico -> palabras)
# ------------------------------------------------------------------
CATEGORIES = {
"food": [
    "APPLE", "EGG", "JUICE", "LEMON", "ORANGE", "CAKE", "BREAD", "HONEY",
    "PIZZA", "WATERMELON", "HARVEST", "VINEYARD",
],
"animals": [
    "CAT", "DOG", "FISH", "SNAKE", "ZEBRA", "BUTTERFLY", "ELEPHANT",
    "PENGUIN", "DRAGON", "SPIDER", "TURTLE", "NEST",
],
"nature": [
    "MOON", "STAR", "TREE", "ICE", "FOREST", "GARDEN", "ISLAND", "JUNGLE",
    "OCEAN", "DESERT", "WATERFALL", "GLACIER", "VOLCANO", "FLOWER",
    "QUICKSAND",
],
"weather": [
    "RAIN", "SNOW", "FIRE", "CLOUD", "RAINBOW", "HURRICANE", "EARTHQUAKE",
    "AVALANCHE", "BLIZZARD", "WINTER", "SUMMER",
],
"places": [
    "HOUSE", "CASTLE", "BRIDGE", "HOSPITAL", "KITCHEN", "LIBRARY", "MUSEUM",
    "RESTAURANT", "UNIVERSITY", "PHARMACY", "STADIUM", "HARBOR", "BAKERY",
    "VILLAGE", "AQUARIUM", "CATHEDRAL", "SKYSCRAPER", "LIGHTHOUSE",
    "OBSERVATORY", "AIRPORT", "IGLOO", "MARKET", "CIRCUS", "LAUNDRY",
],
"transport": [
    "BOAT", "TRAIN", "ROCKET", "YACHT", "GONDOLA", "SUBMARINE",
    "HELICOPTER", "PARACHUTE",
],
"objects": [
    "BOOK", "KEY", "SHOE", "CLOCK", "PHONE", "SOCKS", "CAMERA", "MIRROR",
    "PUZZLE", "BASKET", "UMBRELLA", "GUITAR", "XYLOPHONE", "TELESCOPE",
    "MICROSCOPE", "DIAMOND", "HEART", "COMPASS", "SUITCASE", "PASSPORT",
    "ORCHESTRA",
],
"events": [
    "GRADUATION", "CONCERT", "FESTIVAL", "PARADE", "WEDDING", "BIRTHDAY",
    "CARNIVAL", "MARATHON", "FIREWORKS", "CAMPFIRE", "SAFARI", "YOGA",
    "VOLUNTEER", "JACKPOT", "QUEEN", "NIGHTMARE", "ZOMBIE",
],
}

# ------------------------------------------------------------------
# Definiciones bilingues que faltaban en definitions.json
# ------------------------------------------------------------------
MISSING_DEFS = {
"HOUSE":       ("a building where people live", "un edificio donde vive la gente"),
"KEY":         ("a small metal object that opens a lock", "un objeto pequeno de metal que abre una cerradura"),
"NEST":        ("the home a bird builds for its eggs", "el hogar que un ave construye para sus huevos"),
"RAIN":        ("water that falls from the clouds", "agua que cae de las nubes"),
"SHOE":        ("something you wear on your foot", "algo que te pones en el pie"),
"HEART":       ("the organ that pumps blood in your body", "el organo que bombea la sangre en el cuerpo"),
"CLOCK":       ("an object that shows the time", "un objeto que muestra la hora"),
"FIRE":        ("the hot bright flame that burns things", "la llama caliente y brillante que quema"),
"PIZZA":       ("a flat round bread with cheese on top", "un pan plano y redondo con queso encima"),
"QUEEN":       ("a woman who rules a country", "una mujer que gobierna un pais"),
"SNAKE":       ("a long animal with no legs", "un animal largo y sin patas"),
"WATERMELON":  ("a big green fruit that is red inside", "una fruta grande y verde, roja por dentro"),
"YACHT":       ("a large expensive boat used for pleasure", "un barco grande y costoso usado por placer"),
"BUTTERFLY":   ("an insect with large colorful wings", "un insecto con alas grandes y de colores"),
"CASTLE":      ("a large old building with strong walls", "un edificio grande y antiguo con muros fuertes"),
"DRAGON":      ("an imaginary animal that breathes fire", "un animal imaginario que echa fuego"),
"PUZZLE":      ("a game where you fit pieces together", "un juego donde encajas piezas"),
"GRADUATION":  ("the ceremony when you finish your studies", "la ceremonia cuando terminas tus estudios"),
"JUNGLE":      ("a thick hot forest with many plants", "un bosque denso y caluroso con muchas plantas"),
"NIGHTMARE":   ("a very frightening dream", "un sueno muy aterrador"),
"QUICKSAND":   ("wet sand that pulls you down", "arena mojada que te hunde"),
"SUITCASE":    ("a bag with a handle for carrying clothes when you travel",
                "un bolso con asa para llevar ropa cuando viajas"),
"CIRCUS":      ("a show with clowns and acrobats", "un espectaculo con payasos y acrobatas"),
"LAUNDRY":     ("clothes that need washing, or the place to wash them",
                "ropa que hay que lavar, o el lugar donde se lava"),
"PARADE":      ("a public march with music through the streets",
                "un desfile publico con musica por las calles"),
"MARATHON":    ("a very long running race", "una carrera a pie muy larga"),
"AQUARIUM":    ("a place where fish are kept and shown", "un lugar donde se mantienen y exhiben peces"),
"VINEYARD":    ("a field where grapes are grown for wine", "un campo donde se cultivan uvas para vino"),
"WEDDING":     ("the ceremony when two people marry", "la ceremonia cuando dos personas se casan"),
"XYLOPHONE":   ("a musical instrument played by hitting bars",
                "un instrumento musical que se toca golpeando barras"),
"YOGA":        ("exercise with slow movements and breathing", "ejercicio con movimientos lentos y respiracion"),
"ZOMBIE":      ("a dead body that walks in stories and movies",
                "un cuerpo muerto que camina, en historias y peliculas"),
"BIRTHDAY":    ("the day each year when you were born", "el dia de cada ano en que naciste"),
"CAMPFIRE":    ("a fire made outside when camping", "una fogata hecha al aire libre al acampar"),
"FIREWORKS":   ("explosives that make colored lights in the sky",
                "explosivos que hacen luces de colores en el cielo"),
"GONDOLA":     ("a long narrow boat used in Venice", "un bote largo y angosto usado en Venecia"),
"IGLOO":       ("a small round house made of snow", "una casa pequena y redonda hecha de nieve"),
"JACKPOT":     ("the biggest prize you can win", "el premio mas grande que puedes ganar"),
"LIGHTHOUSE":  ("a tower with a light that guides ships", "una torre con una luz que guia a los barcos"),
"OBSERVATORY": ("a building used to look at the stars", "un edificio usado para observar las estrellas"),
"PARACHUTE":   ("cloth that opens to slow your fall from the sky",
                "tela que se abre para frenar tu caida desde el cielo"),
"CATHEDRAL":   ("a very large and important church", "una iglesia muy grande e importante"),
"SKYSCRAPER":  ("a very tall building in a city", "un edificio muy alto en una ciudad"),
"WATERFALL":   ("water falling from a high place in a river",
                "agua que cae desde un lugar alto en un rio"),
"CARNIVAL":    ("a street festival with costumes and music",
                "una fiesta callejera con disfraces y musica"),
}

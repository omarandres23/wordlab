# -*- coding: utf-8 -*-
"""
TEST DE NIVEL — TANDA 1: los 72 items de VOCABULARIO.

Separado de placement_items.py porque el banco se produce por tandas (vocab ->
grammar -> listening) y revisar 216 items en un solo archivo es justo donde la
calidad se cae sin que nadie lo note.

24 items por formato. Las dificultades siguen una ESCALERA deliberada para
garantizar cobertura sin huecos: se elige la banda primero y se escribe el item
para esa banda, no al reves. La justificacion de cada `why` explica por que ESE
item pertenece a ESA banda.

  definition   2, 5, 7 ... 47, 49     (media ~25.5)
  collocation  1, 3, 5 ... 45, 48     (media ~23.6)
  synonym      2, 4, 6 ... 48, 50     (media ~25.4)

Los tres formatos quedan a menos de 2 puntos de media entre si, que es lo que
impide que el motor mida el formato en vez del nivel.

REGLA DE definition: el enunciado es la definicion EXACTA que ya esta en
definitions.json. No se reescribe ninguna (regla de CLAUDE.md) y no se agrega
ninguna nueva: los 24 items se construyeron eligiendo palabras que ya tenian
entrada, incluidas las de C1-C2.
"""

# ======================================================================
# DEFINITION — 24 items. Enunciado = definicion literal de definitions.json.
# ======================================================================
DEFINITION = [
    dict(id="voc_def_01", difficulty=2.0, correct="CAT",
         prompt="a small furry animal kept as a pet",
         distractors=["TABLE", "RIVER", "SHOE"], source="definitions.json:CAT",
         why="CAT zipf 4.78. Definicion con vocabulario solo A1. Distractores de "
             "campos sin relacion: no hay encaje parcial. Piso absoluto."),
    dict(id="voc_def_04", difficulty=5.0, correct="ISLAND",
         prompt="land surrounded by water",
         distractors=["CHAIR", "BREAD", "CLOCK"], source="definitions.json:ISLAND",
         why="ISLAND zipf 5.01, mas frecuente que CAT pero la definicion exige dos "
             "conceptos ligados (land + surrounded by), no uno. Distractores A1 "
             "inconexos, asi que sigue siendo reconocimiento puro."),
    dict(id="voc_def_05", difficulty=7.0, correct="WINTER",
         prompt="the coldest season of the year",
         distractors=["SUMMER", "MONDAY", "MORNING"], source="definitions.json:WINTER",
         why="WINTER zipf 4.89. Sube respecto del anterior porque SUMMER es el "
             "antonimo dentro del mismo campo: ya no basta reconocer 'season', hay "
             "que leer 'coldest'. Primer item que castiga leer a medias."),
    dict(id="voc_def_06", difficulty=9.0, correct="GARDEN",
         prompt="an area for growing plants",
         distractors=["KITCHEN", "GARAGE", "BALCONY"], source="definitions.json:GARDEN",
         why="GARDEN zipf 4.77. Los tres distractores son espacios de una casa, o sea "
             "mismo campo semantico: hay que saber cual se asocia a plantas. A2.0."),
    dict(id="voc_def_07", difficulty=11.0, correct="BRIDGE",
         prompt="a structure built to cross over water or a road",
         distractors=["TUNNEL", "TOWER", "FENCE"], source="definitions.json:BRIDGE",
         why="BRIDGE zipf 4.77. TUNNEL es el distractor duro: tambien cruza un "
             "obstaculo, pero por debajo. Exige procesar 'over'. A2.0."),
    dict(id="voc_def_08", difficulty=13.0, correct="MIRROR",
         prompt="a glass surface that reflects images",
         distractors=["WINDOW", "SCREEN", "PICTURE"], source="definitions.json:MIRROR",
         why="MIRROR zipf 4.47. Los tres distractores son superficies planas que "
             "muestran algo; solo MIRROR refleja. La palabra clave es 'reflects', "
             "vocabulario A2-B1, lo que sube el item por encima del enunciado."),
    dict(id="voc_def_09", difficulty=15.0, correct="SHELF",
         prompt="a flat board for holding things",
         distractors=["DRAWER", "BASKET", "CUPBOARD"], source="definitions.json:SHELF",
         why="SHELF zipf 4.02, ya fuera del nucleo de altisima frecuencia. Los tres "
             "distractores son muebles de guardar: la unica pista es 'flat board', "
             "que exige vocabulario concreto de A2.5."),
    dict(id="voc_def_10", difficulty=17.0, correct="CEILING",
         prompt="the top inside surface of a room",
         distractors=["ROOF", "FLOOR", "WALL"], source="definitions.json:CEILING",
         why="CEILING zipf 4.18. ROOF es el distractor central y es exactamente la "
             "confusion del hispanohablante, que usa 'techo' para las dos. Hay que "
             "procesar 'inside'. A2.5."),
    dict(id="voc_def_11", difficulty=19.0, correct="LADDER",
         prompt="a set of steps for climbing up",
         distractors=["ROPE", "HOOK", "RAMP"], source="definitions.json:LADDER",
         why="LADDER zipf 4.03. Los distractores sirven todos para subir o sujetar, "
             "asi que la pista util es 'set of steps'. Vocabulario concreto poco "
             "frecuente en el aula: B1.0."),
    dict(id="voc_def_12", difficulty=21.0, correct="HARVEST",
         prompt="the gathering of ripe crops",
         distractors=["PLANTING", "ORCHARD", "SEASON"], source="definitions.json:HARVEST",
         why="HARVEST zipf 4.03, pero la definicion usa 'ripe' y 'crops', ambas B1. "
             "PLANTING es la accion opuesta del mismo ciclo agricola. El item mide "
             "tanto la respuesta como el enunciado, y por eso sube a B1.0."),
    dict(id="voc_def_13", difficulty=23.0, correct="LOAN",
         prompt="money borrowed that must be paid back",
         distractors=["WAGE", "REFUND", "BONUS"], source="definitions.json:LOAN",
         why="LOAN zipf 4.68, alta, pero los tres distractores son movimientos de "
             "dinero del mismo registro financiero. Discrimina por direccion del "
             "dinero (se recibe y se devuelve), no por tema. B1.5."),
    dict(id="voc_def_02", difficulty=25.0, correct="DEADLINE",
         prompt="the latest time by which something must be done",
         distractors=["SCHEDULE", "BUDGET", "AGENDA"],
         source="definitions.json:DEADLINE",
         why="zipf 4.12. Lo que lo sube de A2 a B1.5 son los distractores: los tres "
             "del mismo campo (organizacion del trabajo), asi que reconocer el tema "
             "no alcanza."),
    dict(id="voc_def_14", difficulty=27.0, correct="MORTGAGE",
         prompt="a loan used to buy a house",
         distractors=["RENT", "DEPOSIT", "INSURANCE"], source="definitions.json:MORTGAGE",
         why="MORTGAGE zipf 4.39. Los cuatro son terminos de vivienda y dinero; hay "
             "que saber cual es un prestamo. Registro especializado que no aparece en "
             "el ingles general hasta B1.5-B2."),
    dict(id="voc_def_15", difficulty=29.0, correct="TENANT",
         prompt="a person who rents a home or space",
         distractors=["LANDLORD", "NEIGHBOUR", "GUEST"], source="definitions.json:TENANT",
         why="TENANT zipf 3.78. LANDLORD es el distractor decisivo: es el otro lado "
             "de la MISMA relacion, asi que el item mide direccionalidad, que es "
             "donde falla quien conoce el tema de oidas. B2.0."),
    dict(id="voc_def_16", difficulty=31.0, correct="DROUGHT",
         prompt="a long period with little or no rain",
         distractors=["FLOOD", "FROST", "STORM"], source="definitions.json:DROUGHT",
         why="DROUGHT zipf 3.90 y ademas ortografia opaca (no se pronuncia como se "
             "escribe). Los distractores son los otros fenomenos extremos, uno de "
             "ellos el opuesto exacto. B2.0."),
    dict(id="voc_def_17", difficulty=33.0, correct="TREATY",
         prompt="a formal agreement between countries",
         distractors=["CONTRACT", "PETITION", "CEASEFIRE"], source="definitions.json:TREATY",
         why="TREATY zipf 4.31, frecuencia alta pero concentrada en registro "
             "periodistico-politico. CONTRACT es un acuerdo formal tambien: la unica "
             "pista es 'between countries'. B2.0-B2.5."),
    dict(id="voc_def_18", difficulty=35.0, correct="SURPLUS",
         prompt="an amount left over after needs are met",
         distractors=["DEFICIT", "RESERVE", "MARGIN"], source="definitions.json:SURPLUS",
         why="SURPLUS zipf 3.87. DEFICIT es el antonimo tecnico y RESERVE casi un "
             "sinonimo: el item discrimina dentro de un campo economico estrecho, no "
             "entre campos. B2.5."),
    dict(id="voc_def_19", difficulty=37.0, correct="SCRUTINY",
         prompt="very careful and critical examination",
         distractors=["OVERSIGHT", "GLANCE", "APPRAISAL"], source="definitions.json:SCRUTINY",
         why="SCRUTINY zipf 3.74. APPRAISAL y OVERSIGHT son evaluaciones tambien; la "
             "pista es 'critical'. Sustantivo abstracto de registro formal, tipico "
             "del salto B2.5-C1."),
    dict(id="voc_def_20", difficulty=39.0, correct="AMBIGUOUS",
         prompt="having more than one possible meaning",
         distractors=["OBSCURE", "INACCURATE", "IRRELEVANT"], source="definitions.json:AMBIGUOUS",
         why="AMBIGUOUS zipf 3.57. OBSCURE es el distractor fuerte: tambien es "
             "'dificil de entender', pero por falta de claridad, no por multiplicidad. "
             "Ese matiz es exactamente C1.0."),
    dict(id="voc_def_21", difficulty=41.0, correct="ADAMANT",
         prompt="very sure and refusing to change your mind",
         distractors=["RELUCTANT", "INDIFFERENT", "CAUTIOUS"], source="definitions.json:ADAMANT",
         why="ADAMANT zipf 3.28. Los cuatro son adjetivos de actitud; RELUCTANT tiene "
             "tambien un componente de resistencia pero pasiva, no firme. Discrimina "
             "intensidad y direccion de una actitud: C1.0."),
    dict(id="voc_def_22", difficulty=43.0, correct="AMBIVALENT",
         prompt="having mixed feelings and unsure what to choose",
         distractors=["INDIFFERENT", "APATHETIC", "RESENTFUL"], source="definitions.json:AMBIVALENT",
         why="AMBIVALENT zipf 3.01. INDIFFERENT y APATHETIC son el error clasico: se "
             "confunde 'sentimientos encontrados' con 'sin sentimientos'. Es la misma "
             "confusion en dos distractores a proposito, para que no se acierte por "
             "descarte. C1.5."),
    dict(id="voc_def_23", difficulty=45.0, correct="CAPRICIOUS",
         prompt="changing suddenly for no clear reason",
         distractors=["METICULOUS", "TENACIOUS", "DELIBERATE"], source="definitions.json:CAPRICIOUS",
         why="CAPRICIOUS zipf 2.79. Tiene cognado en espanol (caprichoso) que ayuda, "
             "y por eso NO esta mas arriba pese a su baja frecuencia: la escala mide "
             "dificultad para un hispanohablante, no frecuencia bruta. C1.5."),
    dict(id="voc_def_24", difficulty=47.0, correct="CIRCUMSPECT",
         prompt="careful and thinking about risks before acting",
         distractors=["IMPETUOUS", "OSTENTATIOUS", "DISINGENUOUS"], source="definitions.json:CIRCUMSPECT",
         why="CIRCUMSPECT zipf 2.46, la mas baja del banco de vocabulario. Los tres "
             "distractores son igual de raros (2.4-3.0), asi que no se puede acertar "
             "eligiendo 'la que suena mas culta'. C1.5-C2."),
    dict(id="voc_def_03", difficulty=49.0, correct="COGENT",
         prompt="clear and convincing in argument",
         distractors=["TENTATIVE", "CANDID", "PRUDENT"], source="definitions.json:COGENT",
         why="COGENT zipf 2.71, bajo el umbral ~3.5 del vocabulario academico C1. "
             "Distractores con frecuencia casi identica entre si (3.41-3.45): un C1 "
             "los conoce los tres y aun asi puede no conocer COGENT."),
]

# ======================================================================
# COLLOCATION — 24 items. El hueco es LEXICO, nunca gramatical.
# El eje de dificultad es la OPACIDAD: arriba estan las colocaciones que no
# se deducen del significado de las palabras.
# ======================================================================
COLLOCATION = [
    dict(id="voc_col_04", difficulty=1.0, correct="have",
         prompt="I ___ breakfast at seven every morning.",
         distractors=["do", "make", "take"],
         why="have breakfast. Nucleo A1.0 absoluto. Los tres distractores son la "
             "interferencia del espanol (tomar/hacer el desayuno), asi que el item "
             "mide colocacion desde el primer punto de la escala."),
    dict(id="voc_col_05", difficulty=3.0, correct="made",
         prompt="She ___ a mistake in the report.",
         distractors=["did", "took", "had"],
         why="make a mistake. El par make/do es EL problema del hispanohablante "
             "(un solo verbo 'hacer' cubre los dos). A1.5 porque el sustantivo es "
             "frecuente y el contexto es transparente."),
    dict(id="voc_col_01", difficulty=5.0, correct="takes",
         prompt="She ___ a shower every morning.",
         distractors=["does", "makes", "puts"],
         why="take a shower. MAKES/DOES no son relleno: son la interferencia exacta "
             "del espanol. A1.5 y no A1.0 porque elegir entre 4 verbos frecuentes "
             "cuesta mas que reconocer una palabra."),
    dict(id="voc_col_06", difficulty=7.0, correct="had",
         prompt="They ___ a party for her birthday.",
         distractors=["made", "did", "took"],
         why="have a party. Mismo eje que los anteriores pero con un sustantivo donde "
             "el espanol dice 'hacer una fiesta', asi que MADE es un calco muy "
             "atractivo. A1.5-A2.0."),
    dict(id="voc_col_07", difficulty=9.0, correct="does",
         prompt="He ___ his homework before dinner.",
         distractors=["makes", "takes", "has"],
         why="do homework. Es el reverso de los items anteriores: aqui el correcto es "
             "DO y el calco es MAKE. Que el eje make/do cambie de direccion impide "
             "que se acierte por regla fija. A2.0."),
    dict(id="voc_col_08", difficulty=11.0, correct="do",
         prompt="Can you ___ me a favour?",
         distractors=["make", "give", "put"],
         why="do a favour. GIVE es el distractor nuevo y es plausible (se 'da' algo a "
             "alguien). Formula social fija que se aprende entera: A2.0."),
    dict(id="voc_col_09", difficulty=13.0, correct="make",
         prompt="We need to ___ a decision today.",
         distractors=["take", "do", "have"],
         why="make a decision. TAKE es el calco directo de 'tomar una decision' y es "
             "el error mas persistente de todos los de esta familia: sobrevive hasta "
             "B2. A2.5 porque el contexto sigue siendo transparente."),
    dict(id="voc_col_10", difficulty=15.0, correct="pays",
         prompt="She ___ a lot of attention to detail.",
         distractors=["gives", "makes", "puts"],
         why="pay attention. En espanol se 'presta' atencion, asi que GIVES es el "
             "calco. Sale del eje make/do y entra en verbos especificos por "
             "sustantivo, que es un salto real: A2.5."),
    dict(id="voc_col_11", difficulty=17.0, correct="make",
         prompt="The children ___ a lot of noise.",
         distractors=["do", "put", "have"],
         why="make noise. Vuelve al eje make/do pero con un sustantivo abstracto no "
             "contable, que es donde la regla intuitiva ('make = crear') deja de "
             "ayudar. A2.5."),
    dict(id="voc_col_12", difficulty=19.0, correct="took",
         prompt="He ___ an interest in photography after the trip.",
         distractors=["made", "did", "gave"],
         why="take an interest. Colocacion sin equivalente literal en espanol "
             "('interesarse por'), asi que no hay calco que ayude ni que estorbe: "
             "se sabe o no. B1.0."),
    dict(id="voc_col_02", difficulty=20.0, correct="made",
         prompt="The company ___ a profit of three million last year.",
         distractors=["did", "took", "gave"],
         why="make a profit. Sujeto abstracto y registro de negocios. TOOK y GAVE son "
             "colocaciones validas con otros sustantivos (take a loss, give a "
             "discount), asi que descartarlos exige saber cual va con profit."),
    dict(id="voc_col_13", difficulty=22.0, correct="comes",
         prompt="The new law ___ into effect next month.",
         distractors=["goes", "gets", "makes"],
         why="come into effect. Verbo de movimiento en sentido abstracto, donde el "
             "espanol usa 'entrar en vigor' y por eso GOES parece razonable. Registro "
             "juridico-periodistico: B1.0."),
    dict(id="voc_col_14", difficulty=24.0, correct="took",
         prompt="She ___ a risk by investing everything in one company.",
         distractors=["made", "did", "had"],
         why="take a risk. Coincide con el espanol ('correr/tomar un riesgo'), asi que "
             "la dificultad no viene del calco sino de que MAKE se ha vuelto el "
             "reflejo por defecto a esta altura del banco. B1.5."),
    dict(id="voc_col_15", difficulty=26.0, correct="reached",
         prompt="They ___ an agreement after two days of talks.",
         distractors=["took", "did", "gave"],
         why="reach an agreement. Primer item donde el verbo correcto NO es uno de los "
             "cuatro basicos: hay que conocer el verbo especifico, no elegir entre "
             "make/do/take/have. Ese cambio de mecanica lo situa en B1.5."),
    dict(id="voc_col_16", difficulty=28.0, correct="draws",
         prompt="The article ___ attention to a growing problem.",
         distractors=["takes", "makes", "puts"],
         why="draw attention to. Contrasta a proposito con voc_col_10 (pay attention): "
             "el mismo sustantivo lleva verbos distintos segun el sentido. Quien "
             "memorizo 'pay attention' como bloque falla aqui. B2.0."),
    dict(id="voc_col_17", difficulty=30.0, correct="took",
         prompt="She ___ responsibility for the mistake in public.",
         distractors=["made", "gave", "held"],
         why="take responsibility. HELD es el distractor fino: 'hold responsible' "
             "existe pero con otra estructura y otro sujeto. Discrimina entre dos "
             "colocaciones reales del mismo sustantivo. B2.0."),
    dict(id="voc_col_18", difficulty=32.0, correct="lost",
         prompt="The company ___ ground to its competitors last year.",
         distractors=["fell", "dropped", "gave"],
         why="lose ground. Metafora espacial opaca: 'perder terreno' existe en espanol, "
             "pero DROPPED y FELL son igual de espaciales y plausibles. B2.5."),
    dict(id="voc_col_19", difficulty=34.0, correct="sparked",
         prompt="His remarks ___ a heated debate among the members.",
         distractors=["burned", "lit", "flashed"],
         why="spark a debate. Los cuatro distractores son del mismo campo (fuego), asi "
             "que la metafora se entiende y aun asi hay que saber cual verbo se "
             "lexicalizo. Registro periodistico: B2.5."),
    dict(id="voc_col_20", difficulty=36.0, correct="lends",
         prompt="The new evidence ___ weight to her argument.",
         distractors=["borrows", "owes", "pays"],
         why="lend weight to. Se evitaron ADD y GIVE como distractores porque 'add "
             "weight' TAMBIEN es correcto y el item tendria dos respuestas. Los cuatro "
             "son verbos de prestamo, campo unico. C1.0."),
    dict(id="voc_col_21", difficulty=38.0, correct="turned",
         prompt="The inspector ___ a blind eye to several irregularities.",
         distractors=["closed", "shut", "gave"],
         why="turn a blind eye. Modismo totalmente opaco: en espanol es 'hacer la vista "
             "gorda', asi que CLOSED y SHUT son deducciones logicas y equivocadas. No "
             "hay forma de razonarlo. C1.0."),
    dict(id="voc_col_22", difficulty=40.0, correct="fell",
         prompt="The proposal ___ short of what the committee expected.",
         distractors=["went", "came", "got"],
         why="fall short of. Los cuatro son verbos de movimiento intransitivos y "
             "cualquiera suena posible con 'short'. Sin cognado en espanol y sin "
             "pista interna: C1.0-C1.5."),
    dict(id="voc_col_23", difficulty=42.0, correct="took",
         prompt="He ___ issue with the committee's findings.",
         distractors=["made", "had", "gave"],
         why="take issue with. Vuelve a los cuatro verbos basicos pero en una "
             "colocacion de registro formal y baja frecuencia, donde la familiaridad "
             "con make/do/take/have ya no ayuda a decidir. C1.5."),
    dict(id="voc_col_03", difficulty=45.0, correct="casts",
         prompt="The new evidence ___ serious doubt on his version of events.",
         distractors=["throws", "puts", "lays"],
         why="cast doubt on es fija y opaca. Cuatro verbos de movimiento vecinos, "
             "ninguna pista logica. Perfil tipico de C1.5: no se deduce."),
    dict(id="voc_col_24", difficulty=48.0, correct="hold",
         prompt="His explanation simply does not ___ water.",
         distractors=["keep", "carry", "take"],
         why="hold water (= resistir el analisis). Modismo opaco de registro culto sin "
             "ningun paralelo en espanol; los tres distractores son verbos de "
             "contencion igual de razonables literalmente. C2."),
]

# ======================================================================
# SYNONYM — 24 items. La palabra marcada va entre [corchetes].
# Eje de dificultad: cuanto depende la equivalencia del CONTEXTO y del matiz.
# ======================================================================
SYNONYM = [
    dict(id="voc_syn_04", difficulty=2.0, correct="little",
         prompt="The box was very [small].",
         distractors=["heavy", "empty", "round"],
         why="small/little, equivalencia total para tamano y ambas zipf >5.5. "
             "Distractores A1 de otras dimensiones fisicas (peso, contenido, forma). "
             "Piso de la escala de sinonimia."),
    dict(id="voc_syn_01", difficulty=4.0, correct="large",
         prompt="The house is very [big].",
         distractors=["small", "old", "new"],
         why="big/large, equivalencia TOTAL para tamano fisico: no depende del "
             "contexto ni del registro. Dos distractores son antonimos, asi que se "
             "resuelve por significado y no por descarte."),
    dict(id="voc_syn_05", difficulty=6.0, correct="pleased",
         prompt="She was very [happy] with the result.",
         distractors=["tired", "hungry", "angry"],
         why="happy/pleased. Primera equivalencia que NO es total: 'pleased' pide un "
             "objeto de satisfaccion, que el contexto ('with the result') da. Los "
             "distractores son estados A1 sin relacion. A1.5."),
    dict(id="voc_syn_06", difficulty=8.0, correct="simple",
         prompt="The first test was quite [easy].",
         distractors=["short", "boring", "useful"],
         why="easy/simple. SHORT es el distractor util: un examen facil suele ser "
             "corto, asi que hay que separar la propiedad de su correlato habitual. "
             "A2.0."),
    dict(id="voc_syn_07", difficulty=10.0, correct="started",
         prompt="He [began] the meeting at nine o'clock.",
         distractors=["ended", "joined", "missed"],
         why="begin/start, equivalencia total, pero verbal en vez de adjetival y con "
             "un antonimo directo entre los distractores. A2.0."),
    dict(id="voc_syn_08", difficulty=12.0, correct="bare",
         prompt="When they arrived, the room was completely [empty].",
         distractors=["dirty", "dark", "quiet"],
         why="empty/bare. La equivalencia ya depende del sustantivo: 'bare room' "
             "funciona, 'bare bottle' no. Primer item donde el contexto es "
             "imprescindible. A2.5."),
    dict(id="voc_syn_09", difficulty=14.0, correct="repaired",
         prompt="They [fixed] the broken window yesterday.",
         distractors=["replaced", "removed", "cleaned"],
         why="fix/repair. REPLACED es el distractor decisivo: tambien resuelve una "
             "ventana rota, pero cambiandola, no arreglandola. Mide precision, no "
             "tema. A2.5."),
    dict(id="voc_syn_10", difficulty=16.0, correct="plain",
         prompt="The instructions were very [clear].",
         distractors=["short", "formal", "recent"],
         why="clear/plain en el sentido de 'facil de entender'. PLAIN tiene otros "
             "sentidos (liso, sencillo) que aqui no aplican, asi que el contexto "
             "manda. A2.5-B1."),
    dict(id="voc_syn_11", difficulty=18.0, correct="declined",
         prompt="She politely [refused] the offer.",
         distractors=["accepted", "ignored", "delayed"],
         why="refuse/decline. La equivalencia es casi total pero DECLINE es mas formal "
             "y pide justamente el 'politely' del enunciado. Los distractores son las "
             "tres reacciones alternativas reales. B1.0."),
    dict(id="voc_syn_12", difficulty=21.0, correct="unexpected",
         prompt="The results of the study were [surprising].",
         distractors=["disappointing", "encouraging", "predictable"],
         why="surprising/unexpected. PREDICTABLE es el antonimo y los otros dos son "
             "valoraciones que suelen acompanar a una sorpresa: hay que separar "
             "'inesperado' de 'bueno o malo'. B1.0."),
    dict(id="voc_syn_13", difficulty=23.0, correct="concise",
         prompt="He gave a [brief] explanation of the problem.",
         distractors=["detailed", "honest", "loud"],
         why="brief/concise. CONCISE anade un matiz de eficacia que BRIEF no tiene, "
             "pero en este contexto son intercambiables. Registro formal: B1.5."),
    dict(id="voc_syn_14", difficulty=25.0, correct="persuasive",
         prompt="The lawyer's evidence was [convincing].",
         distractors=["conflicting", "missing", "recent"],
         why="convincing/persuasive, equivalencia alta en registro formal. "
             "CONFLICTING es el distractor que exige leer bien: comparte campo "
             "(pruebas) y sonido inicial. B1.5."),
    dict(id="voc_syn_02", difficulty=26.0, correct="delay",
         prompt="They decided to [postpone] the meeting until Friday.",
         distractors=["cancel", "attend", "shorten"],
         why="CANCEL hace todo el trabajo: mismo campo (algo no ocurre cuando debia) y "
             "es el error de quien entiende la situacion pero no la palabra."),
    dict(id="voc_syn_15", difficulty=29.0, correct="unwilling",
         prompt="The manager was [reluctant] to approve the extra budget.",
         distractors=["unable", "eager", "ready"],
         why="reluctant/unwilling. UNABLE es la confusion real y de peso: no querer no "
             "es no poder, y el espanol 'no estar dispuesto' difumina la frontera. "
             "B2.0."),
    dict(id="voc_syn_16", difficulty=31.0, correct="imprecise",
         prompt="Her response to the question was rather [vague].",
         distractors=["hostile", "immediate", "sincere"],
         why="vague/imprecise. Los tres distractores son propiedades que una respuesta "
             "puede tener a la vez que la vaguedad, asi que el contexto no descarta "
             "ninguno: hay que conocer la palabra. B2.0."),
    dict(id="voc_syn_17", difficulty=33.0, correct="acute",
         prompt="The hospital faced a [severe] shortage of staff.",
         distractors=["minor", "temporary", "gradual"],
         why="severe/acute. ACUTE solo equivale a SEVERE con ciertos sustantivos "
             "(shortage, pain, crisis); con otros significa 'agudo'. Dependencia "
             "fuerte del contexto: B2.5."),
    dict(id="voc_syn_18", difficulty=35.0, correct="incremental",
         prompt="The changes to the system were [gradual].",
         distractors=["sudden", "drastic", "permanent"],
         why="gradual/incremental. INCREMENTAL es de registro tecnico y anade la idea "
             "de pasos discretos. SUDDEN y DRASTIC son los antonimos naturales. B2.5."),
    dict(id="voc_syn_19", difficulty=37.0, correct="thorough",
         prompt="She was [meticulous] about every detail of the contract.",
         distractors=["careless", "indifferent", "hurried"],
         why="meticulous/thorough. Los tres distractores son el polo opuesto en tres "
             "grados distintos, asi que no se acierta por 'elegir la positiva': hay "
             "que reconocer la intensidad. C1.0."),
    dict(id="voc_syn_20", difficulty=39.0, correct="harmful",
         prompt="The policy proved [detrimental] to small businesses.",
         distractors=["beneficial", "irrelevant", "essential"],
         why="detrimental/harmful. DETRIMENTAL es transparente para un hispanohablante "
             "(detrimento), y por eso esta en C1.0 y no mas arriba pese a su baja "
             "frecuencia: la escala mide dificultad real, no rareza."),
    dict(id="voc_syn_21", difficulty=41.0, correct="crucial",
         prompt="Their early support was [pivotal] to the project's success.",
         distractors=["optional", "temporary", "symbolic"],
         why="pivotal/crucial. SYMBOLIC es el distractor fino: un apoyo puede ser "
             "simbolico e importante a la vez, pero no es lo que dice PIVOTAL. "
             "C1.0-C1.5."),
    dict(id="voc_syn_22", difficulty=43.0, correct="unyielding",
         prompt="The minister remained [adamant] despite the criticism.",
         distractors=["apologetic", "evasive", "indifferent"],
         why="adamant/unyielding. EVASIVE es la trampa: tambien describe a quien no "
             "cede ante la critica, pero esquivando en vez de plantandose. Matiz de "
             "actitud, no de significado nuclear. C1.5."),
    dict(id="voc_syn_03", difficulty=46.0, correct="frank",
         prompt="His [candid] account of the failure surprised the board.",
         distractors=["vague", "hostile", "reluctant"],
         why="Los tres distractores describirian igual de bien un relato ante un "
             "consejo: el contexto no descarta ninguno. Hay que saber que candid es "
             "'sin filtro'."),
    dict(id="voc_syn_23", difficulty=48.0, correct="flimsy",
         prompt="The evidence for his claim was [tenuous].",
         distractors=["robust", "abundant", "recent"],
         why="tenuous/flimsy, ambas <zipf 3.6 y sin cognado util. Sustituye a un item "
             "de equivocal->ambiguous que el validador rechazo con razon: AMBIGUOUS ya "
             "es la respuesta de voc_def_20, y preguntar la misma palabra en dos "
             "formatos es medir lo mismo dos veces. ROBUST es el antonimo exacto en "
             "este contexto. C2."),
    dict(id="voc_syn_24", difficulty=50.0, correct="cursory",
         prompt="His [perfunctory] apology satisfied no one.",
         distractors=["heartfelt", "lengthy", "public"],
         why="perfunctory/cursory, dos palabras de zipf <3 que son sinonimas entre si "
             "y no tienen cognado util en espanol. Techo de la escala: exige conocer "
             "las DOS, no solo reconocer una."),
]

VOCAB_ITEMS = (
    [dict(skill="vocab", fmt="definition", speak=None, **d) for d in DEFINITION]
    + [dict(skill="vocab", fmt="collocation", speak=None, source="authored", **d)
       for d in COLLOCATION]
    + [dict(skill="vocab", fmt="synonym", speak=None, source="authored", **d)
       for d in SYNONYM]
)

# -*- coding: utf-8 -*-
"""
TEST DE NIVEL — TANDA 3: los 72 items de LISTENING.

24 por formato. Misma escalera deliberada que las dos tandas anteriores.

  listen_word      2, 4, 6 ... 48, 50    (media 25.7)
  listen_sentence  1, 3, 5 ... 48, 50    (media 24.7)
  listen_question  2, 4, 6 ... 47, 49    (media 25.5)

Spread entre formatos: 1.0 punto.

>>> LA REGLA QUE PARTE ESTA TANDA EN DOS <<<
phonetic_rules.HARD_CONTRAST_POLICY decide donde puede aparecer un contraste
duro, y no es lo mismo en los tres formatos:

  listen_word       el contraste ES lo que se mide -> permitido desde 25.
                    Por debajo de 25, SOLO contrastes suaves (silent_h, ae_e,
                    uh_ah, y_j, w_v). Por eso la escalera de este formato esta
                    partida: los 12 primeros items son suaves y los 12 ultimos
                    duros. No es una decision estetica, la impone el validador.

  listen_sentence   lo medido es GRAMATICA OIDA. Un contraste duro entre dos
  listen_question   transcripciones no es dificultad, es ruido: el item pasaria
                    a medir la voz del navegador. Prohibido a cualquier nivel,
                    incluidas las contracciones auxiliares (He's/He'd), que el
                    validador conoce como `aux_contraction`.

Consecuencia practica en listen_sentence: las cuatro opciones se separan
SIEMPRE por bloques audibles enteros — auxiliares completos, orden de palabras,
formas verbales distintas — nunca por un fonema en silaba atona.

Ninguna palabra hablada es homofona ni heteronimo: FORBIDDEN_SPOKEN las
bloquea, porque si el audio dice /siː/ no hay forma justa de saber si era
SEE o SEA.
"""

# ======================================================================
# LISTEN_WORD — 24. Se pronuncia UNA palabra, 4 opciones escritas.
# Items 1-12 (difficulty 2-24): contrastes SUAVES obligatorios.
# Items 13-24 (difficulty 27-50): contrastes DUROS permitidos.
# ======================================================================
LISTEN_WORD = [
    # ---- tramo SUAVE (por debajo del umbral de 25) ----
    dict(id="lis_wrd_04", difficulty=2.0, speak="man", correct="MAN",
         distractors=["MEN", "MAP", "MOON"], source="minimal_pairs:ae_e",
         why="Contraste ae_e, SUAVE: el espanol no tiene la vocal de 'cat', pero "
             "MAN/MEN se separan lo bastante como para oirse sin entrenamiento. "
             "Las cuatro son A1 y de altisima frecuencia. Piso de la escala."),
    dict(id="lis_wrd_05", difficulty=4.0, speak="cup", correct="CUP",
         distractors=["COP", "CAP", "CAKE"], source="minimal_pairs:uh_ah",
         why="Contraste uh_ah, SUAVE: la vocal de 'cup' no existe en espanol y se "
             "vuelve O, que es justo COP. CAP anade una tercera vocal del mismo "
             "punto, asi que el item cubre el triangulo /ʌ/-/ɒ/-/æ/ entero. A1.5."),
    dict(id="lis_wrd_01", difficulty=6.0, speak="heart", correct="HEART",
         distractors=["ART", "HAND", "DARK"], source="minimal_pairs:silent_h",
         why="Contraste silent_h, SUAVE: la H inglesa es perfectamente audible, el "
             "problema hispano es que la H propia es muda y por eso se ignora. "
             "HEART zipf 4.9 y las cuatro opciones son A1."),
    dict(id="lis_wrd_06", difficulty=8.0, speak="bed", correct="BED",
         distractors=["BAD", "BAG", "BOX"], source="minimal_pairs:ae_e",
         why="ae_e otra vez pero en la direccion contraria a lis_wrd_04: aqui la "
             "respuesta es la vocal /e/ y el distractor la /æ/. Alternar la "
             "direccion impide que se acierte por regla fija. A2.0."),
    dict(id="lis_wrd_07", difficulty=10.0, speak="hot", correct="HOT",
         distractors=["HUT", "HAT", "HOP"], source="minimal_pairs:uh_ah",
         why="uh_ah invertido respecto de lis_wrd_05. HAT mete la tercera vocal y "
             "HOP cambia la consonante final, asi que hay dos ejes de atencion. "
             "A2.0."),
    dict(id="lis_wrd_08", difficulty=12.0, speak="hold", correct="HOLD",
         distractors=["OLD", "COLD", "GOLD"], source="minimal_pairs:silent_h",
         why="silent_h con un set que rima entero (OLD/COLD/GOLD/HOLD): las cuatro "
             "comparten nucleo y coda, asi que toda la informacion esta en la "
             "consonante inicial. Es la version dificil de un contraste suave. A2.0."),
    dict(id="lis_wrd_09", difficulty=14.0, speak="ten", correct="TEN",
         distractors=["TAN", "TIN", "TENT"], source="minimal_pairs:ae_e",
         why="ae_e con TIN de tercer distractor. TEN/TIN es /e/-/ɪ/, que el espanol "
             "SI distingue, asi que no entra en la prohibicion de contrastes duros "
             "y sirve para que no basten dos opciones. A2.5."),
    dict(id="lis_wrd_10", difficulty=16.0, speak="luck", correct="LUCK",
         distractors=["LOCK", "LICK", "LAKE"], source="minimal_pairs:uh_ah",
         why="uh_ah con cuatro vocales distintas sobre el mismo esqueleto L_CK. "
             "Cuanto mas se parecen las opciones entre si, mas fina tiene que ser "
             "la discriminacion aunque el contraste siga siendo suave. A2.5."),
    dict(id="lis_wrd_11", difficulty=18.0, speak="jet", correct="JET",
         distractors=["YET", "JOB", "NET"], source="minimal_pairs:y_j",
         why="Contraste y_j, SUAVE. El espanol tiene un sonido intermedio entre la "
             "Y y la J inglesas, asi que la confusion es de produccion mas que de "
             "percepcion; por eso es suave y va aqui y no arriba. B1.0."),
    dict(id="lis_wrd_12", difficulty=20.0, speak="send", correct="SEND",
         distractors=["SAND", "SPEND", "SUN"], source="minimal_pairs:ae_e",
         why="ae_e con SPEND de distractor, que solo anade una consonante: obliga a "
             "atender a la vocal Y al ataque a la vez. Ultimo item facil del tramo "
             "suave. B1.0."),
    dict(id="lis_wrd_13", difficulty=22.0, speak="vest", correct="VEST",
         distractors=["WEST", "REST", "NEST"], source="minimal_pairs:w_v",
         why="Contraste w_v, SUAVE. Nota de diseno: BEST queda FUERA de las "
             "opciones a proposito, porque BEST/VEST es b_v, que es DURO y esta "
             "prohibido por debajo de 25. El validador lo habria rechazado. B1.0."),
    dict(id="lis_wrd_14", difficulty=24.0, speak="flash", correct="FLASH",
         distractors=["FLESH", "FLAT", "CRASH"], source="minimal_pairs:ae_e",
         why="ae_e en palabras mas largas y menos frecuentes que las anteriores, "
             "justo por debajo del umbral. Cierra el tramo suave en su punto mas "
             "exigente. B1.5."),

    # ---- tramo DURO (desde el umbral de 25) ----
    dict(id="lis_wrd_02", difficulty=27.0, speak="sheep", correct="SHEEP",
         distractors=["SHIP", "SHOP", "SHEET"], source="minimal_pairs:short_long_i",
         why="ship/sheep, el contraste duro por excelencia: el espanol no tiene I "
             "corta. Se permite porque 27 supera el umbral de 25; por debajo "
             "frustraria en vez de medir."),
    dict(id="lis_wrd_15", difficulty=29.0, speak="rice", correct="RICE",
         distractors=["RISE", "RIDE", "RACE"], source="minimal_pairs:s_z",
         why="Contraste s_z, DURO: el espanol no tiene Z sonora, asi que RICE y "
             "RISE colapsan en un solo sonido para el oido hispano. Primer item de "
             "sonoridad final del banco. B2.0."),
    dict(id="lis_wrd_16", difficulty=31.0, speak="chip", correct="CHIP",
         distractors=["SHIP", "CHEAP", "TRIP"], source="minimal_pairs:sh_ch",
         why="DOS contrastes duros en el mismo item: sh_ch frente a SHIP y "
             "short_long_i frente a CHEAP. Solo se sostiene por encima del umbral, "
             "y es lo que lo situa en B2.0 y no antes."),
    dict(id="lis_wrd_17", difficulty=33.0, speak="thin", correct="THIN",
         distractors=["TIN", "THINK", "SHIN"], source="minimal_pairs:th",
         why="Contraste th, DURO: no existe en espanol y se sustituye por T o S. "
             "THINK anade una coda para que no baste oir el ataque. B2.0."),
    dict(id="lis_wrd_18", difficulty=35.0, speak="fool", correct="FOOL",
         distractors=["FULL", "FUEL", "POOL"], source="minimal_pairs:short_long_u",
         why="short_long_u, DURO. El espanol tiene una sola U, asi que full/fool es "
             "invisible sin entrenamiento. FUEL mete un diptongo cercano y POOL "
             "cambia el ataque. B2.5."),
    dict(id="lis_wrd_19", difficulty=37.0, speak="prize", correct="PRIZE",
         distractors=["PRICE", "PRIDE", "PRESS"], source="minimal_pairs:s_z",
         why="s_z en palabra mas larga que lis_wrd_15, y con PRIDE de distractor, "
             "que cambia la consonante final por otra sonora. Discrimina sonoridad "
             "y punto de articulacion a la vez. B2.5."),
    dict(id="lis_wrd_20", difficulty=39.0, speak="wish", correct="WISH",
         distractors=["WITCH", "WASH", "FISH"], source="minimal_pairs:sh_ch",
         why="sh_ch al final de palabra, que es donde mas cuesta: en posicion final "
             "la africada pierde parte de su explosion. WASH cambia la vocal y FISH "
             "el ataque. C1.0."),
    dict(id="lis_wrd_21", difficulty=41.0, speak="berry", correct="BERRY",
         distractors=["VERY", "MERRY", "FERRY"], source="minimal_pairs:b_v",
         why="Contraste b_v, EL contraste del hispanohablante: el espanol tiene un "
             "solo fonema para B y V. Nota de diseno: BURY queda fuera porque es "
             "HOMOFONO de BERRY y haria el item irresoluble. C1.0."),
    dict(id="lis_wrd_03", difficulty=44.0, speak="thought", correct="THOUGHT",
         distractors=["TAUGHT", "THORN", "TALK"], source="minimal_pairs:th",
         why="Contraste th, duro. Nota de diseno: se evita TAUT a proposito porque "
             "es HOMOFONO de TAUGHT — el validador lo habria rechazado igual, pero "
             "conviene que el banco no dependa de eso."),
    dict(id="lis_wrd_22", difficulty=46.0, speak="mouth", correct="MOUTH",
         distractors=["MOUSE", "MOUNT", "SOUTH"], source="minimal_pairs:th",
         why="th final frente a S, que es la sustitucion mas comun. Las cuatro "
             "comparten el diptongo /aʊ/, asi que toda la carga esta en la coda. "
             "C1.5."),
    dict(id="lis_wrd_23", difficulty=48.0, speak="advise", correct="ADVISE",
         distractors=["ADVICE", "ADVANCE", "DEVICE"], source="minimal_pairs:s_z",
         why="advise/advice: el par s_z que sobrevive hasta C2 porque ademas "
             "distingue verbo de sustantivo. Un avanzado que escribe bien la "
             "diferencia sigue sin oirla. C2."),
    dict(id="lis_wrd_24", difficulty=50.0, speak="lose", correct="LOSE",
         distractors=["LOOSE", "LOSS", "NOISE"], source="minimal_pairs:s_z",
         why="loose/lose, sonoridad final en un par de altisima frecuencia que "
             "casi nadie distingue al oido. Techo de la escala: la palabra es "
             "comun, lo dificil es exclusivamente el fonema."),
]

# ======================================================================
# LISTEN_SENTENCE — 24. Se pronuncia una frase; 4 transcripciones que se
# separan SOLO por la parte gramatical.
# NINGUN par de opciones puede separarse por un contraste duro ni por una
# contraccion auxiliar: aqui lo medido es la gramatica, no el oido fino.
# ======================================================================
LISTEN_SENTENCE = [
    dict(id="lis_sen_04", difficulty=1.0, speak="I am a student.",
         correct="I am a student.",
         distractors=["I was a student.", "I have a student.", "He is a student."],
         why="Las cuatro se separan por el verbo entero (am/was/have/is) o por el "
             "sujeto: silabas completas, ningun TTS las confunde. Piso de la "
             "escala, mide solo si oye la copula."),
    dict(id="lis_sen_05", difficulty=3.0, speak="She has two brothers.",
         correct="She has two brothers.",
         distractors=["She have two brothers.", "They have two brothers.",
                      "She has two sisters."],
         why="has/have, diferencia de consonante final /z/ vs /v/ en silaba TONICA, "
             "que si es audible. Nota: se evito a proposito el par has/had, que se "
             "separa por /z/ vs /d/ en la misma posicion y entra en la familia de "
             "aux_contraction. A1.5."),
    dict(id="lis_sen_06", difficulty=5.0, speak="They are playing football.",
         correct="They are playing football.",
         distractors=["They were playing football.", "They are play football.",
                      "We are playing football."],
         why="are/were es una silaba entera de diferencia. El segundo distractor "
             "quita el -ing, que tambien es una silaba. A1.5."),
    dict(id="lis_sen_01", difficulty=7.0, speak="She is eating an apple.",
         correct="She is eating an apple.",
         distractors=["She was eating an apple.", "She eats an apple.",
                      "She has eaten an apple."],
         why="Se separan por el bloque verbal completo (is / was / eats / has "
             "eaten), diferencias de una silaba entera o mas. Mide el presente "
             "continuo A1 OIDO en vez de leido."),
    dict(id="lis_sen_07", difficulty=9.0, speak="He does not like coffee.",
         correct="He does not like coffee.",
         distractors=["He do not like coffee.", "He did not like coffee.",
                      "She does not like coffee."],
         why="does/do/did: tres auxiliares con vocales distintas y tonicas. El "
             "cuarto cambia el sujeto, asi que hay que atender al principio y al "
             "medio de la frase. A2.0."),
    dict(id="lis_sen_08", difficulty=11.0, speak="I went to the beach yesterday.",
         correct="I went to the beach yesterday.",
         distractors=["I go to the beach yesterday.",
                      "I have gone to the beach yesterday.",
                      "I was going to the beach yesterday."],
         why="Pasado simple frente a presente, perfecto y continuo. Los bloques "
             "verbales tienen 1, 2 y 3 silabas respectivamente: imposible "
             "confundirlos aunque la gramatica sea sutil. A2.0."),
    dict(id="lis_sen_09", difficulty=13.0, speak="There are many people here.",
         correct="There are many people here.",
         distractors=["There is many people here.", "There were many people here.",
                      "There are many person here."],
         why="is/are/were en el mismo hueco, mas singular/plural en el sustantivo. "
             "'People' es singular en espanol ('la gente'), que es el origen del "
             "error. A2.5."),
    dict(id="lis_sen_10", difficulty=15.0, speak="She can speak three languages.",
         correct="She can speak three languages.",
         distractors=["She can speaks three languages.",
                      "She cans speak three languages.",
                      "She could speak three languages."],
         why="Modal + infinitivo sin flexionar. Las -s sobrantes son silabas "
             "audibles al final de palabra, y can/could cambia la vocal entera. "
             "A2.5."),
    dict(id="lis_sen_11", difficulty=17.0, speak="I have lived here for ten years.",
         correct="I have lived here for ten years.",
         distractors=["I have lived here since ten years.",
                      "I live here for ten years.",
                      "I am living here for ten years."],
         why="for/since con duracion, mas el tiempo verbal. FOR y SINCE no se "
             "parecen en nada al oido, asi que la dificultad es integramente "
             "gramatical, que es lo que este formato debe medir. A2.5."),
    dict(id="lis_sen_12", difficulty=19.0, speak="He did not go to work.",
         correct="He did not go to work.",
         distractors=["He did not went to work.", "He does not go to work.",
                      "He has not go to work."],
         why="did + infinitivo. El primer distractor anade una silaba (went), el "
             "segundo y el tercero cambian el auxiliar entero. B1.0."),
    dict(id="lis_sen_13", difficulty=21.0,
         speak="The book was written by a student.",
         correct="The book was written by a student.",
         distractors=["The book was wrote by a student.",
                      "The book is written by a student.",
                      "The book has written by a student."],
         why="Pasiva con participio irregular. written/wrote se separan por la "
             "vocal tonica y por la silaba final; was/is/has son auxiliares "
             "completos. B1.0."),
    dict(id="lis_sen_14", difficulty=23.0,
         speak="By the time we arrived, the film had started.",
         correct="By the time we arrived, the film had started.",
         distractors=["By the time we arrived, the film is starting.",
                      "By the time we arrived, the film started.",
                      "By the time we arrived, the film was start."],
         why="Pasado perfecto. Nota de diseno: el distractor obvio seria 'the film "
             "has started', pero has/had es /z/ vs /d/ en silaba atona — la trampa "
             "que la politica prohibe. Sustituido por 'is starting', igual de "
             "incorrecto y con dos silabas de diferencia. B1.5."),
    dict(id="lis_sen_15", difficulty=25.0,
         speak="She suggested that he see a doctor.",
         correct="She suggested that he see a doctor.",
         distractors=["She suggested that he sees a doctor.",
                      "She suggested him to see a doctor.",
                      "She suggested that he saw a doctor."],
         why="Subjuntivo mandativo oido. see/sees/saw se separan por la coda y por "
             "la vocal; el segundo distractor reestructura la frase entera. B1.5."),
    dict(id="lis_sen_16", difficulty=28.0,
         speak="I wish I had studied harder.",
         correct="I wish I had studied harder.",
         distractors=["I wish I would have studied harder.",
                      "I wish I studied harder.",
                      "I wish I was studying harder."],
         why="wish + pasado perfecto. Nota: se evito 'I wish I have studied', que "
             "seria had/have en silaba atona. Los tres distractores cambian el "
             "bloque verbal entero, de una a tres silabas. B2.0."),
    dict(id="lis_sen_02", difficulty=30.0, speak="He's been working here since March.",
         correct="He's been working here since March.",
         distractors=["He was working here since March.",
                      "He's working here since March.",
                      "He works here since March."],
         why="Present perfect continuo. DIVERGE del ejemplo del prompt, que "
             "proponia 'He'd been working': He's/He'd es /z/ vs /d/ y hoy el "
             "validador lo rechaza solo como aux_contraction. Sustituido por 'He "
             "works here since March', igual de incorrecto y claramente audible."),
    dict(id="lis_sen_17", difficulty=32.0,
         speak="She had her car repaired last week.",
         correct="She had her car repaired last week.",
         distractors=["She had repaired her car last week.",
                      "She had her car repair last week.",
                      "She had her car to repair last week."],
         why="Causativa 'have something done'. Los cuatro comparten 'had', asi que "
             "la diferencia esta toda en el orden y en la forma del segundo verbo: "
             "sin trampas foneticas, gramatica pura. B2.0."),
    dict(id="lis_sen_18", difficulty=34.0,
         speak="Not only did she apologise, but she also paid.",
         correct="Not only did she apologise, but she also paid.",
         distractors=["Not only she apologised, but she also paid.",
                      "Not only did she apologised, but she also paid.",
                      "Not only was she apologise, but she also paid."],
         why="Inversion tras 'not only'. Orden de palabras y forma verbal: dos "
             "ejes, ambos audibles como bloques. B2.5."),
    dict(id="lis_sen_19", difficulty=36.0,
         speak="I am not used to getting up early.",
         correct="I am not used to getting up early.",
         distractors=["I am not used to get up early.",
                      "I am not using to get up early.",
                      "I do not used to get up early."],
         why="'be used to' + gerundio. Nota: el distractor 'I am not use to' se "
             "descarto porque used/use es /st/ vs /s/ al final, demasiado fino para "
             "el TTS; sustituido por 'using', que anade una silaba. B2.5."),
    dict(id="lis_sen_20", difficulty=38.0, speak="The report needs to be revised.",
         correct="The report needs to be revised.",
         distractors=["The report needs revised.", "The report needs to revise.",
                      "The report needs being revised."],
         why="Infinitivo pasivo tras 'need'. Los cuatro se separan por el numero de "
             "silabas del bloque final (1, 2, 3 y 3 con vocales distintas). C1.0."),
    dict(id="lis_sen_21", difficulty=40.0,
         speak="Little did they know what was coming.",
         correct="Little did they know what was coming.",
         distractors=["Little they knew what was coming.",
                      "Little did they knew what was coming.",
                      "Little they did know what was coming."],
         why="Inversion tras adverbial negativo. Las cuatro usan las mismas "
             "palabras en ordenes distintos, que es la forma mas limpia de medir "
             "sintaxis por el oido: no hay ni una diferencia fonetica. C1.0."),
    dict(id="lis_sen_22", difficulty=43.0,
         speak="No sooner had he arrived than the meeting began.",
         correct="No sooner had he arrived than the meeting began.",
         distractors=["No sooner he had arrived than the meeting began.",
                      "No sooner had he arrived when the meeting began.",
                      "No sooner had he arrived as the meeting began."],
         why="'No sooner... than' con inversion. than/when/as son tres palabras "
             "completamente distintas al oido, y el primer distractor cambia el "
             "orden. Dos variables independientes. C1.5."),
    dict(id="lis_sen_23", difficulty=45.0,
         speak="It is essential that every member be present.",
         correct="It is essential that every member be present.",
         distractors=["It is essential that every member is present.",
                      "It is essential that every member being present.",
                      "It is essential that every member to be present."],
         why="Subjuntivo mandativo con 'be'. be/is/being/to be tienen 1, 1, 2 y 2 "
             "silabas con vocales distintas: audibles pese a ser palabras "
             "gramaticales atonas. C1.5."),
    dict(id="lis_sen_03", difficulty=48.0, speak="Rarely have I seen such dedication.",
         correct="Rarely have I seen such dedication.",
         distractors=["Rarely I have seen such dedication.",
                      "Rarely has I seen such dedication.",
                      "Rarely have I saw such dedication."],
         why="Inversion tras adverbio restrictivo, OIDA. Las tres diferencias son "
             "orden de palabras, concordancia y forma verbal: las tres las articula "
             "sin problema cualquier TTS."),
    dict(id="lis_sen_24", difficulty=50.0,
         speak="Were it not for her advice, we would have failed.",
         correct="Were it not for her advice, we would have failed.",
         distractors=["Was it not for her advice, we would have failed.",
                      "Were it not of her advice, we would have failed.",
                      "If it were not for her advice, we would failed."],
         why="Formula subjuntiva 'were it not for'. Were/Was se separan por la "
             "vocal tonica entera, no por una coda; for/of por la consonante "
             "inicial. Techo de la escala de listening."),
]

# ======================================================================
# LISTEN_QUESTION — 24. Se pronuncia una pregunta, 4 respuestas escritas.
# El formato que mejor separa niveles altos: exige entender, no distinguir.
# ======================================================================
LISTEN_QUESTION = [
    dict(id="lis_qst_01", difficulty=2.0, speak="What is your name?",
         correct="My name is Ana.",
         distractors=["I am fine, thank you.", "It is on the table.", "Yes, I do."],
         why="Pregunta A1.0 de identificacion. Los tres distractores son respuestas "
             "CORRECTAS a otras preguntas A1 igual de frecuentes, asi que el item "
             "mide si entendio la pregunta y no si sabe construir una respuesta."),
    dict(id="lis_qst_04", difficulty=4.0, speak="How old are you?",
         correct="I am eight years old.",
         distractors=["My name is Tom.", "It is very old.", "I am fine, thanks."],
         why="Interrogativo 'how old'. El segundo distractor reutiliza la palabra "
             "OLD en otro sentido, que es la trampa util: castiga responder por "
             "palabra suelta reconocida. A1.5."),
    dict(id="lis_qst_05", difficulty=6.0, speak="Where do you live?",
         correct="In Madrid.",
         distractors=["At eight o'clock.", "By car.", "With my sister."],
         why="Discriminacion de interrogativo: where / when / how / who. Las cuatro "
             "respuestas son sintagmas preposicionales cortos, asi que solo la "
             "preposicion y el contenido las separan. A1.5."),
    dict(id="lis_qst_06", difficulty=8.0, speak="What time does the class start?",
         correct="At nine o'clock.",
         distractors=["In the classroom.", "Every Monday.", "For two hours."],
         why="'What time' frente a lugar, frecuencia y duracion. Los cuatro son "
             "complementos temporales o locativos plausibles: hay que oir 'what "
             "time' y no solo 'class'. A2.0."),
    dict(id="lis_qst_07", difficulty=10.0, speak="How many brothers do you have?",
         correct="Two.",
         distractors=["Very tall.", "Last year.", "By bus."],
         why="'How many' pide cantidad. La respuesta correcta es la mas corta del "
             "banco, lo que impide acertar por longitud o elaboracion. A2.0."),
    dict(id="lis_qst_08", difficulty=12.0, speak="What did you do last weekend?",
         correct="I visited my grandmother.",
         distractors=["I will go to the beach.", "I am studying English.",
                      "Every Saturday."],
         why="Tiempo verbal oido dentro de la pregunta: 'did' obliga a una "
             "respuesta en pasado. Los tres distractores son futuro, presente "
             "continuo y frecuencia. A2.0."),
    dict(id="lis_qst_09", difficulty=14.0, speak="Would you like something to drink?",
         correct="Yes, a glass of water, please.",
         distractors=["I drank it yesterday.", "It is on the table.",
                      "Because I am thirsty."],
         why="Ofrecimiento, no pregunta de informacion. El primer distractor "
             "responde al verbo DRINK en pasado y el tercero al 'why' que nadie "
             "pregunto: dos formas distintas de contestar a una palabra suelta. "
             "A2.5."),
    dict(id="lis_qst_10", difficulty=16.0, speak="How often do you go to the gym?",
         correct="Three times a week.",
         distractors=["About twenty minutes away.", "Since January.",
                      "With a friend."],
         why="'How often' frente a distancia, punto de inicio y compania. Las "
             "cuatro son respuestas naturales a preguntas con 'how', que es lo que "
             "obliga a oir la segunda palabra. A2.5."),
    dict(id="lis_qst_11", difficulty=18.0, speak="Have you ever been to London?",
         correct="Yes, twice.",
         distractors=["Yes, next summer.", "No, I go tomorrow.",
                      "Yes, I am going now."],
         why="Present perfect de experiencia: la respuesta tiene que mirar al "
             "pasado. Los tres distractores son coherentes en forma pero apuntan al "
             "futuro o al presente. B1.0."),
    dict(id="lis_qst_12", difficulty=20.0, speak="How long does the film last?",
         correct="About two hours.",
         distractors=["At half past eight.", "Three times.", "Since Friday."],
         why="'How long' de duracion frente a hora, frecuencia y punto de inicio. "
             "SINCE es el distractor fino: responde a 'how long' en la variante de "
             "estado, no de evento. B1.0."),
    dict(id="lis_qst_02", difficulty=22.0,
         speak="How long have you been living in this city?",
         correct="About three years.",
         distractors=["Twice a week.", "By bus, usually.", "Because of my job."],
         why="Discriminacion entre interrogativos oida dentro de una pregunta en "
             "present perfect continuo. Las cuatro respuestas son igual de "
             "plausibles fuera de contexto: solo la pregunta las separa."),
    dict(id="lis_qst_13", difficulty=24.0, speak="Why didn't you come to the meeting?",
         correct="I was ill.",
         distractors=["Yes, I came.", "At three o'clock.", "In the main office."],
         why="Pregunta negativa: el primer distractor contradice directamente la "
             "presuposicion de la pregunta, que es el error de quien oye 'come to "
             "the meeting' y no el 'didn't'. B1.5."),
    dict(id="lis_qst_14", difficulty=26.0,
         speak="Could you tell me where the station is?",
         correct="Yes, it's just around the corner.",
         distractors=["Yes, I could.", "No, I couldn't tell you yesterday.",
                      "It was built in 1920."],
         why="Peticion indirecta con forma de pregunta de capacidad. 'Yes, I could' "
             "es la respuesta literal a la forma y equivocada en el uso: es "
             "exactamente el salto pragmatico que separa B1 de B2. B1.5."),
    dict(id="lis_qst_15", difficulty=29.0,
         speak="You haven't finished the report yet, have you?",
         correct="No, not yet.",
         distractors=["Yes, I haven't.", "No, I have finished it.", "Yes, I didn't."],
         why="Question tag sobre una negativa: en ingles el yes/no sigue al hecho, "
             "no a la expectativa del que pregunta, al reves que en espanol. Los "
             "tres distractores son las tres combinaciones incoherentes. B2.0."),
    dict(id="lis_qst_16", difficulty=31.0,
         speak="What would you do if you won the lottery?",
         correct="I would travel around the world.",
         distractors=["I will travel around the world.",
                      "I traveled around the world.", "I won it last year."],
         why="Segundo condicional oido: la respuesta tiene que mantener el "
             "condicional. WILL es el error de quien oye 'if' y responde en primer "
             "condicional. B2.0."),
    dict(id="lis_qst_17", difficulty=33.0, speak="Do you mind if I open the window?",
         correct="No, go ahead.",
         distractors=["Yes, of course, open it.", "Yes, I opened it.",
                      "No, I don't want you to."],
         why="Convencion de 'Do you mind': conceder es responder NO. El primer "
             "distractor se contradice (Yes rechaza, 'open it' concede) y el cuarto "
             "usa el NO correcto con contenido opuesto: el item separa la forma del "
             "contenido. B2.0."),
    dict(id="lis_qst_18", difficulty=35.0,
         speak="How would you feel about moving abroad?",
         correct="I'd be excited about it.",
         distractors=["I moved abroad last year.", "I will move abroad.",
                      "Yes, I would."],
         why="'How would you feel about' pide una valoracion hipotetica, no un dato "
             "ni un si/no. 'Yes, I would' responde a una pregunta cerrada que no se "
             "hizo. B2.5."),
    dict(id="lis_qst_19", difficulty=37.0,
         speak="By the time you get there, will the shops have closed?",
         correct="Yes, probably.",
         distractors=["Yes, they closed.", "No, they are closing now.",
                      "Yes, I will close them."],
         why="Futuro perfecto dentro de una subordinada temporal: la pregunta "
             "encadena dos tiempos y hay que sostener los dos hasta el final. El "
             "tercer distractor cambia el sujeto de la accion. B2.5."),
    dict(id="lis_qst_20", difficulty=39.0,
         speak="I don't suppose you could lend me a hand, could you?",
         correct="Sure, what do you need?",
         distractors=["No, I couldn't lend it.", "Yes, I don't suppose so.",
                      "I lent it yesterday."],
         why="Peticion en forma negativa con tag: la estructura sugiere que se "
             "espera un no, pero es una peticion normal. 'Lend me a hand' es ademas "
             "idiomatico, asi que el segundo distractor responde a 'lend' literal. "
             "C1.0."),
    dict(id="lis_qst_21", difficulty=41.0,
         speak="Had you known about the changes, would you have accepted the offer?",
         correct="No, I would have declined it.",
         distractors=["No, I didn't know about them.", "Yes, I have accepted it.",
                      "Yes, I knew about them."],
         why="Tercer condicional con inversion, oido. El primer distractor responde "
             "al hecho real en vez de a la hipotesis, que es el error natural de "
             "quien no reconoce 'Had you known' como condicional. C1.0."),
    dict(id="lis_qst_22", difficulty=43.0,
         speak="What do you make of the committee's decision?",
         correct="I think it was a mistake.",
         distractors=["I made it yesterday.", "They made a decision.",
                      "I will make one."],
         why="'make of' = opinar, modismo totalmente opaco. Los tres distractores "
             "responden a MAKE en su sentido literal, que es lo que hace un C1 que "
             "no conoce la expresion. C1.5."),
    dict(id="lis_qst_03", difficulty=45.0,
         speak="Would you mind if I brought the deadline forward by a week?",
         correct="Not at all, that works for me.",
         distractors=["Yes, I brought it forward.",
                      "Yes, that would be perfect for me.",
                      "Of course, I'll bring it back."],
         why="Convencion pragmatica de 'Would you mind': la respuesta que CONCEDE "
             "es negativa en la forma. Los tres distractores son confusiones "
             "distintas: leer el condicional como pasado real, contradecirse, y "
             "confundir forward con back."),
    dict(id="lis_qst_23", difficulty=47.0,
         speak="You wouldn't happen to know when the results are due, would you?",
         correct="I'm afraid I don't.",
         distractors=["Yes, I wouldn't happen.", "No, they happened yesterday.",
                      "Yes, it happens often."],
         why="'wouldn't happen to know' es una formula de cortesia fosilizada donde "
             "HAPPEN pierde su significado. Los tres distractores lo interpretan "
             "literalmente, cada uno en un tiempo distinto. C1.5."),
    dict(id="lis_qst_24", difficulty=49.0,
         speak="Far be it from me to criticise, but shouldn't we reconsider the timeline?",
         correct="You may have a point.",
         distractors=["Yes, it is far from me.", "No, it isn't from you.",
                      "Yes, I criticised it."],
         why="'Far be it from me' es subjuntivo fosilizado y ademas un atenuador: "
             "la pregunta real es la de despues de la coma. Hay que descartar la "
             "primera mitad entera como formula y responder a la segunda. Techo del "
             "formato."),
]

LISTENING_ITEMS = (
    [dict(skill="listening", fmt="listen_word", prompt="", **d) for d in LISTEN_WORD]
    + [dict(skill="listening", fmt="listen_sentence", prompt="", source="authored", **d)
       for d in LISTEN_SENTENCE]
    + [dict(skill="listening", fmt="listen_question", prompt="", source="authored", **d)
       for d in LISTEN_QUESTION]
)

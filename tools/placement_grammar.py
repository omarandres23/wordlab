# -*- coding: utf-8 -*-
"""
TEST DE NIVEL — TANDA 2: los 72 items de GRAMATICA.

24 por formato. Misma escalera deliberada que la tanda de vocabulario: se elige
la banda y se escribe el item para ella.

  grammar_gap    2, 4, 6 ... 48, 50    (media 25.7)
  grammar_error  1, 3, 5 ... 46, 49    (media 24.6)
  grammar_best   2, 4, 6 ... 49, 50    (media 26.8)

Spread entre formatos: 2.2 puntos.

EL EJE DE DIFICULTAD ES LA INTERFERENCIA DEL ESPANOL, NO LA RAREZA
Un punto gramatical no es dificil porque sea raro, sino porque el espanol
empuja al alumno hacia la respuesta equivocada. Por eso casi todos los
distractores son errores ATESTIGUADOS, no inventados: 40 de ellos salen del
banco de Spot the Error (spot_data.js, niveles basico e intermedio), que el
proyecto ya valido como errores reales de hispanohablantes.

>>> DONDE NO HAY PRECEDENTE <<<
spot_data.js/avanzado son 15 items de ORTOGRAFIA y solo 5 de gramatica, asi
que por encima de ~35 no hay precedente en el proyecto para NINGUN formato.
Todo ese tramo esta autorado de cero y es el que mas conviene revisar:
subjuntivo mandativo, inversion, cleft, correlativas y estructuras fronteadas.

Ningun item reutiliza una frase literal de spot_data.js: se comparte el punto
gramatical, no el enunciado, para que jugar a Spot the Error no entrene el test.
"""

# ======================================================================
# GRAMMAR_GAP — 24. Hueco gramatical, 4 formas del mismo paradigma.
# ======================================================================
GRAMMAR_GAP = [
    dict(id="gra_gap_01", difficulty=2.0, correct="is",
         prompt="My sister ___ a teacher.",
         distractors=["are", "am", "be"],
         why="Copula en presente, tercera persona singular: el primer punto "
             "gramatical de A1.0. Los cuatro distractores son formas del MISMO "
             "verbo, asi que mide conjugacion sin contaminarse de vocabulario."),
    dict(id="gra_gap_04", difficulty=4.0, correct="Do",
         prompt="___ you like coffee?",
         distractors=["Are", "Is", "Does"],
         why="Auxiliar de interrogativa en presente simple. El espanol no usa "
             "auxiliar ('¿te gusta el cafe?'), asi que la eleccion es puramente "
             "estructural. ARE es el error de quien memorizo 'Are you...?'. A1.5."),
    dict(id="gra_gap_05", difficulty=6.0, correct="are",
         prompt="There ___ two books on the table.",
         distractors=["is", "be", "have"],
         why="there is/are con sujeto plural. HAVE es el calco de 'hay' via "
             "'haber'. spot_data.js/basico registra las dos direcciones del error "
             "('There is many people', 'There are a book'). A1.5."),
    dict(id="gra_gap_06", difficulty=8.0, correct="goes",
         prompt="She ___ to school every day.",
         distractors=["go", "going", "gone"],
         why="-s de tercera persona. Aparece cuatro veces en spot_data.js/basico, "
             "que es la medida de lo persistente que es. A2.0 en formato de hueco: "
             "mas facil que cazarlo dentro de cuatro frases."),
    dict(id="gra_gap_07", difficulty=10.0, correct="speak",
         prompt="He can ___ three languages.",
         distractors=["speaks", "speaking", "to speak"],
         why="Modal + infinitivo sin 'to'. El error 'can speaks' es la "
             "sobregeneralizacion de la -s recien aprendida, y esta en "
             "spot_data.js/basico. A2.0: exige saber que el modal ya marca la "
             "persona."),
    dict(id="gra_gap_08", difficulty=12.0, correct="any",
         prompt="There isn't ___ milk in the fridge.",
         distractors=["some", "no", "none"],
         why="any en negativa. NO produce la doble negacion ('I don't have no "
             "money', spot_data.js/basico), que en espanol es obligatoria y en "
             "ingles agramatical. A2.0."),
    dict(id="gra_gap_09", difficulty=14.0, correct="better",
         prompt="This book is much ___ than the other one.",
         distractors=["more better", "gooder", "more good"],
         why="Comparativo irregular. 'more better' esta en spot_data.js en basico "
             "Y en avanzado: es un error que sobrevive al nivel alto, por eso el "
             "item vale mas de lo que parece. A2.5."),
    dict(id="gra_gap_10", difficulty=16.0, correct="have worked",
         prompt="I ___ in this company since 2019.",
         distractors=["work", "worked", "am working"],
         why="Present perfect con 'since'. El espanol usa presente ('trabajo desde "
             "2019'), asi que WORK y AM WORKING son el calco directo; spot_data.js "
             "/intermedio lo registra como 'I'm working here for three years'. A2.5."),
    dict(id="gra_gap_11", difficulty=18.0, correct="much",
         prompt="How ___ money do you need for the trip?",
         distractors=["many", "lot", "plenty"],
         why="Incontables. 'Dinero' no da ninguna pista de contabilidad en espanol, "
             "asi que MANY es el error por defecto. Emparenta con el 'less/fewer' "
             "de spot_data.js/intermedio. B1.0."),
    dict(id="gra_gap_02", difficulty=21.0, correct="had",
         prompt="If I ___ more time, I would travel more.",
         distractors=["would have", "have", "will have"],
         why="Segundo condicional. WOULD HAVE es el calco literal del espanol ('si "
             "yo tendria') y es el primer item del nivel intermedio de "
             "spot_data.js. El CEFR situa el segundo condicional en el paso A2-B1."),
    dict(id="gra_gap_12", difficulty=23.0, correct="was written",
         prompt="The report ___ by the whole team last week.",
         distractors=["was wrote", "is written", "wrote"],
         why="Pasiva en pasado con participio irregular. Dos errores en uno: la "
             "estructura pasiva y la forma del participio. WAS WROTE es el mismo "
             "fallo que 'was made by our team' de spot_data.js/intermedio. B1.5."),
    dict(id="gra_gap_13", difficulty=25.0, correct="lived",
         prompt="She asked me where I ___ before moving to Madrid.",
         distractors=["live", "do live", "am living"],
         why="Backshift del estilo indirecto. El espanol tambien retrocede el "
             "tiempo, asi que el error no es de interferencia sino de no aplicar la "
             "regla bajo carga: hay una subordinada interrogativa de por medio. B1.5."),
    dict(id="gra_gap_14", difficulty=27.0, correct="getting",
         prompt="I'm not used to ___ up so early.",
         distractors=["get", "got", "gets"],
         why="'be used to' + gerundio, donde 'to' es preposicion y no marca de "
             "infinitivo. Es la misma trampa que 'look forward to' pero menos "
             "conocida, y el espanol ('estar acostumbrado a levantarme') empuja al "
             "infinitivo. B1.5."),
    dict(id="gra_gap_15", difficulty=29.0, correct="had already started",
         prompt="By the time we arrived, the meeting ___.",
         distractors=["already started", "has already started", "was already start"],
         why="Pasado perfecto para anterioridad. 'By the time' obliga; el espanol "
             "admite el indefinido y por eso ALREADY STARTED suena bien. "
             "spot_data.js/intermedio tiene la version con el participio roto. B2.0."),
    dict(id="gra_gap_16", difficulty=31.0, correct="see",
         prompt="He suggested that she ___ a doctor as soon as possible.",
         distractors=["sees", "to see", "seeing"],
         why="Subjuntivo mandativo tras 'suggest': forma base sin -s. TO SEE es el "
             "calco de 'sugirio que fuera / le sugirio ver', y spot_data.js "
             "/intermedio registra 'She suggested me to see a doctor'. B2.0."),
    dict(id="gra_gap_17", difficulty=33.0, correct="will be",
         prompt="The whole house ___ painted next month.",
         distractors=["will", "will paint", "is painting"],
         why="Pasiva en futuro. Exige combinar dos estructuras que por separado ya "
             "se dominan en B1, y la ausencia de agente hace que la voz activa "
             "parezca aceptable. B2.0."),
    dict(id="gra_gap_18", difficulty=35.0, correct="had studied",
         prompt="I wish I ___ harder before the exam.",
         distractors=["would have studied", "studied", "have studied"],
         why="'wish' + pasado perfecto para lamentar el pasado. WOULD HAVE STUDIED "
             "es el calco de 'ojala hubiera estudiado' y esta literalmente en "
             "spot_data.js/intermedio ('I wish I would have studied harder'). B2.5."),
    dict(id="gra_gap_19", difficulty=37.0, correct="repaired",
         prompt="She had her car ___ while she was on holiday.",
         distractors=["repair", "to repair", "repairing"],
         why="Causativa 'have something done'. No existe en espanol, que usa una "
             "activa ('lo hizo reparar'), asi que no hay estructura de la que "
             "transferir: se sabe o se adivina. B2.5."),
    dict(id="gra_gap_20", difficulty=39.0, correct="Being",
         prompt="___ in a hurry, he forgot his keys on the kitchen table.",
         distractors=["Been", "He being", "To be"],
         why="Clausula de participio con sujeto implicito. Registro escrito formal; "
             "el espanol usa gerundio ('estando con prisa') y por eso la forma "
             "parece familiar, pero BEEN es la confusion sistematica de "
             "participio y gerundio. C1.0."),
    dict(id="gra_gap_21", difficulty=41.0, correct="did we learn",
         prompt="Not until the meeting had ended ___ the truth about the merger.",
         distractors=["we learned", "we did learn", "learned we"],
         why="Inversion obligatoria tras adverbial negativo inicial. WE LEARNED es "
             "el orden natural y el que produce todo el mundo; LEARNED WE es la "
             "sobrecorreccion de quien sabe que 'algo hay que invertir'. C1.0."),
    dict(id="gra_gap_22", difficulty=43.0, correct="who",
         prompt="It was John ___ told me about the change of plans.",
         distractors=["which", "whom", "that he"],
         why="Oracion escindida (cleft) con sujeto. WHOM es la sobrecorreccion "
             "culta — el mismo error que 'Whom shall I say is calling?' de "
             "spot_data.js/avanzado — y THAT HE duplica el sujeto, que es el calco "
             "de 'que el me dijo'. C1.5."),
    dict(id="gra_gap_23", difficulty=45.0, correct="being",
         prompt="She strongly objected to ___ treated like a beginner.",
         distractors=["be", "been", "was"],
         why="Preposicion + gerundio en voz pasiva. Acumula dos cosas que ya son "
             "dificiles por separado, y las cuatro opciones son formas del mismo "
             "verbo, asi que no hay pista lexica. C1.5."),
    dict(id="gra_gap_03", difficulty=48.0, correct="Only when",
         prompt="___ he realised the full extent of the damage did he call for help.",
         distractors=["Only then", "When only", "Then only"],
         why="No pregunta si conoce la inversion (ya esta dada en 'did he call'), "
             "sino cual de los cuatro ordenes la licencia. Sintaxis marcada, "
             "ausente del ingles de uso diario: C2."),
    dict(id="gra_gap_24", difficulty=50.0, correct="for",
         prompt="Were it not ___ her timely intervention, the deal would have collapsed.",
         distractors=["of", "to", "with"],
         why="Formula fija subjuntiva 'were it not for'. La preposicion es "
             "arbitraria y no se deduce de nada; el espanol usa 'de no ser POR', lo "
             "que hace de FOR la unica opcion transferible y aun asi la mayoria "
             "duda. Techo de la escala de gramatica."),
]

# ======================================================================
# GRAMMAR_ERROR — 24. Cuatro frases SIN relacion, una tiene error.
# Formato calcado de spot_data.js. Los distractores son frases CORRECTAS.
# ======================================================================
_ERR_PROMPT = "One of these sentences has a mistake. Which one?"

GRAMMAR_ERROR = [
    dict(id="gra_err_04", difficulty=1.0, correct="I has a dog.",
         distractors=["She is happy.", "We are friends.", "They have a car."],
         why="have/has en primera persona. Piso absoluto: las tres correctas son "
             "frases de tres palabras. Lo unico que se mide es si reconoce la "
             "concordancia mas basica del ingles."),
    dict(id="gra_err_05", difficulty=3.0, correct="My brother don't like fish.",
         distractors=["I don't like fish.", "She likes vegetables.",
                      "We don't eat meat."],
         why="doesn't con tercera persona. Aparece dos veces en spot_data.js "
             "/basico. La primera correcta usa 'don't' bien, asi que hay que "
             "atender al sujeto y no al auxiliar. A1.5."),
    dict(id="gra_err_01", difficulty=5.0, correct="He live in Madrid.",
         distractors=["They are happy.", "I have a car.", "We eat at eight."],
         why="-s de tercera persona: el error mas frecuente del principiante "
             "hispanohablante, porque el espanol ya marca persona en la "
             "terminacion. Mismo error que abre spot_data.js/basico."),
    dict(id="gra_err_06", difficulty=7.0, correct="The childs are playing outside.",
         distractors=["The children are happy.", "Two men arrived late.",
                      "Those women are teachers."],
         why="Plural irregular. Esta en spot_data.js/basico. Las tres correctas "
             "traen los otros dos plurales irregulares frecuentes (men, women), "
             "asi que el item mide el paradigma entero, no una palabra. A1.5."),
    dict(id="gra_err_07", difficulty=9.0, correct="I am go to the store now.",
         distractors=["I am going home.", "She is reading a book.",
                      "They are working today."],
         why="Presente continuo sin -ing. Esta en spot_data.js/basico. Las tres "
             "correctas son continuos bien formados, asi que no se acierta por "
             "'el que suena raro' sino por la forma. A2.0."),
    dict(id="gra_err_08", difficulty=11.0, correct="He didn't went to work yesterday.",
         distractors=["She didn't call me back.", "We went to the beach.",
                      "They didn't finish the report."],
         why="did + infinitivo sin flexionar. Esta en spot_data.js/basico. La "
             "tercera correcta usa 'went' bien en afirmativa, asi que el item exige "
             "ver que el auxiliar ya marca el pasado. A2.0."),
    dict(id="gra_err_09", difficulty=13.0, correct="My sister and me went shopping.",
         distractors=["She and I are old friends.", "He gave the keys to me.",
                      "They invited us to dinner."],
         why="Pronombre sujeto en coordinacion. Esta en spot_data.js/basico. La "
             "segunda correcta usa 'me' bien como objeto, asi que castiga la "
             "sobrecorreccion tanto como el error. A2.5."),
    dict(id="gra_err_10", difficulty=15.0, correct="There is many people at the party.",
         distractors=["There are many cars outside.", "There is a problem.",
                      "There were three options."],
         why="Concordancia de there is/are con 'people', que en espanol es singular "
             "('la gente'). Esta en spot_data.js/basico. Las tres correctas cubren "
             "singular, plural y pasado. A2.5."),
    dict(id="gra_err_11", difficulty=17.0, correct="I have 25 years old.",
         distractors=["I am 25 years old.", "She is thirty.",
                      "He turned forty last week."],
         why="'Tener anos' -> 'have years'. NO esta en spot_data.js y es una de las "
             "interferencias mas universales del hispanohablante. La primera "
             "correcta es la version buena de la misma frase, asi que el contraste "
             "es directo. A2.5."),
    dict(id="gra_err_12", difficulty=19.0, correct="I am boring when I have nothing to do.",
         distractors=["The lecture was boring.", "I get bored very easily.",
                      "He seemed bored this morning."],
         why="-ing / -ed en adjetivos participiales. El espanol usa el mismo "
             "adjetivo para las dos direcciones ('aburrido'), asi que la confusion "
             "es estructural. Las correctas incluyen un -ing bien usado, para que "
             "no se resuelva descartando la forma. B1.0."),
    dict(id="gra_err_02", difficulty=22.0,
         correct="I have lived here since three years.",
         distractors=["She has been working here since 2019.",
                      "They finished the report yesterday.",
                      "We are planning a trip for the summer."],
         why="since/for con duracion: calco de 'desde hace tres anos'. B1.0 y no "
             "menos porque las tres correctas traen present perfect continuo, "
             "pasado simple y presente continuo: hay que validar cuatro "
             "estructuras distintas."),
    dict(id="gra_err_13", difficulty=24.0,
         correct="He gave me some advices about the job.",
         distractors=["He gave me some useful advice.",
                      "The information was very helpful.",
                      "She has a lot of knowledge about it."],
         why="Incontables pluralizados. En espanol 'consejos' e 'informaciones' son "
             "contables. Las tres correctas usan los tres incontables tipicos bien, "
             "asi que el item mide la clase de sustantivo, no una palabra. B1.5."),
    dict(id="gra_err_14", difficulty=26.0,
         correct="We discussed about the budget yesterday.",
         distractors=["We talked about the budget.", "They discussed the proposal.",
                      "She complained about the price."],
         why="'discuss' es transitivo directo. El calco viene de 'discutir SOBRE'. "
             "Esta en spot_data.js/intermedio. Las correctas incluyen dos verbos "
             "que SI rigen 'about', asi que no vale la regla 'about siempre "
             "sobra'. B1.5."),
    dict(id="gra_err_15", difficulty=28.0, correct="Despite of the rain, we went out.",
         distractors=["In spite of the rain, we went out.",
                      "Despite the cold, they kept playing.",
                      "Although it rained, we went out."],
         why="'despite' sin 'of'. El error nace de cruzarlo con 'in spite of', y la "
             "primera correcta es justamente esa forma: el item obliga a "
             "distinguirlas en vez de elegir la que suene. Esta en spot_data.js "
             "/intermedio. B2.0."),
    dict(id="gra_err_16", difficulty=30.0, correct="My parents made me to apologise.",
         distractors=["They let me stay out late.", "She had me wait outside.",
                      "He helped me finish the report."],
         why="make + infinitivo sin 'to'. Esta en spot_data.js/intermedio. Las tres "
             "correctas son los otros verbos causativos (let, have, help), asi que "
             "el item mide el paradigma completo y castiga aplicar la regla al "
             "verbo equivocado. B2.0."),
    dict(id="gra_err_17", difficulty=32.0,
         correct="Every one of the employees have received the memo.",
         distractors=["Each department has its own budget.",
                      "None of the equipment was damaged.",
                      "All of the reports have been filed."],
         why="Concordancia con cuantificador singular + sintagma plural. El verbo "
             "se atrae al plural mas cercano. Emparenta con 'Each of the students "
             "have' de spot_data.js/intermedio. La cuarta correcta SI lleva plural, "
             "asi que hay que razonar el cuantificador, no el sustantivo. B2.0."),
    dict(id="gra_err_18", difficulty=34.0,
         correct="I'm interested in to learn more about the role.",
         distractors=["She succeeded in finishing the report on time.",
                      "They objected to being filmed.",
                      "He apologised for arriving late."],
         why="Preposicion + gerundio. Las tres correctas usan tres preposiciones "
             "distintas con gerundio, una de ellas en pasiva, asi que el item mide "
             "la regla y no un verbo memorizado. B2.5. (La distractora original "
             "era 'She insisted on paying for dinner', que es la RESPUESTA de "
             "gra_bst_18: ver un item habria regalado el otro. Lo aviso el "
             "validador.)"),
    dict(id="gra_err_19", difficulty=36.0,
         correct="When I will get home, I will call you.",
         distractors=["As soon as she arrives, we will begin.",
                      "If it rains, we will stay inside.",
                      "Once the report is ready, send it to me."],
         why="Sin futuro en la subordinada temporal. El espanol si lo admite "
             "('cuando llegare' es raro, pero 'si vendra' aparece), y spot_data.js "
             "/intermedio registra la version con 'if'. Aqui son tres conectores "
             "distintos: mide la regla, no el conector. B2.5."),
    dict(id="gra_err_20", difficulty=38.0,
         correct="The evidence were compelling and thorough.",
         distractors=["The data were inconclusive.", "The news was worse than expected.",
                      "The staff have been informed."],
         why="'evidence' es incontable. Lo dificil son las correctas: 'data' en "
             "plural, 'news' en singular pese a la -s y 'staff' como colectivo "
             "plural. Un B2 corrige dos de las tres por error. Esta el mismo caso "
             "en spot_data.js/avanzado. C1.0."),
    dict(id="gra_err_21", difficulty=40.0,
         correct="Had the terms been clearer, the dispute could of been avoided.",
         distractors=["Had we known earlier, we would have acted differently.",
                      "Should you need any help, please call me.",
                      "Were it not for her, the project would have failed."],
         why="'could of' por 'could have': error de transcripcion fonetica de "
             "nativos, no de hispanohablantes, y por eso cuesta verlo. Esta en "
             "spot_data.js/avanzado. Las tres correctas son inversiones "
             "condicionales, que distraen la atencion hacia la estructura. C1.0."),
    dict(id="gra_err_22", difficulty=42.0, correct="Never I have seen such a mess.",
         distractors=["Rarely does he complain about anything.",
                      "Little did they know what awaited them.",
                      "Seldom have we faced such a challenge."],
         why="Falta la inversion tras adverbial negativo. Las tres correctas SI "
             "invierten, con tres auxiliares distintos, asi que el item se resuelve "
             "por patron sintactico. La frase erronea es la que suena natural, que "
             "es lo que lo hace C1.5."),
    dict(id="gra_err_03", difficulty=44.0, correct="He denied to have taken the money.",
         distractors=["The data suggest that the hypothesis is incorrect.",
                      "Scarcely had we arrived when the storm broke.",
                      "Not only did she apologise, but she also offered to pay."],
         why="deny rige gerundio; calco de 'nego haber tomado'. Lo que lo lleva a "
             "C1.5 son las CORRECTAS: 'data' plural, inversion con scarcely e "
             "inversion con not only. A un B2 le suenan sospechosas, asi que el "
             "item castiga corregir de mas."),
    dict(id="gra_err_23", difficulty=46.0, correct="Whom shall I say is calling?",
         distractors=["Whom did you invite to the ceremony?",
                      "The candidate whom we interviewed was excellent.",
                      "To whom should I address the letter?"],
         why="'whom' hipercorrecto en funcion de SUJETO de la subordinada. Esta en "
             "spot_data.js/avanzado. Las tres correctas son 'whom' bien usado como "
             "objeto directo, de relativo y tras preposicion: el item exige "
             "analizar la funcion, no reconocer la palabra. C1.5."),
    dict(id="gra_err_24", difficulty=49.0,
         correct="The committee recommended that the policy is reviewed annually.",
         distractors=["The board insisted that he resign immediately.",
                      "It is essential that every member be present.",
                      "They demanded that the meeting be postponed."],
         why="Subjuntivo mandativo: tras 'recommend that' va la forma base "
             "('be reviewed'), no el indicativo. Las tres correctas son subjuntivos "
             "que a casi todo el mundo le parecen erratas de concordancia, asi que "
             "el item castiga corregir de mas en su forma mas pura. C2."),
]

# ======================================================================
# GRAMMAR_BEST — 24. La MISMA frase en cuatro versiones, una correcta.
# Discrimina mejor que grammar_error de B2 para arriba porque los
# distractores son variantes minimas, no frases sin relacion.
# ======================================================================
_BST_PROMPT = "Which version is correct?"

GRAMMAR_BEST = [
    dict(id="gra_bst_04", difficulty=2.0, correct="She is my sister.",
         distractors=["She my sister.", "She are my sister.", "Her is my sister."],
         why="Copula obligatoria y pronombre sujeto. El espanol permite omitir el "
             "sujeto y aqui hay una variante sin verbo: dos rasgos A1.0 en una "
             "frase de cuatro palabras. Piso del formato."),
    dict(id="gra_bst_05", difficulty=4.0, correct="I don't have any money.",
         distractors=["I don't have no money.", "I no have money.",
                      "I haven't no money."],
         why="Doble negacion. En espanol es obligatoria ('no tengo ningun dinero'), "
             "asi que la version incorrecta es la traduccion literal. Esta en "
             "spot_data.js/basico. A1.5."),
    dict(id="gra_bst_01", difficulty=6.0, correct="I agree with you.",
         distractors=["I am agree with you.", "I am agreed with you.",
                      "I have agree with you."],
         why="'Estoy de acuerdo' -> 'I am agree'. El calco mas extendido del "
             "hispanohablante, y sobrevive hasta niveles altos. Piso fiable: quien "
             "lo falla esta claramente por debajo de A2."),
    dict(id="gra_bst_06", difficulty=9.0, correct="He is taller than his brother.",
         distractors=["He is more taller than his brother.",
                      "He is more tall than his brother.",
                      "He is the taller than his brother."],
         why="Comparativo de adjetivo corto. Los tres distractores son las tres "
             "formas de equivocarse (doble marca, marca analitica, articulo "
             "sobrante) y las tres se documentan en spot_data.js. A2.0."),
    dict(id="gra_bst_07", difficulty=11.0,
         correct="There were a lot of people at the concert.",
         distractors=["There was a lot of people at the concert.",
                      "It had a lot of people at the concert.",
                      "There had a lot of people at the concert."],
         why="'Habia' -> 'it had' / 'there had'. Dos de los tres distractores son "
             "el calco de HABER como verbo pleno, que es un error muy resistente "
             "porque el alumno ya sabe que 'there is' existe y aun asi recae. A2.0."),
    dict(id="gra_bst_08", difficulty=13.0,
         correct="I have been living here for five years.",
         distractors=["I am living here since five years.",
                      "I live here since five years.",
                      "I have been living here since five years."],
         why="for/since + present perfect continuo. El tercer distractor solo falla "
             "en la preposicion, asi que no basta acertar el tiempo verbal. "
             "spot_data.js/intermedio tiene las dos mitades del error por separado. "
             "A2.5."),
    dict(id="gra_bst_09", difficulty=15.0, correct="What is this called in English?",
         distractors=["How is this called in English?",
                      "How this is called in English?",
                      "What this is called in English?"],
         why="'¿Como se llama?' -> 'How is it called?'. Dos ejes a la vez: el "
             "interrogativo correcto y la inversion en la interrogativa directa. "
             "Los cuatro combinan las dos variables. A2.5."),
    dict(id="gra_bst_10", difficulty=17.0, correct="It is raining heavily.",
         distractors=["Is raining heavily.", "It raining heavily.",
                      "There is raining heavily."],
         why="Sujeto expletivo obligatorio. El espanol no lo tiene ('llueve'), asi "
             "que omitirlo es el calco directo. Que el ingles exija un sujeto sin "
             "referente es exactamente lo que no se transfiere. A2.5."),
    dict(id="gra_bst_11", difficulty=19.0,
         correct="She explained the situation to me.",
         distractors=["She explained me the situation.",
                      "She explained me it.",
                      "She me explained the situation."],
         why="'explain' no admite objeto indirecto sin preposicion. El espanol si "
             "('me explico la situacion'), y ademas permite el cliticode antes del "
             "verbo, que es el tercer distractor. Esta en spot_data.js/intermedio. "
             "B1.0."),
    dict(id="gra_bst_12", difficulty=21.0,
         correct="I'm looking forward to the weekend.",
         distractors=["I'm looking forward the weekend.",
                      "I look forward the weekend.",
                      "I'm looking forward for the weekend."],
         why="'look forward TO'. Aqui el complemento es un sustantivo, no un "
             "gerundio: prepara el terreno para gra_bst_02 sin resolverlo, porque "
             "quien memorizo la formula entera de correo no sabe necesariamente "
             "que 'to' es preposicion. B1.0."),
    dict(id="gra_bst_13", difficulty=24.0,
         correct="He asked me if I wanted to come.",
         distractors=["He asked me if I want to come.",
                      "He asked me do I want to come.",
                      "He asked me that if I wanted to come."],
         why="Interrogativa indirecta: backshift, sin auxiliar y sin 'that'. Los "
             "tres distractores fallan cada uno en una de las tres cosas, asi que el "
             "item las mide por separado. B1.5."),
    dict(id="gra_bst_14", difficulty=26.0,
         correct="The book was written by a Spanish author.",
         distractors=["The book was wrote by a Spanish author.",
                      "The book was write by a Spanish author.",
                      "The book has wrote by a Spanish author."],
         why="Participio irregular en pasiva. Las cuatro versiones comparten la "
             "estructura pasiva, asi que lo unico que se mide es la forma del "
             "verbo: item deliberadamente estrecho para anclar ese punto. B1.5."),
    dict(id="gra_bst_15", difficulty=28.0,
         correct="I'd rather you didn't tell anyone about this.",
         distractors=["I'd rather you don't tell anyone about this.",
                      "I'd rather that you don't tell anyone about this.",
                      "I'd rather you not telling anyone about this."],
         why="'would rather' + sujeto distinto pide pasado con valor de presente. "
             "Es contraintuitivo en cualquier lengua materna y el espanol usa "
             "subjuntivo presente ('preferiria que no lo cuentes'). B2.0."),
    dict(id="gra_bst_02", difficulty=30.0,
         correct="I look forward to hearing from you.",
         distractors=["I look forward to hear from you.",
                      "I am looking forward to hear from you.",
                      "I look forward for hearing from you."],
         why="'to' como PREPOSICION seguida de gerundio. B2.0 porque 'look forward "
             "to hear' es una lectura razonable para quien no conoce la excepcion y "
             "sobrevive en gente que maneja bien el resto del idioma."),
    dict(id="gra_bst_16", difficulty=32.0,
         correct="By the time we got there, the film had already started.",
         distractors=["By the time we got there, the film has already started.",
                      "By the time we got there, the film already started.",
                      "By the time we got there, the film was already start."],
         why="Pasado perfecto obligatorio con 'by the time'. Contrasta a proposito "
             "con gra_gap_15, que mide el mismo punto en formato de hueco: aqui hay "
             "que rechazar tres alternativas completas, incluida una con present "
             "perfect que solo falla en el tiempo del auxiliar. B2.0."),
    dict(id="gra_bst_17", difficulty=35.0, correct="It's high time we left.",
         distractors=["It's high time we leave.", "It's high time to we leave.",
                      "It's high time we have left."],
         why="'It's high time' + pasado subjuntivo. Formula fija y opaca: el pasado "
             "no refiere al pasado. Sin equivalente estructural en espanol ('ya es "
             "hora de que nos vayamos', subjuntivo presente). B2.5."),
    dict(id="gra_bst_18", difficulty=37.0,
         correct="She insisted on paying for dinner.",
         distractors=["She insisted to pay for dinner.",
                      "She insisted in paying for dinner.",
                      "She insisted that pay for dinner."],
         why="'insist ON' + gerundio. IN es el calco de 'insistir EN', que es la "
             "preposicion espanola y por eso el distractor mas elegido; el item "
             "separa la eleccion de preposicion de la eleccion de forma verbal. "
             "B2.5."),
    dict(id="gra_bst_19", difficulty=39.0,
         correct="The report needs to be revised before it is submitted.",
         distractors=["The report needs revised before it is submitted.",
                      "The report needs to revise before it is submitted.",
                      "The report needs being revised before it is submitted."],
         why="'need' + infinitivo pasivo. El segundo distractor es el error real: "
             "activa con sentido pasivo, calco de 'necesita revisarse'. C1.0."),
    dict(id="gra_bst_20", difficulty=41.0,
         correct="The more you practise, the easier it becomes.",
         distractors=["The more you practise, the more easy it becomes.",
                      "More you practise, easier it becomes.",
                      "The more practise you, the easier becomes it."],
         why="Correlativa comparativa. Estructura sin paralelo en espanol ('cuanto "
             "mas... mas'), con articulo obligatorio en las dos mitades y orden "
             "fijo. El segundo distractor es exactamente el calco. C1.0."),
    dict(id="gra_bst_21", difficulty=43.0,
         correct="No sooner had he sat down than the phone rang.",
         distractors=["No sooner he had sat down than the phone rang.",
                      "No sooner had he sat down as the phone rang.",
                      "No sooner had he sat down when the phone rang."],
         why="'No sooner... THAN' con inversion. Dos variables independientes: la "
             "inversion y el conector correlativo. Los distractores fallan una sola "
             "cada uno, asi que acertar por la mitad no basta. C1.5."),
    dict(id="gra_bst_22", difficulty=45.0,
         correct="Much as I respect his judgement, I disagree on this point.",
         distractors=["As much I respect his judgement, I disagree on this point.",
                      "Much although I respect his judgement, I disagree on this point.",
                      "Much that I respect his judgement, I disagree on this point."],
         why="Concesiva con 'much as' fronteada. Registro escrito culto, sin "
             "equivalente en espanol salvo perifrasis ('por mucho que'). El primer "
             "distractor invierte las dos palabras, que es lo que produce quien "
             "reconoce la estructura de oido pero no su orden. C1.5."),
    dict(id="gra_bst_23", difficulty=47.0,
         correct="So absorbed was she in the book that she missed her stop.",
         distractors=["So absorbed she was in the book that she missed her stop.",
                      "So absorbed was her in the book that she missed her stop.",
                      "Such absorbed was she in the book that she missed her stop."],
         why="Fronteamiento de complemento con inversion, mas so/such con adjetivo. "
             "Tres variables: orden, caso del pronombre y eleccion de so/such. Es de "
             "las estructuras mas marcadas del ingles escrito. C1.5."),
    dict(id="gra_bst_03", difficulty=49.0,
         correct="Had I known the risks, I would never have agreed.",
         distractors=["If I would have known the risks, I would never have agreed.",
                      "Had I have known the risks, I would never have agreed.",
                      "If I had have known the risks, I would never have agreed."],
         why="Tercer condicional con inversion. Los tres distractores son errores "
             "reales de origen distinto: el calco espanol y dos sobregeneralizaciones "
             "del auxiliar que produce gente ya avanzada al intentar la inversion."),
    dict(id="gra_bst_24", difficulty=50.0,
         correct="Were the proposal to be rejected, we would need a new strategy.",
         distractors=["If the proposal would be rejected, we would need a new strategy.",
                      "Was the proposal to be rejected, we would need a new strategy.",
                      "Were the proposal rejected to be, we would need a new strategy."],
         why="Condicional subjuntivo 'were + to' invertido, la forma mas formal de "
             "la hipotesis en ingles. WAS en lugar de WERE es el error que comete "
             "incluso quien conoce la inversion, porque el subjuntivo ingles solo "
             "sobrevive aqui. Techo de la escala junto a gra_gap_24."),
]

GRAMMAR_ITEMS = (
    [dict(skill="grammar", fmt="grammar_gap", speak=None, source="authored", **d)
     for d in GRAMMAR_GAP]
    + [dict(skill="grammar", fmt="grammar_error", speak=None, prompt=_ERR_PROMPT,
            source="authored", **d) for d in GRAMMAR_ERROR]
    + [dict(skill="grammar", fmt="grammar_best", speak=None, prompt=_BST_PROMPT,
            source="authored", **d) for d in GRAMMAR_BEST]
)

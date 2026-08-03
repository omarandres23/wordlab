# -*- coding: utf-8 -*-
"""
HEAR IT — datos foneticos.

1) PARES MINIMOS: parejas de palabras reales que se diferencian por UN
   solo sonido que el espanol NO distingue. Son los distractores que
   convierten el juego en entrenamiento de oido y no en trivia de
   vocabulario.

2) HOMOFONOS: palabras que suenan IGUAL que otra. Prohibidas en los
   niveles donde el jugador escribe: si el audio dice /siː/ no hay forma
   justa de saber si es SEE o SEA.
"""

# ------------------------------------------------------------------
# 1. PARES MINIMOS por contraste fonetico
# ------------------------------------------------------------------
MINIMAL_PAIRS = {

# El espanol tiene un solo sonido para B y V. Este es EL contraste.
"b_v": [
    ("BERRY", "VERY"), ("BOAT", "VOTE"), ("BEST", "VEST"),
    ("BAN", "VAN"), ("BASE", "VASE"), ("BAT", "VAT"),
    ("CURB", "CURVE"), ("MARBLE", "MARVEL"), ("BOWL", "VOLE"),
    ("BERSE", "VERSE"), ("BAIL", "VEIL"), ("BOLT", "VOLT"),
],

# El espanol no tiene la I corta. ship/sheep es el error clasico.
"short_long_i": [
    ("SHIP", "SHEEP"), ("LIVE", "LEAVE"), ("BIT", "BEAT"),
    ("FIT", "FEET"), ("SIT", "SEAT"), ("HIT", "HEAT"),
    ("CHIP", "CHEAP"), ("SLIP", "SLEEP"), ("FILL", "FEEL"),
    ("STILL", "STEEL"), ("RICH", "REACH"), ("LIST", "LEAST"),
    ("PILL", "PEEL"), ("ITCH", "EACH"), ("MILL", "MEAL"),
    ("GRIN", "GREEN"), ("HILL", "HEEL"), ("TIN", "TEEN"),
    ("DIP", "DEEP"), ("BIN", "BEAN"), ("PICK", "PEAK"),
    ("WILL", "WHEEL"), ("MIT", "MEET"), ("SIN", "SCENE"),
],

# El espanol no tiene la vocal de "cat". Se confunde con la de "bed".
"ae_e": [
    ("BAD", "BED"), ("MAN", "MEN"), ("SAD", "SAID"),
    ("HAD", "HEAD"), ("BAND", "BEND"), ("LAND", "LEND"),
    ("SAT", "SET"), ("MAT", "MET"), ("PAN", "PEN"),
    ("BAG", "BEG"), ("DAD", "DEAD"), ("GAS", "GUESS"),
    ("TAN", "TEN"), ("MASS", "MESS"), ("SAND", "SEND"),
    ("AND", "END"), ("AXE", "EX"), ("FLASH", "FLESH"),
],

# SH y CH se mezclan constantemente.
"sh_ch": [
    ("SHEEP", "CHEAP"), ("SHARE", "CHAIR"), ("SHIP", "CHIP"),
    ("SHOES", "CHOOSE"), ("WASH", "WATCH"), ("CASH", "CATCH"),
    ("SHIN", "CHIN"), ("SHOP", "CHOP"), ("SHERRY", "CHERRY"),
    ("MUSH", "MUCH"), ("WISH", "WITCH"), ("SHEET", "CHEAT"),
],

# El espanol no tiene Z sonora al final.
"s_z": [
    ("RICE", "RISE"), ("PRICE", "PRIZE"), ("ICE", "EYES"),
    ("BUS", "BUZZ"), ("PEACE", "PEAS"), ("RACE", "RAISE"),
    ("LOOSE", "LOSE"), ("PLACE", "PLAYS"), ("ADVICE", "ADVISE"),
],

# La TH inglesa no existe en espanol: se sustituye por T, S o D.
"th": [
    ("THINK", "SINK"), ("THIN", "TIN"), ("THREE", "TREE"),
    ("PATH", "PASS"), ("MOUTH", "MOUSE"), ("THICK", "SICK"),
    ("THOUGHT", "TAUGHT"), ("MATH", "MASS"), ("THANK", "TANK"),
    ("DAY", "THEY"), ("DARE", "THERE"), ("DEN", "THEN"),
],

# La H inicial es muda en espanol: se pierde o se agrega de mas.
"silent_h": [
    ("EAT", "HEAT"), ("AIR", "HAIR"), ("AND", "HAND"),
    ("ART", "HEART"), ("OLD", "HOLD"), ("EAR", "HEAR"),
    ("ILL", "HILL"), ("ATE", "HATE"), ("EDGE", "HEDGE"),
    ("ARM", "HARM"), ("EYE", "HIGH"), ("OWN", "HONE"),
],

# La vocal de "cup" no existe en espanol y se vuelve una O.
"uh_ah": [
    ("CUP", "COP"), ("LUCK", "LOCK"), ("HUT", "HOT"),
    ("BUG", "BOG"), ("CUT", "COT"), ("NUT", "NOT"),
    ("DUCK", "DOCK"), ("SUNG", "SONG"), ("STUCK", "STOCK"),
    ("RUB", "ROB"), ("CLUB", "CLOB"), ("SHUT", "SHOT"),
],

# U corta vs U larga: full/fool.
"short_long_u": [
    ("FULL", "FOOL"), ("PULL", "POOL"), ("LOOK", "LUKE"),
    ("FOOT", "FOOD"), ("SHOULD", "SHOOED"), ("COOK", "KOOK"),
],

# Y vs J: yellow/jello, year/jeer.
"y_j": [
    ("YET", "JET"), ("YEAR", "JEER"), ("YAM", "JAM"),
    ("YOKE", "JOKE"), ("YELL", "JELL"),
],

# W vs V: el espanol no tiene W consonante.
"w_v": [
    ("WEST", "VEST"), ("WINE", "VINE"), ("WET", "VET"),
    ("WORSE", "VERSE"), ("WHILE", "VILE"), ("WAIL", "VEIL"),
],
}

# ------------------------------------------------------------------
# 2. HOMOFONOS — prohibidos donde se escribe la palabra
# ------------------------------------------------------------------
HOMOPHONES = [
    ("SEE", "SEA"), ("TO", "TOO", "TWO"), ("THEIR", "THERE", "THEY'RE"),
    ("RIGHT", "WRITE", "RITE"), ("KNOW", "NO"), ("HEAR", "HERE"),
    ("BUY", "BY", "BYE"), ("ONE", "WON"), ("SON", "SUN"),
    ("MEAT", "MEET"), ("WEEK", "WEAK"), ("ROAD", "RODE"),
    ("FLOUR", "FLOWER"), ("PEACE", "PIECE"), ("PLANE", "PLAIN"),
    ("WAIT", "WEIGHT"), ("HOLE", "WHOLE"), ("BREAK", "BRAKE"),
    ("MAIL", "MALE"), ("SAIL", "SALE"), ("TAIL", "TALE"),
    ("PAIR", "PEAR", "PARE"), ("BARE", "BEAR"), ("HAIR", "HARE"),
    ("BLUE", "BLEW"), ("NEW", "KNEW"), ("NIGHT", "KNIGHT"),
    ("OUR", "HOUR"), ("CELL", "SELL"), ("CENT", "SENT", "SCENT"),
    ("DEAR", "DEER"), ("DIE", "DYE"), ("FAIR", "FARE"),
    ("FIR", "FUR"), ("FLEE", "FLEA"), ("FOR", "FOUR", "FORE"),
    ("GREAT", "GRATE"), ("GROAN", "GROWN"), ("HEAL", "HEEL", "HE'LL"),
    ("HI", "HIGH"), ("LEAD", "LED"), ("MADE", "MAID"),
    ("MAIN", "MANE"), ("MISSED", "MIST"), ("NONE", "NUN"),
    ("OAR", "OR", "ORE"), ("PAIL", "PALE"), ("PAIN", "PANE"),
    ("PAST", "PASSED"), ("POOR", "POUR", "PORE"),
    ("PRINCIPAL", "PRINCIPLE"), ("RAIN", "REIGN", "REIN"),
    ("RAISE", "RAYS"), ("READ", "RED", "REED"), ("RING", "WRING"),
    ("ROLE", "ROLL"), ("SCENE", "SEEN"), ("SEAM", "SEEM"),
    ("SIGHT", "SITE", "CITE"), ("SOAR", "SORE"), ("SOME", "SUM"),
    ("STAIR", "STARE"), ("STEAL", "STEEL"), ("TIDE", "TIED"),
    ("TOE", "TOW"), ("WAIST", "WASTE"), ("WAY", "WEIGH"),
    ("WEATHER", "WHETHER"), ("WHICH", "WITCH"), ("WOOD", "WOULD"),
    ("ALLOWED", "ALOUD"), ("BOARD", "BORED"), ("CEREAL", "SERIAL"),
    ("COARSE", "COURSE"), ("DESERT", "DESSERT"), ("FLOUR", "FLOWER"),
    ("HEARD", "HERD"), ("KNIT", "NIT"), ("LESSEN", "LESSON"),
    ("MEDAL", "METAL", "MEDDLE"), ("MORNING", "MOURNING"),
    ("PEAK", "PEEK", "PIQUE"), ("PLUM", "PLUMB"), ("PRAY", "PREY"),
    ("PROFIT", "PROPHET"), ("SEW", "SO", "SOW"), ("SUITE", "SWEET"),
    ("THREW", "THROUGH"), ("VAIN", "VEIN"), ("WAR", "WORE"),
    ("WARE", "WEAR", "WHERE"), ("WHINE", "WINE"), ("WHOLLY", "HOLY"),
    ("BEEN", "BIN"), ("BERTH", "BIRTH"), ("BUTT", "BUT"),
    ("CHEAP", "CHEEP"), ("CHORD", "CORD"), ("CLOSE", "CLOTHES"),
    ("CREAK", "CREEK"), ("DEW", "DUE", "DO"), ("FAINT", "FEINT"),
    ("FLEW", "FLU", "FLUE"), ("GUESSED", "GUEST"), ("HANGAR", "HANGER"),
    ("HEROIN", "HEROINE"), ("IDLE", "IDOL"), ("LOAN", "LONE"),
    ("MEWS", "MUSE"), ("MINER", "MINOR"), ("MOOSE", "MOUSSE"),
    ("MUSSEL", "MUSCLE"), ("NAVAL", "NAVEL"), ("PATIENCE", "PATIENTS"),
    ("PEDAL", "PEDDLE"), ("RAP", "WRAP"), ("REAL", "REEL"),
    ("ROOT", "ROUTE"), ("ROSE", "ROWS"), ("SCULL", "SKULL"),
    ("STAKE", "STEAK"), ("STATIONARY", "STATIONERY"),
    ("TEAM", "TEEM"), ("THRONE", "THROWN"), ("TIRE", "TYRE"),
    ("TROOP", "TROUPE"), ("WEAVE", "WE'VE"), ("YOKE", "YOLK"),
    ("KNOT", "NOT"), ("KNEAD", "NEED"), ("KNOWS", "NOSE"),
    ("WHOSE", "WHO'S"), ("YOUR", "YOU'RE"), ("ITS", "IT'S"),
    ("AISLE", "ISLE", "I'LL"), ("ALTAR", "ALTER"), ("ASCENT", "ASSENT"),
    ("BAIL", "BALE"), ("BALL", "BAWL"), ("BASE", "BASS"),
    ("BEACH", "BEECH"), ("BOULDER", "BOLDER"), ("BREAD", "BRED"),
    ("CAPITAL", "CAPITOL"), ("CAUGHT", "COURT"), ("CELLAR", "SELLER"),
    ("CHEWS", "CHOOSE"), ("COMPLEMENT", "COMPLIMENT"),
    ("COUNCIL", "COUNSEL"), ("CURRANT", "CURRENT"), ("DAYS", "DAZE"),
    ("DIED", "DYED"), ("DOE", "DOUGH"), ("DUAL", "DUEL"),
    ("EARN", "URN"), ("EWE", "YOU"), ("FEAT", "FEET"),
    ("FIND", "FINED"), ("FLEX", "FLECKS"), ("FOUL", "FOWL"),
    ("GAIT", "GATE"), ("GENES", "JEANS"), ("GILT", "GUILT"),
    ("GORILLA", "GUERRILLA"), ("GRISLY", "GRIZZLY"), ("HAIL", "HALE"),
    ("HAY", "HEY"), ("HEEL", "HE'LL"), ("HIGHER", "HIRE"),
    ("HOARSE", "HORSE"), ("HOSE", "HOES"), ("IN", "INN"),
    ("KERNEL", "COLONEL"), ("LAPSE", "LAPS"), ("LIE", "LYE"),
    ("LOOT", "LUTE"), ("MALL", "MAUL"), ("MANNER", "MANOR"),
    ("MARSHAL", "MARTIAL"), ("MEAN", "MIEN"), ("MIGHT", "MITE"),
    ("MOAN", "MOWN"), ("MODE", "MOWED"), ("NAY", "NEIGH"),
    ("PACKED", "PACT"), ("PEDAL", "PETAL"), ("PIER", "PEER"),
    ("PLAIN", "PLANE"), ("POLE", "POLL"), ("PRINTS", "PRINCE"),
    ("RACK", "WRACK"), ("RAP", "WRAP"), ("REST", "WREST"),
    ("RETCH", "WRETCH"), ("RIGHTS", "WRITES"), ("RODE", "ROWED"),
    ("RUNG", "WRUNG"), ("SEAS", "SEIZE", "SEES"), ("SIGHS", "SIZE"),
    ("SLAY", "SLEIGH"), ("SOLE", "SOUL"), ("STEAL", "STEEL"),
    ("STRAIT", "STRAIGHT"), ("SUEDE", "SWAYED"), ("TACKS", "TAX"),
    ("TAUT", "TAUGHT"), ("TEA", "TEE"), ("THYME", "TIME"),
    ("TOLD", "TOLLED"), ("VALE", "VEIL"), ("VARY", "VERY"),
    ("WADE", "WEIGHED"), ("WAIVE", "WAVE"), ("WEAK", "WEEK"),
    ("WHIRL", "WHORL"), ("WHIT", "WIT"), ("WON", "ONE"),
    ("WRING", "RING"), ("WRITE", "RIGHT"), ("YOU'LL", "YULE"),
]

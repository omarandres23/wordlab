# -*- coding: utf-8 -*-
"""
Bancos de palabras FALSAS para IS IT A REAL WORD, por categoria.
Todas son CANDIDATAS: el script de build valida cada una contra un
diccionario real y descarta las que si existen en ingles.
"""

# ---------------------------------------------------------------
# A) PASADOS REGULARIZADOS  (el error #1 del hispanohablante)
#    Verbos irregulares a los que se les pega -ED.
# ---------------------------------------------------------------
PAST_REG = [
    "SLEEPED", "GOED", "TAKED", "BUYED", "THINKED", "CATCHED", "TEACHED",
    "BRINGED", "KNOWED", "WRITED", "DRINKED", "SPEAKED", "FEELED", "LEAVED",
    "MEETED", "FINDED", "SENDED", "BUILDED", "HOLDED", "SELLED", "TELLED",
    "WINNED", "LOSED", "CHOOSED", "BREAKED", "EATED", "SWIMMED", "DRIVED",
    "RIDED", "GROWED", "THROWED", "WEARED", "BEGINNED", "FORGETED",
    "UNDERSTANDED", "BECOMED", "GIVED", "MAKED", "COMED", "RUNNED",
    "SITTED", "STANDED", "SAYED", "HEARED", "KEEPED", "SPENDED", "LENDED",
    "FIGHTED", "SHOOTED", "HIDED", "BITED", "HITTED", "SHAKED", "STEALED",
    "SPREADED", "DEALED", "RISED", "FALLED", "BLOWED", "DRAWED",
    "FREEZED", "SINGED", "SWEARED", "TEARED", "WAKED", "WEEPED",
    "MISTAKED", "OVERCOMED", "REBUILDED", "WITHDRAWED", "FORBIDED",
    "ARISED", "BEARED", "BINDED", "BREEDED", "CLINGED", "CREEPED",
    "DIGGED", "FLEED", "GRINDED", "HANGED_", "LAYED", "LIGHTED_",
    "SEEKED", "SHRINKED", "SLIDED", "SPLITTED", "STICKED", "STINGED",
    "STRIKED", "STRIVED_", "SWEEPED", "SWINGED", "WINDED_",
]

# ---------------------------------------------------------------
# B) TRAMPAS DE HISPANOHABLANTE
#    B1: sufijo ingles mal aplicado a una raiz espanola
# ---------------------------------------------------------------
ES_SUFFIX = [
    "ENFERMITY", "PRESENTATE", "SOLICITATE", "APROBATION", "EXITOUS",
    "DOCUMENTATE", "COMPROMITION", "ASISTENCE", "ACTUALIZATE",
    "CONFIANCE", "ESPECIALIST", "APROVE", "REALIZATE",
    "COTIDIAN", "APORTATION", "CONCRETATE",
    "PRECISATE", "VALORATE_", "GESTIONATE", "INVERSION_",
    "PLANIFICATE", "CAPACITATION_", "FORMATION_", "TRAMITATE",
    "SUPERATION", "AMPLIATION", "CONCRETION_", "INSCRIPTION_",
    "EFICACITY", "FACILITY_", "COMODITY",
    "PROFESIONALISM", "SENSIBILIZATE", "CONSCIENTIZE",
    "DIVULGATE_", "EVIDENCIATE", "POTENCIATE", "PRIORIZATE",
    "RENTABILITY", "SOLICITUDE_", "SUBSANATE", "TRASLATE",
    "VINCULATE", "IMPLEMENTATE", "OPTIMIZATE",
]

# ---------------------------------------------------------------
#    B2: errores de consonante doble / simple tipicos del espanol
#        (necesidad -> necesity, oportunidad -> oportunity)
# ---------------------------------------------------------------
ES_SPELLING = [
    "NECESITY", "POSIBILITY", "RESPONSABILITY", "OPORTUNITY", "PROFESION",
    "COMUNICATION", "RECOMENDATION", "DIFICULTY", "INTELIGENCE",
    "EFICIENT", "ACOMPANY", "ADQUIRE", "INMIGRATION", "DESCRIPTION_",
    "OCUPATION", "COLABORATION", "ACOMODATION", "AGRESIVE",
    "APARENT", "ATENTION", "COMITTEE_", "CONECTION", "DIFERENT",
    "EFECTIVE", "INTERUPTION", "NECESARY", "OFICIAL", "PERSONALITY_",
    "POSESSION", "PROFESOR", "SUCESS", "SUPORT", "TERITORY",
    "INMEDIATE", "ESTABILITY", "ESPECIAL_", "ESTUDENT", "ESCHOOL",
    "ESPORT_", "ESTRESS", "ESTRUCTURE", "ESPECIFIC",
]

# ---------------------------------------------------------------
# C) TYPOS SUTILES  (errores reales de escritura, casi invisibles)
# ---------------------------------------------------------------
SUBTLE_TYPOS = [
    "ACOMMODATE", "DEFINATELY", "SEPERATE", "RECIEVE", "OCCURED",
    "EMBARASSED", "BEGINING", "ARGUEMENT", "ENVIROMENT", "GOVERMENT",
    "TOMMORROW", "UNTILL", "BUISNESS", "RESTURANT", "GRAMATICALLY",
    "INDEPENDANT", "EXISTANCE", "MAINTENENCE", "OCCASSION", "PRIVELEGE",
    "RECOMEND", "SUCCESFUL", "ADRESS", "ACHEIVE", "APOLOGISE_",
    "BELEIVE", "CALENDER_", "CEMETARY", "COMMITE", "CONCIOUS",
    "DECIEVE", "DISAPOINT", "EMBARASS", "EXCERSISE", "FEBUARY",
    "FOURTY", "GAURD", "HARRASS", "HIEGHT", "IMMEDIATLY",
    "JEWELLERY_", "JUDGEMENT_", "KNOWLEDGABLE", "LENGHT", "LIASON",
    "MISPELL", "NEICE", "NOTICABLE", "OCCURANCE", "PERSUE",
    "PHARAOH_", "POSESS", "PRONOUNCIATION", "QUESTIONAIRE",
    "REFERED", "RELEVENT", "RHYTHYM", "SCHEDULE_", "SEIGE",
    "SENTANCE", "SPEACH", "STRENGHT", "SUPRISE", "TENDANCY",
    "THRESHHOLD", "TWELTH", "VACUM", "WIERD", "WHETHAR",
    "ACCOMODATION", "ADDRES", "ALOT", "APPARANT", "ARTICAL",
    "BASICLY", "BUSSINESS", "COMPLETLY", "DIFFERANT", "EQUIPTMENT",
]

# ---------------------------------------------------------------
# D) PSEUDOPALABRAS PLAUSIBLES
#    Morfologia inglesa correcta, palabra inexistente.
#    (estilo pedido por Omar: CONVERTY, LOADLINE, FANARY)
# ---------------------------------------------------------------
PSEUDO = [
    "CONVERTY", "FANARY", "LOADLINE", "BRIGHTNER", "SPEAKAGE",
    "WALKMENT", "SLOWLINESS", "RAINFULL", "MOONLY", "STRONGTH",
    "WIDTHFUL", "TRUSTMENT", "HELPANCE", "MINDFULLY_", "QUICKNESS_",
    "PLANNAGE", "DRIVANCE", "THINKAGE", "BUILDMENT", "TEACHANCE",
    "CLOUDLY", "STORMFUL", "WINDLY", "SUNFULL", "SKYWARD_",
    "GLASSEN", "WOODEN_", "STONEFUL", "IRONISH", "METALLY",
    "CHAIRSET", "TABLEWARE_", "DOORWAY_", "ROOFLINE_", "WALLSIDE",
    "FLOORAGE_", "STAIRWAY_", "GATEHOUSE_", "YARDLINE_", "FENCEWORK",
    "TIMEFULL", "HOURLY_", "DAYWISE", "WEEKLING", "MONTHLING",
    "YEARWISE", "CLOCKFUL", "WATCHMENT", "DATELINE_", "SEASONLY",
    "MONEYFUL", "CASHMENT", "COINAGE_", "PRICEFUL", "COSTLING",
    "PAYMENTLY", "BANKAGE", "SAVEMENT", "SPENDAGE", "EARNFUL",
    "WORKAGE", "JOBMENT", "TASKFUL", "SKILLAGE", "TRAINMENT",
    "LEARNAGE", "STUDYMENT", "READAGE", "WRITEMENT", "SPELLAGE",
    "TALKMENT", "VOICEFUL", "SOUNDAGE", "HEARMENT", "LISTENAGE",
    "FRIENDAGE", "PEOPLEWISE", "FAMILYFUL", "CHILDMENT", "PARENTAGE_",
    "FOODAGE", "EATMENT", "DRINKAGE", "TASTEFUL_", "COOKMENT",
    "ROADAGE", "TRAVELMENT", "TRIPFUL", "JOURNEYAGE", "FLIGHTMENT",
    "CITYWISE", "TOWNAGE", "PLACEMENT_", "MAPFUL", "STREETAGE",
]

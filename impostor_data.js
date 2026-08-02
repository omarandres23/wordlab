const IMPOSTOR_DATA = {
  "game": "IMPOSTOR",
  "version": 2,
  "scoring": {
    "no_hint": 3,
    "with_hint": 2,
    "fail": 0,
    "max_per_game": 9
  },
  "rules": {
    "rounds_per_game": 3,
    "words_per_round": 5,
    "shared_words": 4,
    "impostor_words": 1,
    "fail_on_wrong_click": true,
    "auto_win_when_one_remains": true,
    "hints_per_round": 1,
    "hint_reveals": "criterion_text",
    "always_show_explanation": true
  },
  "criterion_types": {
    "semantic": "las palabras pertenecen al mismo campo o situacion",
    "synonym": "las palabras significan practicamente lo mismo"
  },
  "note": "Los sets de criterio gramatical (verbo vs sustantivo) fueron eliminados. La relacion entre palabras es siempre de SIGNIFICADO.",
  "sets": {
    "business": {
      "basic": [
        {
          "words": [
            "DESK",
            "CHAIR",
            "PRINTER",
            "STAPLER",
            "BEACH"
          ],
          "impostor": "BEACH",
          "criterion_type": "semantic",
          "explanation": "All are office items; BEACH has nothing to do with an office.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "CASH",
            "COIN",
            "BILL",
            "WALLET",
            "MEETING"
          ],
          "impostor": "MEETING",
          "criterion_type": "semantic",
          "explanation": "These relate to money; MEETING does not.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "JOB",
            "WORK",
            "POSITION",
            "ROLE",
            "HOLIDAY"
          ],
          "impostor": "HOLIDAY",
          "criterion_type": "synonym",
          "explanation": "JOB, WORK, POSITION and ROLE all mean employment; HOLIDAY means time off.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "BOSS",
            "CLIENT",
            "STAFF",
            "MANAGER",
            "INVOICE"
          ],
          "impostor": "INVOICE",
          "criterion_type": "semantic",
          "explanation": "These are people in a workplace; INVOICE is a document.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "PURCHASE",
            "BUY",
            "ACQUIRE",
            "OBTAIN",
            "RETURN"
          ],
          "impostor": "RETURN",
          "criterion_type": "synonym",
          "explanation": "These mean to get something by paying; RETURN means to give something back.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "CONTRACT",
            "INVOICE",
            "RECEIPT",
            "BILL",
            "CUSTOMER"
          ],
          "impostor": "CUSTOMER",
          "criterion_type": "semantic",
          "explanation": "These are business documents; CUSTOMER is a person.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "SHOP",
            "STORE",
            "MARKET",
            "MALL",
            "SALARY"
          ],
          "impostor": "SALARY",
          "criterion_type": "semantic",
          "explanation": "These are places to buy things; SALARY is money you earn.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "EARN",
            "MAKE",
            "GAIN",
            "PROFIT",
            "SPEND"
          ],
          "impostor": "SPEND",
          "criterion_type": "synonym",
          "explanation": "These mean to receive money; SPEND means to use money.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "EMAIL",
            "PHONE",
            "MEETING",
            "MEMO",
            "WAREHOUSE"
          ],
          "impostor": "WAREHOUSE",
          "criterion_type": "semantic",
          "explanation": "These are ways people communicate at work; WAREHOUSE is a building.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "CUSTOMER",
            "CLIENT",
            "BUYER",
            "CONSUMER",
            "SUPPLIER"
          ],
          "impostor": "SUPPLIER",
          "criterion_type": "synonym",
          "explanation": "These all mean someone who buys; SUPPLIER is someone who sells or provides.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "PROFIT",
            "REVENUE",
            "INCOME",
            "EARNINGS",
            "EXPENSE"
          ],
          "impostor": "EXPENSE",
          "criterion_type": "synonym",
          "explanation": "These mean money coming in; EXPENSE is money going out.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "BOSS",
            "MANAGER",
            "SUPERVISOR",
            "DIRECTOR",
            "INTERN"
          ],
          "impostor": "INTERN",
          "criterion_type": "synonym",
          "explanation": "These describe someone in charge; INTERN is an entry-level worker.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "CASH",
            "CHECK",
            "CARD",
            "TRANSFER",
            "DISCOUNT"
          ],
          "impostor": "DISCOUNT",
          "criterion_type": "semantic",
          "explanation": "These are ways to pay; DISCOUNT is a price reduction, not a payment method.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "BOSS",
            "MANAGER",
            "DIRECTOR",
            "LEADER",
            "CLIENT"
          ],
          "impostor": "CLIENT",
          "criterion_type": "synonym",
          "explanation": "BOSS, MANAGER, DIRECTOR and LEADER are all people in charge; a CLIENT is someone who buys from you.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "MONEY",
            "CASH",
            "FUNDS",
            "CAPITAL",
            "DEBT"
          ],
          "impostor": "DEBT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean money you have; DEBT is money you owe.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "OFFICE",
            "DESK",
            "PRINTER",
            "COMPUTER",
            "GARDEN"
          ],
          "impostor": "GARDEN",
          "criterion_type": "semantic",
          "explanation": "All are things you find in a workplace; a GARDEN is not.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "SALARY",
            "WAGE",
            "PAY",
            "INCOME",
            "EXPENSE"
          ],
          "impostor": "EXPENSE",
          "criterion_type": "synonym",
          "explanation": "The first four mean money you receive for working; an EXPENSE is money you spend.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "BUYER",
            "CUSTOMER",
            "CLIENT",
            "SHOPPER",
            "SELLER"
          ],
          "impostor": "SELLER",
          "criterion_type": "synonym",
          "explanation": "The first four all mean the person who buys; the SELLER is the opposite side.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "MEETING",
            "CONFERENCE",
            "INTERVIEW",
            "PRESENTATION",
            "VACATION"
          ],
          "impostor": "VACATION",
          "criterion_type": "semantic",
          "explanation": "All are work events; a VACATION is time away from work.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "PROFIT",
            "GAIN",
            "EARNINGS",
            "REVENUE",
            "LOSS"
          ],
          "impostor": "LOSS",
          "criterion_type": "synonym",
          "explanation": "The first four mean money the business makes; a LOSS is money it does not.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "EMAIL",
            "PHONE",
            "LETTER",
            "MESSAGE",
            "CHAIR"
          ],
          "impostor": "CHAIR",
          "criterion_type": "semantic",
          "explanation": "All are ways to communicate at work; a CHAIR is furniture.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "COMPANY",
            "FIRM",
            "BUSINESS",
            "ENTERPRISE",
            "EMPLOYEE"
          ],
          "impostor": "EMPLOYEE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean an organization; an EMPLOYEE is a person who works in one.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "CONTRACT",
            "AGREEMENT",
            "DEAL",
            "ARRANGEMENT",
            "ARGUMENT"
          ],
          "impostor": "ARGUMENT",
          "criterion_type": "synonym",
          "explanation": "The first four mean something both sides accept; an ARGUMENT is a disagreement.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "BANK",
            "ATM",
            "CARD",
            "ACCOUNT",
            "KITCHEN"
          ],
          "impostor": "KITCHEN",
          "criterion_type": "semantic",
          "explanation": "All are related to handling money; a KITCHEN is not.",
          "level": "basic",
          "category": "business"
        },
        {
          "words": [
            "CHEAP",
            "AFFORDABLE",
            "INEXPENSIVE",
            "ECONOMICAL",
            "EXPENSIVE"
          ],
          "impostor": "EXPENSIVE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean low in price; EXPENSIVE means the opposite.",
          "level": "basic",
          "category": "business"
        }
      ],
      "intermediate": [
        {
          "words": [
            "BUDGET",
            "REVENUE",
            "PROFIT",
            "EXPENSE",
            "DEADLINE"
          ],
          "impostor": "DEADLINE",
          "criterion_type": "semantic",
          "explanation": "These relate to company finances; DEADLINE relates to time.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "CONTRACT",
            "AGREEMENT",
            "DEAL",
            "ARRANGEMENT",
            "DISPUTE"
          ],
          "impostor": "DISPUTE",
          "criterion_type": "synonym",
          "explanation": "These mean a formal understanding between parties; DISPUTE means a disagreement.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "MANAGER",
            "SUPERVISOR",
            "EXECUTIVE",
            "DIRECTOR",
            "INVOICE"
          ],
          "impostor": "INVOICE",
          "criterion_type": "semantic",
          "explanation": "These describe leadership roles; INVOICE is a document.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "INCREASE",
            "BOOST",
            "EXPAND",
            "GROW",
            "DECLINE"
          ],
          "impostor": "DECLINE",
          "criterion_type": "synonym",
          "explanation": "These mean to get bigger; DECLINE means to get smaller.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "AGENDA",
            "MINUTES",
            "PROPOSAL",
            "PRESENTATION",
            "WAREHOUSE"
          ],
          "impostor": "WAREHOUSE",
          "criterion_type": "semantic",
          "explanation": "These relate to business meetings; WAREHOUSE is a storage building.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "CLIENT",
            "CUSTOMER",
            "ACCOUNT",
            "PATRON",
            "VENDOR"
          ],
          "impostor": "VENDOR",
          "criterion_type": "synonym",
          "explanation": "These mean someone who buys from you; VENDOR is someone who sells to you.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "INVOICE",
            "RECEIPT",
            "CONTRACT",
            "PROPOSAL",
            "COLLEAGUE"
          ],
          "impostor": "COLLEAGUE",
          "criterion_type": "semantic",
          "explanation": "These are documents; COLLEAGUE is a person.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "DECREASE",
            "DECLINE",
            "DROP",
            "FALL",
            "SURGE"
          ],
          "impostor": "SURGE",
          "criterion_type": "synonym",
          "explanation": "These mean to go down; SURGE means to increase suddenly.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "BUDGET",
            "SAVINGS",
            "INVESTMENT",
            "EXPENSE",
            "DEADLINE"
          ],
          "impostor": "DEADLINE",
          "criterion_type": "semantic",
          "explanation": "These relate to managing money; DEADLINE relates to time.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "LAUNCH",
            "ESTABLISH",
            "FOUND",
            "START",
            "DISSOLVE"
          ],
          "impostor": "DISSOLVE",
          "criterion_type": "synonym",
          "explanation": "These mean to begin something; DISSOLVE means to end it.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "EMPLOYEE",
            "FREELANCER",
            "CONTRACTOR",
            "INTERN",
            "SHAREHOLDER"
          ],
          "impostor": "SHAREHOLDER",
          "criterion_type": "semantic",
          "explanation": "These are people who work for a company; SHAREHOLDER owns part of it but doesn't necessarily work there.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "EFFICIENT",
            "PRODUCTIVE",
            "EFFECTIVE",
            "COMPETENT",
            "STAGNANT"
          ],
          "impostor": "STAGNANT",
          "criterion_type": "synonym",
          "explanation": "These describe doing something well; STAGNANT means not moving or growing.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "DEPARTMENT",
            "DIVISION",
            "BRANCH",
            "SUBSIDIARY",
            "DEADLINE"
          ],
          "impostor": "DEADLINE",
          "criterion_type": "semantic",
          "explanation": "These are parts of a company's structure; DEADLINE is a point in time.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "INVOICE",
            "RECEIPT",
            "BILL",
            "STATEMENT",
            "CATALOG"
          ],
          "impostor": "CATALOG",
          "criterion_type": "semantic",
          "explanation": "All are documents about money owed or paid; a CATALOG shows products.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "DEADLINE",
            "SCHEDULE",
            "TIMELINE",
            "AGENDA",
            "BONUS"
          ],
          "impostor": "BONUS",
          "criterion_type": "semantic",
          "explanation": "All are about organizing time; a BONUS is extra money.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "SUPPLIER",
            "VENDOR",
            "PROVIDER",
            "DISTRIBUTOR",
            "COMPETITOR"
          ],
          "impostor": "COMPETITOR",
          "criterion_type": "synonym",
          "explanation": "The first four all mean a company that sells you goods; a COMPETITOR fights you for customers.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "PROMOTION",
            "RAISE",
            "BONUS",
            "REWARD",
            "DISMISSAL"
          ],
          "impostor": "DISMISSAL",
          "criterion_type": "semantic",
          "explanation": "All are good things you can get at work; a DISMISSAL means losing your job.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "BUDGET",
            "FORECAST",
            "ESTIMATE",
            "PROJECTION",
            "REFUND"
          ],
          "impostor": "REFUND",
          "criterion_type": "synonym",
          "explanation": "The first four are predictions about future money; a REFUND is money given back.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "WAREHOUSE",
            "FACTORY",
            "STORE",
            "OFFICE",
            "PASSPORT"
          ],
          "impostor": "PASSPORT",
          "criterion_type": "semantic",
          "explanation": "All are places where a business operates; a PASSPORT is a travel document.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "TRAINING",
            "WORKSHOP",
            "COURSE",
            "SEMINAR",
            "RESIGNATION"
          ],
          "impostor": "RESIGNATION",
          "criterion_type": "semantic",
          "explanation": "All are ways to learn at work; a RESIGNATION is quitting your job.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "SHAREHOLDER",
            "INVESTOR",
            "PARTNER",
            "STAKEHOLDER",
            "INTERN"
          ],
          "impostor": "INTERN",
          "criterion_type": "synonym",
          "explanation": "The first four all have a financial stake in the company; an INTERN is a trainee.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "DISCOUNT",
            "SALE",
            "OFFER",
            "DEAL",
            "SURCHARGE"
          ],
          "impostor": "SURCHARGE",
          "criterion_type": "synonym",
          "explanation": "The first four mean a lower price; a SURCHARGE is an extra charge.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "STRATEGY",
            "PLAN",
            "APPROACH",
            "METHOD",
            "OUTCOME"
          ],
          "impostor": "OUTCOME",
          "criterion_type": "synonym",
          "explanation": "The first four are how you intend to do something; an OUTCOME is the result.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "NETWORKING",
            "MEETING",
            "PITCHING",
            "NEGOTIATING",
            "FILING"
          ],
          "impostor": "FILING",
          "criterion_type": "semantic",
          "explanation": "All are ways of dealing with people in business; FILING is organizing documents alone.",
          "level": "intermediate",
          "category": "business"
        },
        {
          "words": [
            "REVENUE",
            "TURNOVER",
            "SALES",
            "INCOME",
            "OVERHEAD"
          ],
          "impostor": "OVERHEAD",
          "criterion_type": "synonym",
          "explanation": "The first four all mean money coming in; OVERHEAD is the cost of running the business.",
          "level": "intermediate",
          "category": "business"
        }
      ],
      "advanced": [
        {
          "words": [
            "LIABILITY",
            "ARBITRATION",
            "COMPLIANCE",
            "LITIGATION",
            "SYNERGY"
          ],
          "impostor": "SYNERGY",
          "criterion_type": "semantic",
          "explanation": "These relate to legal or regulatory risk; SYNERGY refers to combined effectiveness, not risk.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "MERGE",
            "CONSOLIDATE",
            "COMBINE",
            "UNIFY",
            "DIVEST"
          ],
          "impostor": "DIVEST",
          "criterion_type": "synonym",
          "explanation": "These mean to bring together; DIVEST means to sell off or separate.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "BENCHMARK",
            "FORECAST",
            "METRIC",
            "KPI",
            "SUBSIDIARY"
          ],
          "impostor": "SUBSIDIARY",
          "criterion_type": "semantic",
          "explanation": "These are tools to measure or predict performance; SUBSIDIARY is a company owned by another.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "SCALE",
            "EXPAND",
            "GROW",
            "DIVERSIFY",
            "CONTRACT"
          ],
          "impostor": "CONTRACT",
          "criterion_type": "synonym",
          "explanation": "These mean to make bigger; CONTRACT here means to become smaller.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "VOLATILE",
            "UNSTABLE",
            "PRECARIOUS",
            "ERRATIC",
            "ROBUST"
          ],
          "impostor": "ROBUST",
          "criterion_type": "semantic",
          "explanation": "These describe instability; ROBUST means strong and stable, the opposite.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "PROFIT",
            "MARGIN",
            "YIELD",
            "RETURN",
            "OVERHEAD"
          ],
          "impostor": "OVERHEAD",
          "criterion_type": "synonym",
          "explanation": "These mean money gained from an investment; OVERHEAD means ongoing business expenses.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "MITIGATE",
            "HEDGE",
            "INSURE",
            "SAFEGUARD",
            "DISCLOSE"
          ],
          "impostor": "DISCLOSE",
          "criterion_type": "semantic",
          "explanation": "These mean to protect against risk; DISCLOSE means to reveal information.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "DEPRECIATE",
            "DEVALUE",
            "DIMINISH",
            "ERODE",
            "APPRECIATE"
          ],
          "impostor": "APPRECIATE",
          "criterion_type": "synonym",
          "explanation": "These mean to lose value; APPRECIATE means to gain value.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "SHAREHOLDER",
            "STAKEHOLDER",
            "SUBSIDIARY",
            "CONGLOMERATE",
            "FORECAST"
          ],
          "impostor": "FORECAST",
          "criterion_type": "semantic",
          "explanation": "These describe ownership or corporate structure; FORECAST is a prediction.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "PRUDENT",
            "CONSERVATIVE",
            "CAUTIOUS",
            "JUDICIOUS",
            "RECKLESS"
          ],
          "impostor": "RECKLESS",
          "criterion_type": "synonym",
          "explanation": "These describe careful decision-making; RECKLESS means careless.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "ARBITRATION",
            "MEDIATION",
            "SETTLEMENT",
            "NEGOTIATION",
            "EQUITY"
          ],
          "impostor": "EQUITY",
          "criterion_type": "semantic",
          "explanation": "These relate to resolving disputes; EQUITY relates to ownership value.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "CAPITAL",
            "FUNDS",
            "ASSETS",
            "RESOURCES",
            "LIABILITY"
          ],
          "impostor": "LIABILITY",
          "criterion_type": "synonym",
          "explanation": "These mean things of value a company owns; LIABILITY is a debt it owes.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "COMPETITIVE",
            "DOMINANT",
            "LEADING",
            "PREMIER",
            "OBSOLETE"
          ],
          "impostor": "OBSOLETE",
          "criterion_type": "semantic",
          "explanation": "These describe a strong market position; OBSOLETE means outdated and no longer useful.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "LIABILITY",
            "OBLIGATION",
            "DEBT",
            "COMMITMENT",
            "ASSET"
          ],
          "impostor": "ASSET",
          "criterion_type": "synonym",
          "explanation": "The first four all mean something you owe; an ASSET is something you own.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "MERGER",
            "ACQUISITION",
            "TAKEOVER",
            "BUYOUT",
            "LAYOFF"
          ],
          "impostor": "LAYOFF",
          "criterion_type": "semantic",
          "explanation": "All describe one company absorbing another; a LAYOFF is cutting staff.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "COMPLIANCE",
            "REGULATION",
            "POLICY",
            "GUIDELINE",
            "INCENTIVE"
          ],
          "impostor": "INCENTIVE",
          "criterion_type": "semantic",
          "explanation": "All are rules a company must follow; an INCENTIVE is a reward that motivates.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "AUDIT",
            "INSPECTION",
            "REVIEW",
            "EXAMINATION",
            "LAUNCH"
          ],
          "impostor": "LAUNCH",
          "criterion_type": "synonym",
          "explanation": "The first four all mean checking something carefully; a LAUNCH is releasing a product.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "LUCRATIVE",
            "PROFITABLE",
            "REWARDING",
            "GAINFUL",
            "WASTEFUL"
          ],
          "impostor": "WASTEFUL",
          "criterion_type": "synonym",
          "explanation": "The first four mean producing good money; WASTEFUL means losing it.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "COLLATERAL",
            "GUARANTEE",
            "SECURITY",
            "PLEDGE",
            "DIVIDEND"
          ],
          "impostor": "DIVIDEND",
          "criterion_type": "synonym",
          "explanation": "The first four are things promised to secure a loan; a DIVIDEND is a payment to shareholders.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "OUTSOURCE",
            "DELEGATE",
            "SUBCONTRACT",
            "ASSIGN",
            "MONOPOLIZE"
          ],
          "impostor": "MONOPOLIZE",
          "criterion_type": "synonym",
          "explanation": "The first four mean giving work to someone else; MONOPOLIZE means keeping everything.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "INSOLVENT",
            "BANKRUPT",
            "BROKE",
            "PENNILESS",
            "SOLVENT"
          ],
          "impostor": "SOLVENT",
          "criterion_type": "synonym",
          "explanation": "The first four mean unable to pay; SOLVENT means able to pay.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "STAKEHOLDER",
            "INVESTOR",
            "CREDITOR",
            "SHAREHOLDER",
            "APPRENTICE"
          ],
          "impostor": "APPRENTICE",
          "criterion_type": "semantic",
          "explanation": "All have a financial interest in the company; an APPRENTICE is learning a trade.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "ARBITRATION",
            "MEDIATION",
            "NEGOTIATION",
            "SETTLEMENT",
            "LITIGATION"
          ],
          "impostor": "LITIGATION",
          "criterion_type": "synonym",
          "explanation": "The first four are ways to solve a conflict by agreement; LITIGATION means going to court.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "FEASIBLE",
            "VIABLE",
            "PRACTICABLE",
            "WORKABLE",
            "UNREALISTIC"
          ],
          "impostor": "UNREALISTIC",
          "criterion_type": "synonym",
          "explanation": "The first four mean possible to do; UNREALISTIC means it cannot work.",
          "level": "advanced",
          "category": "business"
        },
        {
          "words": [
            "PROCUREMENT",
            "PURCHASING",
            "SOURCING",
            "BUYING",
            "RETAILING"
          ],
          "impostor": "RETAILING",
          "criterion_type": "synonym",
          "explanation": "The first four all mean acquiring supplies; RETAILING means selling to the public.",
          "level": "advanced",
          "category": "business"
        }
      ]
    },
    "travel": {
      "basic": [
        {
          "words": [
            "TICKET",
            "PASSPORT",
            "LUGGAGE",
            "BOARDING",
            "BEACH"
          ],
          "impostor": "BEACH",
          "criterion_type": "semantic",
          "explanation": "These are things you need at an airport; BEACH is a destination, not an airport item.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "TRIP",
            "JOURNEY",
            "VOYAGE",
            "EXCURSION",
            "ARRIVAL"
          ],
          "impostor": "ARRIVAL",
          "criterion_type": "synonym",
          "explanation": "These mean a period of travel; ARRIVAL means reaching the destination.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "TRAIN",
            "BUS",
            "TAXI",
            "PLANE",
            "HOTEL"
          ],
          "impostor": "HOTEL",
          "criterion_type": "semantic",
          "explanation": "These are ways to travel; HOTEL is a place to stay.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "LUGGAGE",
            "BAGGAGE",
            "SUITCASE",
            "BAG",
            "SOUVENIR"
          ],
          "impostor": "SOUVENIR",
          "criterion_type": "synonym",
          "explanation": "These mean things you carry when traveling; SOUVENIR is something you buy to remember a trip.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "HOTEL",
            "HOSTEL",
            "ROOM",
            "RESORT",
            "TICKET"
          ],
          "impostor": "TICKET",
          "criterion_type": "semantic",
          "explanation": "These relate to where you stay; TICKET is for transportation.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "GUIDE",
            "TOUR",
            "ESCORT",
            "USHER",
            "MAP"
          ],
          "impostor": "MAP",
          "criterion_type": "synonym",
          "explanation": "These describe someone who leads you; MAP is an object, not a person.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "PASSPORT",
            "VISA",
            "TICKET",
            "ID",
            "SUNSCREEN"
          ],
          "impostor": "SUNSCREEN",
          "criterion_type": "semantic",
          "explanation": "These are documents you need to travel; SUNSCREEN is something you use, not a document.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "ARRIVE",
            "LAND",
            "REACH",
            "DOCK",
            "DEPART"
          ],
          "impostor": "DEPART",
          "criterion_type": "synonym",
          "explanation": "These mean to arrive somewhere; DEPART means to leave.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "SUNSCREEN",
            "TOWEL",
            "SWIMSUIT",
            "SANDALS",
            "PASSPORT"
          ],
          "impostor": "PASSPORT",
          "criterion_type": "semantic",
          "explanation": "These are items for a beach trip; PASSPORT is a travel document.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "EXPLORE",
            "DISCOVER",
            "WANDER",
            "VISIT",
            "AVOID"
          ],
          "impostor": "AVOID",
          "criterion_type": "synonym",
          "explanation": "These mean to go and see new places; AVOID means to stay away from something.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "MUSEUM",
            "MONUMENT",
            "LANDMARK",
            "TEMPLE",
            "LUGGAGE"
          ],
          "impostor": "LUGGAGE",
          "criterion_type": "semantic",
          "explanation": "These are places tourists visit; LUGGAGE is something you carry.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "DESTINATION",
            "STOP",
            "SPOT",
            "LOCATION",
            "ROUTE"
          ],
          "impostor": "ROUTE",
          "criterion_type": "synonym",
          "explanation": "These mean a place you're going to; ROUTE means the path you take to get there.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "SUNNY",
            "RAINY",
            "HUMID",
            "WINDY",
            "EXPENSIVE"
          ],
          "impostor": "EXPENSIVE",
          "criterion_type": "semantic",
          "explanation": "These describe weather conditions; EXPENSIVE describes a price.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "SUITCASE",
            "BACKPACK",
            "BAG",
            "LUGGAGE",
            "TICKET"
          ],
          "impostor": "TICKET",
          "criterion_type": "synonym",
          "explanation": "The first four all mean something you carry your things in; a TICKET is a document.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "BEACH",
            "MOUNTAIN",
            "LAKE",
            "FOREST",
            "AIRPORT"
          ],
          "impostor": "AIRPORT",
          "criterion_type": "semantic",
          "explanation": "All are natural places; an AIRPORT is built by people.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "MAP",
            "COMPASS",
            "GPS",
            "GUIDE",
            "PILLOW"
          ],
          "impostor": "PILLOW",
          "criterion_type": "semantic",
          "explanation": "All help you find your way; a PILLOW helps you sleep.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "TRIP",
            "JOURNEY",
            "VOYAGE",
            "TOUR",
            "ARRIVAL"
          ],
          "impostor": "ARRIVAL",
          "criterion_type": "synonym",
          "explanation": "The first four all mean travelling somewhere; an ARRIVAL is reaching the end.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "PASSPORT",
            "VISA",
            "TICKET",
            "BOARDING PASS",
            "CAMERA"
          ],
          "impostor": "CAMERA",
          "criterion_type": "semantic",
          "explanation": "All are documents you need to travel; a CAMERA is optional.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "HOTEL",
            "HOSTEL",
            "MOTEL",
            "INN",
            "MUSEUM"
          ],
          "impostor": "MUSEUM",
          "criterion_type": "synonym",
          "explanation": "The first four are all places to sleep when travelling; a MUSEUM is a place to visit.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "SEA",
            "OCEAN",
            "RIVER",
            "LAKE",
            "DESERT"
          ],
          "impostor": "DESERT",
          "criterion_type": "semantic",
          "explanation": "All are places full of water; a DESERT has almost none.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "GUIDE",
            "TOURIST",
            "VISITOR",
            "TRAVELLER",
            "RESIDENT"
          ],
          "impostor": "RESIDENT",
          "criterion_type": "synonym",
          "explanation": "The first four are people who come from elsewhere; a RESIDENT lives there.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "CHEAP",
            "BUDGET",
            "AFFORDABLE",
            "LOW-PRICED",
            "LUXURY"
          ],
          "impostor": "LUXURY",
          "criterion_type": "synonym",
          "explanation": "The first four describe travel that costs little; LUXURY costs a lot.",
          "level": "basic",
          "category": "travel"
        },
        {
          "words": [
            "WALK",
            "HIKE",
            "STROLL",
            "WANDER",
            "DRIVE"
          ],
          "impostor": "DRIVE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean moving on foot; DRIVE means using a car.",
          "level": "basic",
          "category": "travel"
        }
      ],
      "intermediate": [
        {
          "words": [
            "SECURITY",
            "BOARDING",
            "CUSTOMS",
            "DEPARTURE",
            "SOUVENIR"
          ],
          "impostor": "SOUVENIR",
          "criterion_type": "semantic",
          "explanation": "These are airport procedures or areas; SOUVENIR is a keepsake you buy.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "ITINERARY",
            "SCHEDULE",
            "PLAN",
            "AGENDA",
            "EXCURSION"
          ],
          "impostor": "EXCURSION",
          "criterion_type": "synonym",
          "explanation": "These mean a planned list of activities or times; EXCURSION means a short trip.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "CURRENCY",
            "EXCHANGE",
            "CASH",
            "BUDGET",
            "ITINERARY"
          ],
          "impostor": "ITINERARY",
          "criterion_type": "semantic",
          "explanation": "These relate to money while traveling; ITINERARY is a travel plan.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "LAYOVER",
            "STOPOVER",
            "TRANSIT",
            "CONNECTION",
            "DESTINATION"
          ],
          "impostor": "DESTINATION",
          "criterion_type": "synonym",
          "explanation": "These mean a stop between flights; DESTINATION is the final place you're going.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "HOSTEL",
            "RESORT",
            "GUESTHOUSE",
            "INN",
            "EMBASSY"
          ],
          "impostor": "EMBASSY",
          "criterion_type": "semantic",
          "explanation": "These are places to stay; EMBASSY is a government office.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "SOUVENIR",
            "KEEPSAKE",
            "MEMENTO",
            "TRINKET",
            "LUGGAGE"
          ],
          "impostor": "LUGGAGE",
          "criterion_type": "synonym",
          "explanation": "These mean an item to remember a trip; LUGGAGE is what you carry your things in.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "VISA",
            "PERMIT",
            "CLEARANCE",
            "AUTHORIZATION",
            "ITINERARY"
          ],
          "impostor": "ITINERARY",
          "criterion_type": "semantic",
          "explanation": "These are official permissions to travel; ITINERARY is your travel schedule.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "BACKPACKER",
            "TOURIST",
            "TRAVELER",
            "VISITOR",
            "RESIDENT"
          ],
          "impostor": "RESIDENT",
          "criterion_type": "synonym",
          "explanation": "These mean someone visiting a place; RESIDENT means someone who lives there.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "LANDMARK",
            "MONUMENT",
            "HERITAGE",
            "ATTRACTION",
            "CUSTOMS"
          ],
          "impostor": "CUSTOMS",
          "criterion_type": "semantic",
          "explanation": "These relate to places tourists visit; CUSTOMS is an airport process.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "POSTPONE",
            "DELAY",
            "RESCHEDULE",
            "DEFER",
            "EXPEDITE"
          ],
          "impostor": "EXPEDITE",
          "criterion_type": "synonym",
          "explanation": "These mean to move something later; EXPEDITE means to make something happen faster.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "JETLAG",
            "FATIGUE",
            "EXHAUSTION",
            "DROWSINESS",
            "CURRENCY"
          ],
          "impostor": "CURRENCY",
          "criterion_type": "semantic",
          "explanation": "These describe tiredness from travel; CURRENCY is money.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "EMBASSY",
            "CONSULATE",
            "MISSION",
            "LEGATION",
            "CHECKPOINT"
          ],
          "impostor": "CHECKPOINT",
          "criterion_type": "synonym",
          "explanation": "These mean a diplomatic office abroad; CHECKPOINT is a security control point.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "CUSTOMS",
            "IMMIGRATION",
            "CHECKPOINT",
            "BORDER",
            "ITINERARY"
          ],
          "impostor": "ITINERARY",
          "criterion_type": "semantic",
          "explanation": "These relate to crossing into a country; ITINERARY is your travel plan.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "DEPARTURE",
            "BOARDING",
            "CHECK-IN",
            "TAKEOFF",
            "LANDING"
          ],
          "impostor": "LANDING",
          "criterion_type": "semantic",
          "explanation": "All happen before or during leaving; LANDING happens at the end of the flight.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "ITINERARY",
            "SCHEDULE",
            "PLAN",
            "ROUTE",
            "SOUVENIR"
          ],
          "impostor": "SOUVENIR",
          "criterion_type": "synonym",
          "explanation": "The first four are about organizing a trip; a SOUVENIR is something you bring home.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "CUSTOMS",
            "IMMIGRATION",
            "SECURITY",
            "BORDER",
            "LOUNGE"
          ],
          "impostor": "LOUNGE",
          "criterion_type": "semantic",
          "explanation": "All are checkpoints you must pass; a LOUNGE is a place to relax.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "DELAY",
            "CANCELLATION",
            "STRIKE",
            "OVERBOOKING",
            "UPGRADE"
          ],
          "impostor": "UPGRADE",
          "criterion_type": "semantic",
          "explanation": "All are problems that ruin a trip; an UPGRADE is good news.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "CURRENCY",
            "EXCHANGE",
            "RATE",
            "CASH",
            "BACKPACK"
          ],
          "impostor": "BACKPACK",
          "criterion_type": "semantic",
          "explanation": "All are about handling money abroad; a BACKPACK carries your things.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "ACCOMMODATION",
            "LODGING",
            "HOUSING",
            "SHELTER",
            "TRANSPORT"
          ],
          "impostor": "TRANSPORT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean a place to stay; TRANSPORT is how you move.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "CROWDED",
            "PACKED",
            "BUSY",
            "JAMMED",
            "DESERTED"
          ],
          "impostor": "DESERTED",
          "criterion_type": "synonym",
          "explanation": "The first four mean full of people; DESERTED means empty.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "ROUNDTRIP",
            "RETURN",
            "TWO-WAY",
            "BOTH-WAYS",
            "ONE-WAY"
          ],
          "impostor": "ONE-WAY",
          "criterion_type": "synonym",
          "explanation": "The first four mean going and coming back; ONE-WAY means you do not return.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "GUIDEBOOK",
            "BROCHURE",
            "LEAFLET",
            "PAMPHLET",
            "SUITCASE"
          ],
          "impostor": "SUITCASE",
          "criterion_type": "synonym",
          "explanation": "The first four are all printed information for travellers; a SUITCASE holds clothes.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "INSURANCE",
            "COVERAGE",
            "PROTECTION",
            "POLICY",
            "DEPOSIT"
          ],
          "impostor": "DEPOSIT",
          "criterion_type": "synonym",
          "explanation": "The first four protect you if something goes wrong; a DEPOSIT is money paid in advance.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "JETLAG",
            "FATIGUE",
            "EXHAUSTION",
            "TIREDNESS",
            "EXCITEMENT"
          ],
          "impostor": "EXCITEMENT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean feeling worn out; EXCITEMENT is feeling energized.",
          "level": "intermediate",
          "category": "travel"
        },
        {
          "words": [
            "HARBOR",
            "PORT",
            "DOCK",
            "PIER",
            "RUNWAY"
          ],
          "impostor": "RUNWAY",
          "criterion_type": "semantic",
          "explanation": "All are places where boats arrive; a RUNWAY is for planes.",
          "level": "intermediate",
          "category": "travel"
        }
      ],
      "advanced": [
        {
          "words": [
            "EXPEDITION",
            "PILGRIMAGE",
            "SOJOURN",
            "ODYSSEY",
            "CURRENCY"
          ],
          "impostor": "CURRENCY",
          "criterion_type": "semantic",
          "explanation": "These describe types of long or meaningful journeys; CURRENCY is money.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "NOMADIC",
            "ITINERANT",
            "WANDERING",
            "PEREGRINE",
            "SEDENTARY"
          ],
          "impostor": "SEDENTARY",
          "criterion_type": "synonym",
          "explanation": "These describe moving from place to place; SEDENTARY means staying in one place.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "QUARANTINE",
            "REPATRIATE",
            "JURISDICTION",
            "DEPORT",
            "WANDERLUST"
          ],
          "impostor": "WANDERLUST",
          "criterion_type": "semantic",
          "explanation": "These relate to legal control of movement across borders; WANDERLUST is a strong desire to travel.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "WANDERLUST",
            "YEARNING",
            "CRAVING",
            "LONGING",
            "RELUCTANCE"
          ],
          "impostor": "RELUCTANCE",
          "criterion_type": "synonym",
          "explanation": "These mean a strong desire; RELUCTANCE means unwillingness.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "ARCHIPELAGO",
            "PENINSULA",
            "ISTHMUS",
            "ESTUARY",
            "ITINERANT"
          ],
          "impostor": "ITINERANT",
          "criterion_type": "semantic",
          "explanation": "These are geographical landforms; ITINERANT describes a traveling person.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "SOJOURN",
            "STAY",
            "RESIDENCE",
            "STINT",
            "DEPARTURE"
          ],
          "impostor": "DEPARTURE",
          "criterion_type": "synonym",
          "explanation": "These mean a period of staying somewhere; DEPARTURE means leaving.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "ECOTOURISM",
            "SUSTAINABLE",
            "BIOSPHERE",
            "CONSERVATION",
            "ITINERARY"
          ],
          "impostor": "ITINERARY",
          "criterion_type": "semantic",
          "explanation": "These relate to environmentally responsible travel; ITINERARY is simply a travel schedule.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "COSMOPOLITAN",
            "WORLDLY",
            "SOPHISTICATED",
            "CULTURED",
            "PROVINCIAL"
          ],
          "impostor": "PROVINCIAL",
          "criterion_type": "synonym",
          "explanation": "These describe someone familiar with many cultures; PROVINCIAL means narrow or unsophisticated.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "JURISDICTION",
            "REPATRIATION",
            "EXTRADITION",
            "DEPORTATION",
            "SOJOURN"
          ],
          "impostor": "SOJOURN",
          "criterion_type": "semantic",
          "explanation": "These relate to legal authority over people crossing borders; SOJOURN is simply a temporary stay.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "CHARTERED",
            "ORGANIZED",
            "ARRANGED",
            "SCHEDULED",
            "SPONTANEOUS"
          ],
          "impostor": "SPONTANEOUS",
          "criterion_type": "synonym",
          "explanation": "These describe planned travel; SPONTANEOUS means unplanned.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "ARCHIPELAGO",
            "ATOLL",
            "ISLET",
            "LAGOON",
            "EXPEDITION"
          ],
          "impostor": "EXPEDITION",
          "criterion_type": "semantic",
          "explanation": "These are landforms related to islands; EXPEDITION is a type of journey.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "IMMERSIVE",
            "AUTHENTIC",
            "GENUINE",
            "UNFILTERED",
            "SUPERFICIAL"
          ],
          "impostor": "SUPERFICIAL",
          "criterion_type": "synonym",
          "explanation": "These describe a deep, real travel experience; SUPERFICIAL means shallow or not deep.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "ODYSSEY",
            "TREK",
            "EXPEDITION",
            "PILGRIMAGE",
            "LAYOVER"
          ],
          "impostor": "LAYOVER",
          "criterion_type": "semantic",
          "explanation": "These describe long, significant journeys; LAYOVER is a short stop between flights.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "ITINERARY",
            "SCHEDULE",
            "AGENDA",
            "PROGRAM",
            "DESTINATION"
          ],
          "impostor": "DESTINATION",
          "criterion_type": "synonym",
          "explanation": "The first four are plans of what you will do; a DESTINATION is where you end up.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "REMOTE",
            "ISOLATED",
            "SECLUDED",
            "INACCESSIBLE",
            "CENTRAL"
          ],
          "impostor": "CENTRAL",
          "criterion_type": "synonym",
          "explanation": "The first four mean far from everything; CENTRAL means right in the middle.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "VISA",
            "PERMIT",
            "AUTHORIZATION",
            "CLEARANCE",
            "BROCHURE"
          ],
          "impostor": "BROCHURE",
          "criterion_type": "synonym",
          "explanation": "The first four are official permissions to enter; a BROCHURE is advertising.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "SCENIC",
            "PICTURESQUE",
            "BREATHTAKING",
            "STUNNING",
            "MUNDANE"
          ],
          "impostor": "MUNDANE",
          "criterion_type": "synonym",
          "explanation": "The first four describe beautiful views; MUNDANE means ordinary and dull.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "RELOCATE",
            "EMIGRATE",
            "MIGRATE",
            "RESETTLE",
            "COMMUTE"
          ],
          "impostor": "COMMUTE",
          "criterion_type": "synonym",
          "explanation": "The first four mean moving to live somewhere else; COMMUTE means travelling daily to work.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "RESIDENCY",
            "CITIZENSHIP",
            "NATURALIZATION",
            "SETTLEMENT",
            "DEPORTATION"
          ],
          "impostor": "DEPORTATION",
          "criterion_type": "semantic",
          "explanation": "All are ways of gaining the right to stay; DEPORTATION is being forced to leave.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "ACCLIMATIZE",
            "ADAPT",
            "ADJUST",
            "SETTLE IN",
            "WITHDRAW"
          ],
          "impostor": "WITHDRAW",
          "criterion_type": "synonym",
          "explanation": "The first four mean getting used to a new place; WITHDRAW means pulling away from it.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "EXCURSION",
            "OUTING",
            "GETAWAY",
            "JAUNT",
            "DEADLINE"
          ],
          "impostor": "DEADLINE",
          "criterion_type": "synonym",
          "explanation": "The first four are all short pleasure trips; a DEADLINE is a time limit for work.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "TERMINAL",
            "CONCOURSE",
            "GATE",
            "BOARDING AREA",
            "CABIN"
          ],
          "impostor": "CABIN",
          "criterion_type": "semantic",
          "explanation": "All are parts of an airport; a CABIN is inside the plane.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "HOSPITABLE",
            "WELCOMING",
            "FRIENDLY",
            "GRACIOUS",
            "HOSTILE"
          ],
          "impostor": "HOSTILE",
          "criterion_type": "synonym",
          "explanation": "The first four describe places that treat visitors well; HOSTILE is the opposite.",
          "level": "advanced",
          "category": "travel"
        },
        {
          "words": [
            "STOPOVER",
            "LAYOVER",
            "TRANSIT",
            "CONNECTION",
            "NONSTOP"
          ],
          "impostor": "NONSTOP",
          "criterion_type": "synonym",
          "explanation": "The first four all mean breaking the journey; NONSTOP means no break at all.",
          "level": "advanced",
          "category": "travel"
        }
      ]
    },
    "daily": {
      "basic": [
        {
          "words": [
            "WAKE",
            "SHOWER",
            "BRUSH",
            "DRESS",
            "DINNER"
          ],
          "impostor": "DINNER",
          "criterion_type": "semantic",
          "explanation": "These are things you do in the morning; DINNER is an evening meal.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "CLEAN",
            "TIDY",
            "WASH",
            "SCRUB",
            "MESSY"
          ],
          "impostor": "MESSY",
          "criterion_type": "synonym",
          "explanation": "These mean to make something clean; MESSY means dirty or disorganized.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "STOVE",
            "FRIDGE",
            "SINK",
            "OVEN",
            "PILLOW"
          ],
          "impostor": "PILLOW",
          "criterion_type": "semantic",
          "explanation": "These are kitchen items; PILLOW belongs in a bedroom.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "TALK",
            "CHAT",
            "SPEAK",
            "CONVERSE",
            "LISTEN"
          ],
          "impostor": "LISTEN",
          "criterion_type": "synonym",
          "explanation": "These mean to communicate by speaking; LISTEN means to hear and pay attention.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "PAJAMAS",
            "PILLOW",
            "BLANKET",
            "BED",
            "STOVE"
          ],
          "impostor": "STOVE",
          "criterion_type": "semantic",
          "explanation": "These relate to sleeping; STOVE is a kitchen appliance.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "RELAX",
            "REST",
            "UNWIND",
            "CHILL",
            "WORRY"
          ],
          "impostor": "WORRY",
          "criterion_type": "synonym",
          "explanation": "These mean to feel calm; WORRY means to feel anxious.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "MILK",
            "BREAD",
            "EGGS",
            "FRUIT",
            "TOWEL"
          ],
          "impostor": "TOWEL",
          "criterion_type": "semantic",
          "explanation": "These are things you buy at a grocery store; TOWEL is a bathroom item.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "WASH",
            "LAUNDER",
            "CLEAN",
            "SCRUB",
            "FOLD"
          ],
          "impostor": "FOLD",
          "criterion_type": "synonym",
          "explanation": "These mean to remove dirt; FOLD means to arrange clothes neatly, not clean them.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "TOWEL",
            "SOAP",
            "SHAMPOO",
            "TOOTHBRUSH",
            "BLANKET"
          ],
          "impostor": "BLANKET",
          "criterion_type": "semantic",
          "explanation": "These are bathroom items; BLANKET belongs in a bedroom.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "REST",
            "RELAX",
            "LOUNGE",
            "UNWIND",
            "HURRY"
          ],
          "impostor": "HURRY",
          "criterion_type": "synonym",
          "explanation": "These mean to take it easy; HURRY means to move quickly.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "REST",
            "VISIT",
            "SHOP",
            "RELAX",
            "COMMUTE"
          ],
          "impostor": "COMMUTE",
          "criterion_type": "semantic",
          "explanation": "These are common weekend activities; COMMUTE is traveling to work, usually on weekdays.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "SHOP",
            "PURCHASE",
            "BUY",
            "GET",
            "SELL"
          ],
          "impostor": "SELL",
          "criterion_type": "synonym",
          "explanation": "These mean to obtain something with money; SELL means to give something for money.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "SWEEP",
            "DUST",
            "VACUUM",
            "MOP",
            "COOK"
          ],
          "impostor": "COOK",
          "criterion_type": "semantic",
          "explanation": "These are cleaning chores; COOK is preparing food, not cleaning.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "BREAKFAST",
            "LUNCH",
            "DINNER",
            "SNACK",
            "KITCHEN"
          ],
          "impostor": "KITCHEN",
          "criterion_type": "semantic",
          "explanation": "All are meals you eat; a KITCHEN is the room where you cook.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "SHIRT",
            "PANTS",
            "JACKET",
            "SHOES",
            "MIRROR"
          ],
          "impostor": "MIRROR",
          "criterion_type": "semantic",
          "explanation": "All are clothes you wear; a MIRROR is an object you look into.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "HAPPY",
            "GLAD",
            "CHEERFUL",
            "JOYFUL",
            "ANGRY"
          ],
          "impostor": "ANGRY",
          "criterion_type": "synonym",
          "explanation": "The first four all mean feeling good; ANGRY means feeling bad.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "MORNING",
            "AFTERNOON",
            "EVENING",
            "NIGHT",
            "MONDAY"
          ],
          "impostor": "MONDAY",
          "criterion_type": "semantic",
          "explanation": "All are parts of a day; MONDAY is a day of the week.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "SLEEP",
            "REST",
            "NAP",
            "DOZE",
            "RUN"
          ],
          "impostor": "RUN",
          "criterion_type": "synonym",
          "explanation": "The first four all mean resting; RUN means moving fast.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "MOTHER",
            "FATHER",
            "SISTER",
            "BROTHER",
            "NEIGHBOR"
          ],
          "impostor": "NEIGHBOR",
          "criterion_type": "semantic",
          "explanation": "All are family members; a NEIGHBOR lives near you but is not family.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "BIG",
            "LARGE",
            "HUGE",
            "ENORMOUS",
            "TINY"
          ],
          "impostor": "TINY",
          "criterion_type": "synonym",
          "explanation": "The first four all mean of great size; TINY means very small.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "SOAP",
            "SHAMPOO",
            "TOOTHPASTE",
            "TOWEL",
            "SPOON"
          ],
          "impostor": "SPOON",
          "criterion_type": "semantic",
          "explanation": "All are used to get clean; a SPOON is used to eat.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "FAST",
            "QUICK",
            "RAPID",
            "SWIFT",
            "SLOW"
          ],
          "impostor": "SLOW",
          "criterion_type": "synonym",
          "explanation": "The first four all mean moving with speed; SLOW is the opposite.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "APPLE",
            "BANANA",
            "ORANGE",
            "GRAPE",
            "CARROT"
          ],
          "impostor": "CARROT",
          "criterion_type": "semantic",
          "explanation": "All are fruits; a CARROT is a vegetable.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "START",
            "BEGIN",
            "LAUNCH",
            "COMMENCE",
            "FINISH"
          ],
          "impostor": "FINISH",
          "criterion_type": "synonym",
          "explanation": "The first four all mean to start something; FINISH means to end it.",
          "level": "basic",
          "category": "daily"
        },
        {
          "words": [
            "BED",
            "SOFA",
            "CHAIR",
            "TABLE",
            "WINDOW"
          ],
          "impostor": "WINDOW",
          "criterion_type": "semantic",
          "explanation": "All are furniture you can use; a WINDOW is part of the wall.",
          "level": "basic",
          "category": "daily"
        }
      ],
      "intermediate": [
        {
          "words": [
            "UTILITY",
            "SUBSCRIPTION",
            "RENT",
            "INSURANCE",
            "ERRAND"
          ],
          "impostor": "ERRAND",
          "criterion_type": "semantic",
          "explanation": "These are regular payments; ERRAND is a small task you run.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "CHORE",
            "TASK",
            "ERRAND",
            "DUTY",
            "HOBBY"
          ],
          "impostor": "HOBBY",
          "criterion_type": "synonym",
          "explanation": "These mean something you must do; HOBBY is something you do for fun.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "PLUMBING",
            "APPLIANCE",
            "RENOVATION",
            "MAINTENANCE",
            "GROCERY"
          ],
          "impostor": "GROCERY",
          "criterion_type": "semantic",
          "explanation": "These relate to fixing or improving a home; GROCERY relates to food shopping.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "HABIT",
            "ROUTINE",
            "PATTERN",
            "PRACTICE",
            "EXCEPTION"
          ],
          "impostor": "EXCEPTION",
          "criterion_type": "synonym",
          "explanation": "These mean something done regularly; EXCEPTION means something that doesn't follow the rule.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "COMMUTE",
            "BREAKFAST",
            "SHOWER",
            "DRESS",
            "APPOINTMENT"
          ],
          "impostor": "APPOINTMENT",
          "criterion_type": "semantic",
          "explanation": "These are part of a morning routine; APPOINTMENT is a scheduled meeting.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "REPAIR",
            "FIX",
            "MEND",
            "RESTORE",
            "BREAK"
          ],
          "impostor": "BREAK",
          "criterion_type": "synonym",
          "explanation": "These mean to make something work again; BREAK means to damage something.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "REMINDER",
            "CALENDAR",
            "SCHEDULE",
            "PLANNER",
            "THERMOSTAT"
          ],
          "impostor": "THERMOSTAT",
          "criterion_type": "semantic",
          "explanation": "These help you stay organized in time; THERMOSTAT controls temperature.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "POSTPONE",
            "DELAY",
            "PROCRASTINATE",
            "RESCHEDULE",
            "COMPLETE"
          ],
          "impostor": "COMPLETE",
          "criterion_type": "synonym",
          "explanation": "These mean to delay doing something; COMPLETE means to finish it.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "LANDLORD",
            "TENANT",
            "LEASE",
            "DEPOSIT",
            "ERRAND"
          ],
          "impostor": "ERRAND",
          "criterion_type": "semantic",
          "explanation": "These relate to renting a home; ERRAND is a small task you run.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "MAINTAIN",
            "ORGANIZE",
            "MANAGE",
            "ARRANGE",
            "NEGLECT"
          ],
          "impostor": "NEGLECT",
          "criterion_type": "synonym",
          "explanation": "These mean to take care of something; NEGLECT means to fail to take care of it.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "STREAMING",
            "SUBSCRIPTION",
            "WIFI",
            "INTERNET",
            "PLUMBING"
          ],
          "impostor": "PLUMBING",
          "criterion_type": "semantic",
          "explanation": "These relate to home technology services; PLUMBING is a physical home system for water.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "BUSY",
            "HECTIC",
            "PACKED",
            "FULL",
            "IDLE"
          ],
          "impostor": "IDLE",
          "criterion_type": "synonym",
          "explanation": "These describe having a lot to do; IDLE means having nothing to do.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "RENT",
            "UTILITY",
            "INSURANCE",
            "MORTGAGE",
            "CHORE"
          ],
          "impostor": "CHORE",
          "criterion_type": "semantic",
          "explanation": "These are financial obligations of a household; CHORE is a task, not a payment.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "EXHAUSTED",
            "TIRED",
            "WEARY",
            "DRAINED",
            "ENERGETIC"
          ],
          "impostor": "ENERGETIC",
          "criterion_type": "synonym",
          "explanation": "The first four all mean having no energy; ENERGETIC means full of it.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "LAUNDRY",
            "DISHES",
            "VACUUMING",
            "DUSTING",
            "GARDENING"
          ],
          "impostor": "GARDENING",
          "criterion_type": "semantic",
          "explanation": "All are chores you do inside the house; GARDENING is done outside.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "RECIPE",
            "INGREDIENT",
            "OVEN",
            "POT",
            "BLANKET"
          ],
          "impostor": "BLANKET",
          "criterion_type": "semantic",
          "explanation": "All are used to cook; a BLANKET keeps you warm in bed.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "HABIT",
            "ROUTINE",
            "CUSTOM",
            "PRACTICE",
            "SURPRISE"
          ],
          "impostor": "SURPRISE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean something you do regularly; a SURPRISE is unexpected.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "NEIGHBORHOOD",
            "DISTRICT",
            "AREA",
            "ZONE",
            "BUILDING"
          ],
          "impostor": "BUILDING",
          "criterion_type": "synonym",
          "explanation": "The first four all mean a part of a city; a BUILDING is a single structure.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "ARGUE",
            "QUARREL",
            "DISPUTE",
            "BICKER",
            "AGREE"
          ],
          "impostor": "AGREE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean fighting with words; AGREE means the opposite.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "APPOINTMENT",
            "RESERVATION",
            "BOOKING",
            "SCHEDULE",
            "CANCELLATION"
          ],
          "impostor": "CANCELLATION",
          "criterion_type": "synonym",
          "explanation": "The first four all mean arranging a time; a CANCELLATION undoes it.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "POLITE",
            "COURTEOUS",
            "RESPECTFUL",
            "CIVIL",
            "RUDE"
          ],
          "impostor": "RUDE",
          "criterion_type": "synonym",
          "explanation": "The first four describe good manners; RUDE describes bad ones.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "GROCERY",
            "SUPERMARKET",
            "MARKET",
            "STORE",
            "PHARMACY"
          ],
          "impostor": "PHARMACY",
          "criterion_type": "semantic",
          "explanation": "All are places to buy food; a PHARMACY sells medicine.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "BORROW",
            "LEND",
            "RETURN",
            "OWE",
            "DONATE"
          ],
          "impostor": "DONATE",
          "criterion_type": "semantic",
          "explanation": "The first four all involve giving something back; DONATE means giving it away for good.",
          "level": "intermediate",
          "category": "daily"
        },
        {
          "words": [
            "BASEMENT",
            "ATTIC",
            "HALLWAY",
            "BALCONY",
            "FENCE"
          ],
          "impostor": "FENCE",
          "criterion_type": "semantic",
          "explanation": "All are parts of a house; a FENCE surrounds the property outside.",
          "level": "intermediate",
          "category": "daily"
        }
      ],
      "advanced": [
        {
          "words": [
            "MUNDANE",
            "MONOTONOUS",
            "TEDIOUS",
            "REPETITIVE",
            "SPONTANEOUS"
          ],
          "impostor": "SPONTANEOUS",
          "criterion_type": "semantic",
          "explanation": "These describe something boring and repetitive; SPONTANEOUS means unplanned and exciting.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "METICULOUS",
            "PUNCTUAL",
            "DISCIPLINED",
            "METHODICAL",
            "CARELESS"
          ],
          "impostor": "CARELESS",
          "criterion_type": "synonym",
          "explanation": "These describe being very organized and careful; CARELESS means not paying attention to detail.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "LETHARGIC",
            "SEDENTARY",
            "SLUGGISH",
            "LISTLESS",
            "VIGOROUS"
          ],
          "impostor": "VIGOROUS",
          "criterion_type": "semantic",
          "explanation": "These describe a lack of energy; VIGOROUS means full of energy.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "AUTONOMOUS",
            "INDEPENDENT",
            "UNASSISTED",
            "SOVEREIGN",
            "DEPENDENT"
          ],
          "impostor": "DEPENDENT",
          "criterion_type": "synonym",
          "explanation": "These describe not needing help from others; DEPENDENT means relying on others.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "INDISPENSABLE",
            "ESSENTIAL",
            "VITAL",
            "CRUCIAL",
            "TRIVIAL"
          ],
          "impostor": "TRIVIAL",
          "criterion_type": "semantic",
          "explanation": "These mean very important; TRIVIAL means unimportant.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "REJUVENATE",
            "RECHARGE",
            "REFRESH",
            "REVITALIZE",
            "EXHAUST"
          ],
          "impostor": "EXHAUST",
          "criterion_type": "synonym",
          "explanation": "These mean to restore energy; EXHAUST means to use up all your energy.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "RITUALISTIC",
            "HABITUAL",
            "ROUTINE",
            "REGULAR",
            "ERRATIC"
          ],
          "impostor": "ERRATIC",
          "criterion_type": "semantic",
          "explanation": "These describe consistent, predictable behavior; ERRATIC means unpredictable.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "DECLUTTER",
            "STREAMLINE",
            "SIMPLIFY",
            "ORGANIZE",
            "COMPLICATE"
          ],
          "impostor": "COMPLICATE",
          "criterion_type": "synonym",
          "explanation": "These mean to make things simpler; COMPLICATE means to make things harder.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "SPONTANEOUS",
            "IMPULSIVE",
            "UNPLANNED",
            "IMPROMPTU",
            "DELIBERATE"
          ],
          "impostor": "DELIBERATE",
          "criterion_type": "semantic",
          "explanation": "These describe acting without planning; DELIBERATE means done on purpose, with thought.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "PROCRASTINATE",
            "DELAY",
            "STALL",
            "DAWDLE",
            "EXPEDITE"
          ],
          "impostor": "EXPEDITE",
          "criterion_type": "synonym",
          "explanation": "These mean to delay an action; EXPEDITE means to speed it up.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "METICULOUS",
            "DISCIPLINED",
            "METHODICAL",
            "SYSTEMATIC",
            "HAPHAZARD"
          ],
          "impostor": "HAPHAZARD",
          "criterion_type": "semantic",
          "explanation": "These describe an organized approach; HAPHAZARD means disorganized and random.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "PERPETUAL",
            "CONSTANT",
            "UNCEASING",
            "CONTINUAL",
            "OCCASIONAL"
          ],
          "impostor": "OCCASIONAL",
          "criterion_type": "synonym",
          "explanation": "These mean happening all the time; OCCASIONAL means happening rarely.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "STAGNATION",
            "MONOTONY",
            "LETHARGY",
            "COMPLACENCY",
            "MOMENTUM"
          ],
          "impostor": "MOMENTUM",
          "criterion_type": "semantic",
          "explanation": "These describe being stuck without progress; MOMENTUM means the force that drives you forward.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "METICULOUS",
            "THOROUGH",
            "PAINSTAKING",
            "SCRUPULOUS",
            "CARELESS"
          ],
          "impostor": "CARELESS",
          "criterion_type": "synonym",
          "explanation": "The first four all mean very careful; CARELESS is the opposite.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "RESILIENT",
            "TOUGH",
            "HARDY",
            "ROBUST",
            "FRAGILE"
          ],
          "impostor": "FRAGILE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean able to withstand difficulty; FRAGILE breaks easily.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "CHORE",
            "ERRAND",
            "TASK",
            "DUTY",
            "LEISURE"
          ],
          "impostor": "LEISURE",
          "criterion_type": "synonym",
          "explanation": "The first four are things you have to do; LEISURE is free time.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "FRUGAL",
            "THRIFTY",
            "ECONOMICAL",
            "PRUDENT",
            "EXTRAVAGANT"
          ],
          "impostor": "EXTRAVAGANT",
          "criterion_type": "synonym",
          "explanation": "The first four mean careful with money; EXTRAVAGANT means spending too much.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "CLUTTER",
            "MESS",
            "DISARRAY",
            "CHAOS",
            "ORDER"
          ],
          "impostor": "ORDER",
          "criterion_type": "synonym",
          "explanation": "The first four all mean disorganization; ORDER means everything in its place.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "MUNDANE",
            "ROUTINE",
            "ORDINARY",
            "COMMONPLACE",
            "EXTRAORDINARY"
          ],
          "impostor": "EXTRAORDINARY",
          "criterion_type": "synonym",
          "explanation": "The first four describe everyday dullness; EXTRAORDINARY is remarkable.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "CONSIDERATE",
            "THOUGHTFUL",
            "ATTENTIVE",
            "CARING",
            "INDIFFERENT"
          ],
          "impostor": "INDIFFERENT",
          "criterion_type": "synonym",
          "explanation": "The first four mean paying attention to others; INDIFFERENT means not caring.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "PROCRASTINATE",
            "DELAY",
            "POSTPONE",
            "STALL",
            "EXPEDITE"
          ],
          "impostor": "EXPEDITE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean putting things off; EXPEDITE means speeding them up.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "SEDENTARY",
            "INACTIVE",
            "IDLE",
            "STATIONARY",
            "ACTIVE"
          ],
          "impostor": "ACTIVE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean not moving much; ACTIVE is the opposite.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "INSOMNIA",
            "RESTLESSNESS",
            "SLEEPLESSNESS",
            "WAKEFULNESS",
            "SLUMBER"
          ],
          "impostor": "SLUMBER",
          "criterion_type": "synonym",
          "explanation": "The first four all mean being unable to sleep; SLUMBER means deep sleep.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "NURTURE",
            "RAISE",
            "REAR",
            "BRING UP",
            "NEGLECT"
          ],
          "impostor": "NEGLECT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean taking care of a child; NEGLECT means failing to.",
          "level": "advanced",
          "category": "daily"
        },
        {
          "words": [
            "CUISINE",
            "GASTRONOMY",
            "COOKERY",
            "CULINARY ARTS",
            "APPETITE"
          ],
          "impostor": "APPETITE",
          "criterion_type": "synonym",
          "explanation": "The first four are all about the art of cooking; APPETITE is the desire to eat.",
          "level": "advanced",
          "category": "daily"
        }
      ]
    },
    "general": {
      "basic": [
        {
          "words": [
            "SUNNY",
            "RAINY",
            "CLOUDY",
            "WINDY",
            "HAPPY"
          ],
          "impostor": "HAPPY",
          "criterion_type": "semantic",
          "explanation": "These describe weather; HAPPY describes emotion.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "BIG",
            "LARGE",
            "HUGE",
            "GIANT",
            "TINY"
          ],
          "impostor": "TINY",
          "criterion_type": "synonym",
          "explanation": "These mean big in size; TINY means very small.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "RED",
            "BLUE",
            "GREEN",
            "YELLOW",
            "SOFT"
          ],
          "impostor": "SOFT",
          "criterion_type": "semantic",
          "explanation": "These are colors; SOFT describes texture.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "GOOD",
            "GREAT",
            "EXCELLENT",
            "WONDERFUL",
            "TERRIBLE"
          ],
          "impostor": "TERRIBLE",
          "criterion_type": "synonym",
          "explanation": "These mean positive quality; TERRIBLE means very bad.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "DOG",
            "CAT",
            "BIRD",
            "FISH",
            "HAPPY"
          ],
          "impostor": "HAPPY",
          "criterion_type": "semantic",
          "explanation": "These are animals; HAPPY is a feeling.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "SMALL",
            "TINY",
            "LITTLE",
            "MINI",
            "ENORMOUS"
          ],
          "impostor": "ENORMOUS",
          "criterion_type": "synonym",
          "explanation": "These mean small in size; ENORMOUS means very big.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "MOTHER",
            "FATHER",
            "SISTER",
            "BROTHER",
            "FRIEND"
          ],
          "impostor": "FRIEND",
          "criterion_type": "semantic",
          "explanation": "These are family relations; FRIEND is not a family member.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "EASY",
            "SIMPLE",
            "BASIC",
            "EFFORTLESS",
            "DIFFICULT"
          ],
          "impostor": "DIFFICULT",
          "criterion_type": "synonym",
          "explanation": "These mean not hard to do; DIFFICULT means hard.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "FIRST",
            "SECOND",
            "THIRD",
            "FOURTH",
            "MANY"
          ],
          "impostor": "MANY",
          "criterion_type": "semantic",
          "explanation": "These are ordinal numbers; MANY is a quantity word, not an ordinal.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "FAST",
            "QUICK",
            "RAPID",
            "SWIFT",
            "SLUGGISH"
          ],
          "impostor": "SLUGGISH",
          "criterion_type": "synonym",
          "explanation": "These mean moving quickly; SLUGGISH means moving slowly.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "MORNING",
            "AFTERNOON",
            "EVENING",
            "NIGHT",
            "YESTERDAY"
          ],
          "impostor": "YESTERDAY",
          "criterion_type": "semantic",
          "explanation": "These are parts of a day; YESTERDAY refers to a day in the past.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "BEAUTIFUL",
            "PRETTY",
            "LOVELY",
            "GORGEOUS",
            "UGLY"
          ],
          "impostor": "UGLY",
          "criterion_type": "synonym",
          "explanation": "These mean attractive; UGLY means unattractive.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "SUMMER",
            "WINTER",
            "SPRING",
            "AUTUMN",
            "WEEKEND"
          ],
          "impostor": "WEEKEND",
          "criterion_type": "semantic",
          "explanation": "These are seasons; WEEKEND refers to days of the week.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "DOG",
            "CAT",
            "HORSE",
            "COW",
            "TREE"
          ],
          "impostor": "TREE",
          "criterion_type": "semantic",
          "explanation": "All are animals; a TREE is a plant.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "RED",
            "BLUE",
            "GREEN",
            "YELLOW",
            "ROUND"
          ],
          "impostor": "ROUND",
          "criterion_type": "semantic",
          "explanation": "All are colors; ROUND is a shape.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "SUN",
            "MOON",
            "STAR",
            "PLANET",
            "CLOUD"
          ],
          "impostor": "CLOUD",
          "criterion_type": "semantic",
          "explanation": "All are objects in space; a CLOUD is in our sky.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "SMALL",
            "LITTLE",
            "TINY",
            "MINI",
            "GIANT"
          ],
          "impostor": "GIANT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean not big; GIANT means very big.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "DOCTOR",
            "NURSE",
            "DENTIST",
            "SURGEON",
            "TEACHER"
          ],
          "impostor": "TEACHER",
          "criterion_type": "semantic",
          "explanation": "All work in health care; a TEACHER works in education.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "RAIN",
            "SNOW",
            "WIND",
            "STORM",
            "MOUNTAIN"
          ],
          "impostor": "MOUNTAIN",
          "criterion_type": "semantic",
          "explanation": "All are types of weather; a MOUNTAIN is a landform.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "ONE",
            "TWO",
            "THREE",
            "FOUR",
            "FIRST"
          ],
          "impostor": "FIRST",
          "criterion_type": "semantic",
          "explanation": "All say how many; FIRST says the position in an order.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "GUITAR",
            "PIANO",
            "DRUM",
            "VIOLIN",
            "PAINTING"
          ],
          "impostor": "PAINTING",
          "criterion_type": "semantic",
          "explanation": "All are musical instruments; a PAINTING is visual art.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "EASY",
            "SIMPLE",
            "BASIC",
            "STRAIGHTFORWARD",
            "DIFFICULT"
          ],
          "impostor": "DIFFICULT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean not hard; DIFFICULT is the opposite.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "EYE",
            "NOSE",
            "MOUTH",
            "EAR",
            "HAND"
          ],
          "impostor": "HAND",
          "criterion_type": "semantic",
          "explanation": "All are parts of the face; a HAND is at the end of the arm.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "BOOK",
            "MAGAZINE",
            "NEWSPAPER",
            "NOVEL",
            "RADIO"
          ],
          "impostor": "RADIO",
          "criterion_type": "semantic",
          "explanation": "All are things you read; a RADIO is something you listen to.",
          "level": "basic",
          "category": "general"
        },
        {
          "words": [
            "OLD",
            "ANCIENT",
            "ELDERLY",
            "AGED",
            "YOUNG"
          ],
          "impostor": "YOUNG",
          "criterion_type": "synonym",
          "explanation": "The first four all mean having many years; YOUNG means few.",
          "level": "basic",
          "category": "general"
        }
      ],
      "intermediate": [
        {
          "words": [
            "GENEROUS",
            "HONEST",
            "SINCERE",
            "RELIABLE",
            "ARROGANT"
          ],
          "impostor": "ARROGANT",
          "criterion_type": "semantic",
          "explanation": "These describe good character traits; ARROGANT describes a negative trait.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "CONFIDENT",
            "ASSURED",
            "ASSERTIVE",
            "BOLD",
            "TIMID"
          ],
          "impostor": "TIMID",
          "criterion_type": "synonym",
          "explanation": "These mean sure of yourself; TIMID means shy or fearful.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "STUBBORN",
            "ARROGANT",
            "RECKLESS",
            "IMPATIENT",
            "GENEROUS"
          ],
          "impostor": "GENEROUS",
          "criterion_type": "semantic",
          "explanation": "These describe difficult traits; GENEROUS describes a positive trait.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "FLEXIBLE",
            "ADAPTABLE",
            "VERSATILE",
            "ACCOMMODATING",
            "RIGID"
          ],
          "impostor": "RIGID",
          "criterion_type": "synonym",
          "explanation": "These mean able to change easily; RIGID means unable to change.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "LOGICAL",
            "RATIONAL",
            "ANALYTICAL",
            "SYSTEMATIC",
            "EMOTIONAL"
          ],
          "impostor": "EMOTIONAL",
          "criterion_type": "semantic",
          "explanation": "These describe thinking with logic; EMOTIONAL describes thinking with feelings.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "BRAVE",
            "COURAGEOUS",
            "FEARLESS",
            "BOLD",
            "COWARDLY"
          ],
          "impostor": "COWARDLY",
          "criterion_type": "synonym",
          "explanation": "These mean not afraid; COWARDLY means easily scared.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "ANXIOUS",
            "NERVOUS",
            "WORRIED",
            "UNEASY",
            "RELAXED"
          ],
          "impostor": "RELAXED",
          "criterion_type": "semantic",
          "explanation": "These describe feeling worried; RELAXED describes feeling calm.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "ARROGANT",
            "CONCEITED",
            "BOASTFUL",
            "VAIN",
            "MODEST"
          ],
          "impostor": "MODEST",
          "criterion_type": "synonym",
          "explanation": "These mean too proud of yourself; MODEST means humble.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "CURIOUS",
            "INQUISITIVE",
            "RECEPTIVE",
            "RESPONSIVE",
            "STUBBORN"
          ],
          "impostor": "STUBBORN",
          "criterion_type": "semantic",
          "explanation": "These describe being open to new ideas; STUBBORN means refusing to change your mind.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "RELUCTANT",
            "UNWILLING",
            "HESITANT",
            "RESISTANT",
            "EAGER"
          ],
          "impostor": "EAGER",
          "criterion_type": "synonym",
          "explanation": "These mean not wanting to do something; EAGER means very willing.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "CALM",
            "COMPOSED",
            "STEADY",
            "COLLECTED",
            "FRANTIC"
          ],
          "impostor": "FRANTIC",
          "criterion_type": "semantic",
          "explanation": "These describe staying calm; FRANTIC means panicked and stressed.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "CREATIVE",
            "IMAGINATIVE",
            "INVENTIVE",
            "ORIGINAL",
            "UNORIGINAL"
          ],
          "impostor": "UNORIGINAL",
          "criterion_type": "synonym",
          "explanation": "These mean full of new ideas; UNORIGINAL means copying others, lacking new ideas.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "CAUTIOUS",
            "CAREFUL",
            "PRUDENT",
            "WARY",
            "RECKLESS"
          ],
          "impostor": "RECKLESS",
          "criterion_type": "semantic",
          "explanation": "These describe being careful; RECKLESS means careless and risky.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "RIVER",
            "STREAM",
            "CREEK",
            "BROOK",
            "POND"
          ],
          "impostor": "POND",
          "criterion_type": "synonym",
          "explanation": "The first four are all moving water; a POND is still water.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "INVENT",
            "CREATE",
            "DESIGN",
            "DEVELOP",
            "COPY"
          ],
          "impostor": "COPY",
          "criterion_type": "synonym",
          "explanation": "The first four all mean making something new; COPY means repeating what exists.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "HONEST",
            "TRUTHFUL",
            "SINCERE",
            "FRANK",
            "DECEITFUL"
          ],
          "impostor": "DECEITFUL",
          "criterion_type": "synonym",
          "explanation": "The first four all mean telling the truth; DECEITFUL means lying.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "EARTHQUAKE",
            "HURRICANE",
            "FLOOD",
            "DROUGHT",
            "HARVEST"
          ],
          "impostor": "HARVEST",
          "criterion_type": "semantic",
          "explanation": "All are natural disasters; a HARVEST is a good thing for farmers.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "INCREASE",
            "RISE",
            "GROW",
            "EXPAND",
            "SHRINK"
          ],
          "impostor": "SHRINK",
          "criterion_type": "synonym",
          "explanation": "The first four all mean getting bigger; SHRINK means getting smaller.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "MUSCLE",
            "BONE",
            "NERVE",
            "ORGAN",
            "SKIN"
          ],
          "impostor": "SKIN",
          "criterion_type": "semantic",
          "explanation": "All are inside the body; SKIN is on the outside.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "SILENT",
            "QUIET",
            "NOISELESS",
            "HUSHED",
            "DEAFENING"
          ],
          "impostor": "DEAFENING",
          "criterion_type": "synonym",
          "explanation": "The first four all mean without sound; DEAFENING means extremely loud.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "EVIDENCE",
            "PROOF",
            "CONFIRMATION",
            "VERIFICATION",
            "GUESS"
          ],
          "impostor": "GUESS",
          "criterion_type": "synonym",
          "explanation": "The first four all mean something that shows the truth; a GUESS is uncertain.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "ORCHESTRA",
            "CHOIR",
            "BAND",
            "ENSEMBLE",
            "SOLOIST"
          ],
          "impostor": "SOLOIST",
          "criterion_type": "semantic",
          "explanation": "All are groups of musicians; a SOLOIST performs alone.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "PERMANENT",
            "LASTING",
            "ENDURING",
            "EVERLASTING",
            "TEMPORARY"
          ],
          "impostor": "TEMPORARY",
          "criterion_type": "synonym",
          "explanation": "The first four all mean going on forever; TEMPORARY means for a short time.",
          "level": "intermediate",
          "category": "general"
        },
        {
          "words": [
            "VOLCANO",
            "GLACIER",
            "CANYON",
            "DESERT",
            "BRIDGE"
          ],
          "impostor": "BRIDGE",
          "criterion_type": "semantic",
          "explanation": "All are natural landforms; a BRIDGE is built by people.",
          "level": "intermediate",
          "category": "general"
        }
      ],
      "advanced": [
        {
          "words": [
            "TENACIOUS",
            "RESILIENT",
            "DETERMINED",
            "PERSISTENT",
            "FICKLE"
          ],
          "impostor": "FICKLE",
          "criterion_type": "semantic",
          "explanation": "These describe someone who doesn't give up; FICKLE means changing your mind often.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "PRAGMATIC",
            "PRACTICAL",
            "REALISTIC",
            "SENSIBLE",
            "IDEALISTIC"
          ],
          "impostor": "IDEALISTIC",
          "criterion_type": "synonym",
          "explanation": "These mean focused on what is practical; IDEALISTIC means focused on perfect ideas rather than reality.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "EMPATHETIC",
            "PERCEPTIVE",
            "INSIGHTFUL",
            "UNDERSTANDING",
            "OBLIVIOUS"
          ],
          "impostor": "OBLIVIOUS",
          "criterion_type": "semantic",
          "explanation": "These describe understanding others well; OBLIVIOUS means unaware.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "AUDACIOUS",
            "DARING",
            "BOLD",
            "BRAZEN",
            "TIMID"
          ],
          "impostor": "TIMID",
          "criterion_type": "synonym",
          "explanation": "These mean fearlessly bold; TIMID means shy and fearful.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "CANDID",
            "ARTICULATE",
            "ELOQUENT",
            "FRANK",
            "EVASIVE"
          ],
          "impostor": "EVASIVE",
          "criterion_type": "semantic",
          "explanation": "These describe speaking clearly and honestly; EVASIVE means avoiding giving a direct answer.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "UNWAVERING",
            "STEADFAST",
            "RESOLUTE",
            "UNYIELDING",
            "WAVERING"
          ],
          "impostor": "WAVERING",
          "criterion_type": "synonym",
          "explanation": "These mean firmly committed; WAVERING means uncertain or changing.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "JUDICIOUS",
            "DISCERNING",
            "PRUDENT",
            "SENSIBLE",
            "IMPULSIVE"
          ],
          "impostor": "IMPULSIVE",
          "criterion_type": "semantic",
          "explanation": "These describe careful, wise decisions; IMPULSIVE means acting without thinking.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "ALTRUISTIC",
            "SELFLESS",
            "CHARITABLE",
            "GENEROUS",
            "SELFISH"
          ],
          "impostor": "SELFISH",
          "criterion_type": "synonym",
          "explanation": "These mean caring for others before yourself; SELFISH means caring only about yourself.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "VERSATILE",
            "ADAPTABLE",
            "MULTIFACETED",
            "FLEXIBLE",
            "RIGID"
          ],
          "impostor": "RIGID",
          "criterion_type": "semantic",
          "explanation": "These describe being able to adapt; RIGID means unable to change.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "INDOMITABLE",
            "UNSTOPPABLE",
            "INVINCIBLE",
            "UNCONQUERABLE",
            "FRAGILE"
          ],
          "impostor": "FRAGILE",
          "criterion_type": "synonym",
          "explanation": "These mean impossible to defeat; FRAGILE means easily broken or defeated.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "AUSTERE",
            "MODEST",
            "SPARSE",
            "MINIMAL",
            "LAVISH"
          ],
          "impostor": "LAVISH",
          "criterion_type": "semantic",
          "explanation": "These describe a simple, plain lifestyle; LAVISH means extravagant and luxurious.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "ARTICULATE",
            "ELOQUENT",
            "EXPRESSIVE",
            "FLUENT",
            "INCOHERENT"
          ],
          "impostor": "INCOHERENT",
          "criterion_type": "synonym",
          "explanation": "These mean able to speak clearly; INCOHERENT means unclear and hard to follow.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "PERCEPTIVE",
            "DISCERNING",
            "OBSERVANT",
            "ASTUTE",
            "OBLIVIOUS"
          ],
          "impostor": "OBLIVIOUS",
          "criterion_type": "semantic",
          "explanation": "These describe noticing small details; OBLIVIOUS means not noticing anything.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "AMBIGUOUS",
            "VAGUE",
            "UNCLEAR",
            "OBSCURE",
            "EXPLICIT"
          ],
          "impostor": "EXPLICIT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean hard to understand; EXPLICIT means perfectly clear.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "ABUNDANT",
            "PLENTIFUL",
            "AMPLE",
            "COPIOUS",
            "SCARCE"
          ],
          "impostor": "SCARCE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean there is a lot; SCARCE means there is very little.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "INEVITABLE",
            "UNAVOIDABLE",
            "CERTAIN",
            "INESCAPABLE",
            "OPTIONAL"
          ],
          "impostor": "OPTIONAL",
          "criterion_type": "synonym",
          "explanation": "The first four mean it will happen no matter what; OPTIONAL means you can choose.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "DIMINISH",
            "DECLINE",
            "DWINDLE",
            "WANE",
            "SURGE"
          ],
          "impostor": "SURGE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean becoming less; SURGE means rising sharply.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "ADVOCATE",
            "SUPPORTER",
            "PROPONENT",
            "CHAMPION",
            "OPPONENT"
          ],
          "impostor": "OPPONENT",
          "criterion_type": "synonym",
          "explanation": "The first four all mean someone who defends an idea; an OPPONENT fights against it.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "PLAUSIBLE",
            "CREDIBLE",
            "BELIEVABLE",
            "CONVINCING",
            "ABSURD"
          ],
          "impostor": "ABSURD",
          "criterion_type": "synonym",
          "explanation": "The first four all mean it could be true; ABSURD means it makes no sense.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "TRANSPARENT",
            "OPEN",
            "CANDID",
            "FORTHRIGHT",
            "SECRETIVE"
          ],
          "impostor": "SECRETIVE",
          "criterion_type": "synonym",
          "explanation": "The first four all mean hiding nothing; SECRETIVE means hiding everything.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "CATALYST",
            "TRIGGER",
            "STIMULUS",
            "IMPETUS",
            "OBSTACLE"
          ],
          "impostor": "OBSTACLE",
          "criterion_type": "synonym",
          "explanation": "The first four all cause something to start; an OBSTACLE stops it.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "EPIDEMIC",
            "OUTBREAK",
            "PANDEMIC",
            "PLAGUE",
            "REMEDY"
          ],
          "impostor": "REMEDY",
          "criterion_type": "semantic",
          "explanation": "All are widespread diseases; a REMEDY is the cure.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "METICULOUS",
            "RIGOROUS",
            "EXACTING",
            "PRECISE",
            "SLOPPY"
          ],
          "impostor": "SLOPPY",
          "criterion_type": "synonym",
          "explanation": "The first four all mean extremely careful; SLOPPY means done badly.",
          "level": "advanced",
          "category": "general"
        },
        {
          "words": [
            "UNPRECEDENTED",
            "UNPARALLELED",
            "UNIQUE",
            "UNMATCHED",
            "ROUTINE"
          ],
          "impostor": "ROUTINE",
          "criterion_type": "synonym",
          "explanation": "The first four mean never seen before; ROUTINE means it happens all the time.",
          "level": "advanced",
          "category": "general"
        }
      ]
    }
  }
};
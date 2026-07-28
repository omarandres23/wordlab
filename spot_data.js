const SPOT_DATA = {
 "basico": [
  {
   "sentences": [
    "She go to the gym every morning.",
    "I have two brothers and one sister.",
    "They are watching a movie right now.",
    "We usually eat dinner at seven."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "go",
   "errorType": "grammar",
   "correction": "goes",
   "explanation": "With third-person singular subjects (she/he/it) in the present simple, the verb takes an -s: 'She goes', not 'She go'."
  },
  {
   "sentences": [
    "He can speaks three languages.",
    "My mother works at a hospital.",
    "The children are playing outside.",
    "I usually wake up at six."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "speaks",
   "errorType": "grammar",
   "correction": "speak",
   "explanation": "After a modal verb like 'can', the main verb stays in its base form: 'can speak', not 'can speaks'."
  },
  {
   "sentences": [
    "We bought a new car last month.",
    "She don't like coffee in the morning.",
    "They live in a small apartment.",
    "I always brush my teeth twice a day."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "don't",
   "errorType": "grammar",
   "correction": "doesn't",
   "explanation": "Third-person singular (she/he/it) uses 'doesn't', not 'don't': 'She doesn't like coffee.'"
  },
  {
   "sentences": [
    "There is many people at the party.",
    "The dog is sleeping on the sofa.",
    "I like to read before bed.",
    "We walk to school every day."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "is",
   "errorType": "grammar",
   "correction": "are",
   "explanation": "'People' is plural, so it needs 'there are', not 'there is': 'There are many people.'"
  },
  {
   "sentences": [
    "My father drive a blue truck.",
    "She teaches English at a school.",
    "They watch TV in the evening.",
    "He plays soccer on weekends."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "drive",
   "errorType": "grammar",
   "correction": "drives",
   "explanation": "Third-person singular (my father = he) needs -s in the present simple: 'drives', not 'drive'."
  },
  {
   "sentences": [
    "I am agree with your idea.",
    "She wants to buy a new phone.",
    "We are going to the beach tomorrow.",
    "They have a big house."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "am",
   "errorType": "grammar",
   "correction": "",
   "explanation": "'Agree' is a verb, not an adjective, so you don't use 'to be' with it: 'I agree', not 'I am agree.'"
  },
  {
   "sentences": [
    "He didn't went to work yesterday.",
    "I visited my grandmother last week.",
    "We saw a great movie on Friday.",
    "She called me this morning."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "went",
   "errorType": "grammar",
   "correction": "go",
   "explanation": "After 'didn't', use the base form of the verb, not the past: 'didn't go', not 'didn't went.'"
  },
  {
   "sentences": [
    "This book is more better than that one.",
    "The weather is nice today.",
    "I finished my homework early.",
    "She speaks very quietly."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "more",
   "errorType": "grammar",
   "correction": "",
   "explanation": "'Better' is already comparative, so you don't add 'more': 'better than', not 'more better than.'"
  },
  {
   "sentences": [
    "We was very tired after the trip.",
    "They were happy with the results.",
    "I was at home all day.",
    "He was late for the meeting."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "was",
   "errorType": "grammar",
   "correction": "were",
   "explanation": "'We' is plural and takes 'were', not 'was': 'We were tired.'"
  },
  {
   "sentences": [
    "She have a beautiful garden.",
    "My brother lives in Canada.",
    "The cat is under the table.",
    "We enjoy cooking together."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "have",
   "errorType": "grammar",
   "correction": "has",
   "explanation": "Third-person singular (she) uses 'has', not 'have': 'She has a garden.'"
  },
  {
   "sentences": [
    "I don't have no money right now.",
    "She always tells the truth.",
    "We need to leave soon.",
    "They bought some fresh bread."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "no",
   "errorType": "grammar",
   "correction": "any",
   "explanation": "English avoids double negatives: use 'any' after a negative verb: 'don't have any money', not 'don't have no money.'"
  },
  {
   "sentences": [
    "He run very fast in the race.",
    "The train arrives at noon.",
    "She writes emails every day.",
    "We clean the house on Sundays."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "run",
   "errorType": "grammar",
   "correction": "runs",
   "explanation": "Third-person singular (he) needs -s in the present simple: 'runs', not 'run.'"
  },
  {
   "sentences": [
    "I seen that movie already.",
    "They arrived early this morning.",
    "She has finished her work.",
    "We have known each other for years."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "seen",
   "errorType": "grammar",
   "correction": "saw",
   "explanation": "'Seen' needs an auxiliary like 'have': use 'I saw' for simple past or 'I have seen', not 'I seen.'"
  },
  {
   "sentences": [
    "There are a book on the table.",
    "The keys are in my pocket.",
    "My friends are coming over.",
    "The stores are open late."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "are",
   "errorType": "grammar",
   "correction": "is",
   "explanation": "'A book' is singular, so it takes 'there is', not 'there are': 'There is a book.'"
  },
  {
   "sentences": [
    "She like to dance at parties.",
    "He reads the newspaper daily.",
    "We travel during the summer.",
    "They study at the library."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "like",
   "errorType": "grammar",
   "correction": "likes",
   "explanation": "Third-person singular (she) needs -s in the present simple: 'likes', not 'like.'"
  },
  {
   "sentences": [
    "I am go to the store now.",
    "She is reading a good book.",
    "They are working late tonight.",
    "We are having lunch soon."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "go",
   "errorType": "grammar",
   "correction": "going",
   "explanation": "The present continuous needs the -ing form after 'am/is/are': 'I am going', not 'I am go.'"
  },
  {
   "sentences": [
    "He don't speak French.",
    "She works from home on Fridays.",
    "We meet every Monday.",
    "They live near the park."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "don't",
   "errorType": "grammar",
   "correction": "doesn't",
   "explanation": "Third-person singular (he) uses 'doesn't', not 'don't': 'He doesn't speak French.'"
  },
  {
   "sentences": [
    "My sister and me went shopping.",
    "She and I are good friends.",
    "They invited us to dinner.",
    "He gave the book to me."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "me",
   "errorType": "grammar",
   "correction": "I",
   "explanation": "As the subject of the sentence, use 'I', not 'me': 'My sister and I went shopping.'"
  },
  {
   "sentences": [
    "The childs are playing in the yard.",
    "The babies are sleeping now.",
    "The teachers are very kind.",
    "The students are taking a test."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "childs",
   "errorType": "grammar",
   "correction": "children",
   "explanation": "'Child' has an irregular plural: 'children', not 'childs.'"
  },
  {
   "sentences": [
    "We doesn't have any plans.",
    "She doesn't eat meat.",
    "He doesn't like noise.",
    "It doesn't work anymore."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "doesn't",
   "errorType": "grammar",
   "correction": "don't",
   "explanation": "'We' is plural and takes 'don't', not 'doesn't': 'We don't have any plans.'"
  }
 ],
 "intermedio": [
  {
   "sentences": [
    "If I would have more time, I would travel more.",
    "She has been working here since 2019.",
    "They finished the project before the deadline.",
    "We are planning a trip for next summer."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "would",
   "errorType": "grammar",
   "correction": "had",
   "explanation": "In the second conditional 'if' clause, use the past simple, not 'would': 'If I had more time', not 'If I would have.'"
  },
  {
   "sentences": [
    "He has less problems than before.",
    "The report needs to be reviewed carefully.",
    "I've already sent the email to the client.",
    "She's been living in Miami for five years."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "less",
   "errorType": "grammar",
   "correction": "fewer",
   "explanation": "Use 'fewer' with countable nouns like 'problems' and 'less' with uncountable ones: 'fewer problems.'"
  },
  {
   "sentences": [
    "By the time we arrived, the meeting had already start.",
    "This is one of the best decisions we've made.",
    "The company hired ten new employees last quarter.",
    "I'm looking forward to hearing from you soon."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "start",
   "errorType": "grammar",
   "correction": "started",
   "explanation": "The past perfect needs the past participle: 'had already started', not 'had already start.'"
  },
  {
   "sentences": [
    "I look forward to meet you next week.",
    "She's interested in learning Spanish.",
    "We're used to working long hours.",
    "They objected to the new policy."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "meet",
   "errorType": "grammar",
   "correction": "meeting",
   "explanation": "After 'look forward to', the verb takes -ing because 'to' is a preposition here: 'look forward to meeting.'"
  },
  {
   "sentences": [
    "The information were very helpful.",
    "The advice she gave was excellent.",
    "The news was surprising to everyone.",
    "The furniture is quite expensive."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "were",
   "errorType": "grammar",
   "correction": "was",
   "explanation": "'Information' is uncountable and takes a singular verb: 'The information was helpful.'"
  },
  {
   "sentences": [
    "She suggested me to see a doctor.",
    "He recommended a great restaurant.",
    "They advised us to leave early.",
    "I told him about the meeting."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "me",
   "errorType": "grammar",
   "correction": "",
   "explanation": "'Suggest' isn't followed by an object + infinitive: use 'suggested that I see' or 'suggested seeing', not 'suggested me to see.'"
  },
  {
   "sentences": [
    "I'm working here for three years now.",
    "She has lived abroad since 2015.",
    "We've been friends for a long time.",
    "They have owned the shop for a decade."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "working",
   "errorType": "grammar",
   "correction": "have been working",
   "explanation": "For an action continuing from the past to now, use the present perfect continuous: 'I've been working here for three years', not 'I'm working here for three years.'"
  },
  {
   "sentences": [
    "Despite of the rain, we went out.",
    "In spite of the delay, we stayed calm.",
    "Although it was cold, we walked.",
    "Because of the traffic, we were late."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "of",
   "errorType": "grammar",
   "correction": "",
   "explanation": "'Despite' is not followed by 'of': say 'Despite the rain' or 'In spite of the rain', not 'Despite of the rain.'"
  },
  {
   "sentences": [
    "Each of the students have a laptop.",
    "Both of the managers were present.",
    "All of the tickets were sold.",
    "Some of the food was left over."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "have",
   "errorType": "grammar",
   "correction": "has",
   "explanation": "'Each' is singular and takes a singular verb: 'Each of the students has a laptop.'"
  },
  {
   "sentences": [
    "The project was made by our team.",
    "The cake was baked by my mother.",
    "The house was built in 1990.",
    "The letter was written last week."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "made",
   "errorType": "grammar",
   "correction": "done",
   "explanation": "Projects are 'done' or 'completed', not 'made': 'The project was done by our team.'"
  },
  {
   "sentences": [
    "If she will call, tell her I'm out.",
    "If it rains, we'll stay inside.",
    "If you need help, just ask.",
    "If they arrive early, we'll start."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "will",
   "errorType": "grammar",
   "correction": "",
   "explanation": "In the first conditional 'if' clause, use the present simple, not 'will': 'If she calls', not 'If she will call.'"
  },
  {
   "sentences": [
    "I've been knowing him for years.",
    "She has understood the problem.",
    "They have believed in the plan.",
    "We have owned this car since 2020."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "knowing",
   "errorType": "grammar",
   "correction": "known",
   "explanation": "Stative verbs like 'know' aren't used in continuous forms: 'I've known him for years', not 'I've been knowing him.'"
  },
  {
   "sentences": [
    "The team are winning the match.",
    "The company is expanding rapidly.",
    "The committee is meeting today.",
    "The staff is very professional."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "are",
   "errorType": "grammar",
   "correction": "is",
   "explanation": "In American English, collective nouns like 'team' take a singular verb: 'The team is winning.'"
  },
  {
   "sentences": [
    "She made me to clean my room.",
    "He let us leave early.",
    "They made him apologize.",
    "The teacher had us write an essay."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "to",
   "errorType": "grammar",
   "correction": "",
   "explanation": "After 'make' + object, use the bare infinitive without 'to': 'She made me clean', not 'She made me to clean.'"
  },
  {
   "sentences": [
    "We discussed about the budget.",
    "They talked about the project.",
    "We argued about the details.",
    "She spoke about her experience."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "about",
   "errorType": "grammar",
   "correction": "",
   "explanation": "'Discuss' is transitive and takes no preposition: 'We discussed the budget', not 'discussed about the budget.'"
  },
  {
   "sentences": [
    "He is more taller than his brother.",
    "She is smarter than everyone else.",
    "This route is faster than that one.",
    "Today is warmer than yesterday."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "more",
   "errorType": "grammar",
   "correction": "",
   "explanation": "Short adjectives form the comparative with -er alone: 'taller', not 'more taller.'"
  },
  {
   "sentences": [
    "Neither of the options are good.",
    "Either choice works for me.",
    "None of the plans were approved.",
    "Both answers are correct."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "are",
   "errorType": "grammar",
   "correction": "is",
   "explanation": "'Neither' is treated as singular in formal usage: 'Neither of the options is good.'"
  },
  {
   "sentences": [
    "I wish I would have studied harder.",
    "I wish I had more free time.",
    "She wishes she could travel more.",
    "They wish they had left earlier."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "would have",
   "errorType": "grammar",
   "correction": "had",
   "explanation": "After 'wish' about the past, use the past perfect: 'I wish I had studied harder', not 'I wish I would have studied.'"
  },
  {
   "sentences": [
    "The manager explained me the situation.",
    "She showed us the new office.",
    "He gave me some advice.",
    "They told us the truth."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "explained me",
   "errorType": "grammar",
   "correction": "explained to me",
   "explanation": "'Explain' needs 'to' before the person: 'explained the situation to me', not 'explained me the situation.'"
  },
  {
   "sentences": [
    "We have been waiting since two hours.",
    "She has worked here for a year.",
    "They've lived there since 2018.",
    "I've studied English for a decade."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "since",
   "errorType": "grammar",
   "correction": "for",
   "explanation": "Use 'for' with a period of time and 'since' with a starting point: 'waiting for two hours', not 'since two hours.'"
  }
 ],
 "avanzado": [
  {
   "sentences": [
    "The comittee approved the new budget yesterday.",
    "Her argument was both persuasive and well-structured.",
    "The negotiations lasted longer than expected.",
    "Employees are required to submit reports weekly."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "comittee",
   "errorType": "spelling",
   "correction": "committee",
   "explanation": "'Committee' has double 'm' and double 't' and double 'e': c-o-m-m-i-t-t-e-e."
  },
  {
   "sentences": [
    "The manager gave us some usefull advice.",
    "The merger was finalized after months of talks.",
    "She received an award for her outstanding performance.",
    "The board will vote on the proposal tomorrow."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "usefull",
   "errorType": "spelling",
   "correction": "useful",
   "explanation": "The suffix '-ful' is spelled with a single 'l': 'useful', not 'usefull.'"
  },
  {
   "sentences": [
    "The recieved documents were sent to legal.",
    "The client requested a full refund after the delay.",
    "Our quarterly earnings exceeded expectations.",
    "The team collaborated to meet the tight deadline."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "recieved",
   "errorType": "spelling",
   "correction": "received",
   "explanation": "Follow the 'i before e except after c' rule: 'received', not 'recieved.'"
  },
  {
   "sentences": [
    "Had I known earlier, I would have acted differently.",
    "Seldom do we see such dedication.",
    "The accomodation exceeded our expectations.",
    "Rarely has a project generated so much interest."
   ],
   "errorSentenceIndex": 2,
   "errorWord": "accomodation",
   "errorType": "spelling",
   "correction": "accommodation",
   "explanation": "'Accommodation' has double 'c' and double 'm': a-c-c-o-m-m-o-d-a-t-i-o-n."
  },
  {
   "sentences": [
    "The company's success is largely dependant on innovation.",
    "The results were consistent with our predictions.",
    "The strategy proved remarkably effective.",
    "Their commitment to quality is well documented."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "dependant",
   "errorType": "spelling",
   "correction": "dependent",
   "explanation": "As an adjective, the correct spelling is 'dependent' with an 'e': 'dependent on innovation.'"
  },
  {
   "sentences": [
    "Not only did she finish early, but she also exceeded targets.",
    "The proposal was throughly reviewed before approval.",
    "The findings were presented at the conference.",
    "Their analysis was both rigorous and insightful."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "throughly",
   "errorType": "spelling",
   "correction": "thoroughly",
   "explanation": "'Thoroughly' contains 'thorough': t-h-o-r-o-u-g-h-l-y, not 'throughly.'"
  },
  {
   "sentences": [
    "The occurence of such errors is rare.",
    "The phenomenon puzzled researchers for years.",
    "The experiment yielded conclusive results.",
    "The hypothesis was ultimately confirmed."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "occurence",
   "errorType": "spelling",
   "correction": "occurrence",
   "explanation": "'Occurrence' has double 'r' and ends in '-ence': o-c-c-u-r-r-e-n-c-e."
  },
  {
   "sentences": [
    "Scarcely had he arrived when the meeting began.",
    "The seperate departments merged last year.",
    "The transition went more smoothly than anticipated.",
    "The reforms were implemented gradually."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "seperate",
   "errorType": "spelling",
   "correction": "separate",
   "explanation": "'Separate' has an 'a' in the middle: s-e-p-a-r-a-t-e, not 'seperate.'"
  },
  {
   "sentences": [
    "Were it not for her guidance, we would have failed.",
    "The privelege of leading this team is an honor.",
    "The initiative received widespread support.",
    "The outcome surpassed all expectations."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "privelege",
   "errorType": "spelling",
   "correction": "privilege",
   "explanation": "'Privilege' is spelled with two 'i's and no 'd': p-r-i-v-i-l-e-g-e."
  },
  {
   "sentences": [
    "Had the terms been clearer, disputes could of been avoided.",
    "The agreement was mutually beneficial.",
    "The clause was subject to interpretation.",
    "The contract was legally binding."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "could of",
   "errorType": "grammar",
   "correction": "could have",
   "explanation": "'Could of' is never correct; it should be 'could have' (often heard as 'could've'): 'could have been avoided.'"
  },
  {
   "sentences": [
    "The definate deadline has not been announced.",
    "The specifications were remarkably detailed.",
    "The requirements shifted midway through the project.",
    "The milestones were clearly defined.'"
   ],
   "errorSentenceIndex": 0,
   "errorWord": "definate",
   "errorType": "spelling",
   "correction": "definite",
   "explanation": "'Definite' is spelled with 'ite' at the end: d-e-f-i-n-i-t-e, not 'definate.'"
  },
  {
   "sentences": [
    "Little did they know how significant the decision was.",
    "The maintainance costs were higher than projected.",
    "The infrastructure required substantial investment.",
    "The upgrade improved efficiency considerably."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "maintainance",
   "errorType": "spelling",
   "correction": "maintenance",
   "explanation": "'Maintenance' drops the 'i' from 'maintain': m-a-i-n-t-e-n-a-n-c-e."
  },
  {
   "sentences": [
    "Whom shall I say is calling?",
    "The candidate whom we selected declined.",
    "The person to whom I spoke was helpful.",
    "She is someone whom everyone respects."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "Whom",
   "errorType": "grammar",
   "correction": "Who",
   "explanation": "Here the pronoun is the subject of 'is calling', so use 'who': 'Who shall I say is calling?'"
  },
  {
   "sentences": [
    "The consensus among experts is overwhelming.",
    "The arguement lacked supporting evidence.",
    "The debate remained civil throughout.",
    "The conclusion followed logically."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "arguement",
   "errorType": "spelling",
   "correction": "argument",
   "explanation": "'Argument' drops the 'e' from 'argue': a-r-g-u-m-e-n-t, not 'arguement.'"
  },
  {
   "sentences": [
    "The results were more better than last year's.",
    "The revenue grew steadily each quarter.",
    "The forecast proved surprisingly accurate.",
    "The margins improved across all sectors."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "more better",
   "errorType": "grammar",
   "correction": "better",
   "explanation": "'Better' is already comparative, so 'more' is redundant: 'better than', not 'more better than.'"
  },
  {
   "sentences": [
    "Their persistant efforts finally paid off.",
    "The campaign generated significant momentum.",
    "The response was overwhelmingly positive.",
    "The strategy evolved over time."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "persistant",
   "errorType": "spelling",
   "correction": "persistent",
   "explanation": "'Persistent' ends in '-ent': p-e-r-s-i-s-t-e-n-t, not 'persistant.'"
  },
  {
   "sentences": [
    "Never before had such a challenge been faced.",
    "The liason between departments improved communication.",
    "The coordination was seamless throughout.",
    "The partnership yielded impressive results."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "liason",
   "errorType": "spelling",
   "correction": "liaison",
   "explanation": "'Liaison' has two 'i's: l-i-a-i-s-o-n, not 'liason.'"
  },
  {
   "sentences": [
    "The data suggests a clear trend.",
    "The evidence were compelling and thorough.",
    "The methodology was sound and replicable.",
    "The peer review process was rigorous."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "were",
   "errorType": "grammar",
   "correction": "was",
   "explanation": "'Evidence' is uncountable and takes a singular verb: 'The evidence was compelling.'"
  },
  {
   "sentences": [
    "The acknowledgement was greatly appreciated.",
    "The gesture of goodwill strengthened ties.",
    "The recognition was long overdue.",
    "The apology seemed sincere and heartfelt."
   ],
   "errorSentenceIndex": 0,
   "errorWord": "acknowledgement",
   "errorType": "spelling",
   "correction": "acknowledgment",
   "explanation": "In American English, 'acknowledgment' drops the 'e' after 'g': a-c-k-n-o-w-l-e-d-g-m-e-n-t."
  },
  {
   "sentences": [
    "Hardly had the ceremony begun when it started raining.",
    "The entrepeneur launched three startups.",
    "The venture attracted major investors.",
    "The enterprise expanded internationally."
   ],
   "errorSentenceIndex": 1,
   "errorWord": "entrepeneur",
   "errorType": "spelling",
   "correction": "entrepreneur",
   "explanation": "'Entrepreneur' is spelled e-n-t-r-e-p-r-e-n-e-u-r, with 'pre' in the middle."
  }
 ]
};
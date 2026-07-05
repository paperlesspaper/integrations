const dictionaryApiBase = "https://api.dictionaryapi.dev/api/v2/entries/en";
const datamuseApiUrl = "https://api.datamuse.com/words";

const wordBank = [
  {
    word: "aberration",
    partOfSpeech: "noun",
    definition: "A departure from what is normal, typical, or expected.",
    example: "The quiet train platform felt like an aberration during rush hour.",
    related: ["anomaly", "deviation", "oddity"],
    prompt: "Name one exception you noticed today.",
  },
  {
    word: "acumen",
    partOfSpeech: "noun",
    definition: "The ability to make quick, accurate judgments.",
    example: "Her financial acumen helped the studio survive a difficult year.",
    related: ["insight", "shrewdness", "judgment"],
    prompt: "Use it to describe a kind of practical intelligence.",
  },
  {
    word: "alacrity",
    partOfSpeech: "noun",
    definition: "Cheerful readiness or eagerness.",
    example: "He accepted the challenge with surprising alacrity.",
    related: ["eagerness", "readiness", "zeal"],
    prompt: "Think of a task you would do with alacrity.",
  },
  {
    word: "ameliorate",
    partOfSpeech: "verb",
    definition: "To make something bad or unsatisfactory better.",
    example: "The new shade trees will ameliorate the summer heat.",
    related: ["improve", "relieve", "mitigate"],
    prompt: "What small change could ameliorate your day?",
  },
  {
    word: "anachronism",
    partOfSpeech: "noun",
    definition: "Something that belongs to a different time period.",
    example: "The rotary phone looked like an anachronism on the modern desk.",
    related: ["throwback", "relic", "misplacement"],
    prompt: "Spot one anachronism in your surroundings.",
  },
  {
    word: "aplomb",
    partOfSpeech: "noun",
    definition: "Self-confident composure, especially under pressure.",
    example: "She handled the difficult questions with aplomb.",
    related: ["poise", "assurance", "composure"],
    prompt: "Use it for someone who stays calm in public.",
  },
  {
    word: "assiduous",
    partOfSpeech: "adjective",
    definition: "Showing great care, attention, and persistence.",
    example: "The archivist made assiduous notes on every fragile page.",
    related: ["diligent", "careful", "persistent"],
    prompt: "Where would assiduous effort pay off?",
  },
  {
    word: "auspicious",
    partOfSpeech: "adjective",
    definition: "Suggesting a favorable or successful outcome.",
    example: "The clear morning sky seemed like an auspicious sign.",
    related: ["promising", "favorable", "hopeful"],
    prompt: "Describe an auspicious beginning.",
  },
  {
    word: "bellwether",
    partOfSpeech: "noun",
    definition: "A leading indicator of a future trend.",
    example: "Early ticket sales became a bellwether for the festival's success.",
    related: ["indicator", "signal", "barometer"],
    prompt: "What is a bellwether in your field?",
  },
  {
    word: "benevolent",
    partOfSpeech: "adjective",
    definition: "Well meaning and kindly.",
    example: "The mentor's benevolent advice steadied the new team.",
    related: ["kind", "generous", "charitable"],
    prompt: "Use it to describe helpful authority.",
  },
  {
    word: "bolster",
    partOfSpeech: "verb",
    definition: "To support, strengthen, or reinforce.",
    example: "The extra evidence helped bolster her argument.",
    related: ["support", "reinforce", "strengthen"],
    prompt: "What could bolster your confidence?",
  },
  {
    word: "cacophony",
    partOfSpeech: "noun",
    definition: "A harsh, unpleasant mixture of sounds.",
    example: "The kitchen became a cacophony of pans, timers, and laughter.",
    related: ["din", "racket", "clatter"],
    prompt: "Listen for a cacophony today.",
  },
  {
    word: "capricious",
    partOfSpeech: "adjective",
    definition: "Given to sudden and unpredictable changes.",
    example: "The capricious weather turned the picnic into a puzzle.",
    related: ["fickle", "erratic", "unpredictable"],
    prompt: "Use it for weather, moods, or markets.",
  },
  {
    word: "circumspect",
    partOfSpeech: "adjective",
    definition: "Careful to consider risks before acting.",
    example: "A circumspect reply kept the negotiation moving.",
    related: ["cautious", "prudent", "wary"],
    prompt: "Where is a circumspect choice useful?",
  },
  {
    word: "coalesce",
    partOfSpeech: "verb",
    definition: "To come together and form one whole.",
    example: "The scattered ideas began to coalesce into a plan.",
    related: ["merge", "unite", "combine"],
    prompt: "What pieces are starting to coalesce?",
  },
  {
    word: "confluence",
    partOfSpeech: "noun",
    definition: "A coming together of people, things, or streams.",
    example: "The project grew from a confluence of design and research.",
    related: ["junction", "meeting", "merging"],
    prompt: "Name a confluence that shaped your week.",
  },
  {
    word: "conundrum",
    partOfSpeech: "noun",
    definition: "A confusing and difficult problem or question.",
    example: "The missing receipt created a small accounting conundrum.",
    related: ["puzzle", "dilemma", "riddle"],
    prompt: "Turn a current problem into a conundrum sentence.",
  },
  {
    word: "copious",
    partOfSpeech: "adjective",
    definition: "Abundant in supply or quantity.",
    example: "She returned from the lecture with copious notes.",
    related: ["abundant", "plentiful", "ample"],
    prompt: "What do you have in copious amounts?",
  },
  {
    word: "deference",
    partOfSpeech: "noun",
    definition: "Respectful submission to another person's judgment.",
    example: "Out of deference to the host, they waited before eating.",
    related: ["respect", "courtesy", "regard"],
    prompt: "Use it where respect changes behavior.",
  },
  {
    word: "deleterious",
    partOfSpeech: "adjective",
    definition: "Causing harm or damage.",
    example: "Sleeplessness had a deleterious effect on his patience.",
    related: ["harmful", "damaging", "injurious"],
    prompt: "What habit has a deleterious side effect?",
  },
  {
    word: "demure",
    partOfSpeech: "adjective",
    definition: "Reserved, modest, and shy in manner.",
    example: "Her demure smile hid a sharp sense of humor.",
    related: ["reserved", "modest", "quiet"],
    prompt: "Use it carefully; it often describes manner.",
  },
  {
    word: "didactic",
    partOfSpeech: "adjective",
    definition: "Intended to teach, sometimes in an overly moralizing way.",
    example: "The film was charming, but its final scene felt didactic.",
    related: ["instructive", "moralizing", "educational"],
    prompt: "Where does teaching become didactic?",
  },
  {
    word: "disparate",
    partOfSpeech: "adjective",
    definition: "Essentially different in kind; not easily compared.",
    example: "The report joined disparate data into one readable chart.",
    related: ["different", "distinct", "divergent"],
    prompt: "Combine two disparate ideas in a sentence.",
  },
  {
    word: "ebullient",
    partOfSpeech: "adjective",
    definition: "Cheerful, energetic, and full of excitement.",
    example: "The winning team returned to an ebullient crowd.",
    related: ["buoyant", "exuberant", "lively"],
    prompt: "Who has ebullient energy around you?",
  },
  {
    word: "efficacy",
    partOfSpeech: "noun",
    definition: "The ability to produce a desired result.",
    example: "The study tested the efficacy of shorter practice sessions.",
    related: ["effectiveness", "power", "usefulness"],
    prompt: "Ask whether a routine has efficacy.",
  },
  {
    word: "elucidate",
    partOfSpeech: "verb",
    definition: "To make something clear or easier to understand.",
    example: "A simple diagram helped elucidate the process.",
    related: ["explain", "clarify", "illuminate"],
    prompt: "What can you elucidate for someone today?",
  },
  {
    word: "ephemeral",
    partOfSpeech: "adjective",
    definition: "Lasting for a very short time.",
    example: "The applause was loud but ephemeral.",
    related: ["fleeting", "brief", "transient"],
    prompt: "Notice one ephemeral pleasure.",
  },
  {
    word: "equanimity",
    partOfSpeech: "noun",
    definition: "Mental calmness and steadiness under stress.",
    example: "She received the bad news with rare equanimity.",
    related: ["calm", "composure", "balance"],
    prompt: "Use it for calm under pressure.",
  },
  {
    word: "equivocal",
    partOfSpeech: "adjective",
    definition: "Open to more than one interpretation; ambiguous.",
    example: "The manager's equivocal answer did not settle the issue.",
    related: ["ambiguous", "unclear", "vague"],
    prompt: "Rewrite an equivocal sentence clearly.",
  },
  {
    word: "fastidious",
    partOfSpeech: "adjective",
    definition: "Very attentive to detail and hard to please.",
    example: "The fastidious editor caught every misplaced comma.",
    related: ["meticulous", "particular", "exacting"],
    prompt: "When is being fastidious useful?",
  },
  {
    word: "fortuitous",
    partOfSpeech: "adjective",
    definition: "Happening by chance, especially in a lucky way.",
    example: "A fortuitous delay let them avoid the storm.",
    related: ["lucky", "accidental", "fortunate"],
    prompt: "Describe a fortuitous encounter.",
  },
  {
    word: "gregarious",
    partOfSpeech: "adjective",
    definition: "Fond of company; sociable.",
    example: "The gregarious neighbor knew everyone on the block.",
    related: ["sociable", "outgoing", "friendly"],
    prompt: "Who is the most gregarious person you know?",
  },
  {
    word: "harbinger",
    partOfSpeech: "noun",
    definition: "A sign that something is coming.",
    example: "The first warm breeze was a harbinger of spring.",
    related: ["omen", "sign", "forerunner"],
    prompt: "What is a harbinger of change?",
  },
  {
    word: "incisive",
    partOfSpeech: "adjective",
    definition: "Clear, sharp, and intelligently direct.",
    example: "Her incisive comment changed the direction of the meeting.",
    related: ["sharp", "penetrating", "astute"],
    prompt: "Use it for a question that cuts through noise.",
  },
  {
    word: "inchoate",
    partOfSpeech: "adjective",
    definition: "Just begun and not fully formed.",
    example: "The team's inchoate idea needed a clearer goal.",
    related: ["undeveloped", "initial", "nascent"],
    prompt: "What inchoate project needs shape?",
  },
  {
    word: "ineffable",
    partOfSpeech: "adjective",
    definition: "Too great or intense to be expressed in words.",
    example: "The view from the ridge had an ineffable beauty.",
    related: ["indescribable", "unspeakable", "transcendent"],
    prompt: "Try describing something ineffable anyway.",
  },
  {
    word: "inexorable",
    partOfSpeech: "adjective",
    definition: "Impossible to stop, prevent, or persuade.",
    example: "The inexorable march of deadlines continued.",
    related: ["relentless", "unstoppable", "unyielding"],
    prompt: "Use it for a force that keeps moving.",
  },
  {
    word: "juxtapose",
    partOfSpeech: "verb",
    definition: "To place side by side for contrast or comparison.",
    example: "The exhibit juxtaposed ancient tools with modern devices.",
    related: ["compare", "contrast", "place together"],
    prompt: "Juxtapose two images in one sentence.",
  },
  {
    word: "laconic",
    partOfSpeech: "adjective",
    definition: "Using very few words.",
    example: "His laconic reply was simply, 'Noted.'",
    related: ["brief", "terse", "concise"],
    prompt: "Write one laconic message.",
  },
  {
    word: "liminal",
    partOfSpeech: "adjective",
    definition: "Relating to a threshold or transitional state.",
    example: "The empty airport at dawn felt strangely liminal.",
    related: ["transitional", "threshold", "in-between"],
    prompt: "Find a liminal place or moment.",
  },
  {
    word: "lucid",
    partOfSpeech: "adjective",
    definition: "Clear, easy to understand, or mentally coherent.",
    example: "The engineer gave a lucid explanation of the outage.",
    related: ["clear", "coherent", "intelligible"],
    prompt: "Make one confusing idea lucid.",
  },
  {
    word: "mellifluous",
    partOfSpeech: "adjective",
    definition: "Smooth and pleasant to hear.",
    example: "The host's mellifluous voice made the story glow.",
    related: ["smooth", "musical", "flowing"],
    prompt: "Listen for a mellifluous sound.",
  },
  {
    word: "meticulous",
    partOfSpeech: "adjective",
    definition: "Showing great attention to detail.",
    example: "The repair required meticulous work with tiny screws.",
    related: ["careful", "precise", "thorough"],
    prompt: "Where does meticulous work matter most?",
  },
  {
    word: "mitigate",
    partOfSpeech: "verb",
    definition: "To make something less severe or harmful.",
    example: "Better ventilation helped mitigate the heat.",
    related: ["lessen", "reduce", "soften"],
    prompt: "What could mitigate a small frustration?",
  },
  {
    word: "munificent",
    partOfSpeech: "adjective",
    definition: "Very generous.",
    example: "A munificent donor funded the library renovation.",
    related: ["generous", "lavish", "bountiful"],
    prompt: "Use it for generous giving.",
  },
  {
    word: "nascent",
    partOfSpeech: "adjective",
    definition: "Just coming into existence and beginning to develop.",
    example: "The nascent startup still worked from a kitchen table.",
    related: ["emerging", "newborn", "developing"],
    prompt: "What nascent habit do you want to grow?",
  },
  {
    word: "nebulous",
    partOfSpeech: "adjective",
    definition: "Vague, unclear, or poorly defined.",
    example: "The proposal sounded promising but remained nebulous.",
    related: ["vague", "unclear", "hazy"],
    prompt: "Turn a nebulous idea into a specific one.",
  },
  {
    word: "obdurate",
    partOfSpeech: "adjective",
    definition: "Stubbornly refusing to change one's opinion or course.",
    example: "The obdurate committee ignored every compromise.",
    related: ["stubborn", "unyielding", "inflexible"],
    prompt: "Use it for stubborn resistance.",
  },
  {
    word: "obfuscate",
    partOfSpeech: "verb",
    definition: "To make something unclear or difficult to understand.",
    example: "The dense jargon only served to obfuscate the policy.",
    related: ["cloud", "confuse", "muddy"],
    prompt: "Spot a sentence that obfuscates meaning.",
  },
  {
    word: "opulent",
    partOfSpeech: "adjective",
    definition: "Rich, luxurious, or lavish.",
    example: "The opulent lobby glittered with brass and marble.",
    related: ["lavish", "luxurious", "sumptuous"],
    prompt: "Describe something opulent without saying expensive.",
  },
  {
    word: "paradigm",
    partOfSpeech: "noun",
    definition: "A typical example, model, or framework for thinking.",
    example: "Remote work changed the old office paradigm.",
    related: ["model", "pattern", "framework"],
    prompt: "What paradigm has shifted recently?",
  },
  {
    word: "parsimonious",
    partOfSpeech: "adjective",
    definition: "Unwilling to spend money or use resources; frugal to excess.",
    example: "The parsimonious plan left no room for mistakes.",
    related: ["stingy", "frugal", "sparing"],
    prompt: "Use it where thrift becomes too much.",
  },
  {
    word: "pellucid",
    partOfSpeech: "adjective",
    definition: "Transparently clear in style or meaning.",
    example: "Her pellucid prose made a hard topic approachable.",
    related: ["clear", "transparent", "lucid"],
    prompt: "Rewrite one sentence to be pellucid.",
  },
  {
    word: "perfunctory",
    partOfSpeech: "adjective",
    definition: "Done with little care or interest.",
    example: "The clerk gave a perfunctory nod and returned to the screen.",
    related: ["mechanical", "cursory", "routine"],
    prompt: "What task becomes perfunctory when rushed?",
  },
  {
    word: "perspicacious",
    partOfSpeech: "adjective",
    definition: "Having keen insight and good judgment.",
    example: "The perspicacious critic noticed the film's hidden structure.",
    related: ["insightful", "astute", "perceptive"],
    prompt: "Use it for someone who sees what others miss.",
  },
  {
    word: "pragmatic",
    partOfSpeech: "adjective",
    definition: "Focused on practical results rather than theory.",
    example: "They chose a pragmatic fix that could ship by Friday.",
    related: ["practical", "realistic", "sensible"],
    prompt: "What is the pragmatic next step?",
  },
  {
    word: "precipitate",
    partOfSpeech: "verb",
    definition: "To cause something to happen suddenly or sooner than expected.",
    example: "The brief outage precipitated a longer review.",
    related: ["trigger", "provoke", "hasten"],
    prompt: "What event precipitated a change?",
  },
  {
    word: "proclivity",
    partOfSpeech: "noun",
    definition: "A natural tendency or inclination.",
    example: "He had a proclivity for turning errands into adventures.",
    related: ["tendency", "inclination", "bent"],
    prompt: "Name one harmless proclivity.",
  },
  {
    word: "quintessential",
    partOfSpeech: "adjective",
    definition: "Representing the most perfect or typical example.",
    example: "The tiny cafe was the quintessential neighborhood meeting spot.",
    related: ["classic", "typical", "definitive"],
    prompt: "What is quintessential about your city?",
  },
  {
    word: "recalcitrant",
    partOfSpeech: "adjective",
    definition: "Resisting authority, control, or instruction.",
    example: "The recalcitrant printer refused to connect.",
    related: ["defiant", "stubborn", "uncooperative"],
    prompt: "Use it humorously for a troublesome object.",
  },
  {
    word: "resilient",
    partOfSpeech: "adjective",
    definition: "Able to recover quickly from difficulty.",
    example: "The resilient team adapted after the first plan failed.",
    related: ["tough", "adaptable", "durable"],
    prompt: "What makes a system resilient?",
  },
  {
    word: "sagacious",
    partOfSpeech: "adjective",
    definition: "Wise, discerning, and showing good judgment.",
    example: "Her sagacious advice prevented an expensive mistake.",
    related: ["wise", "judicious", "prudent"],
    prompt: "Use it for advice that proves right.",
  },
  {
    word: "salient",
    partOfSpeech: "adjective",
    definition: "Most noticeable, important, or relevant.",
    example: "The salient point was buried in the last paragraph.",
    related: ["important", "prominent", "relevant"],
    prompt: "Find the salient point in a conversation.",
  },
  {
    word: "sanguine",
    partOfSpeech: "adjective",
    definition: "Optimistic, especially in a difficult situation.",
    example: "Despite the delay, the director remained sanguine.",
    related: ["hopeful", "optimistic", "confident"],
    prompt: "Use it for optimism with evidence.",
  },
  {
    word: "serendipity",
    partOfSpeech: "noun",
    definition: "The occurrence of a fortunate discovery by chance.",
    example: "Finding the perfect book in a station kiosk felt like serendipity.",
    related: ["chance", "luck", "fortune"],
    prompt: "Recall a moment of serendipity.",
  },
  {
    word: "solicitous",
    partOfSpeech: "adjective",
    definition: "Showing attentive care or concern.",
    example: "The nurse was solicitous without being intrusive.",
    related: ["attentive", "concerned", "considerate"],
    prompt: "Use it for careful kindness.",
  },
  {
    word: "spurious",
    partOfSpeech: "adjective",
    definition: "Not genuine, valid, or true.",
    example: "The graph suggested a spurious connection between the variables.",
    related: ["false", "bogus", "invalid"],
    prompt: "Where might a spurious pattern appear?",
  },
  {
    word: "stoic",
    partOfSpeech: "adjective",
    definition: "Enduring pain or hardship without complaint.",
    example: "He stayed stoic through the long delay.",
    related: ["uncomplaining", "resolute", "calm"],
    prompt: "Use it for quiet endurance.",
  },
  {
    word: "succinct",
    partOfSpeech: "adjective",
    definition: "Briefly and clearly expressed.",
    example: "The best bug report was succinct and complete.",
    related: ["concise", "brief", "compact"],
    prompt: "Make one message more succinct.",
  },
  {
    word: "surreptitious",
    partOfSpeech: "adjective",
    definition: "Kept secret, especially because it would not be approved.",
    example: "They exchanged a surreptitious glance during the meeting.",
    related: ["secret", "stealthy", "covert"],
    prompt: "Use it for a hidden action.",
  },
  {
    word: "tenacious",
    partOfSpeech: "adjective",
    definition: "Holding firmly to something; persistent.",
    example: "The tenacious researcher kept testing new explanations.",
    related: ["persistent", "determined", "stubborn"],
    prompt: "What goal deserves tenacious effort?",
  },
  {
    word: "trenchant",
    partOfSpeech: "adjective",
    definition: "Vigorous, sharp, and effective in expression.",
    example: "The essay offered a trenchant critique of the proposal.",
    related: ["sharp", "forceful", "incisive"],
    prompt: "Use it for a strong, precise criticism.",
  },
  {
    word: "ubiquitous",
    partOfSpeech: "adjective",
    definition: "Present, appearing, or found everywhere.",
    example: "Charging cables have become ubiquitous in airport lounges.",
    related: ["everywhere", "pervasive", "omnipresent"],
    prompt: "Name something ubiquitous in modern life.",
  },
  {
    word: "venerable",
    partOfSpeech: "adjective",
    definition: "Respected because of age, wisdom, or character.",
    example: "The venerable theater still hosted new playwrights.",
    related: ["respected", "honored", "esteemed"],
    prompt: "Use it for an old institution.",
  },
  {
    word: "vicarious",
    partOfSpeech: "adjective",
    definition: "Experienced through another person's actions or feelings.",
    example: "She felt vicarious excitement through her friend's success.",
    related: ["indirect", "secondhand", "borrowed"],
    prompt: "What gives you vicarious joy?",
  },
  {
    word: "vociferous",
    partOfSpeech: "adjective",
    definition: "Loud, forceful, and outspoken.",
    example: "The proposal met with vociferous opposition.",
    related: ["loud", "vehement", "outspoken"],
    prompt: "Use it for public disagreement.",
  },
  {
    word: "winsome",
    partOfSpeech: "adjective",
    definition: "Attractive or appealing in a fresh, innocent way.",
    example: "The singer's winsome charm filled the small room.",
    related: ["charming", "appealing", "engaging"],
    prompt: "Use it for gentle charm.",
  },
];

const partOfSpeechMap = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
};

function unique(items) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function cleanWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDate(value) {
  const input = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  return new Date().toISOString().slice(0, 10);
}

function dayNumber(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function hashString(value) {
  let hash = 0;
  for (const character of String(value || "")) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function integer(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function modulo(value, length) {
  return ((value % length) + length) % length;
}

function dailyEntry(query) {
  const date = cleanDate(query.date);
  const offset = integer(query.offset, 0);
  const seed = String(query.seed || "");
  const index = modulo(dayNumber(date) - dayNumber("2024-01-01") + hashString(seed) + offset, wordBank.length);
  return { entry: wordBank[index], date, index };
}

function selectedEntry(query) {
  const selection = String(query.selection || "daily").toLowerCase();
  const customWord = cleanWord(query.customWord || query.word);

  if (selection === "custom" && customWord) {
    return {
      entry:
        wordBank.find((item) => item.word === customWord) || {
          word: customWord,
          partOfSpeech: "",
          definition: "",
          example: "",
          related: [],
          prompt: "Try using this word in one clear sentence today.",
        },
      date: cleanDate(query.date),
      index: -1,
    };
  }

  if (selection === "random") {
    const index = Math.floor(Math.random() * wordBank.length);
    return { entry: wordBank[index], date: cleanDate(query.date), index };
  }

  return dailyEntry(query);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Dictionary request failed with ${response.status}`);
  }

  return response.json();
}

function clueWords(fallback) {
  return unique([
    ...String(fallback.definition || "").toLowerCase().split(/[^a-z]+/),
    ...(fallback.related || []),
  ]).filter((word) => word.length > 4);
}

function definitionScore(definition, fallback) {
  const text = String(definition?.definition || "").toLowerCase();
  return clueWords(fallback).reduce(
    (score, word) => score + (text.includes(word.toLowerCase()) ? 1 : 0),
    0,
  );
}

function bestDefinition(definitions, fallback) {
  const candidates = (definitions || []).filter((item) => item.definition);
  if (!candidates.length) {
    return {};
  }

  return candidates
    .map((definition, index) => ({
      definition,
      index,
      score: definitionScore(definition, fallback),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0].definition;
}

function firstDefinition(entry, fallback) {
  const meanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
  const preferred =
    meanings.find((meaning) => meaning.partOfSpeech === fallback.partOfSpeech && meaning.definitions?.length) ||
    meanings.find((meaning) => meaning.definitions?.length);
  const definition = bestDefinition(preferred?.definitions, fallback);
  return { meaning: preferred || {}, definition };
}

function shapeDictionaryApiResult(payload, fallback) {
  const entry = Array.isArray(payload) ? payload[0] : null;
  if (!entry) {
    return null;
  }

  const { meaning, definition } = firstDefinition(entry, fallback);
  const phonetic =
    entry.phonetic ||
    entry.phonetics?.find((item) => item.text)?.text ||
    "";
  const sourceUrl = Array.isArray(entry.sourceUrls) ? entry.sourceUrls[0] : "";

  return {
    word: entry.word || fallback.word,
    pronunciation: phonetic,
    partOfSpeech: meaning.partOfSpeech || fallback.partOfSpeech,
    definition: definition.definition || "",
    example: definition.example || "",
    related: unique([...(meaning.synonyms || []), ...(definition.synonyms || [])]).slice(0, 5),
    antonyms: unique([...(meaning.antonyms || []), ...(definition.antonyms || [])]).slice(0, 4),
    sourceName: "Free Dictionary API",
    sourceUrl: sourceUrl || `https://dictionaryapi.dev/`,
  };
}

function parseDatamuseDefinition(item) {
  const raw = Array.isArray(item?.defs) ? item.defs[0] : "";
  if (!raw) {
    return {};
  }

  const [tag, definition] = raw.split("\t");
  return {
    partOfSpeech: partOfSpeechMap[tag] || tag || "",
    definition: definition || "",
  };
}

function shapeDatamuseResult(payload) {
  const entry = Array.isArray(payload) ? payload[0] : null;
  if (!entry) {
    return null;
  }

  const parsed = parseDatamuseDefinition(entry);
  return {
    word: entry.word,
    partOfSpeech: parsed.partOfSpeech,
    definition: parsed.definition,
    syllables: entry.numSyllables || null,
    sourceName: "Datamuse",
    sourceUrl: "https://www.datamuse.com/api/",
  };
}

async function lookupWord(fallback) {
  const word = cleanWord(fallback.word);
  let dictionary = null;
  let datamuse = null;

  try {
    dictionary = shapeDictionaryApiResult(
      await fetchJson(`${dictionaryApiBase}/${encodeURIComponent(word)}`),
      fallback,
    );
  } catch (error) {
    dictionary = { error: error.message };
  }

  try {
    const url = new URL(datamuseApiUrl);
    url.searchParams.set("sp", word);
    url.searchParams.set("md", "dps");
    url.searchParams.set("max", "1");
    datamuse = shapeDatamuseResult(await fetchJson(url));
  } catch (error) {
    datamuse = { error: error.message };
  }

  const best = dictionary?.definition ? dictionary : datamuse?.definition ? datamuse : {};

  return {
    word,
    pronunciation: dictionary?.pronunciation || "",
    partOfSpeech: best.partOfSpeech || fallback.partOfSpeech || "",
    definition: best.definition || fallback.definition || "No public dictionary definition was found for this word.",
    example: dictionary?.example || fallback.example || "",
    related: unique([...(dictionary?.related || []), ...(fallback.related || [])]).slice(0, 5),
    antonyms: dictionary?.antonyms || [],
    syllables: datamuse?.syllables || null,
    prompt: fallback.prompt || "Try using this word in one clear sentence today.",
    sourceName: best.sourceName || "Local word bank",
    sourceUrl: best.sourceUrl || "",
    apiErrors: unique([dictionary?.error, datamuse?.error]),
  };
}

export default async function handler({ query }) {
  const { entry, date, index } = selectedEntry(query);
  const word = await lookupWord(entry);

  return {
    ...word,
    date,
    index,
    totalWords: wordBank.length,
    selection: String(query.selection || "daily").toLowerCase(),
    updatedAt: new Date().toISOString(),
  };
}

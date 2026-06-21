const facts = [
  {
    topic: "dinosaurs",
    title: {
      en: "Birds Are Living Dinosaurs",
      de: "Voegel sind lebende Dinosaurier",
    },
    fact: {
      en: "Every sparrow, penguin, and eagle belongs to the dinosaur family tree. Scientists call birds avian dinosaurs.",
      de: "Jeder Spatz, Pinguin und Adler gehoert zum Stammbaum der Dinosaurier. Forschende nennen Voegel aviale Dinosaurier.",
    },
    detail: {
      en: "Feathers first helped some dinosaurs stay warm, show off, or glide before powered flight became common.",
      de: "Federn halfen manchen Dinosauriern zuerst beim Warmbleiben, Auffallen oder Gleiten, bevor aktiver Flug haeufig wurde.",
    },
    question: {
      en: "Which bird near you looks most dinosaur-like?",
      de: "Welcher Vogel in deiner Naehe sieht am meisten wie ein Dinosaurier aus?",
    },
  },
  {
    topic: "dinosaurs",
    title: {
      en: "Velociraptor Was Not Giant",
      de: "Velociraptor war nicht riesig",
    },
    fact: {
      en: "A real Velociraptor was about the size of a turkey, with feathers and a long stiff tail for balance.",
      de: "Ein echter Velociraptor war etwa so gross wie ein Truthahn, hatte Federn und einen langen steifen Schwanz fuer Balance.",
    },
    detail: {
      en: "The huge movie raptors were closer in size to a different dinosaur called Deinonychus.",
      de: "Die riesigen Film-Raptoren waren eher so gross wie ein anderer Dinosaurier namens Deinonychus.",
    },
    question: {
      en: "Would a small fast dinosaur be harder to spot than a huge one?",
      de: "Waere ein kleiner schneller Dinosaurier schwerer zu entdecken als ein riesiger?",
    },
  },
  {
    topic: "dinosaurs",
    title: {
      en: "Triceratops Had Tooth Stacks",
      de: "Triceratops hatte Zahn-Stapel",
    },
    fact: {
      en: "Triceratops had hundreds of teeth packed in rows. Worn teeth were replaced like a slow conveyor belt.",
      de: "Triceratops hatte Hunderte Zaehne in Reihen. Abgenutzte Zaehne wurden wie auf einem langsamen Foerderband ersetzt.",
    },
    detail: {
      en: "That helped it grind tough plants with its powerful beak and jaws.",
      de: "So konnte er mit seinem kraeftigen Schnabel und Kiefer zaehe Pflanzen zerkleinern.",
    },
    question: {
      en: "What kind of plants would need super-strong teeth?",
      de: "Welche Pflanzen brauchen besonders starke Zaehne?",
    },
  },
  {
    topic: "dinosaurs",
    title: {
      en: "Footprints Tell Stories",
      de: "Fussspuren erzaehlen Geschichten",
    },
    fact: {
      en: "Fossil footprints can show how fast a dinosaur moved, whether it traveled in groups, and even where mud was soft.",
      de: "Versteinerte Fussspuren zeigen, wie schnell ein Dinosaurier lief, ob er in Gruppen unterwegs war und wo Schlamm weich war.",
    },
    detail: {
      en: "A trail of prints is called a trackway.",
      de: "Eine Spur aus vielen Abdruecken nennt man Faehrte.",
    },
    question: {
      en: "What would your footprints say about your morning?",
      de: "Was wuerden deine Fussspuren ueber deinen Morgen verraten?",
    },
  },
  {
    topic: "dinosaurs",
    title: {
      en: "Ankylosaurus Wore Armor",
      de: "Ankylosaurus trug Panzer",
    },
    fact: {
      en: "Ankylosaurus had bony plates under its skin and a heavy tail club that could swing like a shield with a handle.",
      de: "Ankylosaurus hatte Knochenplatten unter der Haut und eine schwere Schwanzkeule, die wie ein Schild mit Griff schwingen konnte.",
    },
    detail: {
      en: "Its eyelids even had tiny bony shields.",
      de: "Sogar seine Augenlider hatten winzige Knochenschilde.",
    },
    question: {
      en: "Would armor make an animal brave, slow, or both?",
      de: "Macht ein Panzer ein Tier mutig, langsam oder beides?",
    },
  },
  {
    topic: "dinosaurs",
    title: {
      en: "Sauropods Were Neck Champions",
      de: "Sauropoden waren Hals-Meister",
    },
    fact: {
      en: "Some sauropod dinosaurs had necks longer than a school bus, letting them browse plants like living cranes.",
      de: "Manche Sauropoden hatten Haelse länger als ein Schulbus und konnten Pflanzen wie lebende Kräne erreichen.",
    },
    detail: {
      en: "Their bones had air spaces that helped keep the neck lighter.",
      de: "Ihre Knochen hatten Luftraeume, die den Hals leichter machten.",
    },
    question: {
      en: "What would be easy if your neck were that long?",
      de: "Was waere leicht, wenn dein Hals so lang waere?",
    },
  },
  {
    topic: "dinosaurs",
    title: {
      en: "Stegosaurus Had A Tiny Head",
      de: "Stegosaurus hatte einen kleinen Kopf",
    },
    fact: {
      en: "Stegosaurus was as long as a small bus, but its head was only about the size of a large dog head.",
      de: "Stegosaurus war so lang wie ein kleiner Bus, aber sein Kopf war nur etwa so gross wie der Kopf eines grossen Hundes.",
    },
    detail: {
      en: "Its famous back plates may have helped with display, recognition, or body temperature.",
      de: "Seine beruehmten Rueckenplatten halfen vielleicht beim Auffallen, Erkennen oder bei der Koerpertemperatur.",
    },
    question: {
      en: "Why might bright plates be useful?",
      de: "Warum könnten auffaellige Platten nuetzlich sein?",
    },
  },
  {
    topic: "space",
    title: {
      en: "Venus Has A Slow Day",
      de: "Venus hat einen langsamen Tag",
    },
    fact: {
      en: "One day on Venus is longer than one Venus year. It spins so slowly that sunrise takes a very long time.",
      de: "Ein Tag auf der Venus ist länger als ein Venusjahr. Sie dreht sich so langsam, dass der Sonnenaufgang sehr lange dauert.",
    },
    detail: {
      en: "Venus also spins backward compared with most planets.",
      de: "Venus dreht sich ausserdem im Vergleich zu den meisten Planeten rueckwaerts.",
    },
    question: {
      en: "What would you do with a day longer than a year?",
      de: "Was wuerdest du mit einem Tag machen, der länger als ein Jahr ist?",
    },
  },
  {
    topic: "space",
    title: {
      en: "Sunlight Takes A Trip",
      de: "Sonnenlicht reist zu uns",
    },
    fact: {
      en: "Light from the Sun takes about eight minutes to reach Earth, even though it moves faster than anything else.",
      de: "Licht von der Sonne braucht etwa acht Minuten bis zur Erde, obwohl es schneller ist als alles andere.",
    },
    detail: {
      en: "That means we see the Sun as it was a few minutes ago.",
      de: "Das bedeutet: Wir sehen die Sonne so, wie sie vor ein paar Minuten war.",
    },
    question: {
      en: "What else reaches you after a delay?",
      de: "Was kommt bei dir noch mit Verzoegerung an?",
    },
  },
  {
    topic: "space",
    title: {
      en: "The Moon Is Drifting Away",
      de: "Der Mond entfernt sich",
    },
    fact: {
      en: "The Moon moves about 3.8 centimeters farther from Earth each year, roughly the width of a small cookie.",
      de: "Der Mond entfernt sich jedes Jahr etwa 3,8 Zentimeter von der Erde, ungefaehr so breit wie ein kleiner Keks.",
    },
    detail: {
      en: "Astronauts left reflectors on the Moon so scientists can measure the distance with lasers.",
      de: "Astronauten liessen Reflektoren auf dem Mond, damit Forschende die Entfernung mit Lasern messen können.",
    },
    question: {
      en: "How would nights change if the Moon looked smaller?",
      de: "Wie wuerden Naechte aussehen, wenn der Mond kleiner wirkte?",
    },
  },
  {
    topic: "space",
    title: {
      en: "Mars Has A Giant Volcano",
      de: "Mars hat einen Riesenvulkan",
    },
    fact: {
      en: "Olympus Mons on Mars is the tallest known volcano in the Solar System, about three times the height of Mount Everest.",
      de: "Olympus Mons auf dem Mars ist der hoechste bekannte Vulkan im Sonnensystem, etwa dreimal so hoch wie der Mount Everest.",
    },
    detail: {
      en: "Its base is so wide that it would cover a large country-sized area.",
      de: "Seine Basis ist so breit, dass sie ein sehr grosses Gebiet bedecken wuerde.",
    },
    question: {
      en: "Would you rather climb a tall mountain or explore a wide one?",
      de: "Wuerdest du lieber einen hohen oder einen sehr breiten Berg erkunden?",
    },
  },
  {
    topic: "space",
    title: {
      en: "Space Is Mostly Quiet",
      de: "Im Weltall ist es meist still",
    },
    fact: {
      en: "Sound needs air, water, or another material to travel. In empty space, there is almost nothing to carry it.",
      de: "Schall braucht Luft, Wasser oder ein anderes Material. Im leeren Weltall gibt es fast nichts, das ihn tragen kann.",
    },
    detail: {
      en: "Astronauts use radios because radio waves can cross space.",
      de: "Astronautinnen und Astronauten nutzen Funk, weil Radiowellen durch den Weltraum reisen können.",
    },
    question: {
      en: "How would you communicate without sound?",
      de: "Wie wuerdest du dich ohne Schall verständigen?",
    },
  },
  {
    topic: "space",
    title: {
      en: "Saturn Is Light For Its Size",
      de: "Saturn ist fuer seine Groesse leicht",
    },
    fact: {
      en: "Saturn is made mostly of hydrogen and helium, so its average density is lower than water.",
      de: "Saturn besteht vor allem aus Wasserstoff und Helium, deshalb ist seine durchschnittliche Dichte niedriger als die von Wasser.",
    },
    detail: {
      en: "It is still huge: more than 700 Earths could fit inside its volume.",
      de: "Trotzdem ist er riesig: In sein Volumen wuerden mehr als 700 Erden passen.",
    },
    question: {
      en: "Can something be enormous and still light for its size?",
      de: "Kann etwas riesig und fuer seine Groesse trotzdem leicht sein?",
    },
  },
  {
    topic: "space",
    title: {
      en: "Moon Prints Last Ages",
      de: "Mondspuren bleiben lange",
    },
    fact: {
      en: "Footprints on the Moon can last for a very long time because there is no wind or rain to wash them away.",
      de: "Fussspuren auf dem Mond können sehr lange bleiben, weil es dort keinen Wind und keinen Regen gibt, der sie wegwischt.",
    },
    detail: {
      en: "Tiny space rocks can still slowly disturb the surface.",
      de: "Winzige Weltraumsteine können die Oberflaeche aber langsam verändern.",
    },
    question: {
      en: "Where would you leave a message that lasts?",
      de: "Wo wuerdest du eine Botschaft hinterlassen, die lange bleibt?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Octopuses Have Blue Blood",
      de: "Oktopusse haben blaues Blut",
    },
    fact: {
      en: "Octopuses have blue blood and three hearts. Two hearts help move blood past the gills.",
      de: "Oktopusse haben blaues Blut und drei Herzen. Zwei Herzen helfen, Blut an den Kiemen vorbeizubewegen.",
    },
    detail: {
      en: "Their blood uses copper-rich hemocyanin instead of iron-rich hemoglobin.",
      de: "Ihr Blut nutzt kupferreiches Haemocyanin statt eisenreichem Haemoglobin.",
    },
    question: {
      en: "Why might ocean animals need special tricks?",
      de: "Warum brauchen Meerestiere besondere Tricks?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Honeybees Dance Directions",
      de: "Honigbienen tanzen Wege",
    },
    fact: {
      en: "Honeybees can do a waggle dance that tells other bees where to find good food.",
      de: "Honigbienen können einen Schwänzeltanz machen, der anderen Bienen zeigt, wo gutes Futter ist.",
    },
    detail: {
      en: "The angle of the dance points toward the food compared with the Sun.",
      de: "Der Winkel des Tanzes zeigt die Richtung zum Futter im Vergleich zur Sonne.",
    },
    question: {
      en: "Could you invent a dance that points to breakfast?",
      de: "Kannst du einen Tanz erfinden, der zum Fruehstueck zeigt?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Penguins Fly Underwater",
      de: "Pinguine fliegen unter Wasser",
    },
    fact: {
      en: "Penguins cannot fly through air, but their flippers work like wings underwater as they chase fish.",
      de: "Pinguine können nicht durch die Luft fliegen, aber ihre Flossen funktionieren unter Wasser wie Flügel.",
    },
    detail: {
      en: "Their streamlined bodies help them turn quickly.",
      de: "Ihre stromlinienfoermigen Koerper helfen ihnen, schnell die Richtung zu wechseln.",
    },
    question: {
      en: "Would swimming feel different if your arms were wings?",
      de: "Wuerde Schwimmen anders sein, wenn deine Arme Flügel waeren?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Elephants Hear Rumbles",
      de: "Elefanten hoeren Rumpeln",
    },
    fact: {
      en: "Elephants can use very low rumbles that travel far through air and even through the ground.",
      de: "Elefanten können sehr tiefe Rumpellaute nutzen, die weit durch Luft und sogar durch den Boden reisen.",
    },
    detail: {
      en: "Their sensitive feet and trunks help them notice vibrations.",
      de: "Ihre empfindlichen Fuesse und Ruessel helfen ihnen, Schwingungen zu bemerken.",
    },
    question: {
      en: "What would you listen for with your feet?",
      de: "Worauf wuerdest du mit deinen Fuessen lauschen?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Giraffes Have Dark Tongues",
      de: "Giraffen haben dunkle Zungen",
    },
    fact: {
      en: "A giraffe tongue can be about 45 centimeters long and is dark, which may help protect it from the Sun.",
      de: "Eine Giraffenzunge kann etwa 45 Zentimeter lang sein und ist dunkel, was sie vielleicht vor Sonne schuetzt.",
    },
    detail: {
      en: "The tongue helps pull leaves from thorny branches.",
      de: "Die Zunge hilft, Blaetter von dornigen Zweigen zu ziehen.",
    },
    question: {
      en: "What snack would be easier with a super-long tongue?",
      de: "Welcher Snack waere mit einer superlangen Zunge leichter?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Arctic Terns Travel Far",
      de: "Kuestenseeschwalben reisen weit",
    },
    fact: {
      en: "Arctic terns migrate between the Arctic and Antarctic, seeing more daylight than almost any other animal.",
      de: "Kuestenseeschwalben ziehen zwischen Arktis und Antarktis und erleben mehr Tageslicht als fast jedes andere Tier.",
    },
    detail: {
      en: "Their round-trip journey can span tens of thousands of kilometers.",
      de: "Ihre Hin- und Rueckreise kann Zehntausende Kilometer lang sein.",
    },
    question: {
      en: "What would you pack for a pole-to-pole trip?",
      de: "Was wuerdest du fuer eine Reise von Pol zu Pol einpacken?",
    },
  },
  {
    topic: "animals",
    title: {
      en: "Sea Otters Use Tools",
      de: "Seeotter benutzen Werkzeuge",
    },
    fact: {
      en: "Sea otters can use rocks like tools to crack open shellfish while floating on their backs.",
      de: "Seeotter können Steine wie Werkzeuge benutzen, um Muscheln zu knacken, waehrend sie auf dem Ruecken treiben.",
    },
    detail: {
      en: "Some even keep a favorite rock tucked in a loose skin pouch.",
      de: "Manche bewahren sogar einen Lieblingsstein in einer lockeren Hauttasche auf.",
    },
    question: {
      en: "What tool would you keep in a pocket all day?",
      de: "Welches Werkzeug wuerdest du den ganzen Tag in einer Tasche tragen?",
    },
  },
];

const supportedTopics = ["mixed", "dinosaurs", "space", "animals"];
const supportedLanguages = ["en", "de"];

function dayKeyFromDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isFinite(date.getTime())) {
    return dayKeyFromDate(new Date());
  }

  return date.toISOString().slice(0, 10);
}

function hash(value) {
  let result = 2166136261;
  const input = String(value);
  for (let index = 0; index < input.length; index += 1) {
    result ^= input.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }

  return result >>> 0;
}

function normalizeTopic(value) {
  const topic = String(value || "mixed")
    .trim()
    .toLowerCase();
  return supportedTopics.includes(topic) ? topic : "mixed";
}

function normalizeLanguage(value) {
  const requested = String(value || "en")
    .trim()
    .toLowerCase();
  const base = requested.split("-")[0];
  return supportedLanguages.includes(base) ? base : "en";
}

function localize(record, language) {
  return {
    topic: record.topic,
    title: record.title[language] || record.title.en,
    fact: record.fact[language] || record.fact.en,
    detail: record.detail[language] || record.detail.en,
    question: record.question[language] || record.question.en,
  };
}

export default async function handler({ query = {} } = {}) {
  const topic = normalizeTopic(query.topic);
  const language = normalizeLanguage(query.language);
  const dayKey = dayKeyFromDate(query.date);
  const seed = String(query.seed || "");
  const pool =
    topic === "mixed" ? facts : facts.filter((fact) => fact.topic === topic);
  const index = hash(`${dayKey}:${topic}:${seed}`) % pool.length;
  const record = pool[index];

  return {
    ...localize(record, language),
    dayKey,
    index,
    poolSize: pool.length,
    topicMode: topic,
    source: "Curated local fact bank",
    updatedAt: new Date().toISOString(),
  };
}

const copy = {
  de: { title: "Erde", extract: "Die Erde ist der dritte Planet des Sonnensystems. Ozeane bedecken rund 71 Prozent ihrer Oberfläche. Ihre Atmosphäre und flüssiges Wasser ermöglichen das Leben. Ein Umlauf um die Sonne dauert etwa 365 Tage, eine Drehung um die eigene Achse ungefähr 24 Stunden.", titles: ["Erde", "Sonnensystem", "Mond", "Internationale Raumstation", "Sonnenfinsternis", "Mars", "Milchstraße", "James-Webb-Weltraumteleskop", "Jupiter", "Saturn"], events: ["Apollo 11 startet zum ersten bemannten Flug mit einer Landung auf dem Mond.", "Der erste Atombombentest findet in New Mexico statt.", "Der Komet Shoemaker-Levy 9 beginnt mit dem Jupiter zu kollidieren."] },
  en: { title: "Earth", extract: "Earth is the third planet from the Sun. Oceans cover about 71 percent of its surface. Its atmosphere and liquid water make life possible. One orbit around the Sun takes about 365 days, while a rotation on its axis takes approximately 24 hours.", titles: ["Earth", "Solar System", "Moon", "International Space Station", "Solar eclipse", "Mars", "Milky Way", "James Webb Space Telescope", "Jupiter", "Saturn"], events: ["Apollo 11 launches on the first crewed mission to land on the Moon.", "The first nuclear weapons test takes place in New Mexico.", "Comet Shoemaker–Levy 9 begins colliding with Jupiter."] },
  fr: { title: "Terre", extract: "La Terre est la troisième planète du Système solaire. Les océans couvrent environ 71 % de sa surface. Son atmosphère et l’eau liquide permettent la vie. Une révolution autour du Soleil dure environ 365 jours, et une rotation sur son axe près de 24 heures.", titles: ["Terre", "Système solaire", "Lune", "Station spatiale internationale", "Éclipse solaire", "Mars", "Voie lactée", "Télescope spatial James-Webb", "Jupiter", "Saturne"], events: ["Apollo 11 décolle pour la première mission habitée à se poser sur la Lune.", "Le premier essai nucléaire a lieu au Nouveau-Mexique.", "La comète Shoemaker-Levy 9 commence à entrer en collision avec Jupiter."] },
  es: { title: "Tierra", extract: "La Tierra es el tercer planeta del sistema solar. Los océanos cubren aproximadamente el 71 % de su superficie. Su atmósfera y el agua líquida permiten la vida. Una órbita alrededor del Sol dura unos 365 días y una rotación sobre su eje, aproximadamente 24 horas.", titles: ["Tierra", "Sistema solar", "Luna", "Estación Espacial Internacional", "Eclipse solar", "Marte", "Vía Láctea", "Telescopio espacial James Webb", "Júpiter", "Saturno"], events: ["El Apolo 11 despega en la primera misión tripulada que aterrizará en la Luna.", "La primera prueba nuclear tiene lugar en Nuevo México.", "El cometa Shoemaker-Levy 9 comienza a colisionar con Júpiter."] },
};
export function sampleData({ edition, kind, limit, limitCharacters, showImage }) {
  const c = copy[edition] || copy.en;
  return {
    edition, kind, showImage, date: "2026-07-16", sample: true,
    article: { title: c.title, extract: c.extract.slice(0, limitCharacters) + (c.extract.length > limitCharacters ? "…" : ""), image: "./assets/sample-earth.jpg", url: `https://${edition}.wikipedia.org/wiki/${encodeURIComponent(c.title)}` },
    events: c.events.map((text, i) => ({ year: [1969, 1945, 1994][i], text, image: showImage ? "./assets/sample-earth.jpg" : "" })).slice(0, limit),
    image: "./assets/sample-earth.jpg", imageTitle: c.title,
    articles: Array.from({ length: Math.min(limit, 20) }, (_, i) => {
      const views = Math.round(520000 / (i + 1));
      const history = [0.2, 0.4, 0.35, 0.6, 0.5, i % 3 ? 1.25 : 0.6, 1].map((n) => Math.round(views * n));
      return { title: c.titles[i % c.titles.length], rank: i + 1, views, history, change: (views - history[5]) / history[5] * 100, rankChange: i % 3 ? -2 : 4, newEntry: false };
    }),
    partial: false,
  };
}

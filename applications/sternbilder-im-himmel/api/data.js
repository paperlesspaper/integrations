const constellationCatalog = {
  Orion: {
    labelKey: "Orion",
    accent: "gold",
    x: 54,
    y: 49,
    stars: [
      ["Betelgeuse", 46, 31, 1.25],
      ["Bellatrix", 57, 33, 1.05],
      ["Alnitak", 49, 45, 0.9],
      ["Alnilam", 53, 46, 1.05],
      ["Mintaka", 57, 45, 0.9],
      ["Saiph", 48, 63, 0.95],
      ["Rigel", 62, 64, 1.25]
    ],
    lines: [
      ["Betelgeuse", "Alnitak"],
      ["Alnitak", "Alnilam"],
      ["Alnilam", "Mintaka"],
      ["Mintaka", "Bellatrix"],
      ["Betelgeuse", "Bellatrix"],
      ["Alnitak", "Saiph"],
      ["Mintaka", "Rigel"],
      ["Saiph", "Rigel"]
    ],
    note: "A bright winter pattern with the three belt stars at its center."
  },
  "Ursa Major": {
    labelKey: "Ursa Major",
    accent: "red",
    x: 26,
    y: 27,
    stars: [
      ["Dubhe", 18, 18, 1.15],
      ["Merak", 25, 25, 1.0],
      ["Phecda", 35, 29, 0.9],
      ["Megrez", 43, 24, 0.82],
      ["Alioth", 53, 20, 1.05],
      ["Mizar", 62, 21, 1.05],
      ["Alkaid", 72, 17, 1.0]
    ],
    lines: [
      ["Dubhe", "Merak"],
      ["Merak", "Phecda"],
      ["Phecda", "Megrez"],
      ["Megrez", "Dubhe"],
      ["Megrez", "Alioth"],
      ["Alioth", "Mizar"],
      ["Mizar", "Alkaid"]
    ],
    note: "The Big Dipper is the best-known part of this northern constellation."
  },
  Cassiopeia: {
    labelKey: "Cassiopeia",
    accent: "blue",
    x: 72,
    y: 23,
    stars: [
      ["Caph", 54, 27, 0.95],
      ["Schedar", 62, 20, 1.1],
      ["Gamma Cassiopeiae", 70, 28, 1.05],
      ["Ruchbah", 78, 21, 0.95],
      ["Segin", 86, 27, 0.82]
    ],
    lines: [
      ["Caph", "Schedar"],
      ["Schedar", "Gamma Cassiopeiae"],
      ["Gamma Cassiopeiae", "Ruchbah"],
      ["Ruchbah", "Segin"]
    ],
    note: "A compact W-shaped guidepost near the northern Milky Way."
  },
  Cygnus: {
    labelKey: "Cygnus",
    accent: "blue",
    x: 49,
    y: 38,
    stars: [
      ["Deneb", 48, 15, 1.2],
      ["Sadr", 49, 36, 1.05],
      ["Gienah", 32, 37, 0.9],
      ["Delta Cygni", 64, 37, 0.85],
      ["Albireo", 51, 61, 1.0]
    ],
    lines: [
      ["Deneb", "Sadr"],
      ["Sadr", "Albireo"],
      ["Gienah", "Sadr"],
      ["Sadr", "Delta Cygni"]
    ],
    note: "The Northern Cross flies along the bright summer Milky Way."
  },
  Lyra: {
    labelKey: "Lyra",
    accent: "gold",
    x: 76,
    y: 44,
    stars: [
      ["Vega", 72, 25, 1.25],
      ["Zeta Lyrae", 77, 42, 0.82],
      ["Sheliak", 70, 51, 0.82],
      ["Sulafat", 83, 51, 0.82],
      ["Delta Lyrae", 86, 41, 0.72]
    ],
    lines: [
      ["Vega", "Zeta Lyrae"],
      ["Zeta Lyrae", "Sheliak"],
      ["Sheliak", "Sulafat"],
      ["Sulafat", "Delta Lyrae"],
      ["Delta Lyrae", "Zeta Lyrae"]
    ],
    note: "Vega anchors this small constellation and the Summer Triangle."
  },
  Scorpius: {
    labelKey: "Scorpius",
    accent: "red",
    x: 38,
    y: 60,
    stars: [
      ["Acrab", 28, 32, 0.85],
      ["Dschubba", 34, 37, 0.9],
      ["Antares", 39, 48, 1.25],
      ["Epsilon Scorpii", 43, 58, 0.85],
      ["Shaula", 50, 73, 1.05],
      ["Lesath", 58, 68, 0.9],
      ["Sargas", 62, 55, 0.82]
    ],
    lines: [
      ["Acrab", "Dschubba"],
      ["Dschubba", "Antares"],
      ["Antares", "Epsilon Scorpii"],
      ["Epsilon Scorpii", "Shaula"],
      ["Shaula", "Lesath"],
      ["Lesath", "Sargas"]
    ],
    note: "The curved tail and red Antares make Scorpius easy to spot."
  },
  Crux: {
    labelKey: "Crux",
    accent: "gold",
    x: 45,
    y: 39,
    stars: [
      ["Acrux", 45, 55, 1.25],
      ["Gacrux", 43, 25, 1.1],
      ["Mimosa", 34, 40, 1.05],
      ["Imai", 56, 42, 0.95]
    ],
    lines: [
      ["Gacrux", "Acrux"],
      ["Mimosa", "Imai"]
    ],
    note: "The Southern Cross is a small but famous southern landmark."
  },
  Leo: {
    labelKey: "Leo",
    accent: "gold",
    x: 47,
    y: 43,
    stars: [
      ["Regulus", 33, 56, 1.15],
      ["Algieba", 42, 37, 1.05],
      ["Zosma", 56, 34, 0.9],
      ["Denebola", 70, 44, 1.0],
      ["Chertan", 57, 55, 0.82],
      ["Rasalas", 34, 29, 0.82]
    ],
    lines: [
      ["Regulus", "Algieba"],
      ["Algieba", "Rasalas"],
      ["Algieba", "Zosma"],
      ["Zosma", "Denebola"],
      ["Denebola", "Chertan"],
      ["Chertan", "Regulus"]
    ],
    note: "Regulus and the sickle-shaped head mark this spring constellation."
  },
  Pegasus: {
    labelKey: "Pegasus",
    accent: "blue",
    x: 49,
    y: 42,
    stars: [
      ["Markab", 29, 56, 1.0],
      ["Scheat", 30, 31, 1.05],
      ["Algenib", 58, 58, 0.95],
      ["Alpheratz", 59, 30, 1.1],
      ["Enif", 76, 66, 0.9]
    ],
    lines: [
      ["Markab", "Scheat"],
      ["Scheat", "Alpheratz"],
      ["Alpheratz", "Algenib"],
      ["Algenib", "Markab"],
      ["Algenib", "Enif"]
    ],
    note: "The Great Square of Pegasus dominates autumn evenings."
  },
  Taurus: {
    labelKey: "Taurus",
    accent: "red",
    x: 40,
    y: 43,
    stars: [
      ["Aldebaran", 42, 47, 1.18],
      ["Elnath", 63, 22, 1.0],
      ["Zeta Tauri", 65, 68, 0.9],
      ["Hyadum I", 31, 38, 0.78],
      ["Theta Tauri", 31, 55, 0.78],
      ["Pleiades", 18, 24, 1.05]
    ],
    lines: [
      ["Pleiades", "Hyadum I"],
      ["Hyadum I", "Aldebaran"],
      ["Aldebaran", "Theta Tauri"],
      ["Aldebaran", "Elnath"],
      ["Aldebaran", "Zeta Tauri"]
    ],
    note: "Aldebaran, the Hyades, and the Pleiades make Taurus rich on eInk."
  },
  Andromeda: {
    labelKey: "Andromeda",
    accent: "gold",
    x: 46,
    y: 35,
    stars: [
      ["Alpheratz", 25, 50, 1.08],
      ["Delta Andromedae", 39, 41, 0.85],
      ["Mirach", 52, 35, 1.05],
      ["Almach", 72, 26, 1.0],
      ["Mu Andromedae", 56, 20, 0.7]
    ],
    lines: [
      ["Alpheratz", "Delta Andromedae"],
      ["Delta Andromedae", "Mirach"],
      ["Mirach", "Almach"],
      ["Mirach", "Mu Andromedae"]
    ],
    note: "Mirach points toward the Andromeda galaxy in dark skies."
  },
  Centaurus: {
    labelKey: "Centaurus",
    accent: "red",
    x: 58,
    y: 52,
    stars: [
      ["Alpha Centauri", 59, 68, 1.25],
      ["Hadar", 52, 57, 1.15],
      ["Menkent", 43, 41, 0.92],
      ["Muhlifain", 62, 31, 0.82],
      ["N Centauri", 73, 42, 0.76]
    ],
    lines: [
      ["Alpha Centauri", "Hadar"],
      ["Hadar", "Menkent"],
      ["Menkent", "Muhlifain"],
      ["Muhlifain", "N Centauri"],
      ["N Centauri", "Hadar"]
    ],
    note: "Alpha Centauri and Hadar point toward the Southern Cross."
  },
  Carina: {
    labelKey: "Carina",
    accent: "blue",
    x: 45,
    y: 55,
    stars: [
      ["Canopus", 30, 62, 1.25],
      ["Miaplacidus", 48, 49, 1.0],
      ["Avior", 66, 38, 0.92],
      ["Aspidiske", 56, 70, 0.82],
      ["Eta Carinae", 42, 33, 0.78]
    ],
    lines: [
      ["Canopus", "Miaplacidus"],
      ["Miaplacidus", "Avior"],
      ["Miaplacidus", "Aspidiske"],
      ["Miaplacidus", "Eta Carinae"]
    ],
    note: "Carina carries Canopus, one of the brightest stars in the night sky."
  }
};

const scenes = {
  north: {
    spring: ["Ursa Major", "Leo", "Cassiopeia"],
    summer: ["Cygnus", "Lyra", "Scorpius", "Ursa Major"],
    autumn: ["Pegasus", "Andromeda", "Cassiopeia"],
    winter: ["Orion", "Taurus", "Cassiopeia"]
  },
  south: {
    spring: ["Centaurus", "Crux", "Scorpius"],
    summer: ["Carina", "Orion", "Taurus"],
    autumn: ["Crux", "Centaurus", "Carina"],
    winter: ["Scorpius", "Crux", "Lyra"]
  }
};

const densityCounts = {
  minimal: 42,
  balanced: 76,
  rich: 118
};

function stringValue(value, fallback = "") {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") {
    return fallback;
  }

  const trimmed = raw.trim();
  return trimmed ? trimmed : fallback;
}

function oneOf(value, allowed, fallback) {
  const normalized = stringValue(value, fallback);
  return allowed.includes(normalized) ? normalized : fallback;
}

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000);
}

function autoSeason(date, hemisphere) {
  const month = date.getUTCMonth();
  const northernSeason = month < 2 || month === 11
    ? "winter"
    : month < 5
      ? "spring"
      : month < 8
        ? "summer"
        : "autumn";

  if (hemisphere === "north") {
    return northernSeason;
  }

  return {
    spring: "autumn",
    summer: "winter",
    autumn: "spring",
    winter: "summer"
  }[northernSeason];
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function seedFromText(text) {
  let seed = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    seed ^= text.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function backgroundStars({ count, seed }) {
  const random = seededRandom(seed);
  const stars = [];

  for (let index = 0; index < count; index += 1) {
    const x = 4 + random() * 92;
    const y = 8 + random() * 82;
    const magnitude = random();
    stars.push({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      size: Number((0.18 + magnitude * 0.42).toFixed(2)),
      opacity: Number((0.28 + magnitude * 0.62).toFixed(2))
    });
  }

  return stars;
}

function shapeConstellation(name) {
  const constellation = constellationCatalog[name];
  const starsByName = new Map(
    constellation.stars.map(([starName, x, y, size]) => [
      starName,
      { name: starName, x, y, size }
    ])
  );

  return {
    name,
    labelKey: constellation.labelKey,
    accent: constellation.accent,
    x: constellation.x,
    y: constellation.y,
    note: constellation.note,
    stars: Array.from(starsByName.values()),
    lines: constellation.lines
      .map(([from, to]) => ({ from: starsByName.get(from), to: starsByName.get(to) }))
      .filter((line) => line.from && line.to)
  };
}

export default async function handler({ query }) {
  const now = new Date();
  const hemisphere = oneOf(query.hemisphere, ["north", "south"], "north");
  const requestedSeason = oneOf(query.season, ["auto", "spring", "summer", "autumn", "winter"], "auto");
  const season = requestedSeason === "auto" ? autoSeason(now, hemisphere) : requestedSeason;
  const density = oneOf(query.density, ["minimal", "balanced", "rich"], "balanced");
  const visibleNames = scenes[hemisphere][season] || scenes.north.winter;
  const visibleConstellations = visibleNames.map(shapeConstellation);

  const requestedHighlight = stringValue(query.highlight, "daily");
  const dailyIndex = dayOfYear(now) % visibleNames.length;
  const highlight = requestedHighlight === "none"
    ? ""
    : requestedHighlight === "daily"
      ? visibleNames[dailyIndex]
      : visibleNames.includes(requestedHighlight)
        ? requestedHighlight
        : visibleNames[dailyIndex];

  const seed = seedFromText(`${hemisphere}:${season}:${density}:${now.toISOString().slice(0, 10)}`);

  return {
    title: "Sternbilder im Himmel",
    hemisphere,
    season,
    requestedSeason,
    highlight,
    source: "Built-in constellation catalogue",
    sourceUrl: "",
    updatedAt: now.toISOString(),
    backgroundStars: backgroundStars({ count: densityCounts[density], seed }),
    constellations: visibleConstellations
  };
}

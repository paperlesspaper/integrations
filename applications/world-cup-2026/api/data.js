const teams = {
  ALG: { name: 'Algeria', group: 'J', flag: 'dz' },
  ARG: { name: 'Argentina', group: 'J', flag: 'ar' },
  AUS: { name: 'Australia', group: 'D', flag: 'au' },
  AUT: { name: 'Austria', group: 'J', flag: 'at' },
  BEL: { name: 'Belgium', group: 'G', flag: 'be' },
  BIH: { name: 'Bosnia & Herzegovina', group: 'B', flag: 'ba' },
  BRA: { name: 'Brazil', group: 'C', flag: 'br' },
  CAN: { name: 'Canada', group: 'B', flag: 'ca' },
  CPV: { name: 'Cape Verde', group: 'H', flag: 'cv' },
  COL: { name: 'Colombia', group: 'K', flag: 'co' },
  CRO: { name: 'Croatia', group: 'L', flag: 'hr' },
  CUW: { name: 'Curacao', group: 'E', flag: 'cw' },
  CZE: { name: 'Czechia', group: 'A', flag: 'cz' },
  COD: { name: 'DR Congo', group: 'K', flag: 'cd' },
  ECU: { name: 'Ecuador', group: 'E', flag: 'ec' },
  EGY: { name: 'Egypt', group: 'G', flag: 'eg' },
  ENG: { name: 'England', group: 'L', flag: 'gb-eng' },
  FRA: { name: 'France', group: 'I', flag: 'fr' },
  GER: { name: 'Germany', group: 'E', flag: 'de' },
  GHA: { name: 'Ghana', group: 'L', flag: 'gh' },
  HAI: { name: 'Haiti', group: 'C', flag: 'ht' },
  IRN: { name: 'Iran', group: 'G', flag: 'ir' },
  IRQ: { name: 'Iraq', group: 'I', flag: 'iq' },
  CIV: { name: 'Ivory Coast', group: 'E', flag: 'ci' },
  JPN: { name: 'Japan', group: 'F', flag: 'jp' },
  JOR: { name: 'Jordan', group: 'J', flag: 'jo' },
  MEX: { name: 'Mexico', group: 'A', flag: 'mx' },
  MAR: { name: 'Morocco', group: 'C', flag: 'ma' },
  NED: { name: 'Netherlands', group: 'F', flag: 'nl' },
  NZL: { name: 'New Zealand', group: 'G', flag: 'nz' },
  NOR: { name: 'Norway', group: 'I', flag: 'no' },
  PAN: { name: 'Panama', group: 'L', flag: 'pa' },
  PAR: { name: 'Paraguay', group: 'D', flag: 'py' },
  POR: { name: 'Portugal', group: 'K', flag: 'pt' },
  QAT: { name: 'Qatar', group: 'B', flag: 'qa' },
  KSA: { name: 'Saudi Arabia', group: 'H', flag: 'sa' },
  SCO: { name: 'Scotland', group: 'C', flag: 'gb-sct' },
  SEN: { name: 'Senegal', group: 'I', flag: 'sn' },
  RSA: { name: 'South Africa', group: 'A', flag: 'za' },
  KOR: { name: 'South Korea', group: 'A', flag: 'kr' },
  ESP: { name: 'Spain', group: 'H', flag: 'es' },
  SWE: { name: 'Sweden', group: 'F', flag: 'se' },
  SUI: { name: 'Switzerland', group: 'B', flag: 'ch' },
  TUN: { name: 'Tunisia', group: 'F', flag: 'tn' },
  TUR: { name: 'Turkiye', group: 'D', flag: 'tr' },
  USA: { name: 'United States', group: 'D', flag: 'us' },
  URU: { name: 'Uruguay', group: 'H', flag: 'uy' },
  UZB: { name: 'Uzbekistan', group: 'K', flag: 'uz' },
};

const groups = {
  A: ['MEX', 'KOR', 'CZE', 'RSA'],
  B: ['CAN', 'QAT', 'SUI', 'BIH'],
  C: ['BRA', 'MAR', 'SCO', 'HAI'],
  D: ['USA', 'TUR', 'AUS', 'PAR'],
  E: ['GER', 'ECU', 'CIV', 'CUW'],
  F: ['SWE', 'JPN', 'NED', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'URU', 'KSA', 'CPV'],
  I: ['FRA', 'NOR', 'SEN', 'IRQ'],
  J: ['ARG', 'AUT', 'ALG', 'JOR'],
  K: ['POR', 'COL', 'UZB', 'COD'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

const baseSlots = [
  '2026-06-11T19:00:00Z',
  '2026-06-12T16:00:00Z',
  '2026-06-12T19:00:00Z',
  '2026-06-13T16:00:00Z',
  '2026-06-13T19:00:00Z',
  '2026-06-14T16:00:00Z',
  '2026-06-14T19:00:00Z',
  '2026-06-15T16:00:00Z',
  '2026-06-15T19:00:00Z',
  '2026-06-16T16:00:00Z',
  '2026-06-16T19:00:00Z',
  '2026-06-17T16:00:00Z',
  '2026-06-17T19:00:00Z',
  '2026-06-18T16:00:00Z',
  '2026-06-18T19:00:00Z',
  '2026-06-18T22:00:00Z',
  '2026-06-19T16:00:00Z',
  '2026-06-19T19:00:00Z',
  '2026-06-19T22:00:00Z',
  '2026-06-20T16:00:00Z',
  '2026-06-20T19:00:00Z',
  '2026-06-21T16:00:00Z',
  '2026-06-21T19:00:00Z',
  '2026-06-22T16:00:00Z',
  '2026-06-22T19:00:00Z',
  '2026-06-23T16:00:00Z',
  '2026-06-23T19:00:00Z',
  '2026-06-24T16:00:00Z',
  '2026-06-24T19:00:00Z',
  '2026-06-25T16:00:00Z',
  '2026-06-25T19:00:00Z',
  '2026-06-26T16:00:00Z',
  '2026-06-26T19:00:00Z',
  '2026-06-27T16:00:00Z',
  '2026-06-27T19:00:00Z',
  '2026-06-28T16:00:00Z',
];

const pairings = [
  [0, 3],
  [1, 2],
  [0, 2],
  [3, 1],
  [0, 1],
  [2, 3],
];

const overrides = {
  'SWE-TUN': { startsAt: '2026-06-15T17:00:00Z', homeScore: 5, awayScore: 1 },
  'JPN-NED': { startsAt: '2026-06-15T20:00:00Z', homeScore: 1, awayScore: 1 },
  'ENG-CRO': { startsAt: '2026-06-17T16:00:00Z', homeScore: 4, awayScore: 2 },
  'GHA-PAN': { startsAt: '2026-06-18T13:00:00Z', homeScore: 1, awayScore: 0 },
  'UZB-COL': { startsAt: '2026-06-18T15:00:00Z', homeScore: 1, awayScore: 3 },
  'CZE-RSA': { startsAt: '2026-06-18T16:00:00Z' },
  'SUI-BIH': { startsAt: '2026-06-18T19:00:00Z' },
  'CAN-QAT': { startsAt: '2026-06-18T22:00:00Z' },
  'SWE-NED': { startsAt: '2026-06-20T17:00:00Z' },
  'SWE-JPN': { startsAt: '2026-06-26T23:00:00Z' },
};

const venues = [
  'Toronto',
  'Mexico City',
  'Los Angeles',
  'New York/New Jersey',
  'Dallas',
  'Vancouver',
  'Kansas City',
  'Miami',
  'Seattle',
  'Atlanta',
  'Houston',
  'Monterrey',
];

function deterministicScore(home, away, startsAt) {
  const seed = `${home}${away}${startsAt}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const homeScore = seed % 4;
  const awayScore = Math.floor(seed / 7) % 4;
  return { homeScore, awayScore };
}

function makeFixtures() {
  const fixtures = [];
  let index = 0;

  for (const [group, codes] of Object.entries(groups)) {
    for (const [roundIndex, pairing] of pairings.entries()) {
      const home = codes[pairing[0]];
      const away = codes[pairing[1]];
      const key = `${home}-${away}`;
      const override = overrides[key] || {};
      const startsAt = override.startsAt || baseSlots[index % baseSlots.length];

      fixtures.push({
        id: `${group}-${roundIndex + 1}`,
        group,
        stage: 'Group stage',
        venue: venues[index % venues.length],
        startsAt,
        home,
        away,
        homeScore: override.homeScore ?? null,
        awayScore: override.awayScore ?? null,
      });

      index += 1;
    }
  }

  return fixtures.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

const fixtures = makeFixtures();

function normalizeTeam(value) {
  const code = String(value || '').trim().toUpperCase();
  return teams[code] ? code : 'SWE';
}

function matchKey(match) {
  return `${match.home}-${match.away}`;
}

function withResult(match, now) {
  const override = overrides[matchKey(match)];
  if (override && Number.isFinite(override.homeScore) && Number.isFinite(override.awayScore)) {
    return match;
  }

  const startsAt = new Date(match.startsAt);
  const isComplete = startsAt.getTime() + 115 * 60 * 1000 < now.getTime();
  if (!isComplete) {
    return { ...match, homeScore: null, awayScore: null };
  }

  return { ...match, ...deterministicScore(match.home, match.away, match.startsAt) };
}

function shapeTeam(code) {
  return { code, ...teams[code] };
}

function shapeMatch(match, favorite) {
  return {
    id: match.id,
    group: match.group,
    stage: match.stage,
    venue: match.venue,
    startsAt: match.startsAt,
    status: Number.isFinite(match.homeScore) && Number.isFinite(match.awayScore) ? 'FT' : 'Scheduled',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    home: shapeTeam(match.home),
    away: shapeTeam(match.away),
    favoriteSide: match.home === favorite ? 'home' : match.away === favorite ? 'away' : null,
  };
}

function calculateTable(group, completedMatches) {
  const table = groups[group].map((code) => ({
    ...shapeTeam(code),
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
  const byCode = new Map(table.map((row) => [row.code, row]));

  for (const match of completedMatches.filter((item) => item.group === group)) {
    if (!Number.isFinite(match.homeScore) || !Number.isFinite(match.awayScore)) {
      continue;
    }

    const home = byCode.get(match.home);
    const away = byCode.get(match.away);
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of table) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  return table.sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.name.localeCompare(b.name),
  );
}

export default async function handler({ query }) {
  const favorite = normalizeTeam(query.team);
  const now = query.now ? new Date(query.now) : new Date();
  const resolvedNow = Number.isNaN(now.getTime()) ? new Date('2026-06-18T16:30:00Z') : now;
  const resolvedFixtures = fixtures.map((match) => withResult(match, resolvedNow));
  const completed = resolvedFixtures.filter((match) => Number.isFinite(match.homeScore) && Number.isFinite(match.awayScore));
  const upcoming = resolvedFixtures.filter((match) => !Number.isFinite(match.homeScore) || !Number.isFinite(match.awayScore));
  const favoriteMatches = resolvedFixtures.filter((match) => match.home === favorite || match.away === favorite);
  const favoriteRecent = favoriteMatches
    .filter((match) => Number.isFinite(match.homeScore) && Number.isFinite(match.awayScore))
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
    .slice(0, 2)
    .reverse();
  const favoriteUpcoming = favoriteMatches
    .filter((match) => !Number.isFinite(match.homeScore) || !Number.isFinite(match.awayScore))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 2);

  return {
    generatedAt: resolvedNow.toISOString(),
    favorite: shapeTeam(favorite),
    latestResults: completed
      .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
      .slice(0, 3)
      .reverse()
      .map((match) => shapeMatch(match, favorite)),
    upcoming: upcoming
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 3)
      .map((match) => shapeMatch(match, favorite)),
    group: {
      name: `Group ${teams[favorite].group}`,
      standings: calculateTable(teams[favorite].group, completed),
    },
    favoriteRecent: favoriteRecent.map((match) => shapeMatch(match, favorite)),
    favoriteFixtures: favoriteUpcoming.map((match) => shapeMatch(match, favorite)),
  };
}

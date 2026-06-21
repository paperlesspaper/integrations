const scoreboardApiUrl = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const leadersApiUrl = "https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders";

const teamNameMapping = {
  LAR: "LA",
  WSH: "WAS",
};

const seasonStageMapping = {
  1: "PRE",
  2: "REG",
  3: "POST",
  4: "OFF",
};

const statisticTypes = [
  "passingYards",
  "rushingYards",
  "receivingYards",
  "totalTackles",
  "sacks",
  "kickoffYards",
  "interceptions",
  "passingTouchdowns",
  "quarterbackRating",
  "rushingTouchdowns",
  "receptions",
  "receivingTouchdowns",
  "totalPoints",
  "totalTouchdowns",
  "puntYards",
  "passesDefended",
];

const defaultTeams = [
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LA",
  "LAC",
  "LV",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SEA",
  "SF",
  "TB",
  "TEN",
  "WAS",
];

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN NFL request failed with ${response.status}`);
  }

  return response.json();
}

function toInteger(value, fallback, { min, max } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const rounded = Math.floor(number);
  if (Number.isFinite(min) && rounded < min) return min;
  if (Number.isFinite(max) && rounded > max) return max;
  return rounded;
}

function toBoolean(value, fallback = false) {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return fallback;
}

function normalizeTeam(value) {
  const team = String(value || "").trim().toUpperCase();
  return teamNameMapping[team] || (defaultTeams.includes(team) ? team : "KC");
}

function normalizeStatType(value) {
  const statType = String(value || "").trim();
  return statisticTypes.includes(statType) ? statType : "passingYards";
}

function buildScoreboardUrl(settings) {
  const url = new URL(scoreboardApiUrl);

  if (settings.scoreboardMode !== "current") {
    url.searchParams.set("dates", String(settings.season));
    url.searchParams.set("seasontype", String(settings.seasonType));
    url.searchParams.set("week", String(settings.week));
  }

  return url;
}

function getTeamName(competitor = {}) {
  const team = competitor.team?.abbreviation || "";
  return teamNameMapping[team] || team;
}

function getTeamLogo(competitor = {}) {
  const logos = competitor.team?.logos || [];
  return competitor.team?.logo || logos[0]?.href || "";
}

function getDisplayName(competitor = {}) {
  return competitor.team?.shortDisplayName
    || competitor.team?.displayName
    || competitor.team?.name
    || getTeamName(competitor);
}

function getRecord(competitor = {}) {
  return competitor.records?.find((record) => record.type === "total")?.summary
    || competitor.records?.[0]?.summary
    || "";
}

function getPostGameStatus(period) {
  return period > 4 ? "final-overtime" : "final";
}

function getInGameStatus(period) {
  return period > 4 ? "overtime" : String(period || "");
}

function getGameStatus(status = {}) {
  if (status.type?.state === "pre") return "pregame";
  if (status.type?.name === "STATUS_HALFTIME") return "halftime";
  if (status.type?.state === "post") return getPostGameStatus(status.period);
  return getInGameStatus(status.period);
}

function shapeCompetitor(competitor = {}) {
  return {
    id: competitor.id || "",
    abbreviation: getTeamName(competitor),
    name: getDisplayName(competitor),
    location: competitor.team?.location || "",
    record: getRecord(competitor),
    score: Number(competitor.score || 0),
    logo: getTeamLogo(competitor),
    homeAway: competitor.homeAway || "",
    winner: competitor.winner === true,
  };
}

function shapeGame(event = {}, favoriteTeam) {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  const home = shapeCompetitor(competitors.find((item) => item.homeAway === "home") || competitors[0]);
  const away = shapeCompetitor(competitors.find((item) => item.homeAway === "away") || competitors[1]);
  const status = event.status || {};
  const situation = competition.situation || {};
  const possession = competitors.find((item) => item.id === situation.possession);
  const favoriteSide = home.abbreviation === favoriteTeam ? "home" : away.abbreviation === favoriteTeam ? "away" : "";
  const isOngoing = !["pre", "post"].includes(status.type?.state);

  return {
    id: event.id || "",
    name: event.shortName || event.name || "",
    startsAt: event.date || competition.date || "",
    status: getGameStatus(status),
    state: status.type?.state || "",
    detail: status.type?.shortDetail || status.type?.detail || "",
    clock: isOngoing ? status.displayClock || "" : "",
    period: Number(status.period || 0),
    downDistance: situation.shortDownDistanceText || situation.downDistanceText || "",
    possessionTeam: possession ? getTeamName(possession) : "",
    inRedZone: situation.isRedZone === true,
    venue: competition.venue?.fullName || competition.venue?.displayName || "",
    home,
    away,
    favoriteSide,
    isFavoriteGame: Boolean(favoriteSide),
  };
}

function mapPlayerEntry(player = {}) {
  const team = player.team || {};
  const athlete = player.athlete || {};
  const teamAbbreviation = teamNameMapping[team.abbreviation] || team.abbreviation || "";

  return {
    value: player.displayValue || "",
    name: athlete.displayName || athlete.fullName || "",
    avatar: athlete.headshot?.href || "",
    team: teamAbbreviation,
    logo: team.logos?.[0]?.href || "",
  };
}

async function getLeaders(statType) {
  const data = await fetchJson(leadersApiUrl);
  const category = data?.leaders?.categories?.find((item) => item.name === statType);

  return {
    label: category?.displayName || statType,
    shortLabel: category?.shortDisplayName || category?.abbreviation || statType,
    leaders: (category?.leaders || []).slice(0, 5).map(mapPlayerEntry),
  };
}

function sortGames(games) {
  return [...games].sort((a, b) => {
    const liveA = a.state === "in" ? 0 : 1;
    const liveB = b.state === "in" ? 0 : 1;
    if (liveA !== liveB) return liveA - liveB;
    return Date.parse(a.startsAt || 0) - Date.parse(b.startsAt || 0);
  });
}

export default async function handler({ query }) {
  const settings = {
    scoreboardMode: ["current", "week", "favorite"].includes(query.scoreboardMode)
      ? query.scoreboardMode
      : "week",
    team: normalizeTeam(query.team),
    season: toInteger(query.season, 2026, { min: 1970, max: 2100 }),
    seasonType: toInteger(query.seasonType, 2, { min: 1, max: 4 }),
    week: toInteger(query.week, 1, { min: 1, max: 25 }),
    maxGames: toInteger(query.maxGames, 8, { min: 1, max: 16 }),
    showLeaders: toBoolean(query.showLeaders, true),
    statType: normalizeStatType(query.statType),
  };

  const scoreboard = await fetchJson(buildScoreboardUrl(settings));
  const allGames = sortGames((scoreboard.events || []).map((event) => shapeGame(event, settings.team)));
  const favoriteGames = allGames.filter((game) => game.isFavoriteGame);
  const selectedGames = settings.scoreboardMode === "favorite" && favoriteGames.length ? favoriteGames : allGames;
  const leaders = settings.showLeaders ? await getLeaders(settings.statType) : { label: "", shortLabel: "", leaders: [] };
  const favoriteGame = favoriteGames.find((game) => game.state === "in")
    || favoriteGames.find((game) => game.state === "pre")
    || favoriteGames[0]
    || null;

  return {
    source: "ESPN NFL",
    updatedAt: new Date().toISOString(),
    season: scoreboard.season?.year || settings.season,
    stage: seasonStageMapping[scoreboard.season?.type] || "",
    week: scoreboard.week?.number || settings.week,
    requested: settings,
    games: selectedGames.slice(0, settings.maxGames),
    allGamesCount: allGames.length,
    favoriteTeam: settings.team,
    favoriteGame,
    leaders,
  };
}

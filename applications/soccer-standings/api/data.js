const competitions = {
  BL1: { code: 'BL1', name: 'Bundesliga', area: 'Germany' },
  PL: { code: 'PL', name: 'Premier League', area: 'England' },
  PD: { code: 'PD', name: 'Primera División', area: 'Spain' },
  SA: { code: 'SA', name: 'Serie A', area: 'Italy' },
  FL1: { code: 'FL1', name: 'Ligue 1', area: 'France' },
  DED: { code: 'DED', name: 'Eredivisie', area: 'Netherlands' },
  PPL: { code: 'PPL', name: 'Primeira Liga', area: 'Portugal' },
  CL: { code: 'CL', name: 'Champions League', area: 'Europe' },
};

const maxRemoteMarkdownBytes = 12_000;

const sampleTables = {
  BL1: [
    ['Bayern München', 'FCB', 15, 10, 3, 2, 37, 18, 33],
    ['Borussia Dortmund', 'BVB', 15, 9, 4, 2, 31, 17, 31],
    ['Bayer Leverkusen', 'B04', 15, 8, 5, 2, 29, 16, 29],
    ['RB Leipzig', 'RBL', 15, 8, 3, 4, 27, 18, 27],
    ['VfB Stuttgart', 'VFB', 15, 7, 4, 4, 26, 20, 25],
    ['Eintracht Frankfurt', 'SGE', 15, 6, 5, 4, 24, 19, 23],
    ['SC Freiburg', 'SCF', 15, 6, 3, 6, 21, 21, 21],
    ['Werder Bremen', 'SVW', 15, 5, 4, 6, 20, 23, 19],
    ['Union Berlin', 'FCU', 15, 5, 3, 7, 18, 22, 18],
    ['Mainz 05', 'M05', 15, 4, 5, 6, 17, 20, 17],
    ['Augsburg', 'FCA', 15, 4, 4, 7, 18, 26, 16],
    ['St. Pauli', 'STP', 15, 3, 6, 6, 15, 22, 15],
  ],
  PL: [
    ['Liverpool', 'LIV', 16, 11, 3, 2, 34, 17, 36],
    ['Arsenal', 'ARS', 16, 10, 4, 2, 30, 14, 34],
    ['Manchester City', 'MCI', 16, 10, 2, 4, 36, 20, 32],
    ['Chelsea', 'CHE', 16, 9, 4, 3, 31, 19, 31],
    ['Tottenham Hotspur', 'TOT', 16, 8, 3, 5, 29, 23, 27],
    ['Aston Villa', 'AVL', 16, 7, 5, 4, 24, 20, 26],
    ['Newcastle United', 'NEW', 16, 7, 4, 5, 25, 21, 25],
    ['Brighton & Hove Albion', 'BHA', 16, 6, 5, 5, 22, 22, 23],
    ['Manchester United', 'MUN', 16, 6, 4, 6, 21, 23, 22],
    ['West Ham United', 'WHU', 16, 5, 4, 7, 19, 26, 19],
  ],
  PD: [
    ['Real Madrid', 'RMA', 16, 11, 4, 1, 33, 12, 37],
    ['FC Barcelona', 'BAR', 16, 11, 2, 3, 35, 18, 35],
    ['Atlético de Madrid', 'ATM', 16, 10, 3, 3, 28, 13, 33],
    ['Athletic Club', 'ATH', 16, 8, 5, 3, 24, 16, 29],
    ['Villarreal CF', 'VIL', 16, 7, 5, 4, 25, 20, 26],
    ['Real Sociedad', 'RSO', 16, 7, 4, 5, 19, 16, 25],
    ['Real Betis', 'BET', 16, 6, 5, 5, 20, 19, 23],
    ['Sevilla FC', 'SEV', 16, 5, 5, 6, 18, 20, 20],
  ],
  SA: [
    ['Internazionale', 'INT', 15, 11, 3, 1, 32, 12, 36],
    ['Juventus', 'JUV', 15, 9, 5, 1, 24, 10, 32],
    ['AC Milan', 'MIL', 15, 9, 3, 3, 28, 17, 30],
    ['Napoli', 'NAP', 15, 8, 4, 3, 25, 15, 28],
    ['Atalanta BC', 'ATA', 15, 8, 2, 5, 27, 19, 26],
    ['AS Roma', 'ROM', 15, 6, 4, 5, 22, 19, 22],
    ['Lazio', 'LAZ', 15, 6, 3, 6, 19, 18, 21],
    ['Bologna FC', 'BOL', 15, 5, 5, 5, 17, 18, 20],
  ],
  FL1: [
    ['Paris Saint-Germain', 'PSG', 15, 11, 3, 1, 35, 13, 36],
    ['Olympique Marseille', 'OM', 15, 9, 3, 3, 28, 17, 30],
    ['AS Monaco', 'ASM', 15, 8, 4, 3, 26, 18, 28],
    ['Lille OSC', 'LIL', 15, 7, 5, 3, 22, 15, 26],
    ['Olympique Lyonnais', 'OL', 15, 6, 5, 4, 21, 18, 23],
    ['RC Lens', 'RCL', 15, 6, 4, 5, 19, 16, 22],
    ['Stade Rennais', 'REN', 15, 5, 5, 5, 18, 18, 20],
    ['OGC Nice', 'NIC', 15, 5, 4, 6, 17, 19, 19],
  ],
};

sampleTables.DED = [
  ['PSV', 'PSV', 15, 12, 2, 1, 41, 13, 38],
  ['Ajax', 'AJA', 15, 10, 3, 2, 34, 17, 33],
  ['Feyenoord', 'FEY', 15, 9, 4, 2, 32, 15, 31],
  ['AZ', 'AZ', 15, 8, 3, 4, 27, 18, 27],
  ['FC Twente', 'TWE', 15, 7, 4, 4, 24, 19, 25],
  ['FC Utrecht', 'UTR', 15, 6, 5, 4, 21, 18, 23],
];

sampleTables.PPL = [
  ['Sporting CP', 'SCP', 15, 12, 1, 2, 34, 12, 37],
  ['SL Benfica', 'BEN', 15, 11, 2, 2, 31, 13, 35],
  ['FC Porto', 'FCP', 15, 10, 3, 2, 29, 14, 33],
  ['SC Braga', 'BRA', 15, 8, 3, 4, 25, 18, 27],
  ['Vitória SC', 'VSC', 15, 7, 4, 4, 22, 17, 25],
  ['Casa Pia AC', 'CPAC', 15, 5, 5, 5, 16, 17, 20],
];

sampleTables.CL = [
  ['Paris Saint-Germain', 'PSG', 8, 6, 1, 1, 19, 8, 19],
  ['Manchester City', 'MCI', 8, 6, 0, 2, 20, 10, 18],
  ['Real Madrid', 'RMA', 8, 5, 2, 1, 18, 9, 17],
  ['Bayern München', 'FCB', 8, 5, 1, 2, 17, 10, 16],
  ['Arsenal', 'ARS', 8, 4, 3, 1, 15, 8, 15],
  ['Inter', 'INT', 8, 4, 2, 2, 13, 9, 14],
  ['Barcelona', 'BAR', 8, 4, 1, 3, 16, 12, 13],
  ['Borussia Dortmund', 'BVB', 8, 3, 3, 2, 12, 10, 12],
];

function stringValue(value) {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function numberValue(value, fallback) {
  const number = Number(stringValue(value));
  return Number.isFinite(number) ? number : fallback;
}

function boolValue(value, fallback) {
  const raw = stringValue(value).trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return fallback;
}

function isPrivateIPv4(hostname) {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }

  const parts = match.slice(1).map(Number);
  if (parts.some((part) => part < 0 || part > 255)) {
    return true;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function normalizeRemoteMarkdownUrl(value) {
  const raw = stringValue(value).trim();
  if (!raw) {
    return '';
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Remote markdown URL is invalid.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Remote markdown URL must use HTTP or HTTPS.');
  }

  if (url.username || url.password) {
    throw new Error('Remote markdown URL must not include credentials.');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    isPrivateIPv4(hostname) ||
    (!hostname.includes('.') && !hostname.includes(':'))
  ) {
    throw new Error('Remote markdown URL must point to a public host.');
  }

  return url.toString();
}

async function fetchRemoteMarkdown(markdownUrl) {
  const url = normalizeRemoteMarkdownUrl(markdownUrl);
  if (!url) {
    return { markdown: '', url: '' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/markdown,text/plain;q=0.9,*/*;q=0.5' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Remote markdown returned ${response.status}.`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (/\btext\/html\b/i.test(contentType)) {
      throw new Error('Remote markdown URL returned HTML instead of markdown text.');
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > maxRemoteMarkdownBytes) {
      throw new Error(`Remote markdown is larger than ${maxRemoteMarkdownBytes} bytes.`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxRemoteMarkdownBytes) {
      throw new Error(`Remote markdown is larger than ${maxRemoteMarkdownBytes} bytes.`);
    }

    return {
      markdown: new TextDecoder().decode(buffer).replace(/^\uFEFF/, ''),
      url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeCompetition(value) {
  const code = stringValue(value).trim().toUpperCase();
  return competitions[code] ? code : 'BL1';
}

function normalizeRow(row, index) {
  const [name, tla, played, won, draw, lost, goalsFor, goalsAgainst, points] = row;
  const goalDifference = goalsFor - goalsAgainst;
  return {
    position: index + 1,
    playedGames: played,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    team: {
      id: `${tla}-${index + 1}`,
      name,
      shortName: name,
      tla,
      crest: null,
    },
  };
}

function shapeSample(code) {
  const competition = competitions[code];
  return {
    competition,
    season: {
      currentMatchday: 16,
      startDate: '2026-08-15',
      endDate: '2027-05-23',
    },
    source: 'sample',
    updatedAt: new Date().toISOString(),
    table: (sampleTables[code] || sampleTables.BL1).map(normalizeRow),
  };
}

function shapeFootballData(payload, code) {
  const total = payload?.standings?.find((standing) => standing.type === 'TOTAL') || payload?.standings?.[0];
  const table = Array.isArray(total?.table) ? total.table : [];
  if (!table.length) {
    throw new Error('The standings response did not include a table.');
  }

  return {
    competition: {
      code: payload?.competition?.code || code,
      name: payload?.competition?.name || competitions[code].name,
      area: payload?.competition?.area?.name || competitions[code].area,
    },
    season: payload?.season || null,
    source: 'live',
    updatedAt: new Date().toISOString(),
    table: table.map((row, index) => ({
      position: Number(row.position || index + 1),
      playedGames: Number(row.playedGames || 0),
      won: Number(row.won || 0),
      draw: Number(row.draw || 0),
      lost: Number(row.lost || 0),
      goalsFor: Number(row.goalsFor || 0),
      goalsAgainst: Number(row.goalsAgainst || 0),
      goalDifference: Number(row.goalDifference || 0),
      points: Number(row.points || 0),
      form: typeof row.form === 'string' ? row.form : '',
      team: {
        id: row.team?.id || `${code}-${index + 1}`,
        name: row.team?.name || row.team?.shortName || `Team ${index + 1}`,
        shortName: row.team?.shortName || row.team?.name || `Team ${index + 1}`,
        tla: row.team?.tla || '',
        crest: row.team?.crest || null,
      },
    })),
  };
}

function matchesTeam(row, needle) {
  if (!needle) {
    return false;
  }

  const value = needle.toLowerCase();
  return [row.team.name, row.team.shortName, row.team.tla]
    .filter(Boolean)
    .some((candidate) => String(candidate).toLowerCase().includes(value));
}

function sliceAroundFocus(table, focusTeam, maxTeams) {
  if (!Number.isFinite(maxTeams) || maxTeams <= 0 || table.length <= maxTeams) {
    return table;
  }

  const focusIndex = table.findIndex((row) => matchesTeam(row, focusTeam));
  if (focusIndex < 0) {
    return table.slice(0, maxTeams);
  }

  const before = Math.floor((maxTeams - 1) / 2);
  const start = Math.max(0, Math.min(table.length - maxTeams, focusIndex - before));
  return table.slice(start, start + maxTeams);
}

async function fetchLiveStandings(code, apiKey) {
  const headers = { Accept: 'application/json' };
  if (apiKey) {
    headers['X-Auth-Token'] = apiKey;
  }

  const response = await fetch(`https://api.football-data.org/v4/competitions/${encodeURIComponent(code)}/standings`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`football-data.org returned ${response.status}`);
  }

  return shapeFootballData(await response.json(), code);
}

export default async function handler({ query }) {
  const competition = normalizeCompetition(query.competition);
  const apiKey = stringValue(query.apiKey || process.env.FOOTBALL_DATA_API_KEY).trim();
  const forceSample = boolValue(query.sample, false);
  const focusTeam = stringValue(query.focusTeam).trim();
  const maxTeams = numberValue(query.maxTeams, 10);
  let remoteMarkdown = { markdown: '', url: '' };

  let data;
  let warning = '';
  let remoteMarkdownWarning = '';

  if (!forceSample && apiKey) {
    try {
      data = await fetchLiveStandings(competition, apiKey);
    } catch (error) {
      data = shapeSample(competition);
      warning = error instanceof Error ? error.message : 'Live standings failed.';
    }
  } else {
    data = shapeSample(competition);
  }

  if (stringValue(query.markdownUrl).trim()) {
    try {
      remoteMarkdown = await fetchRemoteMarkdown(query.markdownUrl);
    } catch (error) {
      remoteMarkdownWarning = error instanceof Error ? error.message : 'Remote markdown failed.';
    }
  }

  const focused = data.table.find((row) => matchesTeam(row, focusTeam)) || null;
  return {
    ...data,
    warning,
    focusTeam,
    focused,
    remoteMarkdown: remoteMarkdown.markdown,
    remoteMarkdownUrl: remoteMarkdown.url,
    remoteMarkdownWarning,
    table: sliceAroundFocus(data.table, focusTeam, maxTeams),
    fullTableSize: data.table.length,
    maxTeams,
  };
}

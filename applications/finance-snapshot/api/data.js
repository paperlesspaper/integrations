const curatedAssets = {
  "GC=F": { name: "Gold", category: "metals", unit: "USD/oz" },
  "SI=F": { name: "Silver", category: "metals", unit: "USD/oz" },
  "PL=F": { name: "Platinum", category: "metals", unit: "USD/oz" },
  "PA=F": { name: "Palladium", category: "metals", unit: "USD/oz" },
  "HG=F": { name: "Copper", category: "metals", unit: "USD/lb" },
  "ALI=F": { name: "Aluminum", category: "metals", unit: "USD/t" },

  "BTC-USD": { name: "Bitcoin", category: "crypto", unit: "USD" },
  "ETH-USD": { name: "Ethereum", category: "crypto", unit: "USD" },
  "SOL-USD": { name: "Solana", category: "crypto", unit: "USD" },
  "BNB-USD": { name: "BNB", category: "crypto", unit: "USD" },
  "XRP-USD": { name: "XRP", category: "crypto", unit: "USD" },
  "ADA-USD": { name: "Cardano", category: "crypto", unit: "USD" },
  "DOGE-USD": { name: "Dogecoin", category: "crypto", unit: "USD" },
  "DOT-USD": { name: "Polkadot", category: "crypto", unit: "USD" },
  "LINK-USD": { name: "Chainlink", category: "crypto", unit: "USD" },
  "AVAX-USD": { name: "Avalanche", category: "crypto", unit: "USD" },
  "MATIC-USD": { name: "Polygon", category: "crypto", unit: "USD" },
  "LTC-USD": { name: "Litecoin", category: "crypto", unit: "USD" },
  "BCH-USD": { name: "Bitcoin Cash", category: "crypto", unit: "USD" },

  "EURUSD=X": { name: "EUR/USD", category: "currencies", unit: "USD" },
  "GBPUSD=X": { name: "GBP/USD", category: "currencies", unit: "USD" },
  "USDJPY=X": { name: "USD/JPY", category: "currencies", unit: "JPY" },
  "USDCHF=X": { name: "USD/CHF", category: "currencies", unit: "CHF" },
  "USDCAD=X": { name: "USD/CAD", category: "currencies", unit: "CAD" },
  "AUDUSD=X": { name: "AUD/USD", category: "currencies", unit: "USD" },
  "NZDUSD=X": { name: "NZD/USD", category: "currencies", unit: "USD" },
  "EURGBP=X": { name: "EUR/GBP", category: "currencies", unit: "GBP" },
  "EURJPY=X": { name: "EUR/JPY", category: "currencies", unit: "JPY" },
  "EURCHF=X": { name: "EUR/CHF", category: "currencies", unit: "CHF" },
  "EUR=X": { name: "USD/EUR", category: "currencies", unit: "EUR" },
  "GBP=X": { name: "USD/GBP", category: "currencies", unit: "GBP" },
  "JPY=X": { name: "USD/JPY", category: "currencies", unit: "JPY" },
  "CHF=X": { name: "USD/CHF", category: "currencies", unit: "CHF" },

  "CL=F": { name: "WTI Crude", category: "energy", unit: "USD/bbl" },
  "BZ=F": { name: "Brent Crude", category: "energy", unit: "USD/bbl" },
  "NG=F": { name: "Natural Gas", category: "energy", unit: "USD/MMBtu" },
  "RB=F": { name: "Gasoline", category: "energy", unit: "USD/gal" },
  "HO=F": { name: "Heating Oil", category: "energy", unit: "USD/gal" },
  "TTF=F": { name: "Dutch TTF Gas", category: "energy", unit: "EUR/MWh" },

  "ZC=F": { name: "Corn", category: "agriculture", unit: "USD/bu" },
  "ZW=F": { name: "Wheat", category: "agriculture", unit: "USD/bu" },
  "ZS=F": { name: "Soybeans", category: "agriculture", unit: "USD/bu" },
  "KC=F": { name: "Coffee", category: "agriculture", unit: "USD/lb" },
  "CC=F": { name: "Cocoa", category: "agriculture", unit: "USD/t" },
  "SB=F": { name: "Sugar", category: "agriculture", unit: "USD/lb" },
  "CT=F": { name: "Cotton", category: "agriculture", unit: "USD/lb" },

  "^GSPC": { name: "S&P 500", category: "indices", unit: "pts" },
  "^DJI": { name: "Dow Jones", category: "indices", unit: "pts" },
  "^IXIC": { name: "Nasdaq", category: "indices", unit: "pts" },
  "^RUT": { name: "Russell 2000", category: "indices", unit: "pts" },
  "^VIX": { name: "VIX", category: "indices", unit: "pts" },
  "^FTSE": { name: "FTSE 100", category: "indices", unit: "pts" },
  "^GDAXI": { name: "DAX", category: "indices", unit: "pts" },
  "^FCHI": { name: "CAC 40", category: "indices", unit: "pts" },
  "^STOXX50E": { name: "Euro Stoxx 50", category: "indices", unit: "pts" },
  "^N225": { name: "Nikkei 225", category: "indices", unit: "pts" },
  "^HSI": { name: "Hang Seng", category: "indices", unit: "pts" },
  "^AXJO": { name: "ASX 200", category: "indices", unit: "pts" },

  SPY: { name: "S&P 500 ETF", category: "etfs", unit: "USD" },
  QQQ: { name: "Nasdaq 100 ETF", category: "etfs", unit: "USD" },
  DIA: { name: "Dow ETF", category: "etfs", unit: "USD" },
  IWM: { name: "Russell 2000 ETF", category: "etfs", unit: "USD" },
  GLD: { name: "Gold ETF", category: "etfs", unit: "USD" },
  SLV: { name: "Silver ETF", category: "etfs", unit: "USD" },
  USO: { name: "Oil ETF", category: "etfs", unit: "USD" },
  UNG: { name: "Gas ETF", category: "etfs", unit: "USD" },

  AAPL: { name: "Apple", category: "stocks", unit: "USD" },
  MSFT: { name: "Microsoft", category: "stocks", unit: "USD" },
  GOOGL: { name: "Alphabet", category: "stocks", unit: "USD" },
  AMZN: { name: "Amazon", category: "stocks", unit: "USD" },
  NVDA: { name: "NVIDIA", category: "stocks", unit: "USD" },
  META: { name: "Meta", category: "stocks", unit: "USD" },
  TSLA: { name: "Tesla", category: "stocks", unit: "USD" },
  "BRK-B": { name: "Berkshire Hathaway", category: "stocks", unit: "USD" },
  JPM: { name: "JPMorgan Chase", category: "stocks", unit: "USD" },
  V: { name: "Visa", category: "stocks", unit: "USD" },
  MA: { name: "Mastercard", category: "stocks", unit: "USD" },
  ASML: { name: "ASML", category: "stocks", unit: "USD" },
  "SAP.DE": { name: "SAP", category: "europe", unit: "EUR" },
  "SIE.DE": { name: "Siemens", category: "europe", unit: "EUR" },
  "DTE.DE": { name: "Deutsche Telekom", category: "europe", unit: "EUR" },
  "ALV.DE": { name: "Allianz", category: "europe", unit: "EUR" },
  "BAS.DE": { name: "BASF", category: "europe", unit: "EUR" },
  "AIR.PA": { name: "Airbus", category: "europe", unit: "EUR" },
  "MC.PA": { name: "LVMH", category: "europe", unit: "EUR" },
  "NESN.SW": { name: "Nestle", category: "europe", unit: "CHF" },
  "NOVN.SW": { name: "Novartis", category: "europe", unit: "CHF" },
  "SHEL.L": { name: "Shell", category: "europe", unit: "GBp" },
  "BP.L": { name: "BP", category: "europe", unit: "GBp" },
};

const presets = {
  balanced: ["GC=F", "BTC-USD", "EURUSD=X", "^GSPC", "CL=F", "EUR=X"],
  metals: ["GC=F", "SI=F", "PL=F", "PA=F", "HG=F", "ALI=F"],
  crypto: ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "AVAX-USD"],
  currencies: ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "USDCAD=X", "AUDUSD=X", "EURGBP=X", "EUR=X"],
  energy: ["CL=F", "BZ=F", "NG=F", "RB=F", "HO=F", "TTF=F"],
  indices: ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX", "^FTSE", "^GDAXI", "^STOXX50E"],
  tech: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "ASML"],
  europe: ["^GDAXI", "^FCHI", "^STOXX50E", "SAP.DE", "SIE.DE", "DTE.DE", "ALV.DE", "AIR.PA"],
  custom: [],
};

function asString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function splitSymbols(value) {
  if (Array.isArray(value)) {
    return value.flatMap(splitSymbols);
  }

  return asString(value)
    .split(/[,\n]/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

function normalizeSymbol(symbol) {
  return symbol
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9.^=_-]/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSettings(query) {
  const preset = Object.hasOwn(presets, query.preset) ? query.preset : "balanced";
  const selected = splitSymbols(query.symbols);
  const custom = splitSymbols(query.customSymbols);
  const presetSymbols = presets[preset] || [];
  const symbols = unique(
    [...presetSymbols, ...selected, ...custom]
      .map(normalizeSymbol)
      .filter((symbol) => symbol.length <= 24),
  );

  return {
    color: asString(query.color, "light"),
    preset,
    symbols: symbols.length ? symbols : presets.balanced,
    currency: asString(query.currency, "USD").toUpperCase(),
    locale: asString(query.locale, "en-US"),
    limit: numberInRange(query.limit, 8, 1, 16),
    showChange: asBoolean(query.showChange, true),
    showChart: asBoolean(query.showChart, true),
    showSparklines: asBoolean(query.showSparklines, true),
    showRangeStats: asBoolean(query.showRangeStats, true),
    showSource: asBoolean(query.showSource, true),
    chartRange: normalizeChartRange(query.chartRange),
  };
}

function normalizeChartRange(value) {
  const range = asString(value, "1mo").toLowerCase();
  return ["5d", "1mo", "3mo", "6mo", "1y"].includes(range) ? range : "1mo";
}

function chartInterval(range) {
  return range === "5d" ? "1h" : "1d";
}

function quoteUrl(symbol, settings) {
  const params = new URLSearchParams({
    interval: chartInterval(settings.chartRange),
    range: settings.chartRange,
  });

  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params.toString()}`;
}

async function fetchQuote(symbol, settings) {
  const response = await fetch(quoteUrl(symbol, settings), {
    headers: {
      Accept: "application/json",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Quote request for ${symbol} failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(`No quote result for ${symbol}`);
  }

  return shapeQuote(symbol, result);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function lastFinite(values) {
  if (!Array.isArray(values)) {
    return null;
  }

  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = numberOrNull(values[index]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function previousFinite(values) {
  if (!Array.isArray(values)) {
    return null;
  }

  let foundLatest = false;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = numberOrNull(values[index]);
    if (value === null) {
      continue;
    }

    if (foundLatest) {
      return value;
    }

    foundLatest = true;
  }

  return null;
}

function inferUnit(meta, fallback) {
  return meta.currency || fallback?.unit || "";
}

function shapeHistory(result) {
  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  return timestamps
    .map((timestamp, index) => ({
      time: Number.isFinite(Number(timestamp))
        ? new Date(Number(timestamp) * 1000).toISOString()
        : "",
      close: numberOrNull(closes[index]),
    }))
    .filter((point) => point.time && point.close !== null)
    .slice(-120);
}

function historyStats(history) {
  if (!history.length) {
    return {
      high: null,
      low: null,
      rangeChange: null,
      rangeChangePercent: null,
    };
  }

  const values = history.map((point) => point.close);
  const first = values[0];
  const last = values[values.length - 1];
  const rangeChange = last - first;

  return {
    high: Math.max(...values),
    low: Math.min(...values),
    rangeChange,
    rangeChangePercent: first !== 0 ? (rangeChange / first) * 100 : null,
  };
}

function shapeQuote(symbol, result) {
  const meta = result.meta || {};
  const fallback = curatedAssets[symbol] || {};
  const closes = result.indicators?.quote?.[0]?.close || [];
  const history = shapeHistory(result);
  const stats = historyStats(history);
  const price = numberOrNull(meta.regularMarketPrice) ?? lastFinite(closes);
  const previous = numberOrNull(meta.chartPreviousClose) ?? previousFinite(closes);
  const change = price !== null && previous !== null ? price - previous : null;
  const changePercent =
    change !== null && previous !== null && previous !== 0 ? (change / previous) * 100 : null;
  const timestamp = Number.isFinite(Number(meta.regularMarketTime))
    ? new Date(Number(meta.regularMarketTime) * 1000).toISOString()
    : new Date().toISOString();

  return {
    symbol,
    name: meta.shortName || meta.longName || fallback.name || symbol,
    category: fallback.category || meta.instrumentType || "custom",
    exchange: meta.exchangeName || meta.fullExchangeName || "",
    unit: inferUnit(meta, fallback),
    price,
    previous,
    change,
    changePercent,
    trend: change === null ? "flat" : change > 0 ? "up" : change < 0 ? "down" : "flat",
    rangeTrend:
      stats.rangeChange === null
        ? "flat"
        : stats.rangeChange > 0
          ? "up"
          : stats.rangeChange < 0
            ? "down"
            : "flat",
    high: stats.high,
    low: stats.low,
    rangeChange: stats.rangeChange,
    rangeChangePercent: stats.rangeChangePercent,
    history,
    marketState: meta.marketState || "",
    updatedAt: timestamp,
  };
}

function sampleQuote(symbol, index) {
  const fallback = curatedAssets[symbol] || { name: symbol, category: "custom", unit: "USD" };
  const price = [2348.3, 64120, 1.082, 5488.2, 78.44, 0.923][index % 6] || 100 + index * 5;
  const changePercent = [0.42, -1.18, 0.09, 0.64, -0.31, 0.12][index % 6] || 0;
  const change = price * (changePercent / 100);
  const history = Array.from({ length: 28 }, (_, pointIndex) => {
    const wave = Math.sin((pointIndex + index) / 2.4) * price * 0.018;
    const slope = (pointIndex - 13.5) * price * changePercent * 0.0009;
    return {
      time: new Date(Date.now() - (27 - pointIndex) * 24 * 60 * 60 * 1000).toISOString(),
      close: Math.max(0.0001, price + wave + slope),
    };
  });
  const stats = historyStats(history);

  return {
    symbol,
    name: fallback.name,
    category: fallback.category,
    exchange: "Sample",
    unit: fallback.unit,
    price,
    previous: price - change,
    change,
    changePercent,
    trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
    rangeTrend: stats.rangeChange > 0 ? "up" : stats.rangeChange < 0 ? "down" : "flat",
    high: stats.high,
    low: stats.low,
    rangeChange: stats.rangeChange,
    rangeChangePercent: stats.rangeChangePercent,
    history,
    marketState: "SAMPLE",
    updatedAt: new Date().toISOString(),
  };
}

async function fetchQuotes(symbols, settings) {
  const settled = await Promise.allSettled(symbols.map((symbol) => fetchQuote(symbol, settings)));
  const quotes = settled
    .filter((result) => result.status === "fulfilled" && result.value.price !== null)
    .map((result) => result.value);
  const errors = settled
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || "Unknown quote error");

  return { quotes, errors };
}

function findLeader(quotes) {
  return [...quotes]
    .filter((quote) => quote.changePercent !== null)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0] || null;
}

export default async function handler({ query }) {
  const settings = normalizeSettings(query);
  const symbols = settings.symbols.slice(0, settings.limit);
  const { quotes, errors } = await fetchQuotes(symbols, settings);
  const finalQuotes = quotes.length ? quotes : symbols.map(sampleQuote);

  return {
    settings,
    quotes: finalQuotes.slice(0, settings.limit),
    leader: findLeader(finalQuotes),
    errors,
    source: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/",
    sample: quotes.length === 0,
    updatedAt: new Date().toISOString(),
  };
}

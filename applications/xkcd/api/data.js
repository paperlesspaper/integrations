const latestUrl = 'https://xkcd.com/info.0.json';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`XKCD request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchComic(num) {
  if (!num) {
    return fetchJson(latestUrl);
  }
  return fetchJson(`https://xkcd.com/${num}/info.0.json`);
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}

function shapeComic(comic) {
  return {
    title: comic.safe_title || comic.title,
    num: comic.num,
    alt: comic.alt,
    img: comic.img,
    year: comic.year,
    month: comic.month,
    day: comic.day,
  };
}

export default async function handler({ query }) {
  const explicitNum = toPositiveInteger(query.num);
  if (explicitNum) {
    return shapeComic(await fetchComic(explicitNum));
  }

  const kind = typeof query.kind === 'string' ? query.kind : 'latest';
  if (kind === 'latest') {
    return shapeComic(await fetchComic());
  }

  const latest = await fetchComic();
  if (kind === 'random') {
    const num = Math.max(1, Math.floor(Math.random() * latest.num) + 1);
    return shapeComic(await fetchComic(num));
  }

  if (kind === 'offset') {
    const difference = Math.max(0, Number(query.difference || 0));
    const num = Math.max(1, latest.num - Math.floor(difference));
    return shapeComic(await fetchComic(num));
  }

  return shapeComic(latest);
}

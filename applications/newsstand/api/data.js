const listingUrl = "https://walzr.com/papers";
const imageBaseUrl = "https://papers.walzr.com";
const topThree = ["nyt", "wsj", "guardian"];

const fallbackPapers = [
  {
    slug: "nyt",
    name: "The New York Times",
    city: "New York, N.Y.",
    country: "us",
  },
  {
    slug: "wsj",
    name: "The Wall Street Journal",
    city: "New York, N.Y.",
    country: "us",
  },
  {
    slug: "guardian",
    name: "The Guardian",
    city: "London, United Kingdom",
    country: "gb",
  },
  {
    slug: "wapo",
    name: "The Washington Post",
    city: "Washington, D.C.",
    country: "us",
  },
  {
    slug: "latimes",
    name: "Los Angeles Times",
    city: "Los Angeles, Calif.",
    country: "us",
  },
  {
    slug: "sfchronicle",
    name: "San Francisco Chronicle",
    city: "San Francisco, Calif.",
    country: "us",
  },
];

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function matchFirst(input, pattern) {
  const match = input.match(pattern);
  return match ? decodeHtml(match[1].trim()) : "";
}

export function cleanSelection(value) {
  return String(value || "top3")
    .trim()
    .toLowerCase()
    .replace(/^paper:/, "")
    .replace(/[^a-z0-9-]/g, "");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function imageUrl(slug, date) {
  return `${imageBaseUrl}/${slug}/${date}.webp`;
}

export function parsePapers(html) {
  const papers = [];
  const seen = new Set();
  const linkPattern =
    /<a\b[^>]*class="paper"[^>]*href="\/papers\/([^/"]+)\/(\d{4}-\d{2}-\d{2})"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(linkPattern)) {
    const slug = decodeHtml(match[1]);
    const date = match[2];
    const body = match[3];

    if (seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    papers.push({
      slug,
      date,
      name: matchFirst(body, /<h3[^>]*class="paper-title"[^>]*>([\s\S]*?)<\/h3>/),
      city: matchFirst(body, /<div[^>]*class="paper-city"[^>]*>([\s\S]*?)<\/div>/),
      country: matchFirst(body, /\/papers\/flag\/([a-z]{2})/i).toLowerCase(),
      imageUrl:
        matchFirst(body, /data-src="([^"]+)"/) ||
        imageUrl(slug, date),
    });
  }

  return papers;
}

export async function fetchPapers(date) {
  const url = new URL(listingUrl);
  if (date) {
    url.searchParams.set("date", date);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Papers request failed with ${response.status}`);
  }

  return parsePapers(await response.text());
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function bySlug(papers, slug) {
  return papers.find((paper) => paper.slug === slug);
}

function resolvePaper(papers, selection) {
  if (!papers.length) {
    throw new Error("No newspaper front pages were found.");
  }

  if (selection === "random") {
    return pickRandom(papers);
  }

  if (selection === "top3") {
    const availableTopPapers = topThree
      .map((slug) => bySlug(papers, slug))
      .filter(Boolean);
    return pickRandom(availableTopPapers.length ? availableTopPapers : papers);
  }

  return bySlug(papers, selection);
}

export default async function handler({ query }) {
  const date = isIsoDate(query.date) ? String(query.date) : "";
  const selection = cleanSelection(query.newspaper);
  const papers = await fetchPapers(date);
  const paper = resolvePaper(papers, selection);
  const latestDate = paper?.date || papers[0]?.date || date || todayIsoDate();

  if (!paper) {
    const fallback = fallbackPapers.find((item) => item.slug === selection);
    if (fallback) {
      return {
        ...fallback,
        date: latestDate,
        imageUrl: imageUrl(fallback.slug, latestDate),
        sourceUrl: `${listingUrl}/${fallback.slug}/${latestDate}`,
        totalPapers: papers.length,
        updatedAt: new Date().toISOString(),
      };
    }

    throw new Error(`Unknown newspaper slug: ${selection}`);
  }

  return {
    slug: paper.slug,
    name: paper.name || paper.slug,
    city: paper.city || "",
    country: paper.country || "",
    date: paper.date,
    imageUrl: paper.imageUrl || imageUrl(paper.slug, paper.date),
    sourceUrl: `${listingUrl}/${paper.slug}/${paper.date}`,
    totalPapers: papers.length,
    updatedAt: new Date().toISOString(),
  };
}

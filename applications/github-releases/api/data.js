import {
  bool,
  getJson,
  envelope,
  retrievedAt,
  text,
  language,
} from "../../_shared/dashboard-api.js";
export function repositories(value) {
  const repos = [
    ...new Set(
      text(value || "home-assistant/core\npaperless-ngx/paperless-ngx")
        .split(/[,\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  if (
    !repos.length ||
    repos.length > 4 ||
    repos.some(
      (x) =>
        !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x) ||
        x.split("/").some((v) => /^\.+$/.test(v)),
    )
  )
    throw Error("Use up to four owner/repository names");
  return repos;
}
export function newestRelease(data, includePrereleases) {
  if (!Array.isArray(data)) throw Error("Invalid releases response");
  return (
    data
      .filter(
        (r) =>
          !r.draft &&
          (includePrereleases || !r.prerelease) &&
          r.tag_name &&
          Number.isFinite(Date.parse(r.published_at)),
      )
      .sort(
        (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at),
      )[0] || null
  );
}
export async function loadReleases(query, fetchJson = getJson) {
  const de = language(query) === "de";
  if (bool(query.sampleData))
    return envelope(
      {
        note: de
          ? "Neueste Veröffentlichung pro Projekt"
          : "Newest publication per project",
        cards: ["home-assistant/core", "paperless-ngx/paperless-ngx"].map(
          (title, i) => ({
            title,
            value: i ? "v3.0.0-demo" : "2026.9.0-demo",
            detail: de
              ? "Stabile Veröffentlichung · Demo"
              : "Stable release · demo",
            stamp: new Date(Date.now() - i * 86400000).toISOString(),
            tone: i ? "orange" : "blue",
          }),
        ),
      },
      true,
      "GitHub",
    );
  const repos = repositories(query.repositories),
    token = text(query.token),
    headers = {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  const rows = await Promise.allSettled(
    repos.map(async (repo) => {
      const d = await fetchJson(
        `https://api.github.com/repos/${repo}/releases?per_page=30`,
        { headers, ttl: 1800000 },
      );
      const r = newestRelease(d, bool(query.includePrereleases));
      return {
        time: retrievedAt(d),
        card: {
          title: repo,
          value: r ? String(r.tag_name).slice(0, 45) : null,
          detail: r
            ? r.prerelease
              ? de
                ? "Vorabversion"
                : "Pre-release"
              : de
                ? "Stabile Veröffentlichung"
                : "Stable release"
            : de
              ? "Keine passende Veröffentlichung in den letzten 30 Releases"
              : "No matching publication in the last 30 releases",
          stamp: r?.published_at || "",
          tone: r?.prerelease ? "orange" : "blue",
        },
      };
    }),
  );
  const ok = rows.filter((r) => r.status === "fulfilled");
  if (!ok.length) throw Error("Repositories unavailable");
  return envelope(
    {
      partial: ok.length < repos.length,
      note: de
        ? "Veröffentlichungsdatum · kein Vergleich mit installierten Versionen"
        : "Publication date · no comparison with installed versions",
      cards: rows.map((r, i) =>
        r.status === "fulfilled"
          ? r.value.card
          : {
              title: repos[i],
              value: null,
              detail: de
                ? "Projekt nicht erreichbar"
                : "Repository unavailable",
              tone: "orange",
            },
      ),
    },
    false,
    "GitHub",
    ok.map((x) => x.value.time).sort()[0],
  );
}
export default async function handler({ query }) {
  return loadReleases(query);
}

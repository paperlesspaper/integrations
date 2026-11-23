import {
  getJson,
  bool,
  required,
  array,
  number,
  auth,
  post,
  metric,
  tr,
  envelope,
} from "../../_shared/connected-api.js";
export function normalizeActivity(d, q) {
  if (d.errors?.length) throw Error("GitHub GraphQL request failed");
  const user = d.data?.user,
    cal = user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw Error("GitHub user not found");
  const weeks = array(cal.weeks).slice(-Math.floor(number(q.weeks, 26, 4, 53)));
  const days = weeks.flatMap((w) =>
    array(w.contributionDays).map((x) => ({
      date: x.date,
      count: Number(x.contributionCount) || 0,
    })),
  );
  return {
    subtitle: user.name || user.login,
    metrics: [
      metric(
        tr(q, "Letzte 12 Monate", "Last 12 months"),
        cal.totalContributions,
      ),
      metric(
        tr(q, "Sichtbarer Zeitraum", "Visible period"),
        days.reduce((s, d) => s + d.count, 0),
      ),
      metric(
        tr(q, "Aktive Tage", "Active days"),
        days.filter((d) => d.count > 0).length,
      ),
    ],
    heatmap: days,
    note: tr(
      q,
      "Beiträge gemäß GitHub-Sichtbarkeit · ein Feld pro Tag",
      "Contributions follow GitHub visibility · one cell per day",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData)) {
    const now = new Date(),
      start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 181 - start.getUTCDay());
    const weeks = Array.from({ length: 26 }, (_, w) => ({
      contributionDays: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + w * 7 + i);
        return {
          date: d.toISOString().slice(0, 10),
          contributionCount: (w * 3 + i * 7) % 13,
        };
      }),
    }));
    return envelope(
      normalizeActivity(
        {
          data: {
            user: {
              name: "Alex Developer",
              contributionsCollection: {
                contributionCalendar: { totalContributions: 1248, weeks },
              },
            },
          },
        },
        q,
      ),
      true,
      "GitHub",
    );
  }
  const d = await post(
    "https://api.github.com/graphql",
    {
      query:
        "query($login:String!){user(login:$login){login name contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}",
      variables: { login: required(q.username, "GitHub username") },
    },
    auth(q.token),
    fetchJson,
  );
  return envelope(normalizeActivity(d, q), false, "GitHub");
}
export default async function handler({ query }) {
  return loadData(query);
}

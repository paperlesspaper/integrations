import {
  getJson,
  bool,
  required,
  text,
  array,
  auth,
  post,
  row,
  metric,
  tr,
  envelope,
} from "../../_shared/connected-api.js";
export function normalizePullRequests(d, q) {
  if (d.errors?.length) throw Error("GitHub GraphQL request failed");
  const search = d.data?.search;
  if (!search) throw Error("Invalid GitHub response");
  const prs = array(search.nodes);
  const state = (p) => p.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state;
  const label = (p) =>
    p.isDraft
      ? tr(q, "Entwurf", "Draft")
      : ["FAILURE", "ERROR"].includes(state(p))
        ? tr(q, "CI fehlgeschlagen", "CI failed")
        : state(p) === "PENDING"
          ? tr(q, "CI läuft", "CI pending")
          : state(p) === "SUCCESS"
            ? tr(q, "CI erfolgreich", "CI passed")
            : tr(q, "Kein CI-Status", "No CI status");
  return {
    total: search.issueCount,
    metrics: [
      metric(tr(q, "Offene PRs", "Open PRs"), search.issueCount),
      metric(
        tr(q, "CI-Fehler geladen", "Loaded CI failures"),
        prs.filter((p) => ["FAILURE", "ERROR"].includes(state(p))).length,
        "",
        "red",
      ),
    ],
    rows: prs.map((p) =>
      row(
        p.title,
        `${p.repository?.nameWithOwner} #${p.number} · ${p.author?.login || ""}`,
        label(p),
        ["FAILURE", "ERROR"].includes(state(p))
          ? "red"
          : state(p) === "SUCCESS"
            ? "green"
            : "accent",
      ),
    ),
    partial: search.pageInfo?.hasNextPage === true,
    note: tr(
      q,
      "CI-Status des letzten Commits · maximal 50 Pull Requests",
      "CI status of the latest commit · up to 50 pull requests",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      normalizePullRequests(
        {
          data: {
            search: {
              issueCount: 3,
              nodes: [
                {
                  title: "Improve calendar layout",
                  number: 142,
                  repository: { nameWithOwner: "paperlesspaper/display" },
                  author: { login: "alex" },
                  commits: {
                    nodes: [
                      { commit: { statusCheckRollup: { state: "SUCCESS" } } },
                    ],
                  },
                },
                {
                  title: "Add new data adapter",
                  number: 143,
                  repository: { nameWithOwner: "paperlesspaper/display" },
                  author: { login: "sam" },
                  commits: {
                    nodes: [
                      { commit: { statusCheckRollup: { state: "FAILURE" } } },
                    ],
                  },
                },
                {
                  title: "Update documentation",
                  number: 144,
                  isDraft: true,
                  repository: { nameWithOwner: "paperlesspaper/display" },
                  author: { login: "alex" },
                },
              ],
            },
          },
        },
        q,
      ),
      true,
      "GitHub",
    );
  const user = required(q.username, "GitHub username");
  if (!/^[\w-]+$/.test(user)) throw Error("Invalid GitHub username");
  const repo = text(q.repository);
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo))
    throw Error("Invalid repository");
  const mode = ["review-requested", "author", "involves"].includes(q.mode)
    ? q.mode
    : "review-requested";
  const query = `is:pr is:open ${mode}:${user}${repo ? " repo:" + repo : ""}`;
  const d = await post(
    "https://api.github.com/graphql",
    {
      query:
        "query($q:String!){search(query:$q,type:ISSUE,first:50){issueCount pageInfo{hasNextPage} nodes{... on PullRequest{title number isDraft author{login} repository{nameWithOwner} commits(last:1){nodes{commit{statusCheckRollup{state}}}}}}}}",
      variables: { q: query },
    },
    auth(q.token),
    fetchJson,
  );
  return envelope(normalizePullRequests(d, q), false, "GitHub");
}
export default async function handler({ query }) {
  return loadData(query);
}

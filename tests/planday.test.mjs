import test from "node:test";
import assert from "node:assert/strict";
import { loadCalendar } from "../applications/planday/api/data.js";

const credentials = { clientId: "studio", refreshToken: "fixture&value", departmentId: "17" };
// Berlin is already on Monday, but the UTC date still belongs to the preceding week and year.
const now = new Date("2023-12-31T23:30:00Z");
const noNetwork = () => { throw Error("Unexpected network request"); };

test("demo and incomplete setup never contact the provider", async () => {
  const demo = await loadCalendar({ sampleData: true }, noNetwork, now);
  assert.equal(demo.sample, true);
  assert.equal(demo.events[0].start.dateTime, "2024-01-01T07:00:00.000Z");
  await assert.rejects(loadCalendar({}, noNetwork, now), /App-ID/);
});

test("weekly calendar joins paged shifts and employees and preserves local and overnight times", async () => {
  const shift = { date: "2024-01-01", employeeId: 12, status: "Assigned", startDateTime: "2024-01-01T07:00:00Z", endDateTime: "2024-01-01T15:00:00Z" };
  const shifts = [
    { ...shift, date: "2023-12-31", startDateTime: "2023-12-31T20:00:00", endDateTime: "2024-01-01T02:00:00" },
    { ...shift, status: "Draft" }, { ...shift, status: "Open" }, { ...shift, employeeId: null },
    { ...shift, employeeId: 45, startDateTime: null, endDateTime: null }, shift,
    { ...shift, startDateTime: "2024-01-02T21:30:00", endDateTime: "2024-01-03T03:30:00" },
    { ...shift, employeeId: 404, date: "2024-01-03", startDateTime: null, endDateTime: null },
  ];
  const employees = [{ id: 45, firstName: "A.", lastName: "Lin" }, { id: 12, firstName: "Nora", lastName: "May", email: "private" }];
  const fetchJson = async (address, options) => {
    const url = new URL(address);
    if (url.host === "id.planday.com") {
      assert.equal(url.pathname, "/connect/token");
      assert.equal(options.method, "POST");
      assert.deepEqual(Object.fromEntries(new URLSearchParams(options.body)), {
        client_id: "studio", refresh_token: credentials.refreshToken, grant_type: "refresh_token",
      });
      return { access_token: "access" };
    }
    assert.equal(url.host, "openapi.planday.com");
    assert.deepEqual(options.headers, { "X-ClientId": "studio", Authorization: "Bearer access" });
    const offset = Number(url.searchParams.get("offset"));
    if (url.pathname === "/scheduling/v1.0/shifts") {
      assert.equal(url.searchParams.get("departmentId"), "17");
      assert.equal(url.searchParams.get("from"), "2023-12-31");
      assert.equal(url.searchParams.get("to"), "2024-01-07");
      return { data: shifts.slice(offset, offset + 4), paging: { total: shifts.length } };
    }
    assert.equal(url.pathname, "/hr/v1.0/employees");
    return { data: employees.slice(offset, offset + 1), paging: { total: employees.length } };
  };
  const { events, sample } = await loadCalendar(credentials, fetchJson, now);
  assert.equal(sample, false);
  assert.deepEqual(events.map(e => [e.title, e.start.dateTime || e.start.date, e.end?.dateTime]), [
    ["Nora May", "2023-12-31T19:00:00.000Z", "2024-01-01T01:00:00.000Z"],
    ["A. Lin", "2024-01-01", undefined],
    ["Nora May", "2024-01-01T07:00:00.000Z", "2024-01-01T15:00:00.000Z"],
    ["Nora May", "2024-01-02T20:30:00.000Z", "2024-01-03T02:30:00.000Z"],
    ["#404", "2024-01-03", undefined],
  ]);
  assert.doesNotMatch(JSON.stringify(events), /private|employeeId|email/);
});

test("a provider error stays an error, and an empty week does not query HR", async () => {
  await assert.rejects(loadCalendar(credentials, async () => { throw Error("HTTP 403"); }, now), /403/);
  const empty = await loadCalendar(credentials, async address => {
    if (address.includes("/connect/token")) return { access_token: "access" };
    assert.match(address, /scheduling/);
    return { data: [], paging: { total: 0 } };
  }, now);
  assert.deepEqual(empty, { sample: false, events: [] });
});

test("honours one-day and full leap-year ranges and keeps summer shift times in Berlin", async () => {
  const getSample = (from, to) => loadCalendar({ sampleData: true, rangeStart: from, rangeEndExclusive: to }, noNetwork);
  const day = await getSample("2024-07-01", "2024-07-02");
  assert.deepEqual(day.events.map(e => e.start.dateTime), ["2024-07-01T06:00:00.000Z", "2024-07-01T10:00:00.000Z"]);
  const year = await getSample("2024-01-01", "2025-01-01");
  assert.ok(year.events.some(e => e.start.dateTime.startsWith("2024-02-29")));
  assert.ok(year.events.some(e => e.start.dateTime.startsWith("2024-12-31")));
  await assert.rejects(getSample("2024-01-01", "2025-01-02"), /366/);
});

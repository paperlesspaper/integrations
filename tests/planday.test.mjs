import test from "node:test";
import assert from "node:assert/strict";
import handler, { loadCalendar } from "../applications/planday/api/data.js";

const credentials = { clientId: "studio", refreshToken: "fixture&value", departmentId: "17" };
// Berlin is already on Monday, but the UTC date still belongs to the preceding week and year.
const now = new Date("2023-12-31T23:30:00Z");
const noNetwork = () => { throw Error("Unexpected network request"); };

const webSettings = { connection: "webSchedule", departmentId: "17", browserToken: "Bearer fixture", clientId: "web-client" };

test("web schedule joins department shifts to display names and returns only calendar fields", async () => {
  const calls = [];
  const fetchJson = async (url, { headers }) => {
    calls.push(url);
    assert.equal(headers.Authorization, "Bearer fixture");
    assert.equal(headers["X-ClientId"], "web-client");
    const shift = { id: 1, employee_id: 9, date: "2024-01-01", time_zone: "Europe/Berlin",
      start_date_time: "2024-01-01T21:00", end_date_time: "2024-01-02T05:00", status: "Approved", comment: "private" };
    return url.includes("/shifts?") ? { shifts: [shift, { ...shift, status: "Draft" }, { ...shift, employee_id: null }] }
      : { employees: [{ id: 9, display_name: "Test Person", permissions: ["private"] }] };
  };
  const result = await loadCalendar({ ...webSettings, departmentId: 17 }, fetchJson, now);
  assert.deepEqual(calls, ["shift", "people"].map((service, i) =>
    "https://scheduling-" + service + "-api.prod-westeurope.planday.cloud/scheduling/departments/17/day_based/" +
    ["shifts", "employees"][i] + "?from=2023-12-31&to=2024-01-07"));
  assert.deepEqual(result, { sample: false, events: [{ id: 1, title: "Test Person", color: "#0000ff",
    start: { dateTime: "2024-01-01T20:00:00.000Z" }, end: { dateTime: "2024-01-02T04:00:00.000Z" } }] });
});

test("web schedule distinguishes an empty week, rejected token and invalid payload", async () => {
  const empty = await loadCalendar(webSettings, async url => {
    assert.match(url, /\/shifts\?/);
    return { shifts: [] };
  }, now);
  assert.deepEqual(empty, { sample: false, events: [] });
  await assert.rejects(loadCalendar(webSettings, async () => ({}), now), /Invalid/);
  await assert.rejects(loadCalendar(webSettings, async () => { throw Error("HTTP 401"); }, now), /Zugriffstoken/);
  await assert.rejects(loadCalendar({ ...webSettings, departmentId: "" }, noNetwork, now), /Abteilungs-ID/);
  await assert.rejects(handler({ query: webSettings, request: { method: "GET" } }), /POST/);
});

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

test("employee colors follow the roster across views, including staff without shifts", async () => {
  const week = await loadCalendar({ sampleData: true }, noNetwork, now);
  const day = await loadCalendar({ sampleData: true, rangeStart: "2024-01-02", rangeEndExclusive: "2024-01-03" }, noNetwork, now);
  const colors = new Map(week.events.map(event => [event.title, event.color]));
  assert.equal(new Set(colors.values()).size, 4);
  assert.equal(day.events.length, 1);
  for (const event of [...week.events, ...day.events]) assert.equal(event.color, colors.get(event.title));
});

test("resolves roster color collisions when the selected week contains fewer than six people", async () => {
  const employees = Array.from({ length: 9 }, (_, index) => ({ id: index + 1, display_name: "Person " + (index + 1) }));
  const shifts = [7, 2, 1, 7].map((id, i) => ({ id: i + 1, employee_id: id, date: "2024-01-01" }));
  const result = await loadCalendar(webSettings, async url => url.includes("/shifts?") ? { shifts } : { employees }, now);
  const colors = result.events.map(event => event.color);
  assert.equal(new Set(colors).size, 3);
  assert.equal(colors[0], colors[3]);
});

test("name selection preserves compound names, default display names and employee colors", async () => {
  const shift = { id: 1, employee_id: 9, date: "2024-01-01" };
  const web = async url => url.includes("/shifts?")
    ? { shifts: [shift] }
    : { employees: [{ id: 9, display_name: "Anni", name: { first_name: "Anne Marie", last_name: "van den Berg" } }] };
  const open = async url => {
    if (url.includes("/connect/token")) return { access_token: "fixture" };
    if (url.includes("/shifts?")) return { data: [{ id: 1, employeeId: 9, date: shift.date }] };
    return { data: [{ id: 9, firstName: "Anne Marie", lastName: "van den Berg" }] };
  };
  for (const [setup, fetchJson, full] of [[webSettings, web, "Anni"], [credentials, open, "Anne Marie van den Berg"]]) {
    for (const [nameFormat, expected] of [[undefined, full], ["Nur Vorname", "Anne Marie"], ["Nur Nachname", "van den Berg"]]) {
      const { events } = await loadCalendar({ ...setup, nameFormat }, fetchJson, now);
      assert.equal(events[0].title, expected);
      assert.equal(events[0].color, "#0000ff");
    }
  }
  const { events } = await loadCalendar({ ...webSettings, nameFormat: "Nur Nachname" }, async url =>
    url.includes("/shifts?") ? { shifts: [shift] } : { employees: [{ id: 9, display_name: "Anni" }] }, now);
  assert.equal(events[0].title, "#9");
});

test("private helper week preserves names and rejects a wider range", async () => {
  const query = { connection: "weekHelper", helperKey: "a".repeat(43), rangeStart: "2024-01-01", rangeEndExclusive: "2024-01-08", nameFormat: "Nur Vorname" };
  const weekly = async () => ({
    department:"17", from:"2024-01-01", to:"2024-01-07",
    employees:[{id:9,first:"Anne Marie",last:"van den Berg"}],
    shifts:[{id:24,employeeId:9,date:"2024-01-01"}]
  });
  const {events} = await loadCalendar(query, undefined, now, weekly);
  assert.equal(events[0].title,"Anne Marie");
  assert.ok(events[0].color);
  await assert.rejects(loadCalendar({...query,rangeEndExclusive:"2024-01-09"},undefined,now,weekly), /Kalenderwoche/);
  await assert.rejects(loadCalendar({...query,departmentId:"18"},undefined,now,weekly), /Abteilung/);
});

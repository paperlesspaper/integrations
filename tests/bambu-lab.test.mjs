import test from "node:test";
import assert from "node:assert/strict";
import handler, { imageUrl, normalizeTask, normalizeHistory, loadBambu } from "../applications/bambu-lab/api/data.js";

const now = Date.parse("2026-09-22T12:00:00Z");
const task = { id: 1, title: "Vase", status: 1, startTime: "2026-09-22T11:00:00Z", endTime: "2026-09-22T11:00:00Z", costTime: 7200, weight: 0, deviceId: "printer-a" };

test("cloud history estimates are labelled, bounded and never treated as successful completion", () => {
  const running = normalizeTask(task, now);
  assert.equal(running.state, "printing");
  assert.equal(running.progress, 50);
  assert.equal(running.estimatedEnd, "2026-09-22T13:00:00.000Z");
  assert.equal(running.durationSeconds, null);
  assert.equal(running.endTime, null);
  const overdue = normalizeTask(task, now + 7200000);
  assert.equal(overdue.state, "unconfirmed");
  assert.equal(overdue.progress, null);
  assert.equal(overdue.estimatedEnd, null);
  assert.equal(normalizeTask({ ...task, costTime: null }, now).state, "unconfirmed");
});

test("terminal states override the sentinel, with actual runtime separate from slice estimates", () => {
  const short = { ...task, endTime: "2026-09-22T11:00:20Z" };
  const failed = normalizeTask({ ...short, status: 3 }, now);
  assert.equal(failed.state, "failed");
  assert.equal(failed.durationSeconds, 20);
  assert.equal(failed.estimateSeconds, 7200);
  assert.equal(failed.progress, null);
  assert.equal(normalizeTask({ ...short, status: 2 }, now).state, "finished");
  assert.equal(normalizeTask({ ...task, status: "PAUSED" }, now).state, "paused");
});

test("missing and malformed measurements do not become zeros or invalid dates", () => {
  const missing = normalizeTask({ weight: null, costTime: "", startTime: "invalid", status: 99 }, now);
  assert.equal(missing.weightGrams, null);
  assert.equal(missing.estimateSeconds, null);
  assert.equal(missing.startTime, null);
  assert.equal(missing.state, "unknown");
  assert.equal(normalizeTask(task, now).weightGrams, 0);
  assert.equal(normalizeTask({ weight: false }).weightGrams, null);
  assert.equal(normalizeTask({ ...task, startTime: "2026-09-23T00:00:00Z" }, now).state, "unknown");
});

test("materials use AMS mappings without repeating duplicates, and prefer target material", () => {
  const row = normalizeTask({ amsDetailMapping: [null, { filamentType: "PLA", targetFilamentType: "PETG" }, { filamentType: "PETG" }], material: { name: "" } });
  assert.deepEqual(row.materials, ["PETG"]);
  assert.deepEqual(normalizeTask({ material: { name: "ABS" } }).materials, ["ABS"]);
});

test("sorting, printer filtering and duplicate handling preserve the active print", () => {
  const body = { hits: [null, { ...task, id: 3, status: 2, deviceId: "printer-b", startTime: "2026-09-22T11:45:00Z" }, task, task, { ...task, id: 2, status: 2, startTime: "2026-09-21T11:00:00Z" }] };
  const result = normalizeHistory(body, { deviceId: "printer-a", historyLimit: 99 }, now);
  assert.equal(result.current.id, "1");
  assert.deepEqual(result.history.map((r) => r.id), ["2"]);
  assert.equal(normalizeHistory(body, { historyLimit: 0 }, now).history.length, 0);
  assert.equal(normalizeHistory(body, { deviceId: "absent" }, now).current, null);
  assert.throws(() => normalizeHistory({ hits: {} }), /Invalid/);
  assert.equal(normalizeHistory({ hits: [] }).current, null);
});

test("only HTTPS provider images are accepted, without credentials or arbitrary ports", () => {
  for (const url of ["https://makerworld.bblmw.com/model.png", "https://makerworld.com/model.png", "https://public.bambulab.com/a.png", "https://bbl-us-public.oss-us-west-1.aliyuncs.com/a.png"]) assert.equal(imageUrl(url), url);
  for (const url of ["javascript:alert(1)", "data:image/svg+xml,bad", "http://makerworld.com/a.png", "https://makerworld.com.evil.test/a.png", "https://foo.aliyuncs.com/a.png", "https://user:pass@makerworld.com/a.png", "https://makerworld.com:9443/a.png"]) assert.equal(imageUrl(url), "");
});

test("read-only cloud requests use fixed regional endpoints and header authentication", async () => {
  for (const [region, host] of [["china", "api.bambulab.cn"], ["https://evil.test", "api.bambulab.com"]]) {
    const result = await loadBambu({ token: "Bearer PRIVATE_TOKEN", region, deviceId: "A&B", sampleData: "false" }, async (url, options) => {
      const parsed = new URL(url);
      assert.equal(parsed.hostname, host);
      assert.equal(parsed.pathname, "/v1/user-service/my/tasks");
      assert.equal(parsed.searchParams.get("deviceId"), "A&B");
      assert.equal(parsed.searchParams.get("limit"), "50");
      assert.ok(!url.includes("PRIVATE_TOKEN"));
      assert.equal(options.headers.Authorization, "Bearer PRIVATE_TOKEN");
      assert.equal(options.ttl, 60000);
      return { hits: [] };
    }, now);
    assert.equal(result.sample, false);
  }
});

test("failures never fall back to demo data or leak upstream messages", async () => {
  await assert.rejects(loadBambu({ token: "valid" }, async () => { throw Error("Source returned HTTP 401"); }), /^Error: auth$/);
  await assert.rejects(loadBambu({ token: "valid" }, async () => { throw Error("secret token detail"); }), /^Error: upstream$/);
  await assert.rejects(loadBambu({ token: "valid" }, async () => ({ code: 100, hits: [] })), /upstream/);
  await assert.rejects(loadBambu({ token: "" }), /setup/);
  assert.deepEqual(await handler({ query: {} }), { error: "setup" });
  assert.deepEqual(await handler({ query: { token: "invalid\nheader" } }), { error: "setup" });
});

test("demo mode is explicit and supports completed, failed and empty screens without network access", async () => {
  const never = () => { throw Error("Demo made a network request"); };
  for (const demoState of ["printing", "finished", "failed", "empty"]) {
    const data = await loadBambu({ sampleData: "true", demoState, deviceId: "live-printer" }, never, now);
    assert.equal(data.sample, true);
    assert.equal(data.current?.state ?? "empty", demoState);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import weather from "../applications/weather/api/data.js";

for (const [kind, available] of [
  ["current", ["weather"]],
  ["forecast", ["forecast"]],
  [undefined, ["weather", "forecast"]],
  ["all", ["weather", "forecast"]],
]) {
  test(`OpenWeatherMap ${
    kind || "default"
  } only depends on required endpoints`, async (t) => {
    const requests = [];
    t.mock.method(globalThis, "fetch", async (input) => {
      const url = new URL(input);
      const endpoint = url.pathname.split("/").at(-1);
      requests.push(endpoint);
      assert.equal(url.searchParams.get("q"), "Dresden");
      assert.equal(url.searchParams.get("lang"), "nl");
      assert.equal(url.searchParams.get("units"), "metric");
      return new Response(JSON.stringify({ endpoint }), {
        status: available.includes(endpoint) ? 200 : 503,
      });
    });
    const data = await weather({
      query: { kind, location: "Dresden", language: "nl", apiKey: "test-key" },
    });
    assert.deepEqual(requests, available);
    assert.deepEqual(
      data.currentWeather,
      available.includes("weather") ? { endpoint: "weather" } : null
    );
    assert.deepEqual(
      data.forecast,
      available.includes("forecast") ? { endpoint: "forecast" } : null
    );
  });
}

test("required upstream failures still reject the request", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ message: "upstream unavailable" }), {
        status: 503,
      })
  );
  await assert.rejects(
    weather({ query: { kind: "current", apiKey: "test-key" } }),
    /upstream unavailable/
  );
});

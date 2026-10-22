import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler, {
  clampSlotMinutes,
  inferConnectionMode,
  parseFolderInput,
  pickIndex,
  sortFiles,
  imageUrlsForFile,
} from "../applications/google-drive-slideshow/api/data.js";
import {
  normalizeServiceAccountKeyInput,
  parseServiceAccountKey,
  sanitizeServiceAccountKeyText,
  DriveSlideshowError,
  driveErrorKind,
  readGoogleError,
} from "../applications/google-drive-slideshow/api/serviceAccount.js";
import { inferConnectionMode as inferConnectionModeShared } from "../applications/google-drive-slideshow/assets/drive-connection.js";
import foldersHandler from "../applications/google-drive-slideshow/api/folders.js";
import {
  normalizeBrightnessBoost,
  brightnessBoostEpdMeta,
  defaultEpdOptimizeMeta,
} from "../applications/google-drive-slideshow/assets/brightness-boost.js";

test("inferConnectionMode honors explicit public when service account fields are present", () => {
  assert.equal(
    inferConnectionMode({
      connectionMode: "public",
      folderUrl: "https://drive.google.com/drive/folders/pub",
      apiKey: "key",
      serviceAccountKey: '{"client_email":"a@b.iam.gserviceaccount.com"}',
      folderId: "private-folder",
    }),
    "public",
  );
});

test("inferConnectionMode honors explicit serviceAccount when public fields are present", () => {
  assert.equal(
    inferConnectionMode({
      connectionMode: "serviceAccount",
      folderUrl: "https://drive.google.com/drive/folders/pub",
      apiKey: "key",
      serviceAccountKey: '{"client_email":"a@b.iam.gserviceaccount.com"}',
      folderId: "private-folder",
    }),
    "serviceAccount",
  );
});

test("inferConnectionMode falls back to credentials when connectionMode is missing", () => {
  assert.equal(
    inferConnectionMode({
      serviceAccountKey: '{"client_email":"a@b.iam.gserviceaccount.com"}',
      folderId: "private-folder",
    }),
    "serviceAccount",
  );
  assert.equal(
    inferConnectionMode({
      folderUrl: "https://drive.google.com/drive/folders/pub",
      apiKey: "key",
    }),
    "public",
  );
});

test("shared inferConnectionMode matches data re-export", () => {
  const query = {
    connectionMode: "serviceAccount",
    serviceAccountKey: "x",
    folderId: "abc",
  };
  assert.equal(inferConnectionMode(query), inferConnectionModeShared(query));
});

test("parseFolderInput accepts raw folder ID", () => {
  assert.deepEqual(parseFolderInput("1a2b3c-d4e5"), {
    folderId: "1a2b3c-d4e5",
    resourceKey: "",
  });
});

test("parseFolderInput parses /folders/ URL and resourcekey", () => {
  const url =
    "https://drive.google.com/drive/folders/abc123XYZ?resourcekey=0-abc%2Bdef";
  assert.deepEqual(parseFolderInput(url), {
    folderId: "abc123XYZ",
    resourceKey: "0-abc+def",
  });
});

test("parseFolderInput parses open?id= URL", () => {
  assert.deepEqual(
    parseFolderInput("https://drive.google.com/open?id=folderId99"),
    { folderId: "folderId99", resourceKey: "" },
  );
});

test("parseFolderInput rejects invalid URLs with transient errorKind", () => {
  try {
    parseFolderInput("https://example.com/no-folder-here");
    assert.fail("expected throw");
  } catch (error) {
    assert.match(error.message, /folder ID/);
    assert.equal(error.errorKind, "transient");
  }
  assert.throws(() => parseFolderInput("https://drive.google.com/"), (error) => {
    assert.match(error.message, /folder ID/);
    assert.equal(error.errorKind, "transient");
    return true;
  });
});

test("clampSlotMinutes clamps and defaults", () => {
  assert.equal(clampSlotMinutes(0), 1);
  assert.equal(clampSlotMinutes(2000), 1440);
  assert.equal(clampSlotMinutes("90"), 90);
  assert.equal(clampSlotMinutes("nope"), 60);
});

test("sortFiles orders by name", () => {
  const files = [{ name: "b.jpg" }, { name: "a.jpg" }];
  assert.deepEqual(sortFiles(files, "name").map((f) => f.name), ["a.jpg", "b.jpg"]);
});

test("pickIndex walks sequential slots modulo length", () => {
  assert.equal(pickIndex(3, "name", 0, "paper"), 0);
  assert.equal(pickIndex(3, "name", 1, "paper"), 1);
  assert.equal(pickIndex(3, "name", 3, "paper"), 0);
});

test("pickIndex random is stable for paperId and slot", () => {
  const a = pickIndex(10, "random", 42, "kitchen");
  const b = pickIndex(10, "random", 42, "kitchen");
  const c = pickIndex(10, "random", 42, "other");
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("imageUrlsForFile upgrades thumbnail size and adds fallbacks", () => {
  const urls = imageUrlsForFile({
    id: "fileId1",
    thumbnailLink: "https://lh3.googleusercontent.com/foo=s220",
  });
  assert.equal(urls[0], "https://lh3.googleusercontent.com/foo=s1600");
  assert.ok(urls.some((u) => u.includes("fileId1")));
  assert.equal(new Set(urls).size, urls.length);
});

test("handler returns sample when folder and key are empty", async () => {
  const result = await handler({ query: {} });
  assert.equal(result.source, "sample");
  assert.ok(result.total >= 1);
  assert.ok(result.imageUrl.startsWith("data:image/svg+xml"));
});

test("handler returns auth error when folder URL missing for public mode", async () => {
  const result = await handler({ query: { apiKey: "key-only", connectionMode: "public" } });
  assert.equal(result.errorKind, "auth");
  assert.match(result.error, /folder URL or ID/i);
});

test("handler returns auth error when API key missing for public mode", async () => {
  const result = await handler({
    query: { folderUrl: "https://drive.google.com/drive/folders/abc", connectionMode: "public" },
  });
  assert.equal(result.errorKind, "auth");
  assert.match(result.error, /API key/i);
});

test("handler returns auth error when service account key missing", async () => {
  const result = await handler({
    query: { connectionMode: "serviceAccount", folderId: "abc123" },
  });
  assert.equal(result.errorKind, "auth");
  assert.match(result.error, /JSON key/i);
});

test("handler returns auth error when private folder not chosen", async () => {
  const result = await handler({
    query: {
      connectionMode: "serviceAccount",
      serviceAccountKey: '{"client_email":"a@b.iam.gserviceaccount.com","private_key":"x"}',
    },
  });
  assert.equal(result.errorKind, "auth");
  assert.match(result.error, /folder/i);
});

test("handler returns empty errorKind when folder has no images", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 200,
    json: async () => ({ files: [] }),
  }));

  const result = await handler({
    query: {
      connectionMode: "public",
      folderUrl: "https://drive.google.com/drive/folders/abc123XYZ",
      apiKey: "test-key",
    },
  });

  assert.equal(result.errorKind, "empty");
  assert.match(result.error, /empty/i);
});

test("handler returns unsupported when folder has only non-images", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    const href = String(url);
    if (href.includes("/files/abc123XYZ?")) {
      return { ok: true, status: 200, json: async () => ({ resourceKey: "" }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        files: [{ id: "doc1", name: "notes.txt", mimeType: "text/plain" }],
      }),
    };
  });

  const result = await handler({
    query: {
      connectionMode: "public",
      folderUrl: "https://drive.google.com/drive/folders/abc123XYZ",
      apiKey: "test-key",
    },
  });

  assert.equal(result.errorKind, "unsupported");
  assert.match(result.error, /supported images/i);
});

test("driveErrorKind maps HTTP status", () => {
  assert.equal(driveErrorKind(401), "auth");
  assert.equal(driveErrorKind(403), "auth");
  assert.equal(driveErrorKind(404), "auth");
  assert.equal(driveErrorKind(500), "transient");
  assert.equal(driveErrorKind(429), "transient");
});

test("readGoogleError parses API message", async () => {
  const response = {
    text: async () => JSON.stringify({ error: { message: "Quota exceeded" } }),
  };
  assert.equal(await readGoogleError(response, "fallback"), "Quota exceeded");
});

test("readGoogleError uses fallback for empty body", async () => {
  const response = { text: async () => "" };
  assert.equal(await readGoogleError(response, "fallback"), "fallback");
});

test("folders handler requires service account key", async () => {
  const result = await foldersHandler({ query: {} });
  assert.equal(result.errorKind, "auth");
  assert.match(result.error, /JSON key/i);
});

test("folders handler returns sorted folders", async (t) => {
  t.mock.method(crypto, "createSign", () => ({
    update() {
      return this;
    },
    sign() {
      return Buffer.from("fakesignature");
    },
  }));

  t.mock.method(globalThis, "fetch", async (url) => {
    const href = String(url);
    if (href.includes("oauth2.googleapis.com/token")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: "tok" }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        files: [
          { id: "b-id", name: "Beta", mimeType: "application/vnd.google-apps.folder" },
          { id: "a-id", name: "Alpha", mimeType: "application/vnd.google-apps.folder" },
        ],
      }),
    };
  });

  const saKey = JSON.stringify({
    client_email: "robot@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  });

  const result = await foldersHandler({ query: { serviceAccountKey: saKey } });
  assert.ok(Array.isArray(result.folders));
  assert.equal(result.folders.length, 2);
  assert.deepEqual(result.folders.map((f) => f.name), ["Alpha", "Beta"]);
});

test("parseServiceAccountKey accepts parsed service account objects", () => {
  const parsed = parseServiceAccountKey({
    client_email: "robot@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  });
  assert.equal(parsed.clientEmail, "robot@example.iam.gserviceaccount.com");
});

test("normalizeServiceAccountKeyInput stringifies object credentials", () => {
  const object = {
    client_email: "robot@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  };
  assert.equal(
    normalizeServiceAccountKeyInput(object),
    JSON.stringify(object),
  );
});

test("parseServiceAccountKey accepts JSON with non-breaking space indentation", () => {
  const nbsp = "\u00a0";
  const json = `{\n${nbsp}${nbsp}"client_email": "robot@example.iam.gserviceaccount.com",\n${nbsp}${nbsp}"private_key": "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"\n}`;
  const parsed = parseServiceAccountKey(json);
  assert.equal(parsed.clientEmail, "robot@example.iam.gserviceaccount.com");
});

test("sanitizeServiceAccountKeyText normalizes nbsp and strips format chars", () => {
  assert.equal(sanitizeServiceAccountKeyText("a\u00a0b"), "a b");
  assert.equal(sanitizeServiceAccountKeyText("ok\u200bhere"), "okhere");
});

test("parseServiceAccountKey accepts double-encoded JSON strings", () => {
  const object = {
    client_email: "robot@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  };
  const parsed = parseServiceAccountKey(JSON.stringify(JSON.stringify(object)));
  assert.equal(parsed.clientEmail, "robot@example.iam.gserviceaccount.com");
});

test("parseServiceAccountKey rejects corrupted object string", () => {
  assert.throws(() => parseServiceAccountKey("[object Object]"), /corrupted/i);
});

test("parseServiceAccountKey rejects invalid JSON", () => {
  assert.throws(() => parseServiceAccountKey("not-json"), DriveSlideshowError);
});

test("parseServiceAccountKey requires client_email and private_key", () => {
  assert.throws(() => parseServiceAccountKey("{}"), /client_email/);
});

test("parseServiceAccountKey accepts client_email and private_key", () => {
  const parsed = parseServiceAccountKey(
    JSON.stringify({
      client_email: "robot@example.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    }),
  );
  assert.equal(parsed.clientEmail, "robot@example.iam.gserviceaccount.com");
  assert.ok(parsed.privateKey.includes("BEGIN PRIVATE KEY"));
});

test("normalizeBrightnessBoost parses enum labels and clamps", () => {
  assert.equal(normalizeBrightnessBoost("0 - Off"), 0);
  assert.equal(normalizeBrightnessBoost(""), 0);
  assert.equal(normalizeBrightnessBoost("bogus"), 0);
  assert.equal(normalizeBrightnessBoost("1"), 1);
  assert.equal(normalizeBrightnessBoost("3 - Max"), 3);
  assert.equal(normalizeBrightnessBoost(2), 2);
  assert.equal(normalizeBrightnessBoost(99), 3);
  assert.equal(normalizeBrightnessBoost(-2), 0);
});

test("brightnessBoostEpdMeta is natural at level 0 and exposure increases", () => {
  assert.deepEqual(defaultEpdOptimizeMeta(), { intent: "natural" });
  assert.equal(brightnessBoostEpdMeta(0), null);

  const exposures = [1, 2, 3].map(
    (level) =>
      brightnessBoostEpdMeta(level).imageAdjustmentOptions.toneMapping.exposure,
  );
  assert.ok(exposures[0] < exposures[1]);
  assert.ok(exposures[1] < exposures[2]);
});

const configPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../applications/google-drive-slideshow/config.json",
);

const NATIVE_SETTINGS_KEYS = [
  "connectionMode",
  "folderUrl",
  "folderResourceKey",
  "apiKey",
  "serviceAccountKey",
  "serviceAccountEmail",
  "folderId",
  "folderName",
  "folderResourceKeyPrivate",
  "order",
  "fit",
  "slotMinutes",
  "showFilename",
  "brightnessBoost",
];

test("manifest uses custom settings page without native formSchema fields", async () => {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  assert.equal(config.settingsPage, "./settings.html");
  assert.equal(config.settingsPageOnly, true);
  assert.deepEqual(config.formSchema?.properties, {});
  for (const key of NATIVE_SETTINGS_KEYS) {
    assert.ok(key in config.nativeSettings, `missing nativeSettings.${key}`);
  }
});

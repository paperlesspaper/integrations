const validFeedTypes = new Set(["home", "hashtag", "profile"]);
const profileCache = new Map();

function asString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }

  return fallback;
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function normalizeInstanceUrl(value) {
  const raw = asString(value, "https://mastodon.social").replace(/\/+$/, "");
  const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Instance URL must use http or https.");
  }

  return url.origin;
}

function normalizeHashtag(value) {
  return asString(value, "opensource")
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeAcct(value) {
  return asString(value)
    .replace(/^@/, "")
    .replace(/@/, "@")
    .toLowerCase();
}

function normalizeSettings(query) {
  const feedType = validFeedTypes.has(asString(query.feedType))
    ? asString(query.feedType)
    : "hashtag";
  const settings = {
    instanceUrl: normalizeInstanceUrl(query.instanceUrl),
    accessToken: asString(query.accessToken),
    feedType,
    hashtag: normalizeHashtag(query.hashtag),
    profileAcct: normalizeAcct(query.profileAcct),
    limit: clampNumber(query.limit, 5, 1, 12),
    postIndex: clampNumber(query.postIndex, 0, 0, 99),
    hideReplies: asBoolean(query.hideReplies, true),
    showQrCode: asBoolean(query.showQrCode, true),
    qrCodeSize: clampNumber(query.qrCodeSize, 112, 64, 256),
  };

  if (settings.feedType === "home" && !settings.accessToken) {
    throw new Error("Home timelines require a Mastodon access token.");
  }

  if (settings.feedType === "hashtag" && !settings.hashtag) {
    throw new Error("Hashtag feeds require a hashtag.");
  }

  if (settings.feedType === "profile" && !settings.profileAcct) {
    throw new Error("Profile feeds require a profile account.");
  }

  return settings;
}

function buildHeaders(accessToken) {
  const headers = {
    Accept: "application/json",
    "User-Agent": "paperlesspaper-openintegrations/0.1.0",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function fetchJson(url, accessToken) {
  const response = await fetch(url, {
    headers: buildHeaders(accessToken),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized: check the access token and scopes.");
  }

  if (response.status === 404) {
    throw new Error("Mastodon resource was not found.");
  }

  if (response.status === 429) {
    throw new Error("Mastodon rate limit reached. Try a lower refresh rate.");
  }

  if (!response.ok) {
    throw new Error(`Mastodon API failed with ${response.status}.`);
  }

  return await response.json();
}

async function lookupAccount(settings) {
  const cacheKey = `${settings.instanceUrl}:${settings.profileAcct}`;
  if (profileCache.has(cacheKey)) {
    return profileCache.get(cacheKey);
  }

  const url = new URL("/api/v1/accounts/lookup", settings.instanceUrl);
  url.searchParams.set("acct", settings.profileAcct);

  const data = await fetchJson(url, settings.accessToken);
  if (!data?.id) {
    throw new Error("Profile lookup returned no account id.");
  }

  profileCache.set(cacheKey, data.id);
  return data.id;
}

async function feedPath(settings) {
  if (settings.feedType === "home") {
    return "/api/v1/timelines/home";
  }

  if (settings.feedType === "hashtag") {
    return `/api/v1/timelines/tag/${encodeURIComponent(settings.hashtag)}`;
  }

  const accountId = await lookupAccount(settings);
  return `/api/v1/accounts/${accountId}/statuses`;
}

function qrCodeUrl(url, size) {
  if (!url) {
    return "";
  }

  const qr = new URL("https://api.qrserver.com/v1/create-qr-code/");
  qr.searchParams.set("size", `${size}x${size}`);
  qr.searchParams.set("margin", "1");
  qr.searchParams.set("data", url);
  return qr.toString();
}

function textFromHtml(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeStatus(status, settings) {
  const base = status.reblog || status;
  const booster = status.reblog ? status.account : null;
  const media = Array.isArray(base.media_attachments)
    ? base.media_attachments
        .filter((attachment) => attachment.type === "image" || attachment.preview_url)
        .map((attachment) => ({
          id: attachment.id,
          type: attachment.type,
          url: attachment.url || attachment.preview_url,
          previewUrl: attachment.preview_url || attachment.url,
          description: attachment.description || "",
        }))
    : [];

  return {
    id: base.id,
    createdAt: base.created_at,
    contentHtml: base.content || "",
    contentText: textFromHtml(base.content),
    url: base.url || base.uri || "",
    account: {
      id: base.account?.id || "",
      username: base.account?.username || "",
      displayName: base.account?.display_name || base.account?.username || "",
      acct: base.account?.acct || base.account?.username || "",
      avatar: base.account?.avatar_static || base.account?.avatar || "",
    },
    boostedBy: booster
      ? {
          id: booster.id,
          username: booster.username,
          displayName: booster.display_name || booster.username,
          acct: booster.acct || booster.username,
        }
      : null,
    media,
    qrCodeUrl: settings.showQrCode ? qrCodeUrl(base.url || base.uri, settings.qrCodeSize) : "",
  };
}

async function fetchFeed(settings) {
  const path = await feedPath(settings);
  const requestedLimit = settings.limit;
  const fetchLimit = settings.hideReplies
    ? Math.min(40, requestedLimit * 3)
    : requestedLimit;
  const url = new URL(path, settings.instanceUrl);

  url.searchParams.set("limit", String(fetchLimit));
  if (settings.feedType !== "profile") {
    url.searchParams.set("exclude_reblogs", "false");
  }

  const data = await fetchJson(url, settings.accessToken);
  if (!Array.isArray(data)) {
    throw new Error("Mastodon returned an unexpected response shape.");
  }

  const filtered = settings.hideReplies
    ? data.filter((status) => {
        const base = status.reblog || status;
        return base.in_reply_to_id === null && base.in_reply_to_account_id === null;
      })
    : data;

  return filtered.slice(0, requestedLimit).map((status) => normalizeStatus(status, settings));
}

export default async function handler({ query }) {
  const settings = normalizeSettings(query);
  const items = await fetchFeed(settings);

  return {
    feedType: settings.feedType,
    instanceUrl: settings.instanceUrl,
    hashtag: settings.hashtag,
    profileAcct: settings.profileAcct,
    postIndex: settings.postIndex,
    items,
    updatedAt: new Date().toISOString(),
  };
}

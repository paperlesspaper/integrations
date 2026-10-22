import crypto from "node:crypto";
import {
  normalizeServiceAccountKeyInput,
  sanitizeServiceAccountKeyText,
} from "../assets/drive-connection.js";

const userAgent = "paperlesspaper-openintegrations/0.2.1";
const driveReadonlyScope = "https://www.googleapis.com/auth/drive.readonly";
const tokenAudience = "https://oauth2.googleapis.com/token";
const tokenUrl = "https://oauth2.googleapis.com/token";

export class DriveSlideshowError extends Error {
  constructor(message, errorKind = "transient") {
    super(message);
    this.name = "DriveSlideshowError";
    this.errorKind = errorKind;
  }
}

function stringValue(value) {
  return String(value ?? "").trim();
}

export { normalizeServiceAccountKeyInput, sanitizeServiceAccountKeyText };

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseServiceAccountJsonDocument(trimmed) {
  let value = sanitizeServiceAccountKeyText(trimmed).trim();
  let parsed;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new DriveSlideshowError("Service account JSON key is not valid JSON.", "auth");
    }
    if (typeof parsed !== "string") {
      return parsed;
    }
    value = sanitizeServiceAccountKeyText(parsed).trim();
    if (!value) {
      break;
    }
  }
  if (typeof parsed === "string") {
    throw new DriveSlideshowError("Service account JSON key is not valid JSON.", "auth");
  }
  return parsed;
}

export function parseServiceAccountKey(input) {
  const raw = normalizeServiceAccountKeyInput(input);
  const trimmed = stringValue(raw);
  if (!trimmed) {
    throw new DriveSlideshowError("Service account JSON key is required.", "auth");
  }
  if (trimmed === "[object Object]") {
    throw new DriveSlideshowError(
      "Service account key was corrupted. Open settings, paste the JSON key again, and save.",
      "auth",
    );
  }

  const parsed = parseServiceAccountJsonDocument(trimmed);

  const clientEmail = stringValue(parsed.client_email);
  const privateKey = stringValue(parsed.private_key);
  if (!clientEmail || !privateKey) {
    throw new DriveSlideshowError(
      "Service account JSON must include client_email and private_key.",
      "auth",
    );
  }
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new DriveSlideshowError("Service account private_key is missing or invalid.", "auth");
  }

  return {
    clientEmail,
    privateKey,
    rawJson: trimmed,
  };
}

export function signJwtForServiceAccount(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: credentials.clientEmail,
    scope: driveReadonlyScope,
    aud: tokenAudience,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(claim)}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.privateKey, "base64url");
  return `${unsigned}.${signature}`;
}

export async function mintAccessToken(credentials) {
  const assertion = signJwtForServiceAccount(credentials);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent,
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = stringValue(payload?.error_description || payload?.error);
    throw new DriveSlideshowError(
      message || `Google sign-in for the service account failed (${response.status}).`,
      "auth",
    );
  }

  const accessToken = stringValue(payload.access_token);
  if (!accessToken) {
    throw new DriveSlideshowError("Google returned no access token for the service account.", "auth");
  }

  return accessToken;
}

export async function credentialsFromKeyInput(input) {
  const parsed = parseServiceAccountKey(input);
  return parsed;
}

export async function accessTokenFromKeyInput(input) {
  const credentials = await credentialsFromKeyInput(input);
  const accessToken = await mintAccessToken(credentials);
  return { credentials, accessToken };
}

export function driveErrorKind(status) {
  if (status === 401 || status === 403) {
    return "auth";
  }
  if (status >= 500) {
    return "transient";
  }
  if (status === 404) {
    return "auth";
  }
  return "transient";
}

export async function readGoogleError(response, fallback) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text);
    const message = parsed?.error?.message || parsed?.error_description;
    if (message) {
      return String(message);
    }
  } catch {
    // plain text
  }
  return fallback;
}

export { userAgent };

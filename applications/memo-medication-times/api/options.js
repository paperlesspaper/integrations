const userAgent = "paperlesspaper-openintegrations/0.1.0 memo-medication-times-settings";

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringValue(value) {
  return String(firstQueryValue(value) || "").trim();
}

function settingOrEnv(value, envName) {
  return stringValue(value) || stringValue(process.env[envName]);
}

function memoApiKey(value) {
  return (
    stringValue(value) ||
    stringValue(process.env.MEMO_API_API_KEY) ||
    stringValue(process.env.MEMO_API_KEY) ||
    stringValue(process.env.PAPERLESSPAPER_API_KEY)
  );
}

function normalizeMemoBaseUrl(input) {
  const raw = stringValue(input);
  if (!raw) {
    throw new Error("Memo API base URL is required. Set apiBaseUrl or MEMO_API_BASE_URL.");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Memo API base URL must be a valid http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Memo API base URL must use http or https.");
  }

  url.hash = "";
  url.search = "";
  const cleanPath = url.pathname.replace(/\/+$/, "");
  url.pathname = cleanPath.endsWith("/v1") ? cleanPath : `${cleanPath || ""}/v1`;

  return url.toString().replace(/\/+$/, "");
}

function endpointUrl(baseUrl, path, params = {}) {
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(params)) {
    const text = stringValue(value);
    if (text) {
      url.searchParams.set(key, text);
    }
  }
  return url;
}

function timeoutSignal(ms) {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(ms)
    : undefined;
}

async function readError(response) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return `Memo API request failed with ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.error || text.slice(0, 240);
  } catch {
    return text.slice(0, 240);
  }
}

async function fetchMemoJson(baseUrl, path, apiKey, params = {}) {
  const key = stringValue(apiKey);
  if (!key) {
    throw new Error("Memo API key is required. Set apiKey, MEMO_API_API_KEY, MEMO_API_KEY, or PAPERLESSPAPER_API_KEY.");
  }

  const response = await fetch(endpointUrl(baseUrl, path, params), {
    method: "GET",
    cache: "no-store",
    signal: timeoutSignal(20_000),
    headers: {
      accept: "application/json",
      "user-agent": userAgent,
      "x-api-key": key,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

function unwrapResults(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  return [];
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function optionLabel(...parts) {
  return parts.map((part) => stringValue(part)).filter(Boolean).join(" - ");
}

function personNameFromParts(firstName, lastName) {
  return [firstName, lastName].map((part) => stringValue(part)).filter(Boolean).join(" ");
}

function shapeOrganization(organization) {
  return {
    id: stringValue(organization.id || organization._id),
    label:
      optionLabel(organization.name, organization.kind) ||
      stringValue(organization.id || organization._id) ||
      "Organization",
    name: stringValue(organization.name),
    kind: stringValue(organization.kind),
  };
}

function patientRank(user) {
  const apps = record(user.apps);
  const memo = record(apps.memo);
  const values = [user.role, user.category, memo.category].map((value) => stringValue(value).toLowerCase());
  return values.includes("patient") ? 0 : 1;
}

function patientName(user) {
  const meta = record(user.meta);
  const apps = record(user.apps);
  const memo = record(apps.memo);
  const auth0User = record(user.auth0User);
  const auth0Meta = record(auth0User.user_metadata);
  const auth0AppMeta = record(auth0User.app_metadata);

  return (
    stringValue(user.name) ||
    stringValue(meta.displayName || meta.fullName || meta.name) ||
    personNameFromParts(meta.firstName || meta.givenName || meta.firstname, meta.lastName || meta.familyName || meta.lastname) ||
    stringValue(memo.displayName || memo.fullName || memo.name) ||
    personNameFromParts(memo.firstName || memo.givenName || memo.firstname, memo.lastName || memo.familyName || memo.lastname) ||
    stringValue(auth0User.name) ||
    personNameFromParts(auth0User.given_name, auth0User.family_name) ||
    stringValue(auth0Meta.displayName || auth0Meta.fullName || auth0Meta.name) ||
    personNameFromParts(auth0Meta.firstName || auth0Meta.given_name, auth0Meta.lastName || auth0Meta.family_name) ||
    stringValue(auth0AppMeta.displayName || auth0AppMeta.fullName || auth0AppMeta.name) ||
    personNameFromParts(auth0AppMeta.firstName || auth0AppMeta.given_name, auth0AppMeta.lastName || auth0AppMeta.family_name)
  );
}

function shapePatient(user) {
  const meta = record(user.meta);
  const apps = record(user.apps);
  const memo = record(apps.memo);
  const category = stringValue(user.category || memo.category || user.role);
  const name = patientName(user);
  const email = stringValue(user.email || record(user.auth0User).email);
  return {
    id: stringValue(user.id || user._id),
    label:
      optionLabel(name, category === "patient" ? "" : category, name ? "" : email) ||
      email ||
      stringValue(user.id || user._id) ||
      "Patient",
    name,
    email,
    role: stringValue(user.role),
    category,
    timezone: stringValue(user.timezone || meta.timezone),
  };
}

async function readOrganizations(baseUrl, apiKey) {
  const payload = await fetchMemoJson(baseUrl, "/organizations", apiKey);
  return unwrapResults(payload).map(shapeOrganization).filter((item) => item.id);
}

async function readPatients(baseUrl, apiKey, organizationId) {
  if (!organizationId) {
    return [];
  }

  const payload = await fetchMemoJson(baseUrl, "/users", apiKey, {
    organization: organizationId,
    limit: 10000,
    sortBy: "name:asc",
  });
  const users = unwrapResults(payload).map(shapePatient).filter((item) => item.id);
  const patientUsers = users.filter((user) => patientRank(user) === 0);
  return (patientUsers.length ? patientUsers : users).sort((a, b) => {
    const rank = patientRank(a) - patientRank(b);
    if (rank !== 0) {
      return rank;
    }
    return a.label.localeCompare(b.label);
  });
}

export default async function handler({ query }) {
  const apiBaseUrl = settingOrEnv(query.apiBaseUrl, "MEMO_API_BASE_URL");
  const apiKey = memoApiKey(query.apiKey);
  const organizationId = stringValue(query.organizationId);
  const baseUrl = normalizeMemoBaseUrl(apiBaseUrl);
  const organizations = await readOrganizations(baseUrl, apiKey);
  const selectedOrganizationId =
    organizationId ||
    (organizations.length === 1 ? organizations[0].id : "");
  const patients = selectedOrganizationId
    ? await readPatients(baseUrl, apiKey, selectedOrganizationId)
    : [];

  return {
    organizations,
    patients,
    selectedOrganizationId,
    updatedAt: new Date().toISOString(),
  };
}

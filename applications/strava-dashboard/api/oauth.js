const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

function text(value) {
  return String(value ?? "").trim();
}

async function errorMessage(response) {
  const payload = await response.json().catch(() => ({}));
  return text(payload?.message || payload?.error || payload?.errors?.[0]?.message) || `Strava OAuth failed with ${response.status}.`;
}

export default async function stravaOAuth({ query = {} } = {}) {
  const clientId = text(query.clientId);
  const clientSecret = text(query.clientSecret);
  const code = text(query.code);

  if (!clientId || !clientSecret || !code) {
    throw new Error("Client ID, client secret, and authorization code are required.");
  }
  if (!/^\d+$/.test(clientId)) {
    throw new Error("Strava client ID must be a number.");
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "paperlesspaper-strava-dashboard/0.2.0",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  const token = await response.json();
  if (!token?.access_token || !token?.refresh_token || !token?.athlete?.id) {
    throw new Error("Strava returned an incomplete OAuth response.");
  }

  const athleteName = [token.athlete.firstname, token.athlete.lastname]
    .map((value) => text(value))
    .filter(Boolean)
    .join(" ");

  return {
    accessToken: text(token.access_token),
    refreshToken: text(token.refresh_token),
    expiresAt: Number(token.expires_at) || 0,
    athleteId: String(token.athlete.id),
    athleteName,
    scope: text(token.scope),
  };
}

function stringValue(value) {
  return String(value ?? "").trim();
}

/**
 * Keep only characters valid in JSON text: drop controls/format chars, map
 * non-standard separators to regular space (JSON whitespace is SP, TAB, LF, CR).
 */
export function sanitizeServiceAccountKeyText(text) {
  return String(text ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, (char) =>
      char === "\t" || char === "\n" || char === "\r" ? char : "",
    )
    .replace(/\p{Zs}/gu, (char) =>
      char === " " || char === "\t" || char === "\n" || char === "\r" ? char : " ",
    );
}

export function normalizeServiceAccountKeyInput(input) {
  if (input == null || input === "") {
    return "";
  }
  if (typeof input === "string") {
    return sanitizeServiceAccountKeyText(input);
  }
  if (typeof input === "object") {
    return sanitizeServiceAccountKeyText(JSON.stringify(input));
  }
  return sanitizeServiceAccountKeyText(String(input));
}

function normalizeConnectionMode(value) {
  const mode = stringValue(value).toLowerCase();
  if (mode === "serviceaccount" || mode === "service_account") {
    return "serviceAccount";
  }
  if (mode === "public") {
    return "public";
  }
  return "public";
}

export function inferConnectionMode(query) {
  const explicitRaw = stringValue(query?.connectionMode);
  if (explicitRaw) {
    const explicit = normalizeConnectionMode(explicitRaw);
    if (explicit === "serviceAccount") {
      return "serviceAccount";
    }
    if (explicit === "public") {
      return "public";
    }
  }
  const keyMaterial = stringValue(normalizeServiceAccountKeyInput(query?.serviceAccountKey));
  const folderId = stringValue(query?.folderId);
  if (keyMaterial && folderId) {
    return "serviceAccount";
  }
  return "public";
}

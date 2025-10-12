import { API_URL } from "@/lib/api";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const normalizeSlashes = (value: string) =>
  value.replace(/([^:]\/)\/+/g, (_match, group) => `${group}`);

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const sanitizeFilename = (value: string): string => {
  const decoded = safeDecode(value);
  return decoded
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const resolveImageUrl = (source?: string | null): string | null => {
  if (!source) {
    return null;
  }
  const trimmed = source.trim();
  if (!trimmed) {
    return null;
  }

  if (ABSOLUTE_URL_REGEX.test(trimmed)) {
    return normalizeSlashes(trimmed);
  }

  const relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalizeSlashes(`${API_URL}${relative}`);
};

export const buildImageUrlCandidates = (source?: string | null): string[] => {
  const absolute = resolveImageUrl(source);
  if (!absolute) {
    return [];
  }

  const candidates: string[] = [];
  const addCandidate = (value?: string | null) => {
    if (!value) return;
    const normalized = normalizeSlashes(value);
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  addCandidate(absolute);

  try {
    const url = new URL(absolute);
    const parts = url.pathname.split("/").filter(Boolean);
    if (!parts.length) {
      return candidates;
    }

    const filename = parts.pop() ?? "";
    if (!filename) {
      return candidates;
    }

    const basePath = parts.length ? `${url.origin}/${parts.join("/")}` : url.origin;
    const decoded = safeDecode(filename);
    const sanitized = sanitizeFilename(decoded);
    const encoded = encodeURIComponent(decoded);

    [filename, decoded, sanitized, encoded]
      .filter(Boolean)
      .forEach((name) => addCandidate(`${basePath}/${name}${url.search}`));

    const fallbackParams = new URLSearchParams(url.search);
    fallbackParams.set("fallback", "1");
    const fallbackQuery = fallbackParams.toString();

    if (sanitized) {
      addCandidate(`${basePath}/${sanitized}${fallbackQuery ? `?${fallbackQuery}` : ""}`);
    }
  } catch {
    // Ignore malformed URLs, we already have the original candidate
  }

  return candidates;
};

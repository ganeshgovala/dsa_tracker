import { DIFFICULTIES, type RoadmapDifficulty } from "./types";

/** 400 — body/query failed validation. */
export class ValidationError extends Error {}
/** 404 — referenced document does not exist. */
export class NotFoundError extends Error {}
/** 409 — duplicate phase number / topic / problem name. */
export class ConflictError extends Error {}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function requireString(
  value: unknown,
  field: string,
  maxLength = 500,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`"${field}" is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`"${field}" must be at most ${maxLength} chars`);
  }
  return trimmed;
}

export function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError(`"${field}" must be a string`);
  }
  return value.trim() || null;
}

export function optionalUrl(value: unknown, field: string): string | null {
  const url = optionalString(value, field);
  if (url === null) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
  } catch {
    throw new ValidationError(`"${field}" must be a valid http(s) URL`);
  }
  return url;
}

/**
 * Difficulty is validated against the fixed enum. Input is case-insensitive
 * ("easy" → "EASY") so the JSON import can be lenient.
 */
export function normalizeDifficulty(value: unknown): RoadmapDifficulty {
  if (typeof value !== "string") {
    throw new ValidationError(
      `"difficulty" is required and must be one of ${DIFFICULTIES.join(", ")}`,
    );
  }
  const upper = value.trim().toUpperCase();
  if (!(DIFFICULTIES as readonly string[]).includes(upper)) {
    throw new ValidationError(
      `"difficulty" must be one of ${DIFFICULTIES.join(", ")}`,
    );
  }
  return upper as RoadmapDifficulty;
}

export function requireInt(value: unknown, field: string): number {
  const num = typeof value === "string" ? Number(value) : value;
  if (
    typeof num !== "number" ||
    !Number.isInteger(num) ||
    num < 0 ||
    num > 1_000_000
  ) {
    throw new ValidationError(`"${field}" must be a non-negative integer`);
  }
  return num;
}

export function optionalBoolean(
  value: unknown,
  field: string,
  fallback: boolean,
): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") {
    throw new ValidationError(`"${field}" must be a boolean`);
  }
  return value;
}

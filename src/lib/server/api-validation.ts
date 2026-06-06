/**
 * Input validation helpers for the API routes.
 *
 * Every field that gets interpolated into a Claude prompt MUST be bounded —
 * without caps, a scripted client can make each request maximally expensive
 * (token-cost amplification) on endpoints that spend real money.
 */

/** Non-empty trimmed string no longer than maxLen, else null. */
export function boundedString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

/** Finite number within [min, max], else null. */
export function boundedNumber(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

/** Array with at most maxItems entries, else null. */
export function boundedArray<T>(value: unknown, maxItems: number): T[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > maxItems) return null;
  return value as T[];
}

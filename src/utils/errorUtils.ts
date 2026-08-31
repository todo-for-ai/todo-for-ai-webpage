/**
 * Extract a human-readable error message from any thrown value.
 *
 * The API client (ApiHttpError) already sets error.message to the
 * backend's `message` field, so this reliably surfaces the specific
 * reason (e.g. "Token name already exists") rather than a generic
 * "Operation failed".
 *
 * Priority:
 * 1. Error instances (incl. ApiHttpError) → error.message
 * 2. String values → the string itself
 * 3. Fallback → caller-provided i18n fallback
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback
  }
  if (typeof error === 'string' && error) {
    return error
  }
  return fallback
}

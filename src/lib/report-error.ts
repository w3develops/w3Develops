// Sends errors members hit in the browser to the server's logs, so they can
// be found and fixed (see src/app/api/client-errors/route.ts). Only the error,
// the page and the browser are sent: never form contents or account details.

const MAX_REPORTS_PER_PAGE_LOAD = 10;
const sent = new Set<string>();

export type ErrorKind = 'uncaught' | 'unhandled-rejection' | 'render' | 'permission-denied';

export function reportError(kind: ErrorKind, error: unknown, details?: Record<string, string>): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const key = `${kind}|${message}`;
  // Each error once per page load, and only a few in all, so a loop can't flood the logs
  if (sent.has(key) || sent.size >= MAX_REPORTS_PER_PAGE_LOAD) return;
  sent.add(key);
  try {
    fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        message: message.slice(0, 1000),
        stack: error instanceof Error ? error.stack?.slice(0, 4000) : undefined,
        page: window.location.pathname,
        details,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting must never cause an error of its own
  }
}

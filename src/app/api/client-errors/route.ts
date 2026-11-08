import { NextResponse } from 'next/server';

// Errors from members' browsers (see src/lib/report-error.ts), written to the
// server log as structured entries. To read them, open Logs Explorer in the
// Google Cloud console for this project and search for
//   jsonPayload.source="browser"

export const dynamic = 'force-dynamic';

const KINDS = new Set(['uncaught', 'unhandled-rejection', 'render', 'permission-denied']);
// Per server instance, so a broken page or a bad actor can't run up the log bill
const MAX_PER_MINUTE = 120;
let windowStart = 0;
let countInWindow = 0;

const text = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : undefined;

export async function POST(request: Request) {
  const now = Date.now();
  if (now - windowStart > 60_000) { windowStart = now; countInWindow = 0; }
  if (++countInWindow > MAX_PER_MINUTE) return new NextResponse(null, { status: 429 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind = text(body?.kind, 40);
  const message = text(body?.message, 1000);
  if (!kind || !KINDS.has(kind) || !message) return new NextResponse(null, { status: 400 });

  const details: Record<string, string> = {};
  if (body?.details && typeof body.details === 'object') {
    for (const [key, value] of Object.entries(body.details).slice(0, 10)) {
      const v = text(value, 300);
      if (v) details[key.slice(0, 40)] = v;
    }
  }

  // One JSON line per error; Cloud Logging reads "severity" and "message"
  console.error(JSON.stringify({
    severity: 'ERROR',
    source: 'browser',
    message: `[${kind}] ${message}`,
    kind,
    page: text(body?.page, 300),
    stack: text(body?.stack, 4000),
    details,
    browser: request.headers.get('user-agent')?.slice(0, 300),
  }));
  return new NextResponse(null, { status: 204 });
}

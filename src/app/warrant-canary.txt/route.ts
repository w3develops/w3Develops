import { readCanary } from '@/lib/warrant-canary';

export const dynamic = 'force-static';

export function GET() {
  return new Response(readCanary().signed, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

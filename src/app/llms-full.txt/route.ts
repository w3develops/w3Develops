import { buildLlmsFullTxt } from '@/lib/llms';

// A Markdown guide to the site for AI tools and agents (see src/lib/llms.ts).
// Built once at deploy time.
export const dynamic = 'force-static';

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

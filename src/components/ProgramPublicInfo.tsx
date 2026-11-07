import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Parts of the mentorship, tutoring and pair programming pages that don't
// depend on who is signed in. They are in the page's HTML from the start, so
// visitors, search engines and AI crawlers can see what each program is.

export interface ProgramStep {
  title: string;
  text: string;
}

export function HowItWorks({ steps }: { steps: ProgramStep[] }) {
  return (
    <section className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-headline text-center mb-6">How it works</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card className="h-full">
              <CardContent className="p-6 space-y-2">
                <p className="text-sm font-semibold text-primary">Step {index + 1}</p>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Shown in place of the member tools to visitors who aren't signed in */
export function SignInToJoin({ action, returnTo }: { action: string; returnTo: string }) {
  return (
    <Card className="max-w-xl mx-auto text-center">
      <CardContent className="p-8 space-y-4">
        <p className="text-lg font-semibold">Sign in to {action}</p>
        <p className="text-sm text-muted-foreground">It's free, and takes a minute to set up.</p>
        <div className="flex justify-center gap-3">
          <Button asChild><Link href="/signup">Join for free</Link></Button>
          <Button asChild variant="outline"><Link href={`/login?redirect=${returnTo}`}>Log in</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

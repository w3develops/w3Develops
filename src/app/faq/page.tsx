import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactNode } from 'react';
import { FAQ_SECTIONS, type FaqSection } from '@/lib/faq';
import { HelpCircle, Sparkles, Users, Code, ShieldCheck, Globe } from "lucide-react";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/faq');

const ICONS: Record<FaqSection['icon'], ReactNode> = {
  help: <HelpCircle className="h-5 w-5 text-primary" />,
  sparkles: <Sparkles className="h-5 w-5 text-primary" />,
  users: <Users className="h-5 w-5 text-primary" />,
  code: <Code className="h-5 w-5 text-primary" />,
  globe: <Globe className="h-5 w-5 text-primary" />,
};

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to know about learning, building, and growing with the w3Develops community.
        </p>
      </div>

      <div className="grid gap-8">
        {FAQ_SECTIONS.map((section) => (
          <Card key={section.title} className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
              <div className="flex items-center gap-2 border-b-2 border-primary pb-2 w-fit">
                {ICONS[section.icon]}
                <CardTitle className="text-xl font-headline uppercase tracking-wide">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-4">
              <Accordion type="single" collapsible className="w-full">
                {section.items.map((item, i) => (
                  <AccordionItem value={`${section.title}-${i}`} key={i} className="border-b border-muted">
                    <AccordionTrigger className="text-lg text-left hover:text-primary transition-colors">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent forceMount className="text-base text-muted-foreground leading-relaxed">
                      <p dangerouslySetInnerHTML={{ __html: item.answer }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-2 border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold font-headline">Still have questions?</h3>
          <p className="text-muted-foreground">
            Our community is always active and ready to help. Join our Discord to chat with other learners and the core team.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button asChild size="lg">
              <Link href="/chat">Join the Discord</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

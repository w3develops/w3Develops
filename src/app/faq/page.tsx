'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { HelpCircle, Sparkles, Users, Code, ShieldCheck, Globe } from "lucide-react";

const faqSections = [
  {
    title: "General & Mission",
    icon: <HelpCircle className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "What exactly is w3Develops?",
        answer: "w3Develops is a global community of developers who learn, build, and team up on projects together. We offer resources like remote study groups, collaborative build cohorts, and a platform to connect with other developers—all focused on bridging the gap between learning and employment."
      },
      {
        question: "Is w3Develops really free? What's the catch?",
        answer: "Yes, it is 100% free. There is no catch. Our mission is to make tech education accessible to everyone. We are supported by donations and the work of our volunteers. We don't sell your data, and we don't serve ads."
      }
    ]
  },
  {
    title: "AI & Community News",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "What is the AI News Summary at the top of the news page?",
        answer: "Every day, our system uses Gemini AI to analyze the top headlines from dozens of tech RSS feeds and w3Develops' own activities. It generates a concise 'State of the Community' summary to help you stay informed without having to read every single article."
      },
      {
        question: "How do 'Hearts' and 'Shares' work on news articles?",
        answer: "If you're logged in, you can heart articles to show support. This data helps the community see what topics are most relevant. You can also use the share button to instantly post articles to X (Twitter), WhatsApp, or Facebook."
      }
    ]
  },
  {
    title: "Collaboration Hubs",
    icon: <Users className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "What's the difference between a Study Group and a Group Project?",
        answer: "<strong>Study Groups</strong> are for collective learning about a specific topic (e.g., learning Rust together). <strong>Group Projects</strong> are collaborative cohorts where you build a real application from scratch to gain portfolio experience."
      },
      {
        question: "What is Pair Programming and how do I find a partner?",
        answer: "Pair Programming allows two developers to work on the same code in real-time. You can set your status to 'Open to Pairing' in your settings, list your skills, and others can send you a request to start a session with a shared editor."
      },
      {
        question: "How do the 'Check-ins' work?",
        answer: "Consistency is key. Our daily and weekly check-in systems allow group members to post their progress and blockers. This builds accountability and keeps projects moving forward."
      }
    ]
  },
  {
    title: "Mentorship & Growth",
    icon: <Code className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "How can I find a Mentor or a Tutor?",
        answer: "Visit the <a href='/mentorship' class='text-primary underline'>Mentorship</a> or <a href='/tutor' class='text-primary underline'>Tutor</a> pages. You can filter users by specific skills and send a request. Once accepted, you'll get a private shared dashboard with a real-time note editor and task manager."
      },
      {
        question: "How do I showcase my own work?",
        answer: "Use the <a href='/solo-projects' class='text-primary underline'>Solo Projects</a> gallery. You can submit links to your live apps or GitHub repos. Other members can star your projects, helping you get eyes on your hard work."
      },
      {
        question: "Can I apply for an internship here?",
        answer: "Yes! We often have internal openings for web development and digital marketing volunteers. Check the <a href='/careers' class='text-primary underline'>Careers page</a> to see current roles and apply directly."
      }
    ]
  },
  {
    title: "Logistics & Privacy",
    icon: <Globe className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "Why does the site use UTC time for everything?",
        answer: "Our members live in every time zone on Earth. Coordinated Universal Time (UTC) acts as a global anchor. We provide a <a href='/time-converter' class='text-primary underline'>Time Converter</a> to help you find your offset, and most event pages will automatically show you the time in your local zone if you have it set in your profile."
      },
      {
        question: "What is 'Radical Data Minimization'?",
        answer: "It means we only collect what is strictly necessary. We don't track your behavior across the web or build a 'shadow profile' of you. Read our full <a href='/privacy' class='text-primary underline'>Privacy Policy</a> for our commitment to user agency."
      },
      {
        question: "What if I find a bug or need help?",
        answer: "If you have a technical issue, submit a ticket on our <a href='/support' class='text-primary underline'>Support</a> page. For general questions, the best place to get a fast answer is our <a href='/chat' class='text-primary underline'>Discord community</a>."
      }
    ]
  }
];

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
        {faqSections.map((section) => (
          <Card key={section.title} className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
              <div className="flex items-center gap-2 border-b-2 border-primary pb-2 w-fit">
                {section.icon}
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
                    <AccordionContent className="text-base text-muted-foreground leading-relaxed">
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

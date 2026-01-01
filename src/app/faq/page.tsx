
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const faqItems = [
  {
    question: "What is w3Develops?",
    answer: "w3Develops is a global community of developers who learn, build, and team up on projects together. We offer resources like remote study groups, collaborative build cohorts, and a platform to connect with other developers, all for free."
  },
  {
    question: "Is w3Develops really free?",
    answer: "Yes, all of our core offerings are 100% free. Our mission is to make tech education and real-world project experience accessible to everyone. We are supported by donations from our community."
  },
  {
    question: "How do Study Groups work?",
    answer: "Study Groups are small, collaborative groups focused on a specific topic or technology. You can find and join existing groups based on your interests and time commitment. If you can't find a group that fits, you're welcome to create your own!"
  },
  {
    question: "What are Group Projects (Cohorts)?",
    answer: "Group Projects, or 'Build Cohorts', are teams formed to build a real-world application from scratch. It's a great way to get hands-on experience, learn to work in a development team, and build something for your portfolio."
  },
  {
    question: "How is w3Develops different from a coding bootcamp?",
    answer: "While we offer a path to learn and gain experience similar to a bootcamp, we are community-driven, self-paced, and completely free. Our focus is on collaborative, project-based learning in a real-world team environment rather than a traditional classroom structure."
  },
  {
    question: "How can I contribute to w3Develops?",
    answer: "There are many ways to contribute! You can help other learners, give feedback on projects, contribute code to our open-source repositories, or support us through a donation. Check out our <a href='/contribute' class='text-primary underline'>Contribute page</a> for more details."
  },
  {
    question: "I have a question that's not listed here.",
    answer: "If you have a technical issue, please use our <a href='/support' class='text-primary underline'>Support page</a>. For general questions, you can join our <a href='/chat' class='text-primary underline'>community chat on Discord</a> or submit feedback through our <a href='/feedback' class='text-primary underline'>Feedback page</a>."
  }
];

export default function FAQPage() {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Frequently Asked Questions</CardTitle>
                    <CardDescription>
                        Find answers to common questions about the w3Develops community and platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item) => (
                             <AccordionItem value={item.question} key={item.question}>
                                <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground">
                                    <p dangerouslySetInnerHTML={{ __html: item.answer }} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

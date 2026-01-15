
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { webLearningResources, databaseResources, cybersecurityResources, aiMachineLearningResources, web3LearningResources } from "@/lib/learning-resources";

export default function LearnPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Learn Web</CardTitle>
                    <CardDescription>
                        Curated resources to help you learn and master essential web development skills.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {webLearningResources.map((resource) => (
                            <AccordionItem value={resource.topic} key={resource.topic}>
                                <AccordionTrigger className="text-xl font-semibold">{resource.topic}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                  <p className="text-muted-foreground">{resource.description}</p>
                                  <ul className="space-y-3">
                                      {resource.links.map((link) => (
                                          <li key={link.url}>
                                              <Link href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                                                 <Link2 className="h-4 w-4 flex-shrink-0" />
                                                 <span className="font-medium underline-offset-4 hover:underline">{link.title}</span>
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Learn Databases</CardTitle>
                    <CardDescription>
                        Curated resources for learning about different types of databases.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {databaseResources.map((resource) => (
                            <AccordionItem value={resource.topic} key={resource.topic}>
                                <AccordionTrigger className="text-xl font-semibold">{resource.topic}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                  <p className="text-muted-foreground">{resource.description}</p>
                                  <ul className="space-y-3">
                                      {resource.links.map((link) => (
                                          <li key={link.url}>
                                              <Link href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                                                 <Link2 className="h-4 w-4 flex-shrink-0" />
                                                 <span className="font-medium underline-offset-4 hover:underline">{link.title}</span>
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Learn Web3</CardTitle>
                    <CardDescription>
                        Curated resources to help you learn and master essential Web3 skills.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {web3LearningResources.map((resource) => (
                            <AccordionItem value={resource.topic} key={resource.topic}>
                                <AccordionTrigger className="text-xl font-semibold">{resource.topic}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                  <p className="text-muted-foreground">{resource.description}</p>
                                  <ul className="space-y-3">
                                      {resource.links.map((link) => (
                                          <li key={link.url}>
                                              <Link href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                                                 <Link2 className="h-4 w-4 flex-shrink-0" />
                                                 <span className="font-medium underline-offset-4 hover:underline">{link.title}</span>
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Learn AI & Machine Learning</CardTitle>
                    <CardDescription>
                        Dive into the world of AI and ML with these community-curated resources.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {aiMachineLearningResources.map((resource) => (
                            <AccordionItem value={resource.topic} key={resource.topic}>
                                <AccordionTrigger className="text-xl font-semibold">{resource.topic}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                  <p className="text-muted-foreground">{resource.description}</p>
                                  <ul className="space-y-3">
                                      {resource.links.map((link) => (
                                          <li key={link.url}>
                                              <Link href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                                                 <Link2 className="h-4 w-4 flex-shrink-0" />
                                                 <span className="font-medium underline-offset-4 hover:underline">{link.title}</span>
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Learn Cybersecurity</CardTitle>
                    <CardDescription>
                        Curated resources to help you learn and master essential cybersecurity skills.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {cybersecurityResources.map((resource) => (
                            <AccordionItem value={resource.topic} key={resource.topic}>
                                <AccordionTrigger className="text-xl font-semibold">{resource.topic}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                  <p className="text-muted-foreground">{resource.description}</p>
                                  {resource.links.length > 0 ? (
                                    <ul className="space-y-3">
                                        {resource.links.map((link) => (
                                            <li key={link.url}>
                                                <Link href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                                                   <Link2 className="h-4 w-4 flex-shrink-0" />
                                                   <span className="font-medium underline-offset-4 hover:underline">{link.title}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                  ) : (
                                    <p className="text-muted-foreground itaic">Links coming soon...</p>
                                  )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

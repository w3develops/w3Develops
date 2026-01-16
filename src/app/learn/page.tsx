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
import { programmingTheoryResources, webLearningResources, mobileLearningResources, backendLearningResources, databaseResources, cybersecurityResources, aiMachineLearningResources, web3LearningResources, systemsLearningResources } from "@/lib/learning-resources";

interface LearningResource {
    topic: string;
    description: string;
    links: { title: string; url: string; }[];
}

const LearningSection = ({ title, description, resources }: { title: string, description: string, resources: LearningResource[] }) => (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-3xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {resources.map((resource) => (
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
);

export default function LearnPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
             <LearningSection 
                title="Programming Theory"
                description="Start here to learn the fundamental concepts of programming that apply to any language."
                resources={programmingTheoryResources}
            />

            <LearningSection 
                title="Learn Web Development"
                description="Curated resources to help you learn and master essential web development skills, from frontend to backend."
                resources={webLearningResources}
            />

            <LearningSection 
                title="Learn Mobile Development"
                description="Resources for building mobile applications for iOS and Android."
                resources={mobileLearningResources}
            />

            <LearningSection 
                title="Learn Backend"
                description="Explore languages and frameworks for server-side logic and systems programming."
                resources={backendLearningResources}
            />

            <LearningSection 
                title="Learn Systems"
                description="Explore languages for systems programming."
                resources={systemsLearningResources}
            />

            <LearningSection 
                title="Learn Databases"
                description="Curated resources for learning about different types of databases and data management."
                resources={databaseResources}
            />

            <LearningSection 
                title="Learn Blockchain & Web3"
                description="Curated resources to help you learn and master essential Web3 skills for the decentralized web."
                resources={web3LearningResources}
            />

            <LearningSection 
                title="Learn AI & Machine Learning"
                description="Dive into the world of AI and ML with these community-curated resources."
                resources={aiMachineLearningResources}
            />
            
            <LearningSection 
                title="Learn Cybersecurity"
                description="Curated resources to help you learn and master essential cybersecurity skills."
                resources={cybersecurityResources}
            />
        </div>
    );
}

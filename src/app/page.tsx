
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Code, Users, BookOpen, ArrowRight, Hammer, Trophy, GitCommit, UsersRound, FileCheck, ShieldCheck, Milestone, SearchCheck } from "lucide-react";
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import placeholderImages from '@/app/lib/placeholder-images.json';

const features = [
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Study Groups",
    description: "Find your tribe. Learn and grow with developers who share your interests.",
    link: "/studygroups"
  },
  {
    icon: <Code className="h-10 w-10 text-primary" />,
    title: "Group Projects",
    description: "Gain real-world experience by building applications in a team setting.",
    link: "/groupprojects"
  },
  {
    icon: <Trophy className="h-10 w-10 text-primary" />,
    title: "Competitions",
    description: "Test your skills and challenge yourself in community coding competitions.",
    link: "/competitions"
  },
  {
    icon: <Hammer className="h-10 w-10 text-primary" />,
    title: "Hackathons",
    description: "Join hackathons to innovate, build amazing things, and win prizes.",
    link: "/hackathons"
  },
];


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/account');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return <LoadingSkeleton />;
  }

  return (
    <>
        {/* Hero Section */}
        <section className="relative w-full min-h-screen flex items-center justify-center text-center text-white">
            <Image
                src="/newheader.jpg"
                alt="w3develops community"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 max-w-4xl mx-auto px-4">
                <h1 className="text-4xl font-headline tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white">
                    Learn | Build | Team Up
                </h1>
                <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                    Study and build projects with remote teams 100% free
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/signup">Join For Free <ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/explore">Explore</Link>
                    </Button>
                </div>
            </div>
        </section>

      <div className="p-4 md:p-10">
        {/* What we offer Section */}
        <section className="w-full pt-12 md:pt-16 lg:pt-16 pb-2 md:pb-3">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">What We Offer</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A World of Collaboration</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From casual study sessions to intense hackathons, find the perfect space to grow.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
              {features.map((feature) => (
                <Link href={feature.link} key={feature.title}>
                  <Card className="h-full hover:shadow-lg hover:-translate-y-2 transition-transform duration-300">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      {feature.icon}
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-12 text-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <Link href="/explore">More</Link>
                </Button>
            </div>
          </div>
        </section>

        {/* Global Community Section */}
        <section className="w-full pt-12 md:pt-16 lg:pt-20 pb-3">
            <div className="container grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
                <div className="space-y-6">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Global Community</div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Join a Global Developer Community</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        w3Develops is a global community dedicated to helping you grow as a developer through collaboration, mentorship, and real-world projects. We provide a structured path for aspiring developers to gain practical experience and build a professional portfolio.
                    </p>
                    <h3 className="text-2xl font-bold tracking-tighter font-headline">Advance Your Skills with Real-World Projects</h3>
                     <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Our program is designed to bridge the gap between theoretical knowledge and practical application. By participating in our collaborative coding projects, members gain invaluable experience working in a team environment, mirroring the dynamics of a professional software development workplace. This project-based approach ensures that you not only learn to code but also learn how to build functional, real-world applications.
                    </p>
                </div>
                <div className="flex justify-center">
                   <Image
                      src="/logo.png"
                      width={400}
                      height={400}
                      alt="w3Develops Logo"
                      className="rounded-xl object-cover shadow-2xl"
                    />
                </div>
            </div>
        </section>

        {/* Why Choose Section */}
        <section className="w-full pt-12 md:pt-12 pb-3 bg-muted/40">
            <div className="container px-4 md:px-6 pt-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Why Choose w3Develops?</div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Better Way to Learn</h2>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:grid-cols-3">
                  <div className="flex flex-col items-center text-center p-4 gap-2">
                    <CheckCircle className="h-10 w-10 text-accent" />
                    <h3 className="text-xl font-bold">Hands-On Experience</h3>
                    <p className="text-muted-foreground">Move beyond tutorials and apply your skills to tangible projects that solve real problems.</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 gap-2">
                    <CheckCircle className="h-10 w-10 text-accent" />
                    <h3 className="text-xl font-bold">Portfolio Development</h3>
                    <p className="text-muted-foreground">Build a robust portfolio of work that showcases your abilities to potential employers.</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 gap-2">
                    <CheckCircle className="h-10 w-10 text-accent" />
                    <h3 className="text-xl font-bold">Mentorship and Guidance</h3>
                    <p className="text-muted-foreground">Receive support and guidance from experienced developers and mentors within the community.</p>
                  </div>
                </div>
            </div>
        </section>

        {/* Bootcamp Alternative Section */}
         <section className="w-full pt-4 md:pt-8 lg:pt-10 pb-12">
            <div className="container grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
                <div className="flex justify-center lg:order-last">
                   <Image
                      src="/logo.png"
                      width={400}
                      height={400}
                      alt="w3Develops Logo"
                      className="rounded-xl object-cover shadow-2xl"
                    />
                </div>
                <div className="space-y-6 text-center lg:text-left">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Free to Learn</div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">A Free Coding Bootcamp Alternative</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We believe that quality tech education should be accessible to everyone. That is why w3Develops offers a program that serves as an excellent alternative to a traditional free coding bootcamp. Our focus on self-paced learning and community support provides a flexible yet comprehensive educational experience without the financial burden. Members develop in-demand skills while contributing to meaningful open-source projects.
                    </p>
                     <Button asChild size="lg">
                        <Link href="/studygroups">Explore Study Groups</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Remote Study Groups Section */}
        <section className="w-full pt-12 md:pt-12 lg:pt-12 pb-4 md:pb-3">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Collaborate</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Connect with Remote Coding Study Groups</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Geography should not be a barrier to learning and collaboration. At w3Develops, you can connect with motivated individuals from around the world through our dedicated remote coding study groups. These groups provide a platform for members to discuss challenges, share knowledge, and work together on assignments. This collaborative environment fosters a deep understanding of complex topics and helps you stay motivated on your learning journey.
              </p>
            </div>
            <div className="mx-auto max-w-5xl">
                <ul className="grid gap-6 md:grid-cols-3">
                    <li className="flex flex-col items-center text-center gap-2 p-4">
                        <Users className="h-8 w-8 text-primary"/>
                        <h3 className="text-lg font-bold">Global Network</h3>
                        <p className="text-sm text-muted-foreground">Connect with peers and professionals from diverse backgrounds and expand your professional network.</p>
                    </li>
                    <li className="flex flex-col items-center text-center gap-2 p-4">
                        <Code className="h-8 w-8 text-primary"/>
                        <h3 className="text-lg font-bold">Collaborative Learning</h3>
                        <p className="text-sm text-muted-foreground">Enhance your problem-solving skills by working alongside other developers on collaborative coding projects.</p>
                    </li>
                     <li className="flex flex-col items-center text-center gap-2 p-4">
                        <BookOpen className="h-8 w-8 text-primary"/>
                        <h3 className="text-lg font-bold">Structured Support</h3>
                        <p className="text-sm text-muted-foreground">Our remote coding study groups offer a consistent and reliable support system for your development path.</p>
                    </li>
                </ul>
            </div>
          </div>
        </section>

        {/* START: New Content Sections */}
        <section className="w-full py-8 md:py-12">
          <div className="container px-4 md:px-6 space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-headline font-bold tracking-tighter sm:text-6xl md:text-7xl text-foreground">The Global Developer Community for Collaborative Learning &amp; Open Source</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed mt-4">
                w3Develops is more than a learning platform—it is a global ecosystem dedicated to helping you evolve from a student into a professional software engineer. We provide the structure, mentorship, and collaborative coding projects you need to bridge the gap between theory and employment.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4 text-center lg:text-left">
                    <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl font-headline">Build Real-World Software with Collaborative Coding Projects</h3>
                    <p className="text-muted-foreground md:text-lg/relaxed">
                        Most tutorials teach syntax, but they don't teach development. Our program bridges that gap. By joining our collaborative coding projects, you gain invaluable experience mirroring a real software workplace. You won't just learn to code; you will:
                    </p>
                    <ul className="space-y-4 inline-block text-left">
                        <li className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full"><GitCommit className="h-6 w-6 text-primary"/></div>
                            <div>
                                <h4 className="font-semibold">Master Git & GitHub</h4>
                                <p className="text-sm text-muted-foreground">Learn team workflows and version control in a professional environment.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full"><UsersRound className="h-6 w-6 text-primary"/></div>
                             <div>
                                <h4 className="font-semibold">Participate in Agile</h4>
                                <p className="text-sm text-muted-foreground">Experience modern development cycles, from sprints to stand-ups.</p>
                            </div>
                        </li>
                         <li className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full"><FileCheck className="h-6 w-6 text-primary"/></div>
                            <div>
                                <h4 className="font-semibold">Build Your Portfolio</h4>
                                <p className="text-sm text-muted-foreground">Create functional, scalable apps that impress employers.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="flex justify-center">
                     <Image
                      src="/logo.png"
                      width={400}
                      height={400}
                      alt="w3Develops Logo"
                      className="rounded-xl object-cover shadow-2xl"
                    />
                </div>
            </div>
          </div>
        </section>

        <section className="w-full py-8 md:py-12 bg-muted/40">
            <div className="container px-4 md:px-6 text-center space-y-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">A Superior Free Coding Bootcamp Experience</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg/relaxed">We believe quality tech education is a human right, not a luxury. w3Develops offers a comprehensive, self-paced curriculum that serves as a powerful alternative to expensive bootcamps.</p>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:grid-cols-3">
                  <div className="flex flex-col items-center text-center p-4 gap-2">
                    <ShieldCheck className="h-10 w-10 text-primary"/>
                    <h3 className="text-xl font-bold">Zero Financial Barrier</h3>
                    <p className="text-muted-foreground">Access professional-grade learning resources completely free, forever.</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 gap-2">
                    <Milestone className="h-10 w-10 text-primary"/>
                    <h3 className="text-xl font-bold">Open Source Contributions</h3>
                    <p className="text-muted-foreground">Develop in-demand skills by contributing to meaningful open-source software.</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 gap-2">
                    <SearchCheck className="h-10 w-10 text-primary"/>
                    <h3 className="text-xl font-bold">Flexible Pacing</h3>
                    <p className="text-muted-foreground">Learn on your schedule without sacrificing the intensity required for mastery.</p>
                  </div>
                </div>
                 <Button asChild size="lg">
                    <Link href="/signup">Start Learning For Free</Link>
                </Button>
            </div>
        </section>

        <section className="w-full pt-8 md:pt-16">
            <div className="container px-4 md:px-6 text-center space-y-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Join Active Remote Coding Study Groups</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg/relaxed">Geography is no longer a barrier to your career. Connect with motivated peers from around the world through our dedicated remote coding study groups.</p>
                 <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:grid-cols-3">
                  <div className="flex flex-col items-center text-center gap-2 p-4">
                    <h3 className="text-xl font-bold">Global Network</h3>
                    <p className="text-sm text-muted-foreground">Discuss challenges and share knowledge with peers from diverse backgrounds.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2 p-4">
                    <h3 className="text-xl font-bold">Peer Programming</h3>
                    <p className="text-sm text-muted-foreground">Enhance your problem-solving skills by working alongside other developers in real-time.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2 p-4">
                    <h3 className="text-xl font-bold">Consistent Support</h3>
                    <p className="text-sm text-muted-foreground">Rely on a structured support system to keep you motivated through complex topics.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center pt-8">
                    <Image
                        src="/logo.png"
                        width={200}
                        height={200}
                        alt="w3Develops Logo"
                        className="rounded-full object-cover shadow-2xl"
                    />
                    <div className="mt-16">
                        <Button asChild size="lg">
                            <Link href="/signup">Sign Up - 100% FREE!</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
        {/* END: New Content Sections */}
      </div>
    </>
  );
}

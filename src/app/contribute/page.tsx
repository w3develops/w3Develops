'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Pencil, Languages, Search, Braces, Shield } from 'lucide-react';
import Link from 'next/link';

const contributionOptions = [
    {
        icon: <Pencil className="h-6 w-6 text-yellow-400" />,
        title: 'Help Others',
        description: 'Help by answering coding questions on our community forum.',
        link: '#'
    },
    {
        icon: <Search className="h-6 w-6 text-yellow-400" />,
        title: 'Feedback',
        description: 'Give feedback on coding projects built by campers.',
        link: '#'
    },
    {
        icon: <Languages className="h-6 w-6 text-yellow-400" />,
        title: 'Translations',
        description: "Help us translate w3Develops.org's resources.",
        link: '#'
    },
    {
        icon: <Braces className="h-6 w-6 text-yellow-400" />,
        title: 'Write Code',
        description: 'Contribute with code to our open-source codebases.',
        link: '#'
    }
]

export default function ContributeIntroPage() {
    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold font-sans">
                        Contribute to w3Develops
                    </h1>
                    <p className="text-lg text-gray-300">
                        The largest community of learners, built by thousands of kind volunteers—just like you!
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Button asChild size="lg" className="bg-[#f1be32] text-black hover:bg-yellow-400 font-bold gap-2">
                           <Link href="#">Get Started <ArrowRight className="h-5 w-5" /></Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-gray-700 hover:text-white font-bold gap-2 bg-transparent">
                             <Link href="/donate">Donate to our charity <Heart className="h-5 w-5" /></Link>
                        </Button>
                    </div>
                </div>
                 <div className="flex justify-center">
                    <div className="relative w-80 h-80 md:w-96 md:h-96">
                        <Image
                            src="/logo.png"
                            alt="w3Develops Logo"
                            width={400}
                            height={400}
                            className="rounded-full object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-24 md:mt-32">
                <h2 className="text-3xl font-bold font-sans mb-8">Get Involved:</h2>
                <div className="grid md:grid-cols-2 gap-8">
                   {contributionOptions.map((option) => (
                       <div key={option.title} className="bg-[#2a2a40] p-6 rounded-md border border-gray-700">
                           <div className="flex items-center gap-4 mb-4">
                               <div className="bg-[#1b1b32] p-2 rounded-md">
                                {option.icon}
                               </div>
                               <h3 className="text-2xl font-bold text-white">{option.title}</h3>
                           </div>
                           <Link href={option.link} className="text-gray-300 hover:text-yellow-400 underline">
                            {option.description}
                           </Link>
                       </div>
                   ))}
                </div>

                <div className="mt-16 bg-[#1b1b32] border border-gray-700 rounded-lg p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
                                <Shield className="h-7 w-7 text-yellow-400" />
                                Security Vulnerabilities
                            </h3>
                            <p className="text-gray-300 max-w-lg">
                                If you've found a security issue, please follow our responsible disclosure policy to report it.
                            </p>
                        </div>
                        <Button asChild size="lg" className="bg-[#f1be32] text-black hover:bg-yellow-400 font-bold gap-2 flex-shrink-0">
                           <Link href="/contribute/security">View Disclosure Policy <ArrowRight className="h-5 w-5" /></Link>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}

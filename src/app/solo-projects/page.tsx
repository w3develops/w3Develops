'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { SoloProject, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { ExternalLink, User, PlusCircle } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import SubmitSoloProjectForm from '@/components/forms/SubmitSoloProjectForm';

function ProjectList() {
    const firestore = useFirestore();
    const projectsQuery = useMemo(() => query(collection(firestore, 'soloProjects'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: projects, isLoading } = useCollection<SoloProject>(projectsQuery);

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-6 w-3/4 bg-muted rounded"></div>
                            <div className="h-4 w-1/4 bg-muted rounded mt-2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-5/6 mt-2"></div>
                            <div className="h-9 w-32 bg-muted rounded-md mt-4"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
    
    if (!projects || projects.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-xl font-semibold">No Projects Yet</h3>
                <p className="text-muted-foreground mt-2">
                    Be the first to showcase your solo project!
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
                <Card key={project.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>
                            <Link href={`/users/${project.userId}`} className="flex items-center gap-2 text-sm hover:underline">
                                <User className="h-4 w-4" />
                                {project.username}
                            </Link>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                        <p className="text-muted-foreground text-sm mb-4">{project.description}</p>
                        <div>
                             <p className="text-xs text-muted-foreground mb-4">
                                Submitted: {formatTimestamp(project.createdAt)}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                                    View Project <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export default function SoloProjectsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;
    
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-headline">Solo Projects</h1>
                    <p className="text-muted-foreground">
                        Explore and showcase individual projects from our community members.
                    </p>
                </div>
                {isLoading && user && (
                    <div className="h-10 w-48 bg-muted rounded-md animate-pulse"></div>
                )}
                {!isLoading && user && userProfile && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                             <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Submit Your Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Showcase Your Work</DialogTitle>
                                <DialogDescription>Submit your solo project to the community gallery.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <SubmitSoloProjectForm 
                                    user={user} 
                                    userProfile={userProfile} 
                                    onSuccess={() => setIsDialogOpen(false)} 
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <ProjectList />
        </div>
    );
}

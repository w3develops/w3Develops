
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, writeBatch, arrayUnion } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { SoloProject, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { ExternalLink, User } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';

function SubmitProjectForm({ user, userProfile }: { user: any; userProfile: UserProfile }) {
  const [name, setName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectUrl.trim() || !description.trim()) {
      toast({ variant: 'destructive', title: 'Please fill all fields' });
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const newProjectRef = doc(collection(firestore, 'soloProjects'));
      
      batch.set(newProjectRef, {
        userId: user.uid,
        username: userProfile.username,
        name,
        projectUrl,
        description,
        createdAt: serverTimestamp(),
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      batch.update(userDocRef, {
        soloProjectIds: arrayUnion(newProjectRef.id)
      });
      
      await batch.commit();

      toast({ title: 'Project Submitted!', description: 'Your project is now visible to the community.' });
      setName('');
      setProjectUrl('');
      setDescription('');
    } catch (error: any) {
      console.error("Error submitting project: ", error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Showcase Your Work</CardTitle>
        <CardDescription>Submit your solo project to the community gallery.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome App" disabled={isSubmitting} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectUrl">Project URL</Label>
            <Input id="projectUrl" type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://github.com/user/repo" disabled={isSubmitting} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description</Label>
            <Textarea id="projectDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of what your project does." disabled={isSubmitting} required />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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
    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;
    
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-headline">Solo Projects</h1>
                <p className="text-muted-foreground">
                    Explore and showcase individual projects from our community members.
                </p>
            </div>
            
            {isLoading && !user && <div className="h-40 bg-muted rounded-lg animate-pulse mb-8"></div>}

            {user && userProfile && <SubmitProjectForm user={user} userProfile={userProfile} />}

            <ProjectList />
        </div>
    );
}

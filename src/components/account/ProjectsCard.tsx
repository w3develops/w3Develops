'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { PlusCircle, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubmitSoloProjectForm from '@/components/forms/SubmitSoloProjectForm';
import ItemList from '@/components/account/ItemList';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import type { SoloProject, UserProfile } from '@/lib/types';

/** This member's solo projects and the ones they starred */
export default function ProjectsCard({ user, userProfile }: { user: User; userProfile: UserProfile }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const own = useDocsByIds<SoloProject>('soloProjects', userProfile.soloProjectIds);
  const starred = useDocsByIds<SoloProject>('soloProjects', userProfile.starredSoloProjectIds);

  const projectItem = (project: SoloProject) => (
    <>
      <Link href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{project.name}</Link>
      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
    </>
  );

  return (
    <Card>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Showcase Your Work</DialogTitle>
            <DialogDescription>Submit your solo project to the community gallery.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SubmitSoloProjectForm user={user} userProfile={userProfile} onSuccess={() => setIsAddOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <CardHeader>
        <CardTitle>Your Projects</CardTitle>
        <CardDescription>Individual projects you have showcased or starred.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="my-projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-projects">Your Solo Projects</TabsTrigger>
            <TabsTrigger value="starred-projects">
              <Star className="mr-2 h-4 w-4" />
              Starred Projects
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects" className="pt-4">
            <ItemList
              items={own.data}
              isLoading={own.isLoading}
              renderItem={projectItem}
              itemClassName="py-2 space-y-1"
              empty={<p className="text-sm text-muted-foreground text-center py-4">You haven&apos;t added any solo projects yet.</p>}
            />
            <div className="flex gap-2 pt-4">
              <Button asChild size="sm" variant="secondary">
                <Link href="/solo-projects">Explore Solo Projects</Link>
              </Button>
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Solo Project
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="starred-projects" className="pt-4">
            <ItemList
              items={starred.data}
              isLoading={starred.isLoading}
              renderItem={projectItem}
              itemClassName="py-2 space-y-1"
              empty={
                <p className="text-sm text-muted-foreground text-center py-4">
                  You haven&apos;t starred any projects yet. <Link href="/solo-projects" className="underline font-medium">Go explore!</Link>
                </p>
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

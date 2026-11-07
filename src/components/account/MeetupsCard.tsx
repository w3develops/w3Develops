'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ItemList from '@/components/account/ItemList';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import type { Meetup, UserProfile } from '@/lib/types';

/** Meetups this member joined or organized */
export default function MeetupsCard({ userProfile }: { userProfile: UserProfile }) {
  const joined = useDocsByIds<Meetup>('meetups', userProfile.joinedMeetupIds);
  const created = useDocsByIds<Meetup>('meetups', userProfile.createdMeetupIds);

  const meetupLink = (meetup: Meetup) => (
    <Link href={`/meetups/${meetup.id}`} className="font-medium hover:underline">{meetup.name}</Link>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Meetups</CardTitle>
        <CardDescription>Events you have organized or are attending.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="joined">Joined Meetups</TabsTrigger>
            <TabsTrigger value="created">Created Meetups</TabsTrigger>
          </TabsList>
          <TabsContent value="joined" className="pt-4">
            <ItemList
              items={joined.data}
              isLoading={joined.isLoading}
              renderItem={meetupLink}
              empty={
                <p className="text-sm text-muted-foreground text-center py-4">
                  You haven&apos;t joined any meetups. <Link href="/meetups" className="underline font-medium">Find one!</Link>
                </p>
              }
            />
          </TabsContent>
          <TabsContent value="created" className="pt-4">
            <ItemList
              items={created.data}
              isLoading={created.isLoading}
              renderItem={meetupLink}
              empty={<p className="text-sm text-muted-foreground text-center py-4">You haven&apos;t created any meetups yet.</p>}
            />
          </TabsContent>
        </Tabs>
        <div className="flex gap-2 pt-4">
          <Button asChild size="sm" variant="secondary">
            <Link href="/meetups">Explore Meetups</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/meetups/create">Create a Meetup</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

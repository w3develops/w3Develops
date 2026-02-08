'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, Query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Job } from '@/lib/types';
import { Briefcase, Search, PlusCircle, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';

function JobCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-3/4 bg-muted rounded"></div>
        <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-10 w-32 bg-muted rounded-md mt-4"></div>
      </CardContent>
    </Card>
  );
}

export default function JobBoardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300).toLowerCase();

  const jobsQuery = useMemo(() => 
    query(collection(firestore, 'jobs'), orderBy('createdAt', 'desc')) as Query<Job>, 
    [firestore]
  );
  
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (!debouncedSearchTerm) return jobs;
    return jobs.filter(job => 
      job.title.toLowerCase().includes(debouncedSearchTerm) ||
      job.companyName.toLowerCase().includes(debouncedSearchTerm) ||
      job.location.toLowerCase().includes(debouncedSearchTerm)
    );
  }, [jobs, debouncedSearchTerm]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-headline flex items-center gap-3">
            <Briefcase className="h-8 w-8" />
            Job Board
          </h1>
          <p className="text-muted-foreground">Find your next opportunity in tech.</p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/job-board/create">
              <PlusCircle className="w-4 h-4 mr-2" />
              Post a Job
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by title, company, or location..."
          className="pl-10"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {isLoading && (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        )}
        {!isLoading && filteredJobs.length > 0 && filteredJobs.map(job => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription className="text-base">{job.companyName}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Posted on {formatTimestamp(job.createdAt)}</p>
              </div>
              <Button asChild>
                <Link href={`/job-board/${job.id}`}>View Details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
         {!isLoading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold">No Jobs Found</h3>
            <p className="text-muted-foreground mt-2">
              There are no job postings matching your search, or no jobs have been posted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

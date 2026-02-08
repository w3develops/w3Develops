'use client';

import { useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { doc, DocumentReference } from 'firebase/firestore';
import { Job } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Briefcase, MapPin, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function JobDetailsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <Card>
                <CardHeader>
                    <div className="h-8 w-3/4 bg-muted rounded"></div>
                    <div className="h-5 w-1/2 bg-muted rounded mt-2"></div>
                     <div className="flex flex-wrap gap-4 pt-4">
                        <div className="h-6 w-32 bg-muted rounded-full"></div>
                        <div className="h-6 w-32 bg-muted rounded-full"></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 mt-4">
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-5/6"></div>
                        <div className="h-4 bg-muted rounded w-full mt-4"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function JobDetailsPageClient({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const firestore = useFirestore();

  const jobDocRef = useMemo(() => doc(firestore, 'jobs', jobId) as DocumentReference<Job>, [jobId, firestore]);
  const { data: job, isLoading, error } = useDoc<Job>(jobDocRef);

  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <JobDetailsSkeleton />
        </div>
    );
  }
  if (error) return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading job data.</div>;
  if (!job) return <div className="text-center py-10 p-4 md:p-10">Job posting not found.</div>;
  
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
        <Link href="/job-board" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Board
        </Link>
      
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{job.title}</CardTitle>
                <CardDescription className="text-lg">{job.companyName}</CardDescription>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground pt-4 text-sm">
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{job.companyName}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Posted {formatTimestamp(job.createdAt)} by {job.postedByUsername}</div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    <p>{job.description}</p>
                </div>
                 <Button asChild className="mt-6">
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                        Apply Now <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}

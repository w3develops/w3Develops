
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, DocumentReference } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile } from '@/lib/types';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const rolesMap: { [key: string]: string } = {
    "web-development-internship": "Web Development Internship",
    "digital-marketing-internship": "Digital Marketing Internship"
};

export default function CareerApplyPage() {
    const { roleId } = useParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [coverLetter, setCoverLetter] = useState('');

    const roleTitle = rolesMap[roleId as string] || "Internship Position";

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        if (userProfile) {
            setEmail(userProfile.email || '');
            setFullName(userProfile.username || '');
        }
    }, [userProfile]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push(`/login?redirect=/careers/apply/${roleId}`);
        }
    }, [user, isUserLoading, router, roleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !roleId) return;

        setIsSubmitting(true);

        const applicationData = {
            userId: user.uid,
            username: userProfile?.username || 'anonymous',
            roleId: roleId as string,
            roleTitle: roleTitle,
            fullName,
            email,
            resumeUrl,
            portfolioUrl,
            coverLetter,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
        };

        const applicationsCollection = collection(firestore, 'careerApplications');
        
        addDoc(applicationsCollection, applicationData)
            .then(() => {
                setIsSubmitted(true);
                toast({ title: "Application Submitted!", description: "We've received your application and will review it shortly." });
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: applicationsCollection.path,
                    operation: 'create',
                    requestResourceData: applicationData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: "Submission Failed", description: "A permission error occurred." });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    if (isUserLoading || isProfileLoading || !user) {
        return <LoadingSkeleton />;
    }

    if (isSubmitted) {
        return (
            <div className="max-w-2xl mx-auto p-4 md:p-10">
                <Card className="text-center py-12 space-y-6">
                    <CardHeader>
                        <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className="text-3xl">Application Received!</CardTitle>
                        <CardDescription className="text-lg">
                            Thank you, {fullName}. We've successfully received your application for the {roleTitle} position.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-8">
                            Our team will review your profile and reach out via email if there's a match. In the meantime, keep building!
                        </p>
                        <Button asChild>
                            <Link href="/account">Return to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-10 space-y-8">
            <Link href="/careers" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Careers
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Apply for {roleTitle}</CardTitle>
                    <CardDescription>
                        Tell us why you're a great fit for the w3Develops core team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Doe" disabled={isSubmitting} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@example.com" disabled={isSubmitting} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="resumeUrl">Resume Link (Google Drive, Dropbox, etc.)</Label>
                            <Input id="resumeUrl" type="url" value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} required placeholder="https://..." disabled={isSubmitting} />
                            <p className="text-xs text-muted-foreground italic">Please ensure the link is public or viewable by anyone with the link.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="portfolioUrl">Portfolio or GitHub Link (Optional)</Label>
                            <Input id="portfolioUrl" type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://github.com/..." disabled={isSubmitting} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="coverLetter">Why w3Develops? (Brief Cover Letter)</Label>
                            <Textarea 
                                id="coverLetter" 
                                value={coverLetter} 
                                onChange={e => setCoverLetter(e.target.value)} 
                                required 
                                placeholder="What draws you to our mission and what do you hope to learn?" 
                                rows={6} 
                                disabled={isSubmitting}
                                maxLength={2000}
                            />
                            <p className="text-xs text-muted-foreground text-right">{coverLetter.length} / 2000</p>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting Application..." : "Submit Application"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

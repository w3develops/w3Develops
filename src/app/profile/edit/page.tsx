'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { updateDoc, doc, DocumentReference } from 'firebase/firestore';
import { UserProfile, PairProgrammingStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { X, Lock } from 'lucide-react';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Switch } from '@/components/ui/switch';

// Helper function to ensure a URL is absolute
const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export default function EditProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [followInfoPrivate, setFollowInfoPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pair Programming State
  const [pairProgrammingStatus, setPairProgrammingStatus] = useState<PairProgrammingStatus>('closed');
  const [pairProgrammingSkills, setPairProgrammingSkills] = useState<string[]>([]);
  const [currentPairSkill, setCurrentPairSkill] = useState('');

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
      setSkills(userProfile.skills || []);
      setGithub(userProfile.socialLinks?.github || '');
      setLinkedin(userProfile.socialLinks?.linkedin || '');
      setTwitter(userProfile.socialLinks?.twitter || '');
      setFollowInfoPrivate(userProfile.followInfoPrivate || false);
      setPairProgrammingStatus(userProfile.pairProgrammingStatus || 'closed');
      setPairProgrammingSkills(userProfile.pairProgrammingSkills || []);
    }
  }, [userProfile]);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/profile/edit');
    }
  }, [isUserLoading, user, router]);

  const handleAddSkill = (type: 'general' | 'pair') => {
    if (type === 'general' && currentSkill && !skills.includes(currentSkill)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill('');
    } else if (type === 'pair' && currentPairSkill && !pairProgrammingSkills.includes(currentPairSkill)) {
        setPairProgrammingSkills([...pairProgrammingSkills, currentPairSkill]);
        setCurrentPairSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string, type: 'general' | 'pair') => {
    if (type === 'general') {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    } else {
        setPairProgrammingSkills(pairProgrammingSkills.filter(skill => skill !== skillToRemove));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userDocRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
      return;
    }
    
    setIsSubmitting(true);
    
    const updatedProfileData: Partial<UserProfile> = {
      bio,
      skills: [...new Set([...skills, ...pairProgrammingSkills])], // Combine and unique
      socialLinks: {
        github: ensureAbsoluteUrl(github),
        linkedin: ensureAbsoluteUrl(linkedin),
        twitter: ensureAbsoluteUrl(twitter),
      },
      followInfoPrivate,
      pairProgrammingStatus,
      pairProgrammingSkills,
    };

    try {
      await updateDoc(userDocRef, updatedProfileData);
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      router.push('/account');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Could not update your profile. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || isProfileLoading || !user) {
    return (
        <div className="p-4 md:p-10">
            <LoadingSkeleton />
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <form onSubmit={handleUpdateProfile} className="grid gap-8">
        <Card>
            <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
            <CardDescription>
                Keep your profile up to date to help others connect with you.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} disabled />
                <p className="text-xs text-muted-foreground">Usernames cannot be changed after signup.</p>
                </div>

                <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself" value={bio} onChange={(e) => setBio(e.target.value)} disabled={isSubmitting} maxLength={250}/>
                </div>

                <div className="grid gap-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill, 'general')} className="rounded-full hover:bg-muted-foreground/20" disabled={isSubmitting}>
                        <X className="h-3 w-3"/>
                        </button>
                    </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input 
                        value={currentSkill} 
                        onChange={e => setCurrentSkill(e.target.value)} 
                        placeholder="Add a general skill (e.g. React)"
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSkill('general');}}}
                        disabled={isSubmitting}
                        maxLength={50}
                    />
                    <Button type="button" variant="outline" onClick={() => handleAddSkill('general')} disabled={isSubmitting}>Add</Button>
                </div>
                <p className="text-xs text-muted-foreground">Press Enter or click Add to add a skill.</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input id="github" placeholder="github.com/your-username" value={github} onChange={(e) => setGithub(e.target.value)} disabled={isSubmitting} maxLength={150}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" placeholder="linkedin.com/in/your-profile" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} disabled={isSubmitting} maxLength={150}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input id="twitter" placeholder="twitter.com/your-handle" value={twitter} onChange={(e) => setTwitter(e.target.value)} disabled={isSubmitting} maxLength={150}/>
                </div>
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>Pair Programming</CardTitle>
                <CardDescription>Set your availability and preferred topics for pairing sessions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                    <Label htmlFor="pair-programming-status" className="text-base">
                        Open to Pair Programming
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Allow others to send you requests to pair program.
                    </p>
                    </div>
                    <Switch
                    id="pair-programming-status"
                    checked={pairProgrammingStatus === 'open'}
                    onCheckedChange={(checked) => setPairProgrammingStatus(checked ? 'open' : 'closed')}
                    disabled={isSubmitting}
                    />
                </div>
                {pairProgrammingStatus === 'open' && (
                     <div className="grid gap-2">
                        <Label>Pairing Skills</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {pairProgrammingSkills.map(skill => (
                            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                                {skill}
                                <button type="button" onClick={() => handleRemoveSkill(skill, 'pair')} className="rounded-full hover:bg-muted-foreground/20" disabled={isSubmitting}>
                                <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                value={currentPairSkill} 
                                onChange={e => setCurrentPairSkill(e.target.value)} 
                                placeholder="Add a skill for pairing (e.g. TDD)"
                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSkill('pair');}}}
                                disabled={isSubmitting}
                                maxLength={50}
                            />
                            <Button type="button" variant="outline" onClick={() => handleAddSkill('pair')} disabled={isSubmitting}>Add</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">These are skills you want to practice in a pair.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="follow-info-private" className="text-base">
                    Private Follow Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hide your &quot;followers&quot; and &quot;following&quot; lists from other users.
                  </p>
                </div>
                <Switch
                  id="follow-info-private"
                  checked={followInfoPrivate}
                  onCheckedChange={setFollowInfoPrivate}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
        </Card>
        <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}

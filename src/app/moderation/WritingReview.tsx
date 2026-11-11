'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, query, serverTimestamp, where, writeBatch, updateDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Markdown from '@/components/articles/Markdown';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import { ARTICLE_TOPICS } from '@/lib/articles';
import type { Article, UserProfile, WriterApplication } from '@/lib/types';

/** Approving makes them a writer (writers/{uid}) in the same save */
function ApplicationCard({ application, name }: { application: WriterApplication; name: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const decide = async (approve: boolean) => {
    if (!user) return;
    setIsWorking(true);
    try {
      const batch = writeBatch(firestore);
      if (approve) batch.set(doc(firestore, 'writers', application.id), { approvedBy: user.uid, approvedAt: serverTimestamp() });
      batch.update(doc(firestore, 'writerApplications', application.id), {
        status: approve ? 'approved' : 'rejected', reviewedBy: user.uid, reviewedAt: serverTimestamp(), note: note.trim(),
      });
      await batch.commit();
      toast({ title: approve ? `${name} can now write` : 'Application declined' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save that", description: 'Please reload and try again.' });
      setIsWorking(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm"><Link href={`/users/${application.id}`} className="font-semibold underline">{name}</Link> applied to write</p>
        <p className="whitespace-pre-wrap text-sm">{application.about}</p>
        <ul className="text-sm">
          {application.links.map(link => (
            <li key={link}><a href={link} target="_blank" rel="nofollow noopener noreferrer" className="break-all text-primary underline">{link}</a></li>
          ))}
        </ul>
        <Input value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="Note to them (optional)" aria-label="Note to the applicant" />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => decide(true)} disabled={isWorking}>Approve writer</Button>
          <Button size="sm" variant="outline" onClick={() => decide(false)} disabled={isWorking}>Not yet</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const decide = async (publish: boolean) => {
    if (!user) return;
    if (!publish && !note.trim()) {
      toast({ variant: 'destructive', title: 'Add a note', description: 'Tell the writer what to change.' });
      return;
    }
    setIsWorking(true);
    try {
      await updateDoc(doc(firestore, 'articles', article.id), publish
        ? { status: 'published', publishedAt: serverTimestamp(), reviewedBy: user.uid, editorNote: note.trim() }
        : { status: 'rejected', reviewedBy: user.uid, editorNote: note.trim() });
      toast({ title: publish ? 'Published' : 'Sent back to the writer' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save that", description: 'Please reload and try again.' });
      setIsWorking(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{article.title}</span>
          <Badge variant="secondary">{ARTICLE_TOPICS[article.topic] ?? article.topic}</Badge>
          <span className="text-xs text-muted-foreground">by <Link href={`/users/${article.authorId}`} className="underline">{article.authorName}</Link></span>
        </div>
        <p className="text-sm text-muted-foreground">{article.summary}</p>
        <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>{open ? 'Hide article' : 'Read article'}</Button>
        {open && <div className="max-h-[32rem] overflow-y-auto rounded-md border p-4"><Markdown text={article.body} /></div>}
        <Input value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="Note to the writer" aria-label="Note to the writer" />
        <div className="flex gap-2">
          {article.status === 'submitted' && <Button size="sm" onClick={() => decide(true)} disabled={isWorking}>Publish</Button>}
          <Button size="sm" variant="outline" onClick={() => decide(false)} disabled={isWorking}>
            {article.status === 'published' ? 'Unpublish and send back' : 'Send back'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Writer applications and submitted articles, for moderators on /moderation */
export default function WritingReview() {
  const firestore = useFirestore();
  const applicationsQuery = useMemo(() => query(collection(firestore, 'writerApplications'), where('status', '==', 'pending')), [firestore]);
  const submittedQuery = useMemo(() => query(collection(firestore, 'articles'), where('status', '==', 'submitted')), [firestore]);
  const publishedQuery = useMemo(() => query(collection(firestore, 'articles'), where('status', '==', 'published')), [firestore]);
  const { data: applications } = useCollection<WriterApplication>(applicationsQuery);
  const { data: submitted } = useCollection<Article>(submittedQuery);
  const { data: published } = useCollection<Article>(publishedQuery);
  const { data: members } = useDocsByIds<UserProfile>('users', (applications ?? []).map(application => application.id));
  const names = new Map((members ?? []).map(member => [member.id, member.username]));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold">Writer applications ({applications?.length ?? 0})</h2>
        {applications?.length === 0 && <p className="text-sm text-muted-foreground">No applications waiting.</p>}
        {applications?.map(application => <ApplicationCard key={application.id} application={application} name={names.get(application.id) ?? 'A member'} />)}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Articles to review ({submitted?.length ?? 0})</h2>
        {submitted?.length === 0 && <p className="text-sm text-muted-foreground">No articles waiting.</p>}
        {submitted?.map(article => <ArticleCard key={article.id} article={article} />)}
      </section>
      {(published?.length ?? 0) > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">Published articles ({published!.length})</summary>
          <div className="mt-3 space-y-3">{published!.map(article => <ArticleCard key={article.id} article={article} />)}</div>
        </details>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { addDoc, collection, deleteDoc, doc, getDoc, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import Markdown from '@/components/articles/Markdown';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { findBlockedWord } from '@/lib/member-posts';
import { ARTICLE_STATUS_LABELS, ARTICLE_TOPICS, MAX_ABOUT, MAX_BODY, MAX_SAMPLE_LINKS, MAX_SUMMARY, MAX_TITLE, MIN_TITLE, type ArticleTopic } from '@/lib/articles';
import type { Article, WriterApplication } from '@/lib/types';

/** The application to become a writer, or where it stands */
function Application({ application }: { application: WriterApplication | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const { toast } = useToast();
  const [about, setAbout] = useState('');
  const [links, setLinks] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (application?.status === 'pending') {
    return <p className="text-sm text-muted-foreground">Thanks for applying! A moderator will review your application and you&apos;ll get a notification.</p>;
  }

  const send = async () => {
    if (!user || !ensureVerified()) return;
    const sampleLinks = links.split(/\s+/).map(link => link.trim()).filter(Boolean);
    if (!about.trim() || sampleLinks.length === 0 || sampleLinks.length > MAX_SAMPLE_LINKS || sampleLinks.some(link => !/^https:\/\/\S{1,300}$/.test(link))) {
      toast({ variant: 'destructive', title: 'Almost there', description: `Tell us about yourself and add 1 to ${MAX_SAMPLE_LINKS} https links to your writing.` });
      return;
    }
    setIsSending(true);
    try {
      await setDoc(doc(firestore, 'writerApplications', user.uid), { about: about.trim(), links: sampleLinks, topics: [], status: 'pending', createdAt: serverTimestamp() });
      toast({ title: 'Application sent' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't send your application", description: 'Please check your links and try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {application?.status === 'rejected' && (
        <p className="rounded-md border p-3 text-sm">
          Not yet this time.{application.note && <> A moderator said: “{application.note}”</>} You can apply again below.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Like freeCodeCamp&apos;s publication, we ask writers to apply first with a few things they&apos;ve written. Read the{' '}
        <Link href="/news/developer-news-style-guide" className="underline">style guide</Link> before you start.
      </p>
      <div className="grid gap-1">
        <Label htmlFor="writer-about">About you and what you&apos;d like to write</Label>
        <Textarea id="writer-about" value={about} onChange={e => setAbout(e.target.value)} maxLength={MAX_ABOUT} rows={5} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="writer-links">Links to 1 to {MAX_SAMPLE_LINKS} articles or posts you&apos;ve written (one per line)</Label>
        <Textarea id="writer-links" value={links} onChange={e => setLinks(e.target.value)} rows={3} placeholder="https://..." />
      </div>
      <Button onClick={send} disabled={isSending}>{isSending ? 'Sending...' : 'Apply to write'}</Button>
    </div>
  );
}

interface Draft { title: string; summary: string; body: string; topic: ArticleTopic }
const EMPTY: Draft = { title: '', summary: '', body: '', topic: 'programming' };

function draftProblem(draft: Draft): string | null {
  if (draft.title.trim().length < MIN_TITLE) return `Give it a title of at least ${MIN_TITLE} characters.`;
  if (!draft.summary.trim()) return 'Add a one or two sentence summary.';
  if (!draft.body.trim()) return 'Write the article.';
  const blocked = findBlockedWord(`${draft.title} ${draft.summary} ${draft.body}`);
  return blocked ? `Articles can't include “${blocked}”.` : null;
}

/** Writing one article: a new one, or one of theirs that isn't published */
function Editor({ article, onDone }: { article: Article | null; onDone: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(article ? { title: article.title, summary: article.summary, body: article.body, topic: article.topic } : EMPTY);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (status: 'draft' | 'submitted') => {
    if (!user) return;
    const problem = draftProblem(draft);
    if (problem) {
      toast({ variant: 'destructive', title: "Can't save that yet", description: problem });
      return;
    }
    setIsSaving(true);
    try {
      const fields = { title: draft.title.trim(), summary: draft.summary.trim(), body: draft.body, topic: draft.topic, status, updatedAt: serverTimestamp() };
      if (article) {
        await updateDoc(doc(firestore, 'articles', article.id), fields);
      } else {
        const me = (await getDoc(doc(firestore, 'users', user.uid))).data();
        await addDoc(collection(firestore, 'articles'), {
          ...fields, authorId: user.uid, authorName: me?.username ?? '', authorPhoto: me?.profilePictureUrl ?? '', createdAt: serverTimestamp(),
        });
      }
      toast({ title: status === 'submitted' ? 'Sent for review' : 'Draft saved' });
      onDone();
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save the article", description: 'Please check the fields and try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{article ? 'Edit article' : 'New article'}</CardTitle>
        <CardDescription>Markdown works: ## headings, - lists, **bold**, *italic*, `code`, ``` code blocks ``` and [links](https://...).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1">
          <Label htmlFor="article-title">Title</Label>
          <Input id="article-title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} maxLength={MAX_TITLE} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="article-topic">Topic</Label>
          <Select value={draft.topic} onValueChange={value => setDraft({ ...draft, topic: value as ArticleTopic })}>
            <SelectTrigger id="article-topic"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(ARTICLE_TOPICS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="article-summary">Summary</Label>
          <Textarea id="article-summary" value={draft.summary} onChange={e => setDraft({ ...draft, summary: e.target.value })} maxLength={MAX_SUMMARY} rows={2} />
        </div>
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="article-body">Article</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</Button>
          </div>
          {preview
            ? <div className="min-h-64 rounded-md border p-4"><Markdown text={draft.body} /></div>
            : <Textarea id="article-body" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} maxLength={MAX_BODY} rows={18} className="font-mono text-sm" />}
          <p className="text-xs text-muted-foreground">{draft.body.length} / {MAX_BODY} characters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save('submitted')} disabled={isSaving}>Submit for review</Button>
          <Button variant="outline" onClick={() => save('draft')} disabled={isSaving}>Save draft</Button>
          <Button variant="ghost" onClick={onDone} disabled={isSaving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Write for w3Develops: apply, then write and submit articles for /news */
export default function WriterDesk() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Article | 'new' | null>(null);

  const writerRef = useMemo(() => (user ? doc(firestore, 'writers', user.uid) : null), [firestore, user]);
  const applicationRef = useMemo(() => (user ? doc(firestore, 'writerApplications', user.uid) : null), [firestore, user]);
  const articlesQuery = useMemo(() => (user ? query(collection(firestore, 'articles'), where('authorId', '==', user.uid)) : null), [firestore, user]);
  const { data: writer, isLoading: writerLoading } = useDoc(writerRef);
  const { data: application, isLoading: applicationLoading } = useDoc<WriterApplication>(applicationRef);
  const { data: articles } = useCollection<Article>(writer ? articlesQuery : null);
  const sorted = [...(articles ?? [])].sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));

  const remove = async (article: Article) => {
    if (!window.confirm('Delete this article? This can’t be undone.')) return;
    try {
      await deleteDoc(doc(firestore, 'articles', article.id));
    } catch {
      toast({ variant: 'destructive', title: "Couldn't delete it" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-headline">Write for w3Develops</h1>
        <p className="text-muted-foreground">Share tutorials, career stories and lessons learned with the community. Published articles appear on <Link href="/news" className="underline">News</Link> with your name.</p>
      </div>
      {isUserLoading || (user && (writerLoading || applicationLoading)) ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !user ? (
        <p><Link href="/login?redirect=/news/write" className="text-primary underline">Sign in</Link> to apply to write.</p>
      ) : !writer ? (
        <Card><CardContent className="p-4"><Application application={application} /></CardContent></Card>
      ) : editing ? (
        <Editor article={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <div className="space-y-4">
          <Button onClick={() => setEditing('new')}>Write a new article</Button>
          {sorted.length === 0 && <p className="text-muted-foreground">No articles yet.</p>}
          {sorted.map(article => (
            <Card key={article.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{article.title}</span>
                  <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>{ARTICLE_STATUS_LABELS[article.status]}</Badge>
                </div>
                {article.status === 'rejected' && article.editorNote && <p className="text-sm">Editor&apos;s note: “{article.editorNote}”</p>}
                <div className="flex flex-wrap gap-2">
                  {article.status === 'published'
                    ? <Button asChild size="sm" variant="outline"><Link href={`/news/articles/${article.id}`}>View</Link></Button>
                    : <>
                        <Button size="sm" variant="outline" onClick={() => setEditing(article)}>Edit</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(article)}>Delete</Button>
                      </>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

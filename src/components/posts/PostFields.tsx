'use client';

import { Globe, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MAX_POST_LENGTH, MAX_POST_TOPICS, findBlockedWord, parseTopics } from '@/lib/member-posts';
import type { PostAudience } from '@/lib/types';

/**
 * Who a post is for. Private accounts can only post to followers, so the
 * choice is locked for them.
 */
export function AudienceSelect({ value, onChange, locked, idPrefix }: { value: PostAudience; onChange: (value: PostAudience) => void; locked: boolean; idPrefix: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={`${idPrefix}-audience`} className="sr-only">Who can see it</Label>
      <Select value={value} onValueChange={next => onChange(next as PostAudience)} disabled={locked}>
        <SelectTrigger id={`${idPrefix}-audience`} className="h-9 w-[150px]" aria-label="Who can see it">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public"><span className="flex items-center gap-2"><Globe className="h-3 w-3" aria-hidden="true" /> Public</span></SelectItem>
          <SelectItem value="followers"><span className="flex items-center gap-2"><Users className="h-3 w-3" aria-hidden="true" /> Followers</span></SelectItem>
        </SelectContent>
      </Select>
      {locked && <span className="text-xs text-muted-foreground">Your account is private</span>}
    </div>
  );
}

export interface PostDraft {
  text: string;
  topics: string;
  linkUrl: string;
}

export const EMPTY_DRAFT: PostDraft = { text: '', topics: '', linkUrl: '' };

/** What's wrong with a draft, in words for the member, or null when it can be posted */
export function draftProblem(draft: PostDraft): string | null {
  const text = draft.text.trim();
  if (!text) return 'Write something first.';
  if (text.length > MAX_POST_LENGTH) return `Posts can be up to ${MAX_POST_LENGTH} characters.`;
  if (findBlockedWord(text)) return 'Your post has a word that isn’t allowed here. Please reword it.';
  if (parseTopics(draft.topics).length > MAX_POST_TOPICS) return `Pick up to ${MAX_POST_TOPICS} topics.`;
  const link = draft.linkUrl.trim();
  if (link && !/^https:\/\/\S+$/.test(link)) return 'Links must start with https://';
  if (link.length > 500) return 'That link is too long.';
  return null;
}

/** The fields Firestore stores for a draft (see isValidPostContent in firestore.rules) */
export function draftFields(draft: PostDraft) {
  const link = draft.linkUrl.trim();
  return {
    text: draft.text.trim(),
    topics: parseTopics(draft.topics).slice(0, MAX_POST_TOPICS),
    ...(link && { linkUrl: link }),
  };
}

/** The text, topics and link inputs shared by the new-post form and the edit dialog */
export default function PostFields({ draft, onChange, idPrefix }: { draft: PostDraft; onChange: (draft: PostDraft) => void; idPrefix: string }) {
  const remaining = MAX_POST_LENGTH - draft.text.trim().length;
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-text`} className="sr-only">Post</Label>
        <Textarea
          id={`${idPrefix}-text`}
          value={draft.text}
          onChange={e => onChange({ ...draft, text: e.target.value })}
          placeholder="Share what you're learning, building or stuck on..."
          rows={3}
          maxLength={MAX_POST_LENGTH + 50}
        />
        <p className={`text-xs text-right ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`} aria-live="polite">
          {remaining} characters left
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-topics`} className="text-xs">Topics (up to {MAX_POST_TOPICS}, comma-separated)</Label>
          <Input id={`${idPrefix}-topics`} value={draft.topics} onChange={e => onChange({ ...draft, topics: e.target.value })} placeholder="react, career-change" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-link`} className="text-xs">Link (optional)</Label>
          <Input id={`${idPrefix}-link`} type="url" value={draft.linkUrl} onChange={e => onChange({ ...draft, linkUrl: e.target.value })} placeholder="https://github.com/..." />
        </div>
      </div>
    </div>
  );
}

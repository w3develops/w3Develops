import Link from 'next/link';
import { splitMentions } from '@/lib/mentions';

/** Post or reply text with each @username linked to that member's profile (through /u/<username>) */
export default function MentionText({ text }: { text: string }) {
  return (
    <>
      {splitMentions(text).map((part, i) => ('username' in part
        ? <Link key={i} href={`/u/${part.username.toLowerCase()}`} prefetch={false} className="text-primary hover:underline">@{part.username}</Link>
        : <span key={i}>{part.text}</span>))}
    </>
  );
}

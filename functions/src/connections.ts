import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getMembers, writeFeed } from './feed.js';

// Mentorship, tutoring and pair programming requests. A request arriving
// notifies the person it's for; an accepted request notifies the person who
// sent it. Declines aren't announced.

interface Program {
  /** "mentorship", for "accepted your mentorship request" */
  name: string;
  connectionsPath: string;
  /** What the sender asked for, by the request's `type`, from the receiver's side */
  asks: Record<string, string>;
  defaultAsk: string;
}

const PROGRAMS: Record<'mentorshipRequests' | 'tutorRequests' | 'pairRequests', Program> = {
  mentorshipRequests: {
    name: 'mentorship', connectionsPath: '/mentorships',
    asks: { seeking_mentor: 'asked you to be their mentor', seeking_mentee: 'offered to mentor you' },
    defaultAsk: 'sent you a mentorship request',
  },
  tutorRequests: {
    name: 'tutoring', connectionsPath: '/tutorships',
    asks: { seeking_tutor: 'asked you to be their tutor', seeking_student: 'offered to tutor you' },
    defaultAsk: 'sent you a tutoring request',
  },
  pairRequests: {
    name: 'pair programming', connectionsPath: '/pairings',
    asks: {}, defaultAsk: 'wants to pair program with you',
  },
};

// Connections are named after both members' IDs, sorted, like "abc_xyz"
const connectionId = (a: string, b: string) => [a, b].sort().join('_');

/**
 * One function per request collection, so the trigger only runs for
 * requests. A new pending request notifies the person it's for; a request
 * turning to accepted notifies the person who sent it.
 */
function onRequestWritten(collection: keyof typeof PROGRAMS) {
  const program = PROGRAMS[collection];
  return onDocumentWritten(`${collection}/{requestId}`, async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) return;
    const { fromUid, toUid } = after;
    if (typeof fromUid !== 'string' || typeof toUid !== 'string' || fromUid === toUid) return;

    if (!before && after.status === 'pending') {
      const members = await getMembers([fromUid, toUid]);
      const ask = (typeof after.type === 'string' && program.asks[after.type]) || program.defaultAsk;
      await writeFeed(event.id, [
        {
          recipientId: toUid, type: 'request', actorId: fromUid, notify: true, category: 'requests',
          message: `${members.get(fromUid)?.username ?? 'A member'} ${ask}`,
          // Incoming requests are answered from the account page
          link: '/account',
        },
        {
          recipientId: fromUid, type: 'request', actorId: fromUid, notify: false,
          message: `You sent ${members.get(toUid)?.username ?? 'a member'} a ${program.name} request`,
          link: `/users/${toUid}`,
        },
      ], members);
      return;
    }

    if (before && before.status !== 'accepted' && after.status === 'accepted') {
      const members = await getMembers([fromUid, toUid]);
      const link = `${program.connectionsPath}/${connectionId(fromUid, toUid)}`;
      await writeFeed(event.id, [
        {
          recipientId: fromUid, type: 'request_accepted', actorId: toUid, notify: true, category: 'requests',
          message: `${members.get(toUid)?.username ?? 'A member'} accepted your ${program.name} request`, link,
        },
        {
          recipientId: toUid, type: 'request_accepted', actorId: toUid, notify: false,
          message: `You accepted ${members.get(fromUid)?.username ?? 'a member'}'s ${program.name} request`, link,
        },
      ], members);
    }
  });
}

export const onMentorshipRequest = onRequestWritten('mentorshipRequests');
export const onTutorRequest = onRequestWritten('tutorRequests');
export const onPairRequest = onRequestWritten('pairRequests');

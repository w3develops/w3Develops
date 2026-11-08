import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { excerpt, getFollowers, getMembers, writeFeed } from './feed.js';

/** A new solo project: the member's followers hear about it */
export const onSoloProject = onDocumentCreated('soloProjects/{projectId}', async event => {
  const project = event.data?.data();
  const ownerId = project?.userId;
  if (!project || typeof ownerId !== 'string') return;
  const name = typeof project.name === 'string' && project.name ? project.name : 'a new project';
  const followers = (await getFollowers(ownerId)).filter(id => id !== ownerId);
  const members = await getMembers([ownerId]);
  const owner = members.get(ownerId)?.username ?? 'A member';
  // Solo projects are listed on the member's profile
  const link = `/users/${ownerId}`;
  const detail = excerpt(project.description);
  await writeFeed(event.id, [
    { recipientId: ownerId, type: 'solo_project', actorId: ownerId, notify: false, message: `You started a solo project: ${name}`, detail, link },
    ...followers.map(id => ({
      recipientId: id, type: 'solo_project' as const, actorId: ownerId, notify: true, category: 'following' as const,
      message: `${owner} started a solo project: ${name}`, detail, link,
    })),
  ], members);
});

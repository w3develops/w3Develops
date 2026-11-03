import type { Group } from '@/lib/types';
import { ONE_WEEK_IN_MS } from '@/lib/constants';

export const MAX_MEMBERS = 25;

// Study groups, group projects and book clubs work the same way: anyone can
// start one, others join during its first week, and members share tasks and
// check-ins. Only the wording and a few fields differ, and those live here.
export const GROUP_KINDS = {
  studyGroup: {
    collection: 'studyGroups', path: '/studygroups',
    noun: 'group', label: 'Group', title: 'Study Group', plural: 'Study Groups',
    tagline: 'Find a group to learn and grow with.',
    topicLabel: 'Topic', namePlaceholder: 'e.g., React Rangers',
    hourOptions: ['2', '4', '8'], hasGithub: false,
  },
  groupProject: {
    collection: 'groupProjects', path: '/groupprojects',
    noun: 'project', label: 'Project', title: 'Group Project', plural: 'Group Projects',
    tagline: 'Build real projects with other developers.',
    topicLabel: 'Topic / Technology', namePlaceholder: 'e.g., Open Source Habit Tracker',
    hourOptions: ['2', '4', '8'], hasGithub: true,
  },
  bookClub: {
    collection: 'bookClubs', path: '/book-clubs',
    noun: 'club', label: 'Club', title: 'Book Club', plural: 'Book Clubs',
    tagline: 'Find a club to read and discuss with.',
    topicLabel: 'Genre / Topic', namePlaceholder: 'e.g., Sci-Fi Readers',
    hourOptions: ['1', '2', '3'], hasGithub: false,
  },
} as const;

export type GroupKind = keyof typeof GROUP_KINDS;
export type GroupCollection = (typeof GROUP_KINDS)[GroupKind]['collection'];

/** Groups take new members during their first week, like a cohort */
export function isOpenToJoin(group: Group): boolean {
  return !!group.createdAt && Date.now() - group.createdAt.toMillis() < ONE_WEEK_IN_MS;
}

export function isFull(group: Group): boolean {
  return group.memberIds.length >= MAX_MEMBERS;
}

/** Older book clubs saved just the hours ("2"); everything else says "2hr/day" */
export function commitmentLabel(group: Group): string {
  if (group.commitment) return group.commitment;
  return group.commitmentHours ? `${group.commitmentHours}hr/day` : '';
}

import type { Group } from '@/lib/types';
import { JOIN_WINDOW_MS } from '@/lib/constants';

export const MAX_MEMBERS = 25;

// Study groups, group projects and book clubs work the same way: anyone can
// start one, others join until it starts (two weeks after it's created, or
// a start date the host picks), and members share tasks and check-ins. Only the wording and a few fields differ, and those live here.
// Book clubs can also stay open to join for good (`canStayOpen`).
export const GROUP_KINDS = {
  studyGroup: {
    collection: 'studyGroups', path: '/studygroups',
    noun: 'group', label: 'Group', title: 'Study Group', plural: 'Study Groups',
    tagline: 'Find a group to learn and grow with.',
    topicLabel: 'Topic', namePlaceholder: 'e.g., React Rangers',
    hourOptions: ['2', '4', '8'], hasGithub: false, canStayOpen: false,
  },
  groupProject: {
    collection: 'groupProjects', path: '/groupprojects',
    noun: 'project', label: 'Project', title: 'Group Project', plural: 'Group Projects',
    tagline: 'Build real projects with other developers.',
    topicLabel: 'Topic / Technology', namePlaceholder: 'e.g., Open Source Habit Tracker',
    hourOptions: ['2', '4', '8'], hasGithub: true, canStayOpen: false,
  },
  bookClub: {
    collection: 'bookClubs', path: '/book-clubs',
    noun: 'club', label: 'Club', title: 'Book Club', plural: 'Book Clubs',
    tagline: 'Find a club to read and discuss with.',
    topicLabel: 'Genre / Topic', namePlaceholder: 'e.g., Sci-Fi Readers',
    hourOptions: ['1', '2', '3'], hasGithub: false, canStayOpen: true,
  },
} as const;

export type GroupKind = keyof typeof GROUP_KINDS;
export type GroupCollection = (typeof GROUP_KINDS)[GroupKind]['collection'];

/**
 * When a group stops taking new members, in milliseconds: its start date if
 * the host set one, otherwise two weeks after it was created. The Firestore
 * rules (isJoiningGroup) use the same dates.
 */
export function joinDeadline(group: Pick<Group, 'createdAt' | 'startDate'>): number | null {
  if (group.startDate) return group.startDate.toMillis();
  return group.createdAt ? group.createdAt.toMillis() + JOIN_WINDOW_MS : null;
}

/** Whether a group hasn't started yet, when it shows as "New" */
export function isNew(group: Pick<Group, 'createdAt' | 'startDate'>, now = Date.now()): boolean {
  const deadline = joinDeadline(group);
  return deadline !== null && now < deadline;
}

/**
 * Groups take new members until they start, like a cohort. Book clubs set
 * to stay open take them any time.
 */
export function isOpenToJoin(group: Group): boolean {
  return !!group.openToJoinAnytime || isNew(group);
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;

/**
 * How long a group still takes new members, in words ("3 days left to
 * join"), or null once it has started
 */
export function joinTimeLeft(group: Group, now: number): string | null {
  if (group.openToJoinAnytime) return 'Open to join anytime';
  const deadline = joinDeadline(group);
  if (deadline === null) return null;
  const left = deadline - now;
  if (left <= 0) return null;
  if (left >= ONE_DAY_IN_MS) {
    const days = Math.floor(left / ONE_DAY_IN_MS);
    return `${days} ${days === 1 ? 'day' : 'days'} left to join`;
  }
  if (left >= ONE_HOUR_IN_MS) {
    const hours = Math.floor(left / ONE_HOUR_IN_MS);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} left to join`;
  }
  return 'Less than an hour left to join';
}

export function isFull(group: Group): boolean {
  return group.memberIds.length >= MAX_MEMBERS;
}

/** Older book clubs saved just the hours ("2"); everything else says "2hr/day" */
export function commitmentLabel(group: Group): string {
  if (group.commitment) return group.commitment;
  return group.commitmentHours ? `${group.commitmentHours}hr/day` : '';
}


import type { ModerationAction } from './member-posts';
import { FieldValue, Timestamp } from 'firebase/firestore';
import type { PostTopic } from '@/lib/post-topics';

export interface NotificationSettings {
  dailyCodingNewsletter?: boolean;
  dailyJsNewsletter?: boolean;
  weeklyBookClub?: boolean;
  tipsAndTricks?: boolean;
  interviewQuestions?: boolean;
  weeklyDigest?: boolean;
  surveys?: boolean;
}

export type UserStatus = 'active' | 'paused' | 'inactive';
export type MentorshipRole = 'none' | 'mentor' | 'mentee' | 'both';
export type MentorshipStatus = 'open' | 'closed';
export type TutorRole = 'none' | 'tutor' | 'student' | 'both';
export type TutorStatus = 'open' | 'closed';
export type PairProgrammingStatus = 'open' | 'closed';


export interface UserProfile {
  id: string;
  username: string;
  username_lowercase?: string;
  profilePictureUrl?: string;
  bio?: string;
  timezone?: string; // e.g. "America/New_York", detected from the browser
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    discord?: string; // a Discord username, not a link
  };
  skills?: string[];
  createdAt?: Timestamp | FieldValue;
  lastLoginAt?: Timestamp | FieldValue;
  lastLogoutAt?: Timestamp | FieldValue;
  followers?: string[];
  following?: string[];
  followInfoPrivate?: boolean;
  /** Feed posts are for followers only, and people ask to follow (src/lib/hooks/useFeedPrefs.ts) */
  privateAccount?: boolean;
  createdMeetupIds?: string[];
  soloProjectIds?: string[];
  starredSoloProjectIds?: string[];
  heartedArticleLinks?: string[]; // links of news articles the member hearted
  notificationSettings?: NotificationSettings;
  status?: UserStatus;
  lastCheckInAt?: Timestamp | FieldValue | null;
  mentorshipRole?: MentorshipRole;
  mentorshipStatus?: MentorshipStatus;
  mentoringSkills?: string[];
  seekingSkills?: string[];
  tutorRole?: TutorRole;
  tutorStatus?: TutorStatus;
  tutoringSkills?: string[];
  seekingTutoringSkills?: string[];
  pairProgrammingStatus?: PairProgrammingStatus;
  pairProgrammingSkills?: string[];
}

export interface GlobalAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  link?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
}

// Study groups, group projects and book clubs share one shape; see src/lib/groups.ts
export interface Group {
  id: string;
  name: string;
  name_lowercase: string;
  creatorId: string;
  description: string;
  memberIds: string[];
  topic: string;
  commitment?: string; // e.g. "4hr/day"
  commitmentHours?: string; // older book clubs only
  commitmentDays: string[]; // days in the host's timezone
  startTime?: string; // "HH:mm" in the host's timezone
  timezone?: string; // the host's timezone, e.g. "America/New_York"
  githubUrl?: string; // group projects only
  openToJoinAnytime?: boolean; // book clubs only: takes members after it starts too
  startDate?: Timestamp; // optional first meeting; members can join until then
  createdAt: Timestamp;
}
export type StudyGroup = Group;
export type GroupProject = Group;
export type BookClub = Group;



export interface Meetup {
    id: string;
    name: string;
    name_lowercase: string;
    creatorId: string;
    description: string;
    topic: string;
    attendeeIds: string[];
    dateTime: Timestamp;
    timezone: string;
    locationType: 'Online' | 'In-Person' | 'Hybrid';
    locationAddress?: string;
    virtualLink?: string;
    createdAt: Timestamp;
}

export interface Competition {
  id: string;
  name: string;
  name_lowercase: string;
  description: string;
  rules: string;
  prize: string;
  creatorId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  winnerId?: string;
  createdAt: Timestamp;
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  userId: string;
  username: string;
  projectUrl: string;
  soloProjectId?: string | null;
  description: string;
  submittedAt: Timestamp;
  voterIds: string[];
}

export interface MeetupUpdate {
    id: string;
    meetupId: string;
    creatorId: string;
    content: string;
    createdAt: Timestamp;
}

export interface Task {
    id: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    isCompleted: boolean;
    creatorId: string;
    completedBy?: string | null;
    createdAt: Timestamp;
    completedAt?: Timestamp | null;
    position: number;
}

export interface Notification {
    id: string;
    message: string;
    isRead: boolean;
    createdAt: Timestamp;
    link?: string;
}

/**
 * One entry in a member's activity feed (users/{uid}/feed), written by the
 * server (functions/src/feed.ts). Entries with `notify` also show in the
 * notification bell until read.
 */
export interface FeedEntry {
    id: string;
    type: 'follow' | 'group_join' | 'group_leave' | 'checkin' | 'task_added' | 'task_done'
        | 'request' | 'request_accepted' | 'solo_project' | 'reminder'
        | 'follow_request' | 'reply' | 'moderation' | 'appeal' | 'mention';
    actorId: string;
    actorName: string;
    actorPhoto: string;
    message: string;
    /** A short quote, like the start of a check-in; may be empty */
    detail?: string;
    link: string;
    notify: boolean;
    read: boolean;
    createdAt: Timestamp;
}

export interface CheckIn {
    id: string;
    userId: string;
    type: 'daily' | 'weekly';
    content: string;
    createdAt: Timestamp;
}

export interface SoloProject {
  id: string;
  userId: string;
  username: string;
  name: string;
  projectUrl: string;
  description: string;
  createdAt: Timestamp;
}

export interface SharedNote {
  id: string;
  content: string;
  lastUpdatedBy: string;
  lastUpdatedAt: Timestamp;
}

export interface MentorshipRequest {
    id: string;
    fromUid: string;
    toUid: string;
    fromUsername: string;
    toUsername: string;
    type: 'seeking_mentor' | 'seeking_mentee';
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp;
}

export interface Mentorship {
  id: string;
  memberIds: string[];
  mentorId: string;
  menteeId: string;
  createdAt: Timestamp;
}

export interface TutorRequest {
    id: string;
    fromUid: string;
    toUid: string;
    fromUsername: string;
    toUsername: string;
    type: 'seeking_tutor' | 'seeking_student';
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp;
}

export interface Tutorship {
  id: string;
  memberIds: string[];
  tutorId: string;
  studentId: string;
  createdAt: Timestamp;
}

export interface PairingRequest {
    id: string;
    fromUid: string;
    toUid: string;
    fromUsername: string;
    toUsername: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp;
}

export interface Pairing {
  id: string;
  memberIds: string[];
  createdAt: Timestamp;
}

export interface Job {
  id: string;
  title: string;
  title_lowercase: string;
  companyName: string;
  location: string;
  description: string;
  applyUrl: string;
  postedById: string;
  postedByUsername: string;
  createdAt: Timestamp;
}

export interface CareerApplication {
  id: string;
  userId: string;
  username: string;
  roleId: string;
  roleTitle: string;
  fullName: string;
  email: string;
  resumeUrl: string;
  portfolioUrl?: string;
  coverLetter: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
  createdAt: Timestamp;
}

export interface Feedback {
  id: string;
  feedback: string;
  createdAt: Timestamp;
  userId?: string;
  username?: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: Timestamp;
}

// w3Develops' own posts: community insights and daily news roundups, one
// topic per news refresh time (src/lib/post-topics.ts). Written only by the
// scheduler in functions/src/posts.ts; everyone can read them. The document
// ID is the Pacific date and topic, like "2026-11-09-crypto".
export interface PostItem {
  text: string; // a headline, or a group, meetup or competition name
  link?: string; // https:// address or a path on this site
  source?: string; // the publisher, for news stories
  detail?: string; // a short note, like "Study group · 4 members"
  at?: Timestamp; // a time to show in the reader's zone
  atLabel?: string; // what `at` is, like "Starts" or "Published"
}

export interface PostSection {
  heading: string;
  items: PostItem[];
}

export interface BlogPost {
  id: string;
  topic: PostTopic;
  title: string;
  description: string; // a sentence or two for cards, search results and the RSS feed
  intro: string;
  sections: PostSection[];
  outro?: string;
  aiWritten: boolean; // true if an AI model wrote any of the text
  editionId: string; // start of the news edition it went out in (UTC ISO time)
  createdAt: Timestamp;
}

/**
 * A short public post on the community feed (/feed). Members write their own;
 * moderators and the auto-hide job (functions/src/reports.ts) change
 * `status`. Hidden posts are readable only by moderators and the author.
 */
export type PostAudience = 'public' | 'followers';

export interface MemberPost {
  id: string;
  authorId: string;
  /** The author's username and photo when they posted, so the feed needs no profile lookups */
  authorName: string;
  authorPhoto: string;
  text: string;
  /** Up to 3 lowercase topics, like "react" (see src/lib/member-posts.ts) */
  topics: string[];
  /** An optional https link shown under the text */
  linkUrl?: string;
  /** Everyone, or only the author's followers (always followers for a private account) */
  audience: PostAudience;
  /** An optional image in Storage at imagePath (memberPosts/<uid>/<postId>/<file>) */
  imageUrl?: string;
  imagePath?: string;
  status: 'visible' | 'hidden';
  /** Who hid it: a moderator, the auto-hide after several reports, or the automatic text and image checks */
  hiddenBy?: 'moderator' | 'reports' | 'auto-check';
  /** The moderationLog entry for the latest moderator action on it */
  moderationLogId?: string;
  /** Kept by firestore.rules (likes) and functions/src/replies.ts (replies) */
  likeCount?: number;
  replyCount?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** A reply to a feed post (memberPosts/{postId}/replies/{id}) */
export interface PostReply {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  status: 'visible' | 'hidden';
  hiddenBy?: 'moderator' | 'reports' | 'auto-check';
  moderationLogId?: string;
  createdAt: Timestamp;
  /** Set when the author edited it */
  updatedAt?: Timestamp;
}

/** Someone asking to follow a private account (followRequests/<toId>_<fromId>) */
export interface FollowRequest {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  fromPhoto: string;
  createdAt: Timestamp;
}

/** A member asking moderators to look again at an action (appeals/{moderationLogId}) */
export interface Appeal {
  id: string;
  userId: string;
  action: 'hide' | 'auto-hide' | 'warn' | 'suspend' | 'remove-image';
  postId?: string;
  /** Set when the appeal is about a reply to the post */
  replyId?: string;
  text: string;
  status: 'open' | 'upheld' | 'reversed';
  /** The moderator's answer, shown to the member */
  response?: string;
  closedBy?: string;
  closedAt?: Timestamp;
  createdAt: Timestamp;
}

/** A member's own feed settings (users/{uid}/private/feedPrefs); only they can read it */
export interface FeedPrefs {
  /** Topics whose posts come first in their feed */
  topics?: string[];
  /** Members whose posts they don't see; the muted member isn't told */
  mutedIds?: string[];
  /** Like muted, and these members also can't follow them */
  blockedIds?: string[];
  /** All their posts are for followers only. Now kept on the profile (UserProfile.privateAccount); older accounts have it here. */
  privateAccount?: boolean;
}

/** A report a member filed about another member or one of their posts (src/components/ReportUserButton.tsx) */
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  /** Set when the report is about a post, or a reply to one (with replyId) */
  postId?: string;
  replyId?: string;
  reason: string;
  details: string;
  page: string;
  status: 'open' | 'closed';
  closedBy?: string;
  closedAt?: Timestamp;
  createdAt: Timestamp;
}

/** One moderator action, kept for the record; nobody can change or delete these */
export interface ModerationLogEntry {
  id: string;
  /** The moderator's uid, or "system" for the auto-hide */
  actorId: string;
  action: ModerationAction;
  targetUserId: string;
  postId?: string;
  /** Set when the action was about a reply to the post */
  replyId?: string;
  /** For edits and deletions of members' items, like "studyGroups/abc" (src/lib/moderated-items.ts) */
  contentPath?: string;
  /** Why, in the moderator's words; shown to the member for warnings */
  note: string;
  createdAt: Timestamp;
}

/** A member's warnings and suspension (memberStandings/{uid}); set by moderators, readable by the member */
export interface MemberStanding {
  id: string;
  warnings: number;
  lastWarning?: string;
  /** They can't post until then */
  suspendedUntil?: Timestamp | null;
  lastLogId: string;
  /** The moderationLog entries for their latest warning and suspension, which they can appeal */
  warnLogId?: string;
  suspendLogId?: string;
  updatedAt: Timestamp;
}

/** A member of the moderation team (moderators/{uid}), written by the setModerator function */
export interface Moderator {
  id: string;
  username: string;
  addedBy: string;
  addedAt: Timestamp;
}

/** An organization's page (organizations/{slug}) */
export interface Organization {
  id: string;
  name: string;
  kind: import('./organizations').OrgKind;
  tagline: string;
  about: string;
  /** An https link, or empty */
  website: string;
  location: string;
  ownerId: string;
  /** Run the page; always includes the owner, and are all members */
  adminIds: string[];
  memberIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** A member asking to join an organization (organizations/{slug}/joinRequests/{uid}) */
export interface OrgJoinRequest {
  id: string;
  name: string;
  photo: string;
  note: string;
  createdAt: Timestamp;
}

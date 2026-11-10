
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
  };
  skills?: string[];
  createdAt?: Timestamp | FieldValue;
  lastLoginAt?: Timestamp | FieldValue;
  lastLogoutAt?: Timestamp | FieldValue;
  followers?: string[];
  following?: string[];
  followInfoPrivate?: boolean;
  createdMeetupIds?: string[];
  joinedMeetupIds?: string[];
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
  mentorIds?: string[];
  menteeIds?: string[];
  mentorshipIds?: string[];
  tutorRole?: TutorRole;
  tutorStatus?: TutorStatus;
  tutoringSkills?: string[];
  seekingTutoringSkills?: string[];
  tutorIds?: string[];
  studentIds?: string[];
  tutorshipIds?: string[];
  pairProgrammingStatus?: PairProgrammingStatus;
  pairProgrammingSkills?: string[];
  pairPartnerIds?: string[];
  pairingIds?: string[];
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
        | 'request' | 'request_accepted' | 'solo_project' | 'reminder';
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


import { FieldValue, Timestamp } from 'firebase/firestore';

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
  email?: string;
  username: string;
  username_lowercase?: string;
  profilePictureUrl?: string;
  bio?: string;
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
  createdStudyGroupIds?: string[];
  joinedStudyGroupIds?: string[];
  createdGroupProjectIds?: string[];
  joinedGroupProjectIds?: string[];
  createdBookClubIds?: string[];
  joinedBookClubIds?: string[];
  createdMeetupIds?: string[];
  joinedMeetupIds?: string[];
  soloProjectIds?: string[];
  starredSoloProjectIds?: string[];
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

export interface GroupProject {
  id: string;
  name: string;
  name_lowercase: string;
  creatorId: string;
  description: string;
  memberIds: string[];
  githubUrl?: string;
  topic: string;
  commitment: string;
  commitmentDays: string[];
  createdAt: Timestamp;
}

export interface StudyGroup {
  id: string;
  name: string;
  name_lowercase: string;
  creatorId: string;
  description: string;
  memberIds: string[];
  topic: string;
  commitment: string;
  commitmentDays: string[];
  createdAt: Timestamp;
}

export interface BookClub {
  id: string;
  name: string;
  name_lowercase: string;
  creatorId: string;
  description: string;
  memberIds: string[];
  topic: string;
  commitmentHours: string;
  commitmentDays: string[];
  createdAt: Timestamp;
}

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

export interface User {
  email: string;
  username: string;
  username_lowercase: string;
  createdAt: FieldValue;
  lastLoginAt: FieldValue;
  profilePictureUrl: string;
  bio: string;
  socialLinks: { [key: string]: string };
  skills: string[];
  followers: string[];
  following: string[];
  followInfoPrivate: boolean;
  createdStudyGroupIds: string[];
  joinedStudyGroupIds: string[];
  createdGroupProjectIds: string[];
  joinedGroupProjectIds: string[];
  notificationSettings?: NotificationSettings;
}

export interface Notification {
    id: string;
    message: string;
    isRead: boolean;
    createdAt: Timestamp;
    link?: string;
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
  soloProjectId?: string;
  description?: string;
  submittedAt: Timestamp;
  voterIds: string[];
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

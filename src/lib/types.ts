
import { FieldValue, Timestamp } from 'firebase/firestore';

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
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  lastLogoutAt?: Timestamp;
  followers?: string[];
  following?: string[];
  followInfoPrivate?: boolean;
  createdStudyGroupIds?: string[];
  joinedStudyGroupIds?: string[];
  createdGroupProjectIds?: string[];
  joinedGroupProjectIds?: string[];
  isSubscribedToNewsletter?: boolean;
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
  isSubscribedToNewsletter: boolean;
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

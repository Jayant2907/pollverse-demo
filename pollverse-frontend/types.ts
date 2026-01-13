export interface User {
  id: number | string;
  username: string;
  avatar: string;
  points: number;
  pollsCreated: number;
  pollsVotedOn: (number | string)[]; // Array of Poll IDs
  following: (number | string)[]; // Array of User IDs
  followers: (number | string)[]; // Array of User IDs
  pollsCount: number;
  trustLevel?: number;
  rank?: number;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  website?: string;
  profession?: string;
  interests?: string[];
  dateOfBirth?: Date;
  socialLinks?: { twitter?: string; instagram?: string; linkedin?: string; github?: string };
  interactionType?: string;
}


export interface Comment {
  id: number | string;
  user: User;
  text: string;
  likes: number;
  timestamp: Date;
  parentId?: number;
  replyCount?: number;
  replies?: Comment[];
  isLiked?: boolean;
  userInteraction?: string | null;
  reactions?: Record<string, number>;
}

export interface PollOption {
  id: string | number;
  text: string;
}

export interface SurveyQuestion {
  id: string | number;
  text: string;
  options: PollOption[];
  allowMultiple?: boolean;
  required?: boolean;
}

export interface SwipeResult {
  lowScoreTitle: string; // e.g., "You are a Boomer"
  highScoreTitle: string; // e.g., "You are Gen Z"
}

export interface Poll {
  id: number | string;
  creator?: User; // Optional since backend may only provide creatorId
  creatorId?: number; // Backend field
  question: string;
  description?: string;
  pollType: 'multiple_choice' | 'survey' | 'binary' | 'image' | 'ranking' | 'slider' | 'swipe' | 'petition';
  options: PollOption[];
  votes: Record<string | number, number>;
  comments: Comment[];
  commentsCount?: number;
  likes: number;
  dislikes: number;
  reactions?: Record<string, number>;
  category: string;
  tags: string[];
  timestamp: Date;
  swipeResults?: SwipeResult; // Only for 'swipe' type
  surveyQuestions?: SurveyQuestion[]; // For multi-page surveys

  // Expiration Logic
  expiresAt?: Date;
  scheduledAt?: Date;
  maxVotes?: number;
  goal_threshold?: number;
  // Social state for current user
  userInteraction?: string | null;
  userVote?: string | number | null;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'DRAFT' | 'SCHEDULED';
  createdAt: Date;
  updatedAt?: Date;
  moderationLogs?: ModerationLog[];
}

export interface ModerationLog {
  id: number;
  pollId: number;
  moderatorId: number;
  moderator: User;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'RESUBMITTED';
  comment?: string;
  createdAt: string; // Date string from JSON
}

export interface PageState {
  name: string;
  data?: any;
}

export type Theme = 'light' | 'dark';
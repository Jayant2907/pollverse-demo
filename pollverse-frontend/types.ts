export interface User {
  id: number | string;
  username: string;
  avatar: string;
  points: number;
  pollsCreated: number;
  pollsVotedOn: (number | string)[]; // Array of Poll IDs
  following: (number | string)[]; // Array of User IDs
  followers: (number | string)[]; // Array of User IDs
}

export interface Comment {
  id: number | string;
  user: User;
  text: string;
  likes: number;
  timestamp: Date;
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
  pollType: 'multiple_choice' | 'survey' | 'binary' | 'image' | 'ranking' | 'slider' | 'swipe';
  options: PollOption[];
  votes: Record<string | number, number>;
  comments: Comment[];
  commentsCount?: number;
  likes: number;
  dislikes: number;
  category: string;
  tags: string[];
  timestamp: Date;
  swipeResults?: SwipeResult; // Only for 'swipe' type
  surveyQuestions?: SurveyQuestion[]; // For multi-page surveys

  // Expiration Logic
  expiresAt?: Date;
  maxVotes?: number;
}

export interface PageState {
  name: string;
  data?: any;
}

export type Theme = 'light' | 'dark';
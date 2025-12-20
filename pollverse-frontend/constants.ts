import { Poll, User } from './types';

const now = new Date();

export const CATEGORIES = ['For You', 'Following', 'Trending', 'Sports', 'Technology', 'Movies', 'Travel', 'Food', 'Business'];

export const MOCK_USER: User = {
  id: 1,
  username: 'You',
  avatar: 'https://picsum.photos/100/100',
  points: 1250,
  pollsCreated: 15,
  pollsVotedOn: [],
  following: [], followers: []
};

export const INITIAL_MOCK_POLLS: Poll[] = [
  {
    id: 2001,
    creator: { id: 999, username: 'SurveyAdmin', avatar: 'https://picsum.photos/120/120', points: 5000, pollsCreated: 42, pollsVotedOn: [], following: [], followers: [] },
    question: 'Help us improve by answering a few quick questions!',
    description: 'We value your feedback. This survey helps us understand your needs better.',
    pollType: 'survey',
    category: 'Civic',
    tags: ['feedback', 'survey', 'civic'],
    options: [], // Not used for multi-page
    surveyQuestions: [
      {
        id: 'q1',
        text: 'How satisfied are you with our service?',
        options: [
          { id: 'opt1', text: 'Very Satisfied' },
          { id: 'opt2', text: 'Satisfied' },
          { id: 'opt3', text: 'Neutral' },
          { id: 'opt4', text: 'Dissatisfied' }
        ],
        required: true,
        allowMultiple: false
      },
      {
        id: 'q2',
        text: 'Which features do you use the most?',
        options: [
          { id: 'f1', text: 'Poll Creation' },
          { id: 'f2', text: 'Voting' },
          { id: 'f3', text: 'Comments' },
          { id: 'f4', text: 'Profile Customization' }
        ],
        required: false,
        allowMultiple: true
      },
      {
        id: 'q3',
        text: 'How likely are you to recommend us to a friend?',
        options: [
          { id: 'r1', text: 'Extremely Likely' },
          { id: 'r2', text: 'Likely' },
          { id: 'r3', text: 'Unlikely' }
        ],
        required: true,
        allowMultiple: false
      }
    ],
    votes: {},
    comments: [],
    likes: 45,
    dislikes: 1,
    timestamp: new Date(now.getTime() - 30 * 60000),
    expiresAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000) // Expires in 6 days
  },
  {
    id: 1020,
    creator: { id: 112, username: 'MarketingTeam', avatar: 'https://picsum.photos/112/112', points: 1200, pollsCreated: 8, pollsVotedOn: [], following: [], followers: [] },
    question: 'How did you hear about our new app?',
    description: 'We are trying to optimize our marketing channels.',
    pollType: 'survey',
    options: [],
    surveyQuestions: [
      {
        id: 'q1',
        text: 'How did you hear about us?',
        options: [{ id: 'a', text: 'Instagram Ads' }, { id: 'b', text: 'Friend Referral' }, { id: 'c', text: 'Tech Blog' }, { id: 'd', text: 'App Store Search' }],
        required: true,
        allowMultiple: true
      }
    ],
    votes: { a: 45, b: 120, c: 30, d: 15 },
    comments: [],
    likes: 80,
    dislikes: 0,
    category: 'Business',
    tags: ['business', 'marketing', 'app'],
    timestamp: new Date(now.getTime() - 10 * 60000)
  },
  {
    id: 1022,
    creator: { id: 114, username: 'CommunityMgr', avatar: 'https://picsum.photos/114/114', points: 1500, pollsCreated: 12, pollsVotedOn: [], following: [], followers: [] },
    question: 'Which social platforms do you use daily?',
    description: 'We are expanding our community reach. Help us decide where to focus!',
    pollType: 'survey',
    options: [],
    surveyQuestions: [
      {
        id: 'q1',
        text: 'Which social platforms do you use daily?',
        options: [
          { id: 'a', text: 'Instagram' },
          { id: 'b', text: 'Twitter / X' },
          { id: 'c', text: 'LinkedIn' },
          { id: 'd', text: 'TikTok' },
          { id: 'e', text: 'Reddit' }
        ],
        allowMultiple: true,
        required: true
      }
    ],
    votes: { a: 150, b: 120, c: 200, d: 80, e: 90 },
    comments: [],
    likes: 120,
    dislikes: 2,
    category: 'Trending',
    tags: ['socialmedia', 'community', 'apps'],
    timestamp: new Date(now.getTime() - 2 * 60000)
  },
  {
    id: 1,
    creator: { id: 101, username: 'SportsFanatic', avatar: 'https://picsum.photos/101/101', points: 500, pollsCreated: 5, pollsVotedOn: [], following: [], followers: [] },
    question: 'Who will win the next Cricket World Cup?',
    description: 'Considering the current team form, pitch conditions, and historical performance, which team has the best shot at lifting the trophy?',
    pollType: 'multiple_choice',
    options: [{ id: 'a', text: 'India' }, { id: 'b', text: 'Australia' }, { id: 'c', text: 'England' }, { id: 'd', text: 'South Africa' }],
    votes: { a: 1250, b: 880, c: 620, d: 340 },
    comments: [
      { id: 1, user: { id: 102, username: 'CricketFan', avatar: 'https://picsum.photos/102/102', points: 100, pollsCreated: 0, pollsVotedOn: [], following: [], followers: [] }, text: 'India has the home advantage!', likes: 15, timestamp: new Date(now.getTime() - 2 * 60 * 60000) },
      { id: 2, user: { id: 103, username: 'AussieFan', avatar: 'https://picsum.photos/103/103', points: 200, pollsCreated: 0, pollsVotedOn: [], following: [], followers: [] }, text: 'Never count out Australia.', likes: 4, timestamp: new Date(now.getTime() - 10 * 60000) }
    ],
    likes: 1200,
    dislikes: 50,
    category: 'Sports',
    tags: ['cricket', 'worldcup', 'sports'],
    timestamp: new Date(now.getTime() - 2 * 60 * 60000)
  },
  {
    id: 1021,
    creator: { id: 113, username: 'ProductManager', avatar: 'https://picsum.photos/113/113', points: 2000, pollsCreated: 25, pollsVotedOn: [], following: [], followers: [] },
    question: 'What features should we build next?',
    pollType: 'survey', // Legacy survey treated as single page if structured, but here let's keep it simple for now or assume it will use the surveyQuestions flow if we update it.
    // To ensure compatibility, we can leave this as 'survey' but without questions, it might break.
    // Let's migrate it.
    options: [],
    surveyQuestions: [
      {
        id: 'q1',
        text: 'What features should we build next?',
        options: [{ id: 'a', text: 'Dark Mode' }, { id: 'b', text: 'Direct Messaging' }, { id: 'c', text: 'Live Video Polls' }, { id: 'd', text: 'Groups/Communities' }],
        allowMultiple: true,
        required: true
      }
    ],
    votes: { a: 800, b: 200, c: 150, d: 600 },
    comments: [],
    likes: 300,
    dislikes: 5,
    category: 'Trending',
    tags: ['product', 'features', 'roadmap'],
    timestamp: new Date(now.getTime() - 60 * 60000)
  },
  {
    id: 99,
    creator: { id: 109, username: 'HistoryKeeper', avatar: 'https://picsum.photos/109/109', points: 800, pollsCreated: 10, pollsVotedOn: [], following: [], followers: [] },
    question: 'Previous Election Prediction (Expired)',
    description: 'This poll has ended because the expiration time passed.',
    pollType: 'binary',
    options: [{ id: 'a', text: 'Candidate A' }, { id: 'b', text: 'Candidate B' }],
    votes: { a: 1500, b: 1400 },
    comments: [],
    likes: 100,
    dislikes: 5,
    category: 'Trending',
    tags: ['election', 'politics'],
    timestamp: new Date(now.getTime() - 48 * 60 * 60000),
    expiresAt: new Date(now.getTime() - 1 * 60 * 60000) // Expired 1 hour ago
  },
  {
    id: 100,
    creator: { id: 110, username: 'BetaTester', avatar: 'https://picsum.photos/110/110', points: 100, pollsCreated: 1, pollsVotedOn: [], following: [], followers: [] },
    question: 'First 50 Voters Only!',
    description: 'This poll closed automatically after reaching 50 votes.',
    pollType: 'multiple_choice',
    options: [{ id: 'a', text: 'Gold' }, { id: 'b', text: 'Silver' }],
    votes: { a: 30, b: 20 }, // Total 50
    comments: [],
    likes: 20,
    dislikes: 0,
    category: 'Trending',
    tags: ['limited', 'exclusive'],
    timestamp: new Date(now.getTime() - 30 * 60000),
    maxVotes: 50 // Reached limit
  },
  {
    id: 4,
    creator: { id: 105, username: 'Foodie', avatar: 'https://picsum.photos/104/104', points: 300, pollsCreated: 12, pollsVotedOn: [], following: [], followers: [] },
    question: 'Rank these pizza toppings from best to worst.',
    pollType: 'ranking',
    options: [{ id: 'a', text: 'Pepperoni' }, { id: 'b', text: 'Mushrooms' }, { id: 'c', text: 'Onions' }, { id: 'd', text: 'Bacon' }],
    votes: {},
    comments: [],
    likes: 300,
    dislikes: 10,
    category: 'Food',
    tags: ['pizza', 'foodranking', 'toppings'],
    timestamp: new Date(now.getTime() - 5 * 60 * 60000)
  },
  {
    id: 3,
    creator: { id: 102, username: 'MovieLover', avatar: 'https://picsum.photos/105/105', points: 400, pollsCreated: 2, pollsVotedOn: [], following: [], followers: [] },
    question: 'Which blockbuster will gross more worldwide?',
    pollType: 'image',
    options: [{ id: 'a', text: 'Cyber Runner 3049' }, { id: 'b', text: 'Chronicles of Atheria' }],
    votes: { a: 980, b: 1120 },
    comments: [{ id: 3, user: { id: 104, username: 'FilmBuff', avatar: 'https://picsum.photos/106/106', points: 50, pollsCreated: 0, pollsVotedOn: [], following: [], followers: [] }, text: 'The sci-fi one looks amazing!', likes: 8, timestamp: new Date(now.getTime() - 15 * 60000) }],
    likes: 540,
    dislikes: 12,
    category: 'Movies',
    tags: ['movies', 'scifi', 'fantasy'],
    timestamp: new Date(now.getTime() - 8 * 60 * 60000)
  },
  {
    id: 5,
    creator: { id: 106, username: 'TravelBug', avatar: 'https://picsum.photos/107/107', points: 600, pollsCreated: 22, pollsVotedOn: [], following: [], followers: [] },
    question: 'How likely are you to travel internationally in the next 6 months?',
    pollType: 'slider',
    options: [{ id: 'a', text: 'Not Likely' }, { id: 'b', text: 'Very Likely' }],
    votes: {},
    comments: [],
    likes: 150,
    dislikes: 5,
    category: 'Travel',
    tags: ['travel', 'vacation', 'summer'],
    timestamp: new Date(now.getTime() - 12 * 60 * 60000)
  },
  {
    id: 2,
    creator: { id: 103, username: 'TechGuru', avatar: 'https://picsum.photos/108/108', points: 900, pollsCreated: 8, pollsVotedOn: [], following: [], followers: [] },
    question: 'Which is the better mobile OS for privacy?',
    description: 'This is a long-standing debate. One side prioritizes a walled-garden approach for security, while the other champions open-source flexibility. Which ecosystem do you trust more with your personal data and why?',
    pollType: 'binary',
    options: [{ id: 'a', text: 'iOS' }, { id: 'b', text: 'Android' }],
    votes: { a: 2890, b: 3150 },
    comments: [],
    likes: 2500,
    dislikes: 300,
    category: 'Technology',
    tags: ['tech', 'privacy', 'ios', 'android'],
    timestamp: new Date(now.getTime() - 24 * 60 * 60000)
  },
];

export const getTotalVotes = (votes: Record<string | number, number> | null | undefined) => {
  if (!votes || typeof votes !== 'object') return 0;
  return Object.values(votes).reduce((sum, count) => sum + (count || 0), 0);
};

export const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};
import { Poll, User } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/polls`;

const mapPoll = (poll: any): Poll => ({
    ...poll,
    timestamp: new Date(poll.createdAt),
    expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : undefined,
    votes: poll.votes || {},
    creator: poll.creator || {
        id: poll.creatorId || 1,
        username: 'User ' + (poll.creatorId || 1),
        avatar: 'https://i.pravatar.cc/150?u=' + (poll.creatorId || 1),
        pollsVotedOn: [],
        following: [],
        followers: []
    },
    comments: Array.isArray(poll.comments) ? poll.comments.map((c: any) => ({
        ...c,
        timestamp: c.createdAt ? new Date(c.createdAt) : new Date(),
    })) : [],
    commentsCount: poll.commentsCount !== undefined ? poll.commentsCount : (Array.isArray(poll.comments) ? poll.comments.length : 0),
});

export const PollService = {
    // ============ FEED ============
    getFeed: async (params?: { category?: string; search?: string; tag?: string; userId?: number; creatorId?: number }): Promise<Poll[]> => {
        try {
            const query = new URLSearchParams();
            if (params?.category) query.append('category', params.category);
            if (params?.search) query.append('search', params.search);
            if (params?.tag) query.append('tag', params.tag);
            if (params?.userId) query.append('userId', String(params.userId));
            if (params?.creatorId) query.append('creatorId', String(params.creatorId));

            const response = await fetch(`${API_URL}?${query.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            return data.map(mapPoll);
        } catch (error) {
            console.error("Failed to fetch feed:", error);
            return [];
        }
    },

    // ============ POLL CRUD ============
    createPoll: async (pollData: Partial<Poll>): Promise<Poll> => {
        try {
            const { creator, ...rest } = pollData as any;
            const backendData = {
                ...rest,
                creatorId: creator?.id || 1,
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });
            const data = await response.json();
            return { ...data, timestamp: new Date(data.createdAt), creator: creator || { id: 1, username: 'User 1' } };
        } catch (error) {
            console.error("Failed to create poll:", error);
            throw error;
        }
    },

    updatePoll: async (id: number | string, pollData: Partial<Poll>): Promise<Poll> => {
        try {
            const { creator, ...rest } = pollData as any;
            const backendData = {
                ...rest,
                creatorId: creator?.id || 1,
            };

            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });
            const data = await response.json();
            return mapPoll(data);
        } catch (error) {
            console.error("Failed to update poll:", error);
            throw error;
        }
    },

    getPoll: async (id: number): Promise<Poll | null> => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) return null;
            return mapPoll(await response.json());
        } catch (error) {
            console.error("Failed to get poll:", error);
            return null;
        }
    },

    seedPolls: async (polls: any[]) => {
        const response = await fetch(`${API_URL}/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(polls)
        });
        return response.json();
    },

    // ============ VOTING ============
    vote: async (pollId: number, userId: number, optionId: string) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, optionId })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to vote:", error);
            throw error;
        }
    },

    getUserVote: async (pollId: number, userId: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/vote/${userId}`);
            if (!response.ok) return null;
            return response.json();
        } catch (error) {
            return null;
        }
    },

    unvote: async (pollId: number, userId: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/vote`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to unvote:", error);
            throw error;
        }
    },

    // ============ LIKES/DISLIKES ============
    reactToPoll: async (pollId: number, userId: number, type: string) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to react to poll:", error);
            throw error;
        }
    },
    getInteractors: async (pollId: number, type: string): Promise<User[]> => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/interactors?type=${type}`);
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error(`Failed to get interactors:`, error);
            return [];
        }
    },

    // ============ COMMENTS ============
    getComments: async (pollId: number, userId?: number) => {
        try {
            const query = userId ? `?userId=${userId}` : '';
            const response = await fetch(`${API_URL}/${pollId}/comments${query}`);
            return response.json();
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            return [];
        }
    },
    addComment: async (pollId: number, userId: number, text: string, parentId?: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text, parentId })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to add comment:", error);
            throw error;
        }
    },
    reactToComment: async (commentId: number, userId: number, type: string) => {
        try {
            const response = await fetch(`${API_URL}/comments/${commentId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to react to comment:", error);
            throw error;
        }
    },
    moderatePoll: async (pollId: number, moderatorId: number, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', comment?: string) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/moderate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moderatorId, action, comment })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to moderate poll:", error);
            throw error;
        }
    },

    getModerationHistory: async (pollId: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/moderation-history`);
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error("Failed to fetch moderation history:", error);
            return [];
        }
    },
};

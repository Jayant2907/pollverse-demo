import { Poll, User } from '../types';

const API_URL = 'http://localhost:3000/polls';

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
    likePoll: async (pollId: number, userId: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to like poll:", error);
            throw error;
        }
    },

    dislikePoll: async (pollId: number, userId: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/dislike`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to dislike poll:", error);
            throw error;
        }
    },

    unlikePoll: async (pollId: number, userId: number) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/like`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return response.json();
        } catch (error) {
            console.error("Failed to unlike poll:", error);
            throw error;
        }
    },
    getInteractors: async (pollId: number, type: 'like' | 'dislike'): Promise<User[]> => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/interactors?type=${type}`);
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error(`Failed to get ${type}rs:`, error);
            return [];
        }
    },
};

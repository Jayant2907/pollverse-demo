import { Poll } from '../types';

const API_URL = 'http://localhost:3000/polls';

export const PollService = {
    getFeed: async (params?: { category?: string; search?: string; tag?: string }): Promise<Poll[]> => {
        try {
            const query = new URLSearchParams();
            if (params?.category) query.append('category', params.category);
            if (params?.search) query.append('search', params.search);
            if (params?.tag) query.append('tag', params.tag);

            const response = await fetch(`${API_URL}?${query.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            // Transform backend entities to Frontend Poll types if needed (dates usually come as strings)
            return data.map((poll: any) => ({
                ...poll,
                timestamp: new Date(poll.createdAt), // Map createdAt to timestamp
                creator: {
                    id: poll.creatorId || 1,
                    username: 'User ' + (poll.creatorId || 1),
                    avatar: 'https://i.pravatar.cc/150?u=' + (poll.creatorId || 1),
                    pollsVotedOn: [],
                    following: []
                },
                comments: Array.isArray(poll.comments) ? poll.comments : [],
                // Map other fields if necessary
            }));
        } catch (error) {
            console.error("Failed to fetch feed:", error);
            return [];
        }
    },

    createPoll: async (pollData: Partial<Poll>): Promise<Poll> => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pollData)
            });
            const data = await response.json();
            return { ...data, timestamp: new Date(data.createdAt) };
        } catch (error) {
            console.error("Failed to create poll:", error);
            throw error;
        }
    },

    seedPolls: async (polls: any[]) => {
        await fetch(`${API_URL}/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(polls)
        });
    },

    seedUsers: async (users: any[]) => {
        await fetch('http://localhost:3000/users/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(users)
        });
    }
};

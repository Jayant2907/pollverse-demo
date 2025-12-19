import { Comment } from '../types';

const API_URL = 'http://localhost:3000/polls';
// Note: Comments are currently sub-resource of polls endpoint in backend. 
// We might want to move backend to /comments eventually, but for now we keep URL structure but separate service.

export const CommentService = {
    getComments: async (pollId: number): Promise<Comment[]> => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/comments`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((c: any) => ({
                ...c,
                timestamp: new Date(c.createdAt),
            }));
        } catch (error) {
            console.error("Failed to get comments:", error);
            return [];
        }
    },

    addComment: async (pollId: number, userId: number, text: string) => {
        try {
            const response = await fetch(`${API_URL}/${pollId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text })
            });
            const c = await response.json();
            return { ...c, timestamp: new Date(c.createdAt) };
        } catch (error) {
            console.error("Failed to add comment:", error);
            throw error;
        }
    },

    seedComments: async (commentsData: { pollId: number; userId: number; text: string }[]) => {
        try {
            const response = await fetch(`${API_URL}/seed/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentsData)
            });
            return response.json();
        } catch (error) {
            console.error("Failed to seed comments:", error);
            throw error;
        }
    }
};

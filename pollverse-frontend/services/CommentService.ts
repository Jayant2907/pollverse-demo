import { Comment } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/polls`;
// Note: Comments are currently sub-resource of polls endpoint in backend. 
// We might want to move backend to /comments eventually, but for now we keep URL structure but separate service.

export const CommentService = {
    getComments: async (pollId: number, userId?: number): Promise<Comment[]> => {
        try {
            const url = userId ? `${API_URL}/${pollId}/comments?userId=${userId}` : `${API_URL}/${pollId}/comments`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();

            const mapComment = (c: any): Comment => ({
                ...c,
                timestamp: new Date(c.createdAt),
                replies: c.replies ? c.replies.map(mapComment) : []
            });

            return data.map(mapComment);
        } catch (error) {
            console.error("Failed to get comments:", error);
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
            const c = await response.json();
            return { ...c, timestamp: new Date(c.createdAt) };
        } catch (error) {
            console.error("Failed to add comment:", error);
            throw error;
        }
    },

    likeComment: async (commentId: number, userId: number) => {
        const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return response.json();
    },

    unlikeComment: async (commentId: number, userId: number) => {
        const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return response.json();
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

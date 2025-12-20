import { User } from '../types';

const USERS_URL = 'http://localhost:3000/users';

export const UserService = {
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await fetch(USERS_URL);
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error("Failed to fetch users:", error);
            return [];
        }
    },

    getUser: async (id: number): Promise<User | null> => {
        try {
            const response = await fetch(`${USERS_URL}/${id}`);
            if (!response.ok) return null;
            return response.json();
        } catch (error) {
            return null;
        }
    },

    seedUsers: async (users: any[]) => {
        try {
            const response = await fetch(`${USERS_URL}/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(users)
            });
            return response.json();
        } catch (error) {
            console.error("Failed to seed users:", error);
            throw error;
        }
    },
    follow: async (userId: number, targetUserId: number) => {
        const response = await fetch(`${USERS_URL}/${userId}/follow/${targetUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    },
    unfollow: async (userId: number, targetUserId: number) => {
        const response = await fetch(`${USERS_URL}/${userId}/unfollow/${targetUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    },
    getFollowers: async (userId: number): Promise<User[]> => {
        const response = await fetch(`${USERS_URL}/${userId}/followers`);
        if (!response.ok) return [];
        return response.json();
    },
    getFollowing: async (userId: number): Promise<User[]> => {
        const response = await fetch(`${USERS_URL}/${userId}/following`);
        if (!response.ok) return [];
        return response.json();
    }
};

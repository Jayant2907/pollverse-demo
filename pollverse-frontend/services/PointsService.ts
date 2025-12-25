const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const POINTS_URL = `${BASE_URL}/points`;

export const PointsService = {
    getLeaderboard: async () => {
        try {
            const response = await fetch(`${POINTS_URL}/leaderboard`);
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
            return [];
        }
    },
    getUserRank: async (userId: number) => {
        try {
            const response = await fetch(`${POINTS_URL}/rank/${userId}`);
            if (!response.ok) return null;
            return response.json();
        } catch (error) {
            console.error("Failed to fetch user rank:", error);
            return null;
        }
    }
};

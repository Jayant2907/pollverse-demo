const POINTS_URL = 'http://localhost:3000/points'; // Adjust base URL as needed

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

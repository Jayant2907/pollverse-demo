const NOTIFICATIONS_URL = 'http://localhost:3000/notifications';

export const NotificationService = {
    getNotifications: async (userId: number) => {
        try {
            const response = await fetch(`${NOTIFICATIONS_URL}/${userId}`);
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            return [];
        }
    },
    markAsRead: async (id: number) => {
        try {
            await fetch(`${NOTIFICATIONS_URL}/${id}/read`, { method: 'PATCH' });
        } catch (error) {
            console.error("Failed to mark notification read:", error);
        }
    }
};

import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon } from '../components/Icons';
import { User } from '../types';
import { NotificationService } from '../services/NotificationService';
import { timeAgo } from '../constants'; // Assumed exists or I can just use locale string

interface NotificationsPageProps {
    onBack: () => void;
    currentUser: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack, currentUser }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!currentUser?.id) return;
        setLoading(true);
        NotificationService.getNotifications(Number(currentUser.id))
            .then(data => setNotifications(data))
            .finally(() => setLoading(false));
    }, [currentUser?.id]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'vote': return '🗳️';
            case 'comment': return '💬';
            case 'like': return '❤️';
            case 'dislike': return '👎';
            default: return '🔔';
        }
    };

    const getMessage = (n: any) => {
        const actorName = n.actor?.username || 'Someone';
        switch (n.type) {
            case 'vote': return <span className="text-sm"><span className="font-bold">{actorName}</span> voted on your poll.</span>;
            case 'comment': return <span className="text-sm"><span className="font-bold">{actorName}</span> commented on your poll.</span>;
            case 'like': return <span className="text-sm"><span className="font-bold">{actorName}</span> liked your poll.</span>;
            case 'dislike': return <span className="text-sm"><span className="font-bold">{actorName}</span> disliked your poll.</span>;
            default: return <span className="text-sm">New notification from <span className="font-bold">{actorName}</span>.</span>;
        }
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto text-gray-900 dark:text-gray-100">Notifications</h1>
                <div className="w-10"></div>
            </header>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {loading ? <p className="text-center text-gray-500">Loading...</p> :
                    notifications.length === 0 ? <p className="text-center text-gray-500 mt-10">No notifications yet.</p> :
                        notifications.map(n => (
                            <div key={n.id} className={`flex items-start space-x-3 p-3 rounded-lg ${n.isRead ? 'bg-transparent' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
                                <span className="text-2xl mt-1">{getIcon(n.type)}</span>
                                <div>
                                    <p className="text-gray-900 dark:text-gray-100">{getMessage(n)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
            </div>
        </div>
    );
};

export default NotificationsPage;
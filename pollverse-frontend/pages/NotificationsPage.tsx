import React from 'react';
import { ChevronLeftIcon } from '../components/Icons';

interface NotificationsPageProps {
    onBack: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack }) => (
    <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
        <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
            <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
            <h1 className="text-xl font-bold mx-auto text-gray-900 dark:text-gray-100">Notifications</h1>
             <div className="w-10"></div>
        </header>
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            <div className="flex items-start space-x-3"><span className="text-2xl mt-1">👍</span><p><span className="font-bold">SportsFanatic</span> and 25 others liked your poll about the Cricket World Cup.</p></div>
            <div className="flex items-start space-x-3"><span className="text-2xl mt-1">💬</span><p><span className="font-bold">FilmBuff</span> commented on a poll you voted on.</p></div>
        </div>
    </div>
);

export default NotificationsPage;
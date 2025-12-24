import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon } from '../components/Icons';
import { PointsService } from '../services/PointsService';
import { User } from '../types';

interface LeaderboardPageProps {
    onBack: () => void;
    onNavigate: (name: string, data?: any) => void;
    currentUser: User;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, onNavigate, currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [userRank, setUserRank] = useState<{ rank: number; points: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = () => {
            PointsService.getLeaderboard().then(data => {
                setUsers(data);
                setIsLoading(false);
            });

            if (currentUser && currentUser.id) {
                PointsService.getUserRank(Number(currentUser.id)).then(rankData => {
                    setUserRank(rankData);
                });
            }
        };

        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);

        return () => clearInterval(interval);
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return '🥇'; // Gold
        if (index === 1) return '🥈'; // Silver
        if (index === 2) return '🥉'; // Bronze
        return <span className="text-gray-500 font-bold">{index + 1}</span>;
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-gray-100">Leaderboard</h1>
            </header>

            <div className="flex-grow overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map((user, index) => {
                            const isMe = String(user.id) === String(currentUser.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => onNavigate('profile', user)}
                                    className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${isMe ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/10 dark:to-gray-900 border border-yellow-100 dark:border-yellow-900/30' : 'bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                                >
                                    <div className="w-8 text-center text-xl mr-3">{getRankIcon(index)}</div>
                                    <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.username} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 bg-gray-200 object-cover" />
                                    <div className="ml-3 flex-grow">
                                        <div className="flex items-center">
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{user.username}</p>
                                            {isMe && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase">You</span>}
                                        </div>
                                        <p className="text-xs text-blue-600 font-semibold">Level {Math.floor((user.points || 0) / 100) + 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-gray-800 dark:text-gray-200">{user.points || 0}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Points</p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Your Position if not in top list */}
                        {userRank && !users.some(u => String(u.id) === String(currentUser.id)) && (
                            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-3 px-2">Your Rank</p>
                                <div
                                    onClick={() => onNavigate('profile', currentUser)}
                                    className="flex items-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 cursor-pointer"
                                >
                                    <div className="w-8 text-center font-bold text-blue-600 mr-3">{userRank.rank}</div>
                                    <img src={currentUser.avatar} alt={currentUser.username} className="w-10 h-10 rounded-full border border-blue-200 object-cover" />
                                    <div className="ml-3 flex-grow">
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{currentUser.username}</p>
                                        <p className="text-xs text-blue-600 font-semibold">Level {Math.floor((userRank.points || 0) / 100) + 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-blue-600">{userRank.points}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Points</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;

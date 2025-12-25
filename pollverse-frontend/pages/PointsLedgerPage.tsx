import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon } from '../components/Icons';
import { User } from '../types';

interface PointsLedgerPageProps {
    onBack: () => void;
    onNavigate: (name: string, data?: any) => void;
    currentUser: User;
}

interface Transaction {
    id: number;
    actionType: string;
    points: number;
    targetId?: number;
    metadata?: Record<string, any>;
    createdAt: string;
}

import { PollService } from '../services/PollService';
import { UserService } from '../services/UserService';

const PointsLedgerPage: React.FC<PointsLedgerPageProps> = ({ onBack, onNavigate, currentUser }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleEntryClick = async (tx: Transaction) => {
        try {
            if (tx.actionType === 'FOLLOW' && tx.targetId) {
                const user = await UserService.getUser(tx.targetId);
                if (user) onNavigate('profile', user);
            } else if (tx.actionType === 'LIKE_COMMENT' && tx.metadata?.pollId) {
                const poll = await PollService.getPoll(tx.metadata.pollId);
                if (poll) onNavigate('comments', poll);
            } else if (tx.actionType === 'SIGN_PETITION' && tx.targetId) {
                // Navigate to feed with the petition in focus
                onNavigate('feed', { targetPollId: tx.targetId });
            } else if (tx.targetId) {
                const poll = await PollService.getPoll(tx.targetId);
                if (poll) {
                    onNavigate('results', poll);
                }
            }
        } catch (e) {
            console.error("Navigation failed", e);
        }
    };

    useEffect(() => {
        fetch(`http://localhost:3000/points/ledger/${currentUser.id}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [currentUser.id]);

    const getActionLabel = (actionType: string): string => {
        const labels: Record<string, string> = {
            'CREATE_POLL': 'Created Poll',
            'VOTE': 'Voted',
            'SWIPE_BONUS': 'Swipe Poll',
            'SURVEY_COMPLETE': 'Survey Complete',
            'FOLLOW': 'Followed User',
            'LIKE_COMMENT': 'Comment Liked',
            'TRENDING_BONUS': 'Poll Trending!',
            'CLAWBACK': 'Points Reversed',
            'SIGN_PETITION': 'Signed Petition',
            'POLL_PUBLISHED': 'Poll Went Live'
        };
        return labels[actionType] || actionType;
    };

    const getActionIcon = (actionType: string): string => {
        const icons: Record<string, string> = {
            'CREATE_POLL': '📝',
            'VOTE': '✅',
            'SWIPE_BONUS': '👆',
            'SURVEY_COMPLETE': '📋',
            'FOLLOW': '👤',
            'LIKE_COMMENT': '💬',
            'TRENDING_BONUS': '🔥',
            'CLAWBACK': '⚠️',
            'SIGN_PETITION': '✍️',
            'POLL_PUBLISHED': '🚀'
        };
        return icons[actionType] || '⭐';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const documentedPoints = transactions.reduce((acc, tx) => acc + tx.points, 0);
    const legacyPoints = (currentUser.points || 0) - documentedPoints;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeftIcon />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Points History</h2>
                        <p className="text-xs text-gray-500 font-medium">{currentUser.points || 0} Total Points</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-grow overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (transactions.length > 0 || legacyPoints > 0) ? (
                    <div className="space-y-3">
                        {transactions.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => handleEntryClick(tx)}
                                className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-95"
                            >
                                <div className="text-2xl mr-4">{getActionIcon(tx.actionType)}</div>
                                <div className="flex-grow">
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{getActionLabel(tx.actionType)}</p>
                                    <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                                </div>
                                <div className={`font-black text-lg ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.points >= 0 ? '+' : ''}{tx.points}
                                </div>
                            </div>
                        ))}

                        {/* Legacy / Initial Balance Item */}
                        {legacyPoints > 0 && (
                            <div className="flex items-center p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 opacity-80">
                                <div className="text-2xl mr-4">🎉</div>
                                <div className="flex-grow">
                                    <p className="font-bold text-gray-900 dark:text-gray-100">Initial Balance</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Account Setup & Legacy Points</p>
                                </div>
                                <div className="font-black text-lg text-blue-600">
                                    +{legacyPoints}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                        <div className="text-6xl mb-4">📜</div>
                        <p className="text-xl font-bold">No transactions yet</p>
                        <p className="text-sm">Start voting and creating polls to earn points!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PointsLedgerPage;

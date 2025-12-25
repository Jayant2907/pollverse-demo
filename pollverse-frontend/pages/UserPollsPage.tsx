import React, { useEffect, useState } from 'react';
import { Poll, User } from '../types';
import { PollService } from '../services/PollService';
import PollCard from '../components/poll/PollCard';
import { ChevronLeftIcon } from '../components/Icons';

interface UserPollsPageProps {
    user: User;
    currentUser: User;
    isLoggedIn: boolean;
    onBack: () => void;
    onNavigate: (name: string, data?: any) => void;
    requireLogin: (action: () => void) => void;
    showToast: (message: string) => void;
    onVote: (pollId: number | string, pointsEarned?: number) => void;
    setGlobalLoading?: (loading: boolean) => void;
}

const UserPollsPage: React.FC<UserPollsPageProps> = ({
    user,
    currentUser,
    isLoggedIn,
    onBack,
    onNavigate,
    requireLogin,
    showToast,
    onVote,
    setGlobalLoading
}) => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserPolls = async () => {
            setIsLoading(true);
            try {
                const data = await PollService.getFeed({
                    creatorId: Number(user.id),
                    userId: isLoggedIn ? Number(currentUser.id) : undefined
                });
                setPolls(data);
            } catch (error) {
                console.error("Failed to fetch user polls:", error);
                showToast("Failed to load polls");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserPolls();
    }, [user.id, currentUser.id, isLoggedIn]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeftIcon />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {user.id === currentUser.id ? 'My Polls' : `${user.username}'s Polls`}
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">{polls.length} Polls</p>
                    </div>
                </div>
            </div>

            {/* Content - Full sized scrollable feed */}
            <main className="flex-grow overflow-y-auto snap-y snap-mandatory scrollbar-hide">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : polls.length > 0 ? (
                    polls.map(poll => (
                        <div key={poll.id} className="h-[calc(100vh-80px)] w-full snap-start">
                            <PollCard
                                poll={poll}
                                onNavigate={onNavigate}
                                isLoggedIn={isLoggedIn}
                                requireLogin={requireLogin}
                                showToast={showToast}
                                onVote={onVote}
                                currentUser={currentUser}
                                setGlobalLoading={setGlobalLoading}
                            />
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-xl font-bold">No polls yet</p>
                        <p className="text-sm">This user hasn't posted any polls.</p>
                        {user.id === currentUser.id && (
                            <button
                                onClick={() => onNavigate('addPoll')}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-full"
                            >
                                Create First Poll
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserPollsPage;

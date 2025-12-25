import React, { useEffect, useState } from 'react';
import { Poll, User } from '../types';
import { PollService } from '../services/PollService';
import PollCard from '../components/poll/PollCard';
import { ChevronLeftIcon, ShieldCheck, XIcon, ShieldAlert, FileEdit } from '../components/Icons';


interface ReviewQueuePageProps {
    currentUser: User;
    onBack: () => void;
    onNavigate: (name: string, data?: any) => void;
    showToast: (message: string) => void;
    setGlobalLoading?: (loading: boolean) => void;
}

const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({ currentUser, onBack, onNavigate, showToast, setGlobalLoading }) => {
    const [pendingPolls, setPendingPolls] = useState<Poll[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [currentAction, setCurrentAction] = useState<'REJECT' | 'REQUEST_CHANGES' | null>(null);

    const fetchQueue = async () => {
        setIsLoading(true);
        try {
            const data = await PollService.getFeed({ category: 'Pending' });
            setPendingPolls(data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load review queue");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
        if (!pendingPolls[currentIndex]) return;

        const pollId = Number(pendingPolls[currentIndex].id);

        if (setGlobalLoading) setGlobalLoading(true);
        try {
            await PollService.moderatePoll(pollId, Number(currentUser.id), action, feedback);
            showToast(`${action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Changes Requested'}!`);

            // Remove from local list
            const updated = [...pendingPolls];
            updated.splice(currentIndex, 1);
            setPendingPolls(updated);

            // Adjust index
            if (currentIndex >= updated.length && updated.length > 0) {
                setCurrentIndex(updated.length - 1);
            }

            // Reset feedback
            setFeedback('');
            setShowFeedbackInput(false);
            setCurrentAction(null);
        } catch (error) {
            console.error(error);
            showToast("Failed to submit decision");
        } finally {
            if (setGlobalLoading) setGlobalLoading(false);
        }
    };

    const currentPoll = pendingPolls[currentIndex];

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (pendingPolls.length === 0) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                <header className="flex items-center p-4 border-b border-gray-100 dark:border-gray-800">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ChevronLeftIcon />
                    </button>
                    <div className="flex-grow flex items-center justify-center space-x-2 mr-10">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold">Review Queue (0/0)</h2>
                    </div>
                </header>
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">All Clear!</p>
                    <p className="text-sm">There are no polls waiting for review at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ChevronLeftIcon />
                </button>
                <div className="flex-grow flex items-center justify-center space-x-2 mr-10 text-gray-800 dark:text-gray-100">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold">Review Queue ({currentIndex + 1}/{pendingPolls.length})</h2>
                </div>
            </header>

            {/* Content Swiper Style */}
            <main className="flex-grow overflow-y-auto p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-lg aspect-[4/5] sm:aspect-auto">
                    <PollCard
                        poll={currentPoll}
                        onNavigate={onNavigate}
                        isLoggedIn={true}
                        requireLogin={() => { }}
                        showToast={showToast}
                        onVote={() => { }}
                        currentUser={currentUser}
                        readOnly={true}
                    />
                </div>
            </main>

            {/* Action Bar */}
            <footer className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4">
                {showFeedbackInput ? (
                    <div className="animate-slide-up space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Feedback for Creator ({currentAction === 'REJECT' ? 'Rejection' : 'Edit Request'})
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Write a clear message..."
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 h-24 transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => { setShowFeedbackInput(false); setCurrentAction(null); setFeedback(''); }}
                                className="flex-1 py-3 text-gray-500 font-bold hover:text-gray-700 bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors flex items-center justify-center space-x-2"
                            >
                                <XIcon />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={() => handleAction(currentAction!)}
                                disabled={!feedback.trim()}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                <ShieldCheck className="w-5 h-5" />
                                <span>Submit Decision</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2 h-16">
                        <button
                            onClick={() => { setShowFeedbackInput(true); setCurrentAction('REJECT'); }}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all border border-red-200 flex flex-col items-center justify-center space-y-1"
                        >
                            <ShieldAlert className="w-5 h-5" />
                            <span>Reject</span>
                        </button>
                        <button
                            onClick={() => { setShowFeedbackInput(true); setCurrentAction('REQUEST_CHANGES'); }}
                            className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl font-bold text-sm transition-all border border-yellow-200 flex flex-col items-center justify-center space-y-1"
                        >
                            <FileEdit className="w-5 h-5" />
                            <span>Request Edit</span>
                        </button>
                        <button
                            onClick={() => handleAction('APPROVE')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex flex-col items-center justify-center space-y-1"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>Approve</span>
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default ReviewQueuePage;

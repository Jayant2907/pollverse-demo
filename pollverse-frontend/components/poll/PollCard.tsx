import React, { useState, useRef, useEffect } from 'react';
import { Poll, User } from '../../types';
import { getTotalVotes } from '../../constants';
import { ThumbUpIcon, ThumbDownIcon, ShareIcon, ChartBarIcon, ChatIcon, MenuIcon, XIcon, ChevronLeftIcon, ShieldCheck } from '../Icons';
import SvgPlaceholder from '../ui/SvgPlaceholder';
import SwipePoll from './SwipePoll';
import ModerationTimeline from './ModerationTimeline';

import confetti from 'canvas-confetti';

interface PollCardProps {
    poll: Poll;
    onNavigate: (name: string, data?: any) => void;
    isLoggedIn: boolean;
    requireLogin: (action: () => void) => void;
    showToast: (message: string) => void;
    onVote: (pollId: number | string, pointsEarned?: number, updatedVotes?: Record<string | number, number>) => void;
    onVoteComplete?: () => void;
    currentUser: User;
    readOnly?: boolean;
    setGlobalLoading?: (loading: boolean) => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onNavigate, isLoggedIn, requireLogin, showToast, onVote, onVoteComplete, currentUser, readOnly, setGlobalLoading }) => {
    const [userVote, setUserVote] = useState<string | number | null>(poll.userVote || null);
    const [interaction, setInteraction] = useState<'like' | 'dislike' | null>(poll.userInteraction || null);
    const [likesCount, setLikesCount] = useState(poll.likes || 0);
    const [dislikesCount, setDislikesCount] = useState(poll.dislikes || 0);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [interactorsModal, setInteractorsModal] = useState<{ type: 'like' | 'dislike' | 'vote', users: User[] } | null>(null);
    const [isLoadingInteractors, setIsLoadingInteractors] = useState(false);
    const [showModeration, setShowModeration] = useState(false);

    // Check moderator status: Top 4 on leaderboard
    const isModerator = (currentUser?.rank || 999) <= 4;


    useEffect(() => {
        setUserVote(poll.userVote || null);
        setInteraction(poll.userInteraction || null);
        setLikesCount(poll.likes || 0);
        setDislikesCount(poll.dislikes || 0);
    }, [poll.id, poll.userVote, poll.userInteraction, poll.likes, poll.dislikes]);

    const handleShowInteractors = async (e: React.MouseEvent, type: 'like' | 'dislike' | 'vote') => {
        e.stopPropagation();
        setIsLoadingInteractors(true);
        setInteractorsModal({ type, users: [] });
        try {
            const PollService = (await import('../../services/PollService')).PollService;
            const users = await PollService.getInteractors(Number(poll.id), type);
            setInteractorsModal({ type, users });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingInteractors(false);
        }
    };

    const handleInteract = async (type: 'like' | 'dislike') => {
        if (readOnly) return;
        if (!isLoggedIn) {
            requireLogin(() => handleInteract(type));
            return;
        }
        triggerHaptic();

        // Optimistic Update
        const previousInteraction = interaction;
        if (interaction === type) {
            setInteraction(null);
            if (type === 'like') setLikesCount(prev => prev - 1);
            else setDislikesCount(prev => prev - 1);
        } else {
            setInteraction(type);
            if (type === 'like') {
                setLikesCount(prev => prev + 1);
                if (previousInteraction === 'dislike') setDislikesCount(prev => prev - 1);
            } else {
                setDislikesCount(prev => prev + 1);
                if (previousInteraction === 'like') setLikesCount(prev => prev - 1);
            }
        }

        // API Call
        if (setGlobalLoading) setGlobalLoading(true);
        try {
            const PollService = (await import('../../services/PollService')).PollService;
            const userId = Number(currentUser.id);
            if (interaction === type) {
                await PollService.unlikePoll(Number(poll.id), userId);
            } else {
                if (type === 'like') {
                    await PollService.likePoll(Number(poll.id), userId);
                } else {
                    await PollService.dislikePoll(Number(poll.id), userId);
                }
            }
        } catch (error) {
            console.error("Interaction failed, reverting", error);
            // Revert on error (could imply setting state back)
        } finally {
            if (setGlobalLoading) setGlobalLoading(false);
        }
    };

    // State for Ranking Polls
    const [rankedItems, setRankedItems] = useState(poll.options);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // State for Slider Polls
    const [sliderValue, setSliderValue] = useState(50);

    // Check Expiration Logic
    const totalVotes = getTotalVotes(poll.votes || {});
    const isTimeExpired = poll.expiresAt && new Date() > poll.expiresAt;
    const isMaxVotesReached = poll.maxVotes ? totalVotes >= poll.maxVotes : false;
    const isPollClosed = !!(isTimeExpired || isMaxVotesReached);

    // UI / Haptic helpers
    const triggerHaptic = () => {
        if (navigator.vibrate) navigator.vibrate(30);
    };

    const triggerConfetti = () => {
        const colors = ['#3b82f6', '#ef4444', '#10b981'];
        confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
            colors: colors,
            disableForReducedMotion: true
        });
    };

    const handleVote = async (optionId: string | number) => {
        if (isPollClosed || readOnly) return;

        if (!isLoggedIn) {
            requireLogin(() => handleVote(optionId));
            return;
        }

        if (!userVote) {
            // Optimistic Update can be tricky if network is slow but we revert on error
            triggerHaptic();
            triggerConfetti();
            setUserVote(optionId);

            if (setGlobalLoading) setGlobalLoading(true);
            try {
                const PollService = (await import('../../services/PollService')).PollService;
                const result = await PollService.vote(Number(poll.id), Number(currentUser.id), String(optionId));

                if (result.success) {
                    onVote(poll.id, result.pointsEarned, result.votes); // Notify App to update user stats and votes
                    if (onVoteComplete) {
                        onVoteComplete();
                    }
                } else {
                    // Revert on failure (e.g. maxVotes reached)
                    setUserVote(null);
                    showToast(result.message || 'Vote failed');
                }
            } catch (error) {
                console.error("Vote failed", error);
                setUserVote(null);
                showToast("Failed to cast vote");
            } finally {
                if (setGlobalLoading) setGlobalLoading(false);
            }
        }
    };



    const handleShare = async () => {
        const shareData = {
            title: 'Check out this poll on PollVerse!',
            text: poll.question,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(shareData.url);
                showToast('Link copied to clipboard!');
            }
        } catch (err) {
            console.error("Couldn't share poll", err);
        }
    };

    // Drag and Drop Handlers for Ranking
    const handleDragStart = (_e: React.DragEvent, position: number) => { dragItem.current = position; };
    const handleDragEnter = (_e: React.DragEvent, position: number) => { dragOverItem.current = position; };
    const handleDrop = () => {
        if (isPollClosed) return;
        if (dragItem.current === null || dragOverItem.current === null) return;
        const copyListItems = [...rankedItems];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setRankedItems(copyListItems);
        triggerHaptic();
    };

    // Time Remaining formatting
    const getTimeRemaining = () => {
        if (!poll.expiresAt) return null;
        const diff = poll.expiresAt.getTime() - new Date().getTime();
        if (diff <= 0) return "Expired";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `Expires in ${days}d ${hours}h`;
    };

    const renderPollContent = () => {
        const isDisabled = !!userVote || !!isPollClosed || !!readOnly;

        switch (poll.pollType) {
            case 'petition':
                const signatureCount = Math.max(0, getTotalVotes(poll.votes));
                const goal = Math.max(1, poll.goal_threshold || 100);
                const progress = Math.min((signatureCount / goal) * 100, 100);
                const isGoalReached = signatureCount >= goal;

                return (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{signatureCount}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Signatures</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-bold ${isGoalReached ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                    {isGoalReached ? 'Goal Reached!' : `${goal} needed`}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${isGoalReached ? 'bg-green-500' : 'bg-blue-600'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <button
                            onClick={(e) => handleShowInteractors(e, 'vote')}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <span> View Signature Wall</span>
                            <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                        </button>

                        {!userVote ? (
                            <button
                                onClick={() => handleVote('signed')} // Use a distinct key or just 'signed'
                                disabled={isDisabled}
                                className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2 
                                    ${isDisabled ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                <span>Sign Petition</span>
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-bold text-center border border-green-200 dark:border-green-800 flex items-center justify-center space-x-2">
                                <ShieldCheck className="w-5 h-5" />
                                <span>You Signed!</span>
                            </div>
                        )}
                        {isGoalReached && !userVote && (
                            <p className="text-center text-xs font-bold text-green-600 animate-pulse">Campaign Goal Reached!</p>
                        )}
                    </div>
                );

            case 'swipe':
                if (isPollClosed && !userVote) {
                    return (
                        <div className="h-64 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500">
                            <span className="text-3xl mb-2">🔒</span>
                            <p className="font-bold">Poll Ended</p>
                        </div>
                    );
                }
                return (
                    <SwipePoll
                        poll={poll}
                        readOnly={readOnly}
                        onVoteComplete={async () => {
                            if (isLoggedIn) {
                                try {
                                    const PollService = (await import('../../services/PollService')).PollService;
                                    const result = await PollService.vote(Number(poll.id), Number(currentUser.id), 'completed');
                                    onVote(poll.id, result.pointsEarned || 10);
                                } catch (e) {
                                    onVote(poll.id, 10);
                                }
                            } else {
                                onVote(poll.id, 10);
                            }
                            if (onVoteComplete) onVoteComplete();
                        }}
                    />
                );
            case 'survey':
                // Multi-page survey Participation Card
                return (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                            {poll.category ? `${poll.category} Survey` : 'Survey'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
                            {poll.question}
                        </p>

                        <button
                            onClick={() => onNavigate('survey', poll)}
                            disabled={isPollClosed}
                            className={`w-full py-3 px-6 rounded-lg font-bold text-lg shadow-lg transition-transform active:scale-95 ${isPollClosed
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-800 dark:bg-blue-700 text-white hover:bg-blue-900'
                                }`}
                        >
                            {isPollClosed ? 'Survey Ended' : 'Participate'}
                        </button>
                        {poll.expiresAt && (
                            <p className="text-xs text-gray-400 mt-3">{getTimeRemaining()}</p>
                        )}
                    </div>
                );
            case 'image':
                return (
                    <div className="relative flex justify-center items-center h-full group">
                        <span className="absolute text-5xl font-black text-gray-200 dark:text-gray-700 z-0">VS</span>
                        {poll.options.map((opt, i) => (
                            <div key={opt.id} className={`relative w-1/2 mx-2 flex-shrink-0 transition-all duration-500 ease-out ${i === 0 ? 'group-hover:rotate-[-2deg]' : 'group-hover:rotate-[2deg]'} group-hover:scale-105 ${userVote ? (userVote === opt.id ? 'scale-105 z-10' : 'scale-95 opacity-60') : ''}`}>
                                <button onClick={() => handleVote(opt.id)} className={`w-full rounded-xl overflow-hidden border-4 transition-all duration-300 shadow-lg ${userVote === opt.id ? 'border-blue-500' : 'border-transparent'} ${isDisabled ? 'cursor-not-allowed opacity-80' : ''}`} disabled={isDisabled}>
                                    <SvgPlaceholder w={400} h={600} text={opt.text} bgColor={i === 0 ? '#020617' : '#1e293b'} textColor="#93c5fd" />
                                </button>
                            </div>
                        ))}
                    </div>
                );
            case 'ranking':
                return (
                    <div className="px-2">
                        {!userVote ? rankedItems.map((item, index) => (
                            <div key={item.id} draggable={!isPollClosed && !readOnly} onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDrop} onDragOver={(e) => e.preventDefault()}
                                className={`flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-3 my-2 rounded-lg border border-gray-200 dark:border-gray-600 ${isPollClosed || readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-grab active:cursor-grabbing'}`}>
                                <span className="font-bold text-gray-400">{index + 1}</span>
                                <MenuIcon />
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.text}</span>
                            </div>
                        )) : rankedItems.map((item, index) => (
                            <div key={item.id} className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/30 p-3 my-2 rounded-lg border border-blue-200 dark:border-blue-800">
                                <span className="font-bold text-blue-500">{index + 1}</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.text}</span>
                            </div>
                        ))}
                        {!userVote && <button onClick={() => handleVote('ranked')} disabled={isDisabled} className={`w-full mt-3 p-3 bg-blue-600 text-white font-bold rounded-lg transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>Submit Rank</button>}
                    </div>
                );
            case 'slider':
                return (
                    <div className="px-4 py-6">
                        <input type="range" min={0} max={100} value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} disabled={isDisabled} className={`w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none accent-blue-600 dark:accent-blue-500 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>{poll.options[0].text}</span>
                            <span>{poll.options[1].text}</span>
                        </div>
                        {userVote && <p className="text-center font-bold text-xl mt-4 text-blue-600 dark:text-blue-400">You voted: {sliderValue}</p>}
                        {!userVote && <button onClick={() => handleVote(sliderValue)} disabled={isDisabled} className={`w-full mt-6 p-3 bg-blue-600 text-white font-bold rounded-lg transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>Submit Rating</button>}
                    </div>
                );
            default: // multiple_choice and binary
                return (
                    <div className="px-2">{poll.options.map(option => {
                        let borderClass = "border-gray-200 dark:border-gray-600";
                        let bgClass = "bg-white dark:bg-gray-700";

                        if (userVote) {
                            if (userVote === option.id) {
                                borderClass = "border-blue-500";
                                bgClass = "bg-blue-50 dark:bg-blue-900/30";
                            }
                        }

                        return (
                            <button key={option.id} onClick={() => handleVote(option.id)} className={`relative w-full text-left p-3 my-2 border rounded-lg transition-all duration-300 overflow-hidden ${borderClass} ${bgClass} ${!userVote && !isDisabled ? "hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600" : ""} ${isDisabled && userVote !== option.id ? "opacity-60 cursor-not-allowed" : ""}`} disabled={isDisabled}>
                                <div className="absolute top-0 left-0 h-full bg-blue-100 dark:bg-blue-500/30 transition-all duration-500 ease-out" style={{ width: (userVote || isPollClosed) ? `${(poll.votes[option.id] / getTotalVotes(poll.votes) * 100)}%` : '0%' }}></div>
                                <div className="relative z-10 flex justify-between items-center">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-[15px]">{option.text}</span>
                                    {(userVote || isPollClosed) && <span className="font-bold text-[13px] text-blue-600 dark:text-blue-400">{((poll.votes[option.id] / getTotalVotes(poll.votes)) * 100 || 0).toFixed(0)}%</span>}
                                </div>
                            </button>
                        )
                    })}</div>
                );
        }
    };

    return (
        <div id={`poll-${poll.id}`} className="h-full w-full snap-start relative bg-white dark:bg-black flex flex-col md:rounded-2xl md:border md:border-gray-100 md:dark:border-gray-800 md:shadow-md md:overflow-hidden md:hover:shadow-xl transition-all duration-300">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10">
                <button onClick={() => onNavigate('profile', poll.creator)} className="flex items-center space-x-3 text-left group">
                    <div className="relative">
                        <img src={poll.creator?.avatar || `https://i.pravatar.cc/150?u=${poll.creatorId || 1}`} alt={poll.creator?.username || 'User'} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-800" />
                        {poll.creator?.rank && poll.creator.rank <= 3 && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-[8px] px-1 rounded-full border border-white dark:border-black font-bold">
                                #{poll.creator.rank}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-none group-hover:text-blue-600 transition-colors">{poll.creator?.username || 'PollVerse User'}</span>
                        <span className="text-[10px] text-gray-500 font-medium mt-0.5">{poll.category || 'General'}</span>
                    </div>
                </button>
                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {poll.status && poll.status !== 'PUBLISHED' && (
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${poll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            poll.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {poll.status}
                        </div>
                    )}
                    {isPollClosed && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold uppercase">
                            {isTimeExpired ? 'Expired' : 'Ended'}
                        </span>
                    )}
                    <button className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <MenuIcon />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow relative overflow-y-auto px-5 py-4 scrollbar-hide flex flex-col justify-center min-h-[140px]">
                {/* Question */}
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight tracking-tight text-left">
                    {poll.question}
                </h2>

                {/* Description */}
                {poll.description && (
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                        {showFullDescription ? poll.description : (
                            <>
                                {poll.description.slice(0, 100)}
                                {poll.description.length > 100 && <span className="text-gray-400">... <button onClick={() => setShowFullDescription(true)} className="text-blue-600 font-medium hover:underline">more</button></span>}
                            </>
                        )}
                    </p>
                )}

                {/* Poll Interactive Area */}
                <div className="w-full">
                    {renderPollContent()}
                </div>

                {/* Tags */}
                {poll.tags && poll.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                        {poll.tags.map((tag, i) => (
                            <span key={i} className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">#{tag}</span>
                        ))}
                    </div>
                )}
            </main>

            {/* Action Bar (Footer) */}
            <footer className="flex-shrink-0 px-4 py-3 bg-white dark:bg-black border-t border-gray-50 dark:border-gray-900">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <button
                            onClick={() => handleInteract('like')}
                            className={`flex flex-col items-center gap-1 group ${interaction === 'like' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <div className={`p-2 rounded-full group-active:scale-90 transition-all ${interaction === 'like' ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}>
                                <ThumbUpIcon active={interaction === 'like'} />
                            </div>
                            <span
                                onClick={(e) => { e.stopPropagation(); handleShowInteractors(e, 'like'); }}
                                className="text-xs font-bold hover:underline cursor-pointer"
                            >
                                {likesCount}
                            </span>
                        </button>

                        <button
                            onClick={() => handleInteract('dislike')}
                            className={`flex flex-col items-center gap-1 group ${interaction === 'dislike' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <div className={`p-2 rounded-full group-active:scale-90 transition-all ${interaction === 'dislike' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                                <ThumbDownIcon active={interaction === 'dislike'} />
                            </div>
                            <span
                                onClick={(e) => { e.stopPropagation(); handleShowInteractors(e, 'dislike'); }}
                                className="text-xs font-bold hover:underline cursor-pointer"
                            >
                                {dislikesCount}
                            </span>
                        </button>

                        <button
                            onClick={() => onNavigate('comments', poll)}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors group"
                        >
                            <div className="p-2 rounded-full group-active:scale-90 transition-transform">
                                <ChatIcon />
                            </div>
                            <span className="text-xs font-bold">{poll.commentsCount ?? poll.comments?.length ?? 0}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={handleShare} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-900 rounded-full">
                            <ShareIcon />
                        </button>
                        {poll.pollType !== 'swipe' && (
                            <button onClick={() => onNavigate('results', poll)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full text-[13px] font-bold shadow-lg active:scale-95 transition-transform whitespace-nowrap">
                                <ChartBarIcon className="w-4 h-4" />
                                <span>Results</span>
                            </button>
                        )}
                    </div>
                </div>
            </footer>

            {/* Full Description Modal - Moved Outside Main for clean overlay */}
            {
                showFullDescription && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in rounded-2xl" onClick={() => setShowFullDescription(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-8 max-w-sm shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">{poll.question}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{poll.description}</p>
                            <button onClick={() => setShowFullDescription(false)} className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold">Close</button>
                        </div>
                    </div>
                )
            }
            {/* Interactors Modal */}
            {
                interactorsModal && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in p-2 rounded-2xl" onClick={() => setInteractorsModal(null)}>
                        <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[70%] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-bold capitalize">
                                    {interactorsModal.type === 'vote' ? 'Signatures' : `Users who ${interactorsModal.type}d`}
                                </h3>
                                <button onClick={() => setInteractorsModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><XIcon /></button>
                            </div>
                            <div className="flex-grow overflow-y-auto p-2">
                                {isLoadingInteractors ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : interactorsModal.users.length > 0 ? (
                                    <div className="space-y-1">
                                        {interactorsModal.users.map(u => (
                                            <div
                                                key={u.id}
                                                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                                                onClick={() => {
                                                    onNavigate('profile', u);
                                                    setInteractorsModal(null);
                                                }}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full border border-gray-100 dark:border-gray-800" />
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{u.username}</p>
                                                        <p className="text-[10px] text-gray-500">{u.points} Points</p>
                                                    </div>
                                                </div>
                                                <span className="rotate-180 text-gray-400 scale-75"><ChevronLeftIcon /></span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <p className="text-gray-500 text-sm">No {interactorsModal.type === 'vote' ? 'signatures' : interactorsModal.type + 's'} yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Moderation Modal */}
            {
                showModeration && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 rounded-2xl animate-fade-in" onClick={() => setShowModeration(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-5 max-h-[85%] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold dark:text-gray-100">Content Status</h3>
                                <button onClick={() => setShowModeration(false)}><XIcon /></button>
                            </div>

                            <div className={`p-2 rounded-lg text-center font-bold mb-4 text-sm ${poll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                poll.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    poll.status === 'CHANGES_REQUESTED' ? 'bg-orange-100 text-orange-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {poll.status || 'PUBLISHED'}
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">History</h4>
                                <ModerationTimeline pollId={poll.id} />
                            </div>

                            {isModerator && poll.status === 'PENDING' && (
                                <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="font-semibold text-sm">Moderator Actions</h4>
                                    <div className="flex gap-2">
                                        <button onClick={async () => {
                                            if (confirm('Approve this content?')) {
                                                if (setGlobalLoading) setGlobalLoading(true);
                                                try {
                                                    const PollService = (await import('../../services/PollService')).PollService;
                                                    await PollService.moderatePoll(Number(poll.id), Number(currentUser.id), 'APPROVE');
                                                    setShowModeration(false);
                                                    showToast('Approved!');
                                                } catch (e) {
                                                    console.error(e);
                                                    showToast('Failed to approve');
                                                } finally {
                                                    if (setGlobalLoading) setGlobalLoading(false);
                                                }
                                            }
                                        }} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm transition-colors">Approve</button>

                                        <button onClick={async () => {
                                            const reason = prompt('Reason for rejection:');
                                            if (reason) {
                                                if (setGlobalLoading) setGlobalLoading(true);
                                                try {
                                                    const PollService = (await import('../../services/PollService')).PollService;
                                                    await PollService.moderatePoll(Number(poll.id), Number(currentUser.id), 'REJECT', reason);
                                                    setShowModeration(false);
                                                    showToast('Content Rejected');
                                                } catch (e) {
                                                    console.error(e);
                                                    showToast('Failed to reject');
                                                } finally {
                                                    if (setGlobalLoading) setGlobalLoading(false);
                                                }
                                            }
                                        }} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-sm transition-colors">Reject</button>
                                    </div>
                                    <button onClick={async () => {
                                        const changes = prompt('What needs to be changed?');
                                        if (changes) {
                                            if (setGlobalLoading) setGlobalLoading(true);
                                            try {
                                                const PollService = (await import('../../services/PollService')).PollService;
                                                await PollService.moderatePoll(Number(poll.id), Number(currentUser.id), 'REQUEST_CHANGES', changes);
                                                setShowModeration(false);
                                                showToast('Changes Requested');
                                            } catch (e) {
                                                console.error(e);
                                                showToast('Failed to request changes');
                                            } finally {
                                                if (setGlobalLoading) setGlobalLoading(false);
                                            }
                                        }
                                    }} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold text-sm transition-colors">Request Changes</button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >

    );
};

export default PollCard;
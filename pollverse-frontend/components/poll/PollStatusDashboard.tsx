import React, { useState, useEffect } from 'react';
import { Poll, User } from '../../types';
import PollCard from './PollCard';
import { ShieldCheck, ShieldAlert, FileEdit, Clock, ChevronLeftIcon } from '../Icons';

interface PollStatusDashboardProps {
    polls: Poll[];
    currentUser: User;
    onNavigate: (name: string, data?: any) => void;
    onBack?: () => void;
}

const PollStatusDashboard: React.FC<PollStatusDashboardProps> = ({ polls, currentUser, onNavigate, onBack }) => {
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(polls.length > 0 ? polls[0] : null);

    useEffect(() => {
        if (polls.length > 0 && !selectedPoll) {
            setSelectedPoll(polls[0]);
        }
    }, [polls, selectedPoll]);

    if (!selectedPoll) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Clock className="w-12 h-12 mb-2 opacity-50" />
                <p>No polls in review status.</p>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
            case 'APPROVE':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                    border: 'border-emerald-200 dark:border-emerald-800/30',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    iconBg: 'bg-emerald-100 dark:bg-emerald-800/20',
                    icon: <ShieldCheck className="w-6 h-6" />
                };
            case 'REJECTED':
            case 'REJECT':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/10',
                    border: 'border-red-200 dark:border-red-800/30',
                    text: 'text-red-700 dark:text-red-300',
                    iconBg: 'bg-red-100 dark:bg-red-800/20',
                    icon: <ShieldAlert className="w-6 h-6" />
                };
            case 'CHANGES_REQUESTED':
            case 'REQUEST_CHANGES':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/10',
                    border: 'border-blue-200 dark:border-blue-800/30',
                    text: 'text-blue-700 dark:text-blue-300',
                    iconBg: 'bg-blue-100 dark:bg-blue-800/20',
                    icon: <FileEdit className="w-6 h-6" />
                };
            case 'RESUBMITTED': // Log action
                return {
                    bg: 'bg-indigo-50 dark:bg-indigo-900/10',
                    border: 'border-indigo-200 dark:border-indigo-800/30',
                    text: 'text-indigo-700 dark:text-indigo-300',
                    iconBg: 'bg-indigo-100 dark:bg-indigo-800/20',
                    icon: <FileEdit className="w-6 h-6" />
                };
            default: // PENDING
                return {
                    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
                    border: 'border-yellow-200 dark:border-yellow-800/30',
                    text: 'text-yellow-700 dark:text-yellow-300',
                    iconBg: 'bg-yellow-100 dark:bg-yellow-800/20',
                    icon: <Clock className="w-6 h-6" />
                };
        }
    };

    const renderTimeline = () => {
        const logs = [...(selectedPoll.moderationLogs || [])].reverse();
        const currentStyle = getStatusStyle(selectedPoll.status);

        const getTitleAndDesc = (status: string) => {
            switch (status) {
                case 'PUBLISHED': return { title: 'Live on feed', desc: 'Your poll is active and collecting votes.' };
                case 'REJECTED': return { title: 'Not approved', desc: 'Needs changes to meet guidelines.' };
                case 'CHANGES_REQUESTED': return { title: 'Changes requested', desc: 'Please update your poll based on the feedback.' };
                case 'PENDING': return { title: 'Under review', desc: "We're taking a look to ensure everything meets our guidelines." };
                default: return { title: 'Under review', desc: '' };
            }
        };

        const { title: currentTitle, desc: currentDesc } = getTitleAndDesc(selectedPoll.status);

        return (
            <div className="space-y-6 my-8">
                {/* Current Status Card */}
                <div className={`p-5 rounded-[16px] ${currentStyle.bg} border-2 ${currentStyle.border} shadow-sm animate-fade-in-up transition-all hover:shadow-md`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl ${currentStyle.iconBg} ${currentStyle.text}`}>
                                {currentStyle.icon}
                            </div>
                            <h3 className={`font-semibold text-lg ${currentStyle.text}`}>
                                {currentTitle}
                            </h3>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                            {new Date(selectedPoll.updatedAt || selectedPoll.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="pl-[52px]">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                            {currentDesc}
                        </p>

                        {selectedPoll.status === 'CHANGES_REQUESTED' && (
                            <button
                                onClick={() => onNavigate('addPoll', selectedPoll)}
                                className="mt-2 w-fit px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm hover:shadow"
                            >
                                <FileEdit className="w-4 h-4" />
                                <span>Please edit the highlighted section</span>
                            </button>
                        )}
                        {selectedPoll.status === 'REJECTED' && (
                            <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg text-xs text-gray-500 italic border border-gray-100 dark:border-gray-800">
                                Check our community guidelines for more info.
                            </div>
                        )}
                    </div>
                </div>

                {/* Log History Stacked below */}
                {logs.map((log) => {
                    const style = getStatusStyle(log.action);
                    let logTitle = '';
                    let logDesc = '';

                    switch (log.action) {
                        case 'APPROVE': logTitle = 'Approved'; logDesc = `Reviewed by ${log.moderator?.username || 'Moderator'}`; break;
                        case 'REJECT': logTitle = 'Not approved'; logDesc = `Reviewed by ${log.moderator?.username || 'Moderator'}`; break;
                        case 'REQUEST_CHANGES': logTitle = 'Changes requested'; logDesc = `Reviewed by ${log.moderator?.username || 'Moderator'}`; break;
                        case 'RESUBMITTED': logTitle = 'You sent an updated version'; logDesc = 'New version sent for review.'; break;
                        default: logTitle = 'Update'; logDesc = '';
                    }

                    return (
                        <div key={log.id} className={`p-5 rounded-[16px] bg-gray-50 dark:bg-gray-800/40 border-2 border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 transition-colors`}>
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500`}>
                                        {style.icon}
                                    </div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                                        {logTitle}
                                    </h4>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="pl-[52px]">
                                <p className="text-sm text-gray-500 mb-2">{logDesc}</p>
                                {log.comment && (
                                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 italic">
                                        "{log.comment}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Creation Node */}
                <div className="p-5 rounded-[16px] bg-gray-50/50 dark:bg-gray-900/20 border-2 border-gray-100/50 dark:border-gray-800/30 opacity-70">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h4 className="font-semibold text-gray-600 dark:text-gray-400">Poll created</h4>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(selectedPoll.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-white dark:bg-black">
            {/* Left Column: Timeline & List (60%) */}
            <div className="w-full md:w-3/5 flex flex-col h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black relative z-10">
                {/* Glassmorphism Header */}
                <div className="sticky top-0 z-20 px-6 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center">
                    {onBack && (
                        <button onClick={onBack} className="mr-4 p-2 -ml-2 text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ChevronLeftIcon />
                        </button>
                    )}
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 flex-grow">
                        Status Dashboard
                    </h2>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500">
                        {polls.length} Active
                    </span>
                </div>

                <div className="flex-grow overflow-y-auto p-6 scrollbar-hide">
                    {/* Poll Selector if multiple */}
                    {polls.length > 1 && (
                        <div className="flex space-x-3 mb-8 overflow-x-auto py-2 no-scrollbar">
                            {polls.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPoll(p)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${selectedPoll.id === p.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="truncate max-w-[100px] block">{p.question}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="max-w-xl mx-auto md:mx-0">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-2">
                            {selectedPoll.question}
                        </h1>
                        <div className="flex items-center space-x-2 mb-8">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Timeline</span>
                        </div>

                        {renderTimeline()}
                    </div>
                </div>
            </div>

            {/* Right Column: Sticky Preview (40%) */}
            <div className="hidden md:flex w-2/5 bg-gray-50 dark:bg-gray-900 items-center justify-center p-8 sticky top-0 h-full">
                {/* Handset Frame */}
                <div className="relative w-[360px] h-[720px] bg-black rounded-[3rem] shadow-2xl border-4 border-gray-800 overflow-hidden ring-4 ring-gray-200 dark:ring-gray-800 transform scale-90 lg:scale-100 transition-transform">
                    {/* Notch/Dynamic Island */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>

                    {/* Screen Content */}
                    <div className="w-full h-full bg-white dark:bg-gray-950 overflow-y-auto no-scrollbar pt-8">
                        <div className="pointer-events-none">
                            <PollCard
                                poll={selectedPoll}
                                currentUser={currentUser}
                                isLoggedIn={true}
                                onNavigate={() => { }}
                                onVote={() => { }}
                                requireLogin={() => { }}
                                showToast={() => { }}
                                readOnly={true}
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview</p>
                </div>
            </div>
        </div>
    );
};

export default PollStatusDashboard;

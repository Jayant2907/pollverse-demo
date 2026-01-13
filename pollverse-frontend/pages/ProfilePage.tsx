import React, { useState, useEffect } from 'react';
import { User, Poll } from '../types';
import { ChevronLeftIcon, CogIcon, LogoutIcon, XIcon, FileEdit } from '../components/Icons';
import { UserService } from '../services/UserService';
import { PollService } from '../services/PollService';
import PollStatusDashboard from '../components/poll/PollStatusDashboard';

interface ProfilePageProps {
    user: User;
    onBack: () => void;
    onNavigate: (name: string, data?: any) => void;
    onLogout: () => void;
    currentUser: User;
    onToggleFollow: (userId: string | number) => void;
    allPolls: Poll[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onNavigate, onLogout, currentUser, onToggleFollow, allPolls }) => {
    const [activeTab, setActiveTab] = useState<'created' | 'voted' | 'status' | 'drafts'>('created');
    const [statusPolls, setStatusPolls] = useState<Poll[]>([]);
    const [draftsPolls, setDraftsPolls] = useState<Poll[]>([]);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [selectedPollForStatus, setSelectedPollForStatus] = useState<Poll | null>(null);

    const isMainUser = currentUser && (String(user.id) === String(currentUser.id));
    const displayUser = isMainUser ? currentUser : user;
    const isFollowing = currentUser.following.some(id => String(id) === String(user.id));

    const userPolls = allPolls.filter(p => p.creator?.id === displayUser.id);
    const votedPolls = allPolls.filter(p => currentUser.pollsVotedOn.some(id => String(id) === String(p.id)));

    // Level Calculation
    const points = displayUser.points || 0;
    const getLevel = (pts: number) => {
        if (pts < 1000) return 1 + Math.floor(pts / 111);
        return 10 + Math.floor((pts - 1000) / 225);
    };
    const level = getLevel(points);
    const nextLevelPoints = level < 10 ? level * 111 : 1000 + (level - 9) * 225;
    const prevLevelPoints = level === 1 ? 0 : (level < 11 ? (level - 1) * 111 : 1000 + (level - 10) * 225);
    const progress = Math.min(100, Math.max(0, ((points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100));

    const [modalMode, setModalMode] = useState<'followers' | 'following' | null>(null);
    const [modalUsers, setModalUsers] = useState<User[]>([]);
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    useEffect(() => {
        if (modalMode) {
            setIsLoadingModal(true);
            const fetchUsers = modalMode === 'followers'
                ? UserService.getFollowers(Number(displayUser.id))
                : UserService.getFollowing(Number(displayUser.id));

            fetchUsers.then(users => {
                setModalUsers(users);
                setIsLoadingModal(false);
            }).catch(e => {
                console.error(`Failed to fetch ${modalMode}`, e);
                setIsLoadingModal(false);
            });
        }
    }, [modalMode, user.id]);

    useEffect(() => {
        if (isMainUser) {
            setIsLoadingStatus(true);
            PollService.getFeed({ creatorId: Number(currentUser.id), userId: Number(currentUser.id) })
                .then(data => {
                    const now = new Date();
                    const nonPublishedOrScheduled = data.filter(p => {
                        const isPublished = p.status === 'PUBLISHED';
                        const isScheduledFuture = isPublished && p.scheduledAt && new Date(p.scheduledAt) > now;
                        return (p.status !== 'PUBLISHED' && p.status !== 'DRAFT') || isScheduledFuture;
                    });
                    setStatusPolls(nonPublishedOrScheduled);

                    PollService.getFeed({ category: 'Drafts', creatorId: Number(currentUser.id), userId: Number(currentUser.id) })
                        .then(drafts => setDraftsPolls(drafts));

                    setIsLoadingStatus(false);
                });
        }
    }, [isMainUser, currentUser.id]);

    const handlePollClick = (poll: Poll) => {
        onNavigate('feed', { targetPollId: poll.id });
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in relative overflow-hidden">
            <header className="flex-shrink-0 flex items-center p-4 justify-between z-20 relative bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronLeftIcon /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm font-black tracking-tight uppercase text-gray-400">User Profile</h1>
                </div>
                {isMainUser ? (
                    <button onClick={() => onNavigate('settings')} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><CogIcon /></button>
                ) : <div className="w-10 h-10"></div>}
            </header>

            <div className="flex-grow overflow-y-auto z-10 relative scrollbar-hide pb-32">
                {/* Visual Header Banner */}
                <div className="w-full h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Profile Section */}
                <div className="px-6 relative">
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="relative">
                            <div className="p-1 rounded-full bg-white dark:bg-black shadow-xl">
                                <img src={displayUser.avatar} alt={displayUser.username} className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-black" />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white dark:border-black shadow-lg">
                                LVL {level}
                            </div>
                        </div>

                        <div className="flex gap-2 mb-2">
                            {isMainUser ? (
                                <button
                                    onClick={() => onNavigate('editProfile')}
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-gray-200 dark:border-gray-700"
                                >
                                    <FileEdit className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => onToggleFollow(displayUser.id)}
                                    className={`px-6 py-2 rounded-xl font-black text-xs transition-all transform active:scale-95 shadow-md ${isFollowing
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                        : 'bg-blue-600 text-white'
                                        }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{displayUser.username}</h2>
                            {displayUser.profession && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest">{displayUser.profession}</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 font-bold">@{displayUser.username.toLowerCase().replace(/\s/g, '')}</p>
                    </div>

                    {/* Bio Section */}
                    {displayUser.bio ? (
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                            {displayUser.bio}
                        </p>
                    ) : isMainUser && (
                        <p className="mt-4 text-sm text-gray-400 italic">Add a bio to tell people who you are.</p>
                    )}

                    {/* Info Pills (Location, Website, Date) */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[11px] font-bold text-gray-500">
                        {displayUser.location && (
                            <div className="flex items-center gap-1">
                                <span>📍</span>
                                <span className="uppercase tracking-wide">{displayUser.location}</span>
                            </div>
                        )}
                        {displayUser.website && (
                            <a href={displayUser.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                                <span>🔗</span>
                                <span className="uppercase tracking-wide">{displayUser.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                        )}
                    </div>

                    {/* Interests Tags */}
                    {(() => {
                        const interests = Array.isArray(displayUser.interests) ? displayUser.interests : (typeof displayUser.interests === 'string' ? (displayUser.interests as string).split(',').filter(i => !!i) : []);
                        if (interests.length === 0) return null;
                        return (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {interests.map(interest => (
                                    <span key={interest} className="text-[10px] font-black uppercase tracking-tighter bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                                        #{interest}
                                    </span>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Stats Section */}
                    <div className="flex gap-6 mt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{displayUser.points?.toLocaleString() || 0}</span>
                            <span className="text-[10px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">Points</span>
                        </div>
                        <button onClick={() => setModalMode('followers')} className="flex items-center gap-1.5 group">
                            <span className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{displayUser.followers?.length || 0}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Followers</span>
                        </button>
                        <button onClick={() => setModalMode('following')} className="flex items-center gap-1.5 group">
                            <span className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{displayUser.following?.length || 0}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Following</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-gray-900 dark:text-white">{displayUser.pollsCount || 0}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Polls</span>
                        </div>
                    </div>

                    {/* Level Progress (discreet) */}
                    <div className="mt-6 flex flex-col gap-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-blue-600 dark:text-blue-400">Level {level}</span>
                            <span className="text-gray-400">{Math.floor(progress)}% to Level {level + 1}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-8">
                    <div className="flex px-4 border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'created', label: 'Polls' },
                            { id: 'voted', label: 'Voted' },
                            { id: 'status', label: 'Status', show: isMainUser, count: statusPolls.length },
                            { id: 'drafts', label: 'Drafts', show: isMainUser, count: draftsPolls.length }
                        ].map(tab => (
                            (tab.show !== false) && (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-shrink-0 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </span>
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
                                </button>
                            )
                        ))}
                    </div>

                    <div className="p-4">
                        {activeTab === 'created' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userPolls.length > 0 ? userPolls.map(poll => (
                                    <div
                                        key={poll.id}
                                        onClick={() => handlePollClick(poll)}
                                        className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{poll.category}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Live</span>
                                        </div>
                                        <p className="font-black text-gray-900 dark:text-white leading-tight mb-2">{poll.question}</p>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase">
                                            <span>{Object.values(poll.votes || {}).reduce((a, b) => a + b, 0)} Votes</span>
                                            <span>•</span>
                                            <span>{poll.comments?.length || 0} Comments</span>
                                        </div>
                                    </div>
                                )) : <div className="col-span-full text-center py-16 text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">No polls yet</div>}
                            </div>
                        )}

                        {activeTab === 'voted' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {votedPolls.length > 0 ? votedPolls.map(poll => (
                                    <div
                                        key={poll.id}
                                        onClick={() => handlePollClick(poll)}
                                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all"
                                    >
                                        <p className="font-bold text-gray-900 dark:text-white leading-tight truncate">{poll.question}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Voted {timeAgo(new Date())}</p>
                                    </div>
                                )) : <div className="col-span-full text-center py-16 text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">No activity yet</div>}
                            </div>
                        )}

                        {activeTab === 'drafts' && (
                            <div className="space-y-4">
                                {draftsPolls.length > 0 ? draftsPolls.map(poll => (
                                    <div key={poll.id} className="bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:bg-gray-100 transition-all">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-400">Draft</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(poll.createdAt!).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-extrabold text-gray-900 dark:text-white mb-2">{poll.question}</h4>
                                        <button onClick={() => onNavigate('addPoll', poll)} className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group">
                                            Continue Editing <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </button>
                                    </div>
                                )) : <div className="text-center py-16 text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">No drafts</div>}
                            </div>
                        )}

                        {activeTab === 'status' && (
                            <div className="space-y-3">
                                {isLoadingStatus ? (
                                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                ) : statusPolls.length > 0 ? (
                                    statusPolls.map(poll => (
                                        <div key={poll.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-lg transition-all animate-fade-in-up">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border
                                                    ${poll.scheduledAt && new Date(poll.scheduledAt) > new Date() ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        poll.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                            poll.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                    {poll.scheduledAt && new Date(poll.scheduledAt) > new Date() ? 'Scheduled' :
                                                        poll.status === 'PENDING' ? 'In Review' : poll.status === 'REJECTED' ? 'Rejected' : 'Action Needed'}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold">{new Date(poll.createdAt!).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-black text-gray-900 dark:text-white mb-2">{poll.question}</h4>
                                            <button onClick={() => setSelectedPollForStatus(poll)} className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group">
                                                Track Timeline <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </button>
                                        </div>
                                    ))
                                ) : <div className="text-center py-16 text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">Clear of tasks</div>}
                            </div>
                        )}
                    </div>
                </div>

                {isMainUser && (
                    <div className="px-6 mt-12 mb-8">
                        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-100 transition-colors uppercase tracking-widest text-[10px]">
                            <LogoutIcon />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Successor Modals and Popups */}
            {selectedPollForStatus && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-black animate-slide-up">
                    <PollStatusDashboard
                        polls={[selectedPollForStatus!]}
                        currentUser={currentUser}
                        onNavigate={onNavigate}
                        onBack={() => setSelectedPollForStatus(null)}
                    />
                </div>
            )}

            {modalMode && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center animate-fade-in p-0 sm:p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[85%] overflow-hidden animate-slide-up relative">
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-black uppercase tracking-tight">{modalMode}</h3>
                            <button onClick={() => setModalMode(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"><XIcon /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-2">
                            {isLoadingModal ? (
                                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                            ) : modalUsers.length > 0 ? (
                                modalUsers.map(u => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all cursor-pointer group"
                                        onClick={() => {
                                            onNavigate('profile', u);
                                            setModalMode(null);
                                        }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-black shadow-md" />
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white leading-none mb-1">{u.username}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{u.points} Points</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <span className="rotate-180 block"><ChevronLeftIcon className="w-4 h-4" /></span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-16">
                                    <span className="text-4xl grayscale opacity-50">👤</span>
                                    <p className="text-sm font-bold text-gray-400 uppercase mt-4">Empty list</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for relative time
function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    return date.toLocaleDateString();
}

export default ProfilePage;
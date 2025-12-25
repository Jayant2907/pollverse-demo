import React, { useState, useEffect } from 'react';
import { User, Poll } from '../types';
import { ChevronLeftIcon, CogIcon, LogoutIcon, XIcon } from '../components/Icons';
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
    const [activeTab, setActiveTab] = useState<'created' | 'voted' | 'status'>('created');
    const [statusPolls, setStatusPolls] = useState<Poll[]>([]);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [selectedPollForStatus, setSelectedPollForStatus] = useState<Poll | null>(null);

    const isMainUser = user.id === currentUser.id;
    const isFollowing = currentUser.following.some(id => String(id) === String(user.id));

    const userPolls = allPolls.filter(p => p.creator?.id === user.id);
    const votedPolls = allPolls.filter(p => currentUser.pollsVotedOn.some(id => String(id) === String(p.id)));

    // Level Calculation
    const points = user.points || 0;
    const getLevel = (pts: number) => {
        if (pts < 1000) return 1 + Math.floor(pts / 111);
        return 10 + Math.floor((pts - 1000) / 225);
    };
    const level = getLevel(points);
    const nextLevelPoints = level < 10 ? level * 111 : 1000 + (level - 9) * 225; // Approx
    const prevLevelPoints = level === 1 ? 0 : (level < 11 ? (level - 1) * 111 : 1000 + (level - 10) * 225);
    const progress = Math.min(100, Math.max(0, ((points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100));

    const [modalMode, setModalMode] = useState<'followers' | 'following' | null>(null);
    const [modalUsers, setModalUsers] = useState<User[]>([]);
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    useEffect(() => {
        if (modalMode) {
            setIsLoadingModal(true);
            const fetchUsers = modalMode === 'followers'
                ? UserService.getFollowers(Number(user.id))
                : UserService.getFollowing(Number(user.id));

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
                    const nonPublished = data.filter(p => p.status !== 'PUBLISHED');
                    setStatusPolls(nonPublished);
                    setIsLoadingStatus(false);
                });
        }
    }, [isMainUser, currentUser.id]);

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in relative overflow-hidden">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800 justify-between">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
                {isMainUser ? (
                    <button onClick={() => onNavigate('settings')} className="text-gray-500 p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><CogIcon /></button>
                ) : <div className="w-10 h-10"></div>}
            </header>

            <div className="flex-grow overflow-y-auto">
                <div className="p-4 flex flex-col items-center text-center">
                    <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full border-4 border-white dark:border-black mb-4 shadow-lg object-cover" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.username}</h2>
                    {!isMainUser && (
                        <button
                            onClick={() => onToggleFollow(user.id)}
                            className={`mt-4 px-8 py-2 rounded-full font-bold transition-all transform active:scale-95 ${isFollowing
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                                }`}
                        >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                    <div className="mt-2 w-full max-w-xs">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                            <span>Lvl {level}</span>
                            <span>{Math.floor(progress)}%</span>
                            <span>Lvl {level + 1}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 py-3 px-2 rounded-xl w-full shadow-sm">
                        <div
                            onClick={() => isMainUser && onNavigate('pointsLedger')}
                            className={`text-center ${isMainUser ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors' : ''} p-1`}
                        >
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.points?.toLocaleString() || 0}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Points</p>
                        </div>
                        <div
                            onClick={() => onNavigate('userPolls', user)}
                            className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors p-1"
                        >
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{user.pollsCount || 0}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Polls</p>
                        </div>
                        <div
                            onClick={() => setModalMode('followers')}
                            className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors p-1"
                        >
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{user.followers?.length || 0}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Followers</p>
                        </div>
                        <div
                            onClick={() => setModalMode('following')}
                            className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors p-1"
                        >
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{user.following?.length || 0}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Following</p>
                        </div>
                    </div>
                </div>

                {isMainUser && <button onClick={() => onNavigate('editProfile')} className="mx-4 mb-2 p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold rounded-lg w-[calc(100%-32px)]">Edit Profile</button>}

                <div className="px-4">
                    <h3 className="text-md font-bold mb-2 text-gray-800 dark:text-gray-200">Badges</h3>
                    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 text-center"><span className="text-3xl">🏆</span><p className="text-xs font-semibold mt-1">Top 10%</p></div>
                        <div className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center"><span className="text-3xl">✍️</span><p className="text-xs font-semibold mt-1">Creator</p></div>
                        <div className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center"><span className="text-3xl">🗳️</span><p className="text-xs font-semibold mt-1">Voter</p></div>
                    </div>
                </div>

                <div className="mt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex">
                        <button onClick={() => setActiveTab('created')} className={`flex-1 p-3 font-semibold text-center transition-colors ${activeTab === 'created' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>Created</button>
                        <button onClick={() => setActiveTab('voted')} className={`flex-1 p-3 font-semibold text-center transition-colors ${activeTab === 'voted' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>Voted</button>
                        {isMainUser && (
                            <button onClick={() => setActiveTab('status')} className={`flex-1 p-3 font-semibold text-center transition-colors flex items-center justify-center space-x-1 ${activeTab === 'status' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                <span>Status</span>
                                {statusPolls.length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                                        {statusPolls.length}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>

                    <div className={activeTab === 'status' ? '' : 'p-4'}>
                        {activeTab === 'created' && (
                            <div className="grid grid-cols-2 gap-3">
                                {userPolls.length > 0 ? userPolls.map(poll => (<div key={poll.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"><p className="font-semibold truncate">{poll.question}</p></div>)) : <div className="col-span-2 text-center text-gray-400 p-8">{isMainUser ? "You haven't" : "This user hasn't"} created any polls yet.</div>}
                            </div>
                        )}
                        {activeTab === 'voted' && (
                            <div className="grid grid-cols-2 gap-3">
                                {votedPolls.length > 0 ? votedPolls.map(poll => (<div key={poll.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"><p className="font-semibold truncate">{poll.question}</p></div>)) : <div className="col-span-2 text-center text-gray-400 p-8">Voted polls will appear here.</div>}
                            </div>
                        )}
                        {activeTab === 'status' && (
                            <div className="space-y-3">
                                {isLoadingStatus ? (
                                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                ) : statusPolls.length > 0 ? (
                                    statusPolls.map(poll => (
                                        <div key={poll.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm relative overflow-hidden animate-fade-in-up">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded 
                                                    ${poll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        poll.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {poll.status === 'PENDING' ? 'In Review' : poll.status === 'REJECTED' ? 'Rejected' : 'Action Needed'}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-medium">{poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : ''}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{poll.question}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-1 mb-3">{poll.description || 'No description'}</p>
                                            <button
                                                onClick={() => setSelectedPollForStatus(poll)}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
                                            >
                                                View Timeline & Details <span className="ml-1">→</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 p-8">No polls in review status.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {selectedPollForStatus && (
                    <div className="fixed inset-0 z-[100] bg-white dark:bg-black animate-slide-up">
                        <PollStatusDashboard
                            polls={[selectedPollForStatus]}
                            currentUser={currentUser}
                            onNavigate={onNavigate}
                            onBack={() => setSelectedPollForStatus(null)}
                        />
                    </div>
                )}

                {isMainUser && (
                    <div className="p-4 mt-4">
                        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                            <LogoutIcon />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Followers/Following Modal */}
            {modalMode && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[80%] overflow-hidden animate-slide-up">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-bold capitalize">{modalMode}</h3>
                            <button onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><XIcon /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2">
                            {isLoadingModal ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : modalUsers.length > 0 ? (
                                <div className="space-y-1">
                                    {modalUsers.map(u => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                                            onClick={() => {
                                                onNavigate('profile', u);
                                                setModalMode(null);
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-800" />
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{u.username}</p>
                                                    <p className="text-xs text-gray-500">{u.points} Points</p>
                                                </div>
                                            </div>
                                            <span className="rotate-180 text-gray-400"><ChevronLeftIcon /></span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-12">
                                    <p className="text-gray-500">No {modalMode} yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
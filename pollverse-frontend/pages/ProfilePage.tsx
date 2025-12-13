import React, { useState } from 'react';
import { User, Poll } from '../types';
import { ChevronLeftIcon, CogIcon, LogoutIcon } from '../components/Icons';

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
    const [activeTab, setActiveTab] = useState<'created' | 'voted'>('created');
    const isMainUser = user.id === currentUser.id;
    const isFollowing = currentUser.following.includes(user.id);

    const userPolls = allPolls.filter(p => p.creator.id === user.id);
    const votedPolls = allPolls.filter(p => currentUser.pollsVotedOn.includes(p.id));

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800 justify-between">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
                {isMainUser ? (
                    <button onClick={() => onNavigate('settings')} className="text-gray-500 p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><CogIcon /></button>
                ) : <div className="w-10 h-10"></div>}
            </header>
            <div className="overflow-y-auto">
                <div className="p-4 flex flex-col items-center text-center">
                    <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full border-4 border-white dark:border-black mb-4 shadow-lg object-cover" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.username}</h2>
                    {!isMainUser && (
                        <button onClick={() => onToggleFollow(user.id)} className={`mt-4 px-6 py-2 rounded-full font-semibold transition-colors ${isFollowing ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-blue-600 text-white'}`}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                    <div className="flex space-x-6 mt-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 py-3 px-6 rounded-xl w-full justify-center shadow-sm">
                        <div className="text-center"><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{user.points?.toLocaleString() || 0}</p><p className="text-xs text-gray-500 dark:text-gray-400">Points</p></div>
                        <div className="text-center"><p className="text-xl font-bold text-gray-800 dark:text-gray-200">{userPolls.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Created</p></div>
                        <div className="text-center"><p className="text-xl font-bold text-gray-800 dark:text-gray-200">{isMainUser ? user.pollsVotedOn.length : user.pollsVotedOn.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Voted</p></div>
                    </div>
                </div>
                {isMainUser && <button onClick={() => onNavigate('editProfile')} className="mx-4 mb-2 p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold rounded-lg">Edit Profile</button>}
                <div className="px-4">
                    <h3 className="text-md font-bold mb-2 text-gray-800 dark:text-gray-200">Badges</h3>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                        <div className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 text-center"><span className="text-3xl">🏆</span><p className="text-xs font-semibold mt-1">Top 10%</p></div>
                        <div className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center"><span className="text-3xl">✍️</span><p className="text-xs font-semibold mt-1">Creator</p></div>
                        <div className="flex-shrink-0 w-24 flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center"><span className="text-3xl">🗳️</span><p className="text-xs font-semibold mt-1">Voter</p></div>
                    </div>
                </div>
                <div className="mt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex">
                        <button onClick={() => setActiveTab('created')} className={`w-1/2 p-3 font-semibold text-center transition-colors ${activeTab === 'created' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>Created</button>
                        <button onClick={() => setActiveTab('voted')} className={`w-1/2 p-3 font-semibold text-center transition-colors ${activeTab === 'voted' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>Voted</button>
                    </div>
                    <div className="p-4">
                        {activeTab === 'created' ? (
                            <div className="grid grid-cols-2 gap-3">
                                {userPolls.length > 0 ? userPolls.map(poll => (<div key={poll.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"><p className="font-semibold truncate">{poll.question}</p></div>)) : <div className="col-span-2 text-center text-gray-400 p-8">{isMainUser ? "You haven't" : "This user hasn't"} created any polls yet.</div>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {votedPolls.length > 0 ? votedPolls.map(poll => (<div key={poll.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"><p className="font-semibold truncate">{poll.question}</p></div>)) : <div className="col-span-2 text-center text-gray-400 p-8">Voted polls will appear here.</div>}
                            </div>
                        )}
                    </div>
                </div>
                 {isMainUser && (
                     <div className="p-4 mt-4">
                         <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                             <LogoutIcon />
                             <span>Logout</span>
                         </button>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default ProfilePage;
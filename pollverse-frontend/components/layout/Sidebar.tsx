import React from 'react';
import { HomeIcon, SearchIcon, BellIcon, UserIcon, PlusIcon, AppLogo, TrophyIcon, ShieldCheck } from '../Icons';

interface SidebarProps {
    page: string;
    onNavigate: (page: string, data?: any) => void;
    currentUser: any;
}

const Sidebar: React.FC<SidebarProps> = ({ page, onNavigate, currentUser }) => {
    const navItems = [
        { name: 'feed', label: 'Home', icon: HomeIcon },
        { name: 'explore', label: 'Explore', icon: SearchIcon },
        { name: 'notifications', label: 'Notifications', icon: BellIcon },
        { name: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon },
        { name: 'profile', label: 'Profile', icon: UserIcon },
    ];

    if ((currentUser?.rank || 999) <= 4) {
        navItems.push({ name: 'reviewQueue', label: 'Moderation', icon: ShieldCheck });
    }

    if (currentUser?.role === 'SUPER_ADMIN') {
        navItems.push({ name: 'admin', label: 'Command Center', icon: AppLogo });
    }

    return (
        <aside className="hidden md:flex flex-col w-[240px] h-screen sticky top-0 px-2 py-4 justify-between border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-black flex-shrink-0">
            <div className="flex flex-col items-start px-2">
                <div onClick={() => onNavigate('feed')} className="flex items-center gap-2 mb-4 px-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full py-1.5 transition-colors">
                    <AppLogo />
                    <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">PollVerse</span>
                </div>

                <nav className="flex flex-col gap-0.5 w-full">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => onNavigate(item.name, item.name === 'profile' ? currentUser : undefined)}
                            className={`flex items-center gap-4 px-4 py-2 rounded-full text-[15px] transition-all duration-200 group ${page === item.name
                                ? 'font-bold text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <div className="relative">
                                <item.icon active={page === item.name} />
                                {item.name === 'notifications' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                            </div>
                            <span>{item.label}</span>
                        </button>
                    ))}

                    <button
                        onClick={() => onNavigate('addPoll')}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Post Poll</span>
                    </button>
                </nav>
            </div>

            <div className="p-2">
                <button onClick={() => onNavigate('profile', currentUser)} className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors text-left group">
                    <img src={currentUser?.avatar || 'https://i.pravatar.cc/150'} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                    <div className="flex flex-col flex-grow">
                        <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600">{currentUser?.username || 'User'}</span>
                        <span className="text-gray-500 text-xs">@{currentUser?.username?.toLowerCase().replace(/\s/g, '') || 'user'}</span>
                    </div>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

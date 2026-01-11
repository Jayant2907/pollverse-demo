import React from 'react';
import { SearchIcon } from '../Icons';

interface RightPanelProps {
    onNavigate: (page: string) => void;
    trendingTags: string[];
    setSearchQuery: (query: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ onNavigate, trendingTags, setSearchQuery }) => {
    return (
        <aside className="hidden lg:flex flex-col w-[350px] h-screen sticky top-0 py-4 pr-6 pl-2 gap-4 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-black overflow-y-auto no-scrollbar">
            {/* Search Bar */}
            <div className="relative group focus-within:ring-2 ring-blue-500 rounded-full flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search PollVerse"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-transparent rounded-full leading-5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-blue-500 focus:text-gray-900 sm:text-sm transition-all"
                />
            </div>

            {/* Trending Card */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                <h3 className="font-extrabold text-lg mb-3 text-gray-900 dark:text-white px-2 uppercase tracking-tight">What's Happening</h3>
                <div className="flex flex-col gap-0">
                    {trendingTags.length > 0 ? (
                        trendingTags.map((tag, i) => (
                            <button
                                key={i}
                                onClick={() => setSearchQuery(tag)}
                                className="flex flex-col items-start hover:bg-gray-100 dark:hover:bg-gray-800 p-2.5 rounded-lg transition-colors text-left"
                            >
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trending</span>
                                <span className="font-bold text-[15px] text-gray-800 dark:text-gray-200">#{tag}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">1.2k Polls</span>
                            </button>
                        ))
                    ) : (
                        <p className="text-gray-500 p-2 text-xs">No trending topics right now.</p>
                    )}
                </div>
                <button className="w-full text-left p-2.5 text-blue-500 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mt-1">
                    Show more
                </button>
            </div>

            {/* Leaderboard Snippet */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                <h3 className="font-extrabold text-lg mb-3 text-gray-900 dark:text-white px-2 uppercase tracking-tight">Top Creators</h3>
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" onClick={() => onNavigate('leaderboard')}>
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                                {i}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white">PollMaster {i}</span>
                                <span className="text-xs text-gray-500">@{`master${i}`}</span>
                            </div>
                            <button className="ml-auto bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-80">
                                Follow
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <nav className="flex flex-wrap gap-x-4 gap-y-2 px-4 text-xs text-gray-400">
                <a href="#" className="hover:underline">Terms of Service</a>
                <a href="#" className="hover:underline">Privacy Policy</a>
                <a href="#" className="hover:underline">Cookie Policy</a>
                <a href="#" className="hover:underline">Accessibility</a>
                <a href="#" className="hover:underline">Ads info</a>
                <span>© 2026 PollVerse, Inc.</span>
            </nav>
        </aside>
    );
};

export default RightPanel;

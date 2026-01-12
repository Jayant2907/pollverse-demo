import React, { useState } from 'react';
import { SearchIcon, TrophyIcon, ChartBarIcon, HeartIcon } from '../components/Icons';
import { POLL_CATEGORIES } from '../constants';

interface ExplorePageProps {
    onNavigate: (page: string, data?: any) => void;
    setSearchQuery: (query: string) => void;
    trendingTags: string[];
}

const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate, setSearchQuery, trendingTags }) => {
    const [localQuery, setLocalQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (localQuery.trim()) {
            setSearchQuery(localQuery);
            onNavigate('feed');
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-black min-h-full">
            {/* Search Section */}
            <div className="p-4 sticky top-0 bg-white/90 dark:bg-black/95 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                    </div>
                    <input
                        type="text"
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder="Search topics, tags, or creators"
                        className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-2xl leading-5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-blue-500 focus:text-gray-900 sm:text-sm transition-all"
                    />
                </form>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-8">
                {/* Trending Tags Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ChartBarIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-extrabold text-xl tracking-tight">Trending Tags</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {trendingTags.map((tag, i) => (
                            <button
                                key={i}
                                onClick={() => { setSearchQuery(tag); onNavigate('feed'); }}
                                className="flex flex-col items-start p-4 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all text-left"
                            >
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Trending</span>
                                <span className="font-bold text-base text-gray-900 dark:text-white">#{tag}</span>
                                <span className="text-xs text-gray-400 mt-1">1.2k Polls</span>
                            </button>
                        ))}
                        {trendingTags.length === 0 && (
                            <p className="text-gray-500 text-sm col-span-2 text-center py-8">No trending tags right now.</p>
                        )}
                    </div>
                </section>

                {/* Popular Categories Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-extrabold text-xl tracking-tight">Browse Categories</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {POLL_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setSearchQuery(cat); onNavigate('feed'); }}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Quick Shortcuts */}
                <section className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-black text-2xl leading-none mb-2">Create a Poll</h3>
                            <p className="text-blue-100 text-sm mb-4">Share your thoughts with the world and earn points.</p>
                            <button
                                onClick={() => onNavigate('addPoll')}
                                className="bg-white text-blue-600 font-bold px-6 py-2.5 rounded-full text-sm shadow-lg active:scale-95 transition-all"
                            >
                                Get Started
                            </button>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <HeartIcon className="w-12 h-12" />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ExplorePage;

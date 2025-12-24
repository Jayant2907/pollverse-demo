import { useState, useEffect, useMemo, useRef } from 'react';
import { PollService } from './services/PollService';
import { UserService } from './services/UserService';
import { ThemeProvider } from './context/ThemeContext';
import { PageState, Poll, User } from './types';
import { MOCK_USER, CATEGORIES } from './constants';
import {
    HomeIcon, UserIcon, PlusIcon, SearchIcon, BellIcon, AppLogo, XIcon, DuplicateIcon
} from './components/Icons';
import PollCard from './components/poll/PollCard';
import PollCardSkeleton from './components/poll/PollCardSkeleton';
import Toast from './components/ui/Toast';
import Toggle from './components/ui/Toggle';

// Pages
import LoginPage from './pages/LoginPage';
import AddPollPage from './pages/AddPollPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import CommentsPage from './pages/CommentsPage';
import ResultsPage from './pages/ResultsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import SurveyPage from './pages/SurveyPage';
import UserPollsPage from './pages/UserPollsPage';
import AdminPage from './pages/AdminPage';

function App() {
    const [page, setPage] = useState<PageState>({ name: 'feed', data: null });
    const [activeCategory, setActiveCategory] = useState('For You');
    const [polls, setPolls] = useState<Poll[]>([]);
    const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginRedirectAction, setLoginRedirectAction] = useState<(() => void) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });

    // Auto Scroll State
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsLoading(true);
        PollService.getFeed().then(data => {
            setPolls(data);
            setIsLoading(false);
        });

        // Auto-login from localStorage
        const savedUser = localStorage.getItem('pollverse_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
                setIsLoggedIn(true);
            } catch (e) {
                console.error("Failed to parse saved user", e);
            }
        }
    }, []);

    const showToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 2000);
    };

    const requireLogin = (action: () => void) => {
        setLoginRedirectAction(() => action);
        setPage({ name: 'login' });
    };

    const handleLoginSuccess = (user?: any) => {
        setIsLoggedIn(true);
        if (user) {
            const updatedUser = {
                ...currentUser,
                ...user,
                pollsVotedOn: user.pollsVotedOn || currentUser.pollsVotedOn || [],
                following: user.following || currentUser.following || [],
                followers: user.followers || currentUser.followers || [],
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('pollverse_user', JSON.stringify(updatedUser));
        }
        if (loginRedirectAction) {
            loginRedirectAction();
            setLoginRedirectAction(null);
        } else {
            setPage({ name: 'feed' });
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(MOCK_USER);
        localStorage.removeItem('pollverse_user');
        setPage({ name: 'feed' });
    };

    const handleCreatePoll = (newPollData: Partial<Poll>) => {
        PollService.createPoll({ ...newPollData, creator: currentUser }).then(newPoll => {
            setPolls(prevPolls => [newPoll, ...prevPolls]);
            setPage({ name: 'feed' });
        });
    };

    const handleNavigation = (name: string, data?: any) => {
        const protectedPages = ['profile', 'addPoll', 'notifications', 'settings', 'comments', 'results', 'editProfile', 'survey'];
        const action = async () => {
            if (name === 'profile' && data && data.id) {
                // Fetch fresh user data to get accurate followers/following counts
                try {
                    const freshUser = await UserService.getUser(Number(data.id));
                    setPage({ name, data: freshUser || data });
                } catch (e) {
                    setPage({ name, data });
                }
            } else {
                setPage({ name, data });
            }
        };

        if (protectedPages.includes(name) && !isLoggedIn && name !== 'profile') {
            requireLogin(action);
        } else if (name === 'profile' && !data && !isLoggedIn) {
            requireLogin(action);
        } else {
            action();
        }
    };

    const handleUpdateUser = (updatedUser: User) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('pollverse_user', JSON.stringify(updatedUser));
    };

    const handleVote = (pollId: number | string) => {
        if (!currentUser.pollsVotedOn.includes(pollId)) {
            setCurrentUser(prev => ({ ...prev, pollsVotedOn: [...prev.pollsVotedOn, pollId] }));
        }
    };

    // Auto Scroll Logic
    const handleVoteComplete = () => {
        if (autoScrollEnabled && scrollContainerRef.current) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const cardHeight = scrollContainerRef.current.clientHeight;
                    scrollContainerRef.current.scrollBy({ top: cardHeight, behavior: 'smooth' });
                }
            }, 1200); // Wait 1.2s for confetti/animation
        }
    };

    const handleToggleFollow = async (userId: string | number) => {
        if (!isLoggedIn) {
            requireLogin(() => handleToggleFollow(userId));
            return;
        }

        const targetId = Number(userId);
        const isFollowing = currentUser.following.includes(String(targetId)) || currentUser.following.includes(targetId);

        try {
            if (isFollowing) {
                await UserService.unfollow(Number(currentUser.id), targetId);
            } else {
                await UserService.follow(Number(currentUser.id), targetId);
            }

            setCurrentUser(prev => {
                const following = prev.following.includes(String(targetId)) || prev.following.includes(targetId)
                    ? prev.following.filter(id => String(id) !== String(targetId))
                    : [...prev.following, String(targetId)];
                const updated = { ...prev, following };
                localStorage.setItem('pollverse_user', JSON.stringify(updated));
                return updated;
            });

            // Update profile page data if we are viewing the target user's profile
            if (page.name === 'profile' && page.data && String(page.data.id) === String(targetId)) {
                setPage(prev => ({
                    ...prev,
                    data: {
                        ...prev.data,
                        followers: isFollowing
                            ? (prev.data.followers || []).filter((id: any) => String(id) !== String(currentUser.id))
                            : [...(prev.data.followers || []), String(currentUser.id)]
                    }
                }));
            }
            showToast(isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
        } catch (e) {
            console.error("Failed to toggle follow:", e);
            showToast('Failed to update follow status');
        }
    };

    useEffect(() => {
        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                // Determine filters
                const filters: any = {};
                if (activeCategory !== 'For You') filters.category = activeCategory;
                if (searchQuery.trim() !== '') filters.search = searchQuery;
                if (isLoggedIn) filters.userId = currentUser.id;

                const data = await PollService.getFeed(filters);
                setPolls(data);
            } catch (e) {
                console.error(e);
            }
            setIsLoading(false);
        };

        const debounceTimer = setTimeout(() => {
            fetchFeed();
        }, 300); // Debounce search

        return () => clearTimeout(debounceTimer);
    }, [activeCategory, searchQuery, currentUser.following]);

    // Removed local filtering `filteredPolls` useMemo as we now fetch from backend
    const filteredPolls = polls;

    const renderDetailContent = () => {
        switch (page.name) {
            case 'profile':
                return <ProfilePage user={page.data || currentUser} currentUser={currentUser} onBack={() => setPage({ name: 'feed' })} onNavigate={handleNavigation} onLogout={handleLogout} onToggleFollow={handleToggleFollow} allPolls={polls} />;
            case 'results':
                return <ResultsPage poll={page.data} onBack={() => setPage({ name: 'feed' })} />;
            case 'comments':
                return <CommentsPage poll={page.data} onBack={() => setPage({ name: 'feed' })} isLoggedIn={isLoggedIn} requireLogin={requireLogin} currentUser={currentUser} />;
            case 'notifications':
                return <NotificationsPage onBack={() => setPage({ name: 'feed' })} currentUser={currentUser} />;
            case 'settings':
                return <SettingsPage onBack={() => handleNavigation('profile', currentUser)} />;
            case 'addPoll':
                return <AddPollPage onBack={() => setPage({ name: 'feed' })} onPollCreate={handleCreatePoll} initialData={page.data} />;
            case 'login':
                return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setPage({ name: 'feed' })} />;
            case 'editProfile':
                return <EditProfilePage onBack={() => handleNavigation('profile', currentUser)} currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
            case 'survey':
                return <SurveyPage poll={page.data} onBack={() => setPage({ name: 'feed' })} onComplete={handleVote} />;
            case 'userPolls':
                return (
                    <UserPollsPage
                        user={page.data}
                        currentUser={currentUser}
                        isLoggedIn={isLoggedIn}
                        onBack={() => handleNavigation('profile', page.data)}
                        onNavigate={handleNavigation}
                        requireLogin={requireLogin}
                        showToast={showToast}
                        onVote={handleVote}
                    />
                );
            case 'admin':
                return <AdminPage onBack={() => setPage({ name: 'feed' })} />;
            default:
                return null;
        }
    }

    const isDetailPage = page.name !== 'feed';

    const topHashtags = useMemo(() => {
        const tagCounts: Record<string, number> = {};
        polls.forEach(poll => {
            if (poll.tags) {
                poll.tags.forEach(tag => {
                    const normalizedTag = tag.toLowerCase();
                    tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
                });
            }
        });

        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);
    }, [polls]);

    return (
        <ThemeProvider>
            <div className="w-full h-screen flex items-center justify-center p-4">
                <div className="w-full h-full bg-gray-100 dark:bg-black font-sans flex flex-col shadow-2xl border-gray-300 dark:border-gray-700 border-8 rounded-[40px] overflow-hidden relative">
                    {/* Main Feed View */}
                    <div className={`h-full w-full flex flex-col ${isDetailPage ? 'hidden' : 'flex'}`}>
                        <div className="flex-shrink-0 w-full p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <button onClick={() => setSearchActive(!searchActive)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><SearchIcon /></button>
                            <div className="flex items-center space-x-2">
                                <AppLogo />
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">PollVerse</h1>
                            </div>
                            <div className="flex items-center space-x-3">
                                {/* Auto Scroll Toggle */}
                                <div className="flex items-center space-x-1" title="Auto Scroll">
                                    <span className="text-xs font-bold text-blue-600">Auto</span>
                                    <Toggle enabled={autoScrollEnabled} onChange={() => setAutoScrollEnabled(!autoScrollEnabled)} />
                                </div>
                                <button onClick={() => setPage({ name: 'admin' })} className="text-gray-500 hover:text-blue-500" title="Admin/Seed"><DuplicateIcon /></button>
                                <button onClick={() => handleNavigation('notifications')} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><BellIcon /></button>
                            </div>
                        </div>

                        {searchActive ?
                            <div className="flex-shrink-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex flex-col animate-fade-in relative z-10 transition-all duration-300">
                                <div className="flex items-center space-x-2 p-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search polls..."
                                        className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoFocus
                                    />
                                    <button onClick={() => { setSearchActive(false); setSearchQuery(''); }} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><XIcon /></button>
                                </div>

                                {searchQuery.trim() === '' && topHashtags.length > 0 && (
                                    <div className="px-4 pb-3 animate-fade-in">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Trending Topics</p>
                                        <div className="flex flex-wrap gap-2">
                                            {topHashtags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => setSearchQuery(tag)}
                                                    className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                >
                                                    #{tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div> :
                            <div className="flex-shrink-0 w-full overflow-x-auto py-3 px-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                                <div className="flex space-x-3">{CATEGORIES.map(category => (<button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeCategory === category ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{category}</button>))}</div>
                            </div>
                        }

                        <div ref={scrollContainerRef} className="flex-grow w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
                            {isLoading ? (
                                <>
                                    <PollCardSkeleton />
                                    <PollCardSkeleton />
                                </>
                            ) : (
                                filteredPolls.map(poll => (
                                    <PollCard
                                        key={poll.id}
                                        poll={poll}
                                        onNavigate={handleNavigation}
                                        isLoggedIn={isLoggedIn}
                                        requireLogin={requireLogin}
                                        showToast={showToast}
                                        onVote={handleVote}
                                        onVoteComplete={handleVoteComplete}
                                        currentUser={currentUser}
                                    />
                                ))
                            )}
                        </div>

                        <nav className="flex-shrink-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-2">
                            <button onClick={() => setPage({ name: 'feed' })} className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${page.name === 'feed' ? '!text-blue-600 dark:!text-blue-500' : ''}`}><HomeIcon active={page.name === 'feed'} /></button>
                            <button onClick={() => handleNavigation('addPoll')} className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 -mt-10 border-4 border-white dark:border-black hover:scale-105 transition-transform"><PlusIcon /></button>
                            <button onClick={() => handleNavigation('profile', currentUser)} className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${page.name === 'profile' ? '!text-blue-600 dark:!text-blue-500' : ''}`}><UserIcon active={page.name === 'profile'} /></button>
                        </nav>
                    </div>

                    {/* Detail Page Overlay */}
                    {isDetailPage && (
                        <div className="absolute top-0 left-0 h-full w-full bg-white dark:bg-black z-20">
                            {renderDetailContent()}
                        </div>
                    )}
                    <Toast message={toast.message} show={toast.show} />
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;
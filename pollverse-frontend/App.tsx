import { useState, useEffect, useMemo, useRef } from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { PollService } from './services/PollService';
import { UserService } from './services/UserService';
import { ThemeProvider } from './context/ThemeContext';
import { PageState, Poll, User } from './types';
import { MOCK_USER, CATEGORIES } from './constants';
import {
    HomeIcon, UserIcon, PlusIcon, SearchIcon, BellIcon, AppLogo, TrophyIcon, ShieldCheck, XIcon
} from './components/Icons';

// Layout
import Sidebar from './components/layout/Sidebar';
import RightPanel from './components/layout/RightPanel';
import PollCard from './components/poll/PollCard';
import PollCardSkeleton from './components/poll/PollCardSkeleton';
import Toast from './components/ui/Toast';
import Toggle from './components/ui/Toggle';
import LoadingOverlay from './components/ui/LoadingOverlay';

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
import LeaderboardPage from './pages/LeaderboardPage';
import PointsLedgerPage from './pages/PointsLedgerPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ExplorePage from './pages/ExplorePage';


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
    const [globalLoading, setGlobalLoading] = useState(false);

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
                // Security/Stability Check: If ID is too large (likely a legacy timestamp ID), 
                // clear it to prevent DB integer overflow errors.
                if (user && user.id && Number(user.id) > 2147483647) {
                    localStorage.removeItem('pollverse_user');
                } else {
                    setCurrentUser(user);
                    setIsLoggedIn(true);
                    updateUserRank(user.id);
                }
            } catch (e) {
                console.error("Failed to parse saved user", e);
                localStorage.removeItem('pollverse_user');
            }
        }
    }, []);

    // Simple URL-based navigation listener (for convenience)
    useEffect(() => {
        const path = window.location.pathname;
        if (path === '/admin') {
            setPage({ name: 'admin' });
        } else if (path === '/moderation' || path === '/review') {
            setPage({ name: 'reviewQueue' });
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
        if (user) updateUserRank(user.id);
    };

    const updateUserRank = async (userId: number | string) => {
        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const res = await fetch(`${BASE_URL}/points/rank/${userId}`);
            if (res.ok) {
                const rankData = await res.json();
                setCurrentUser(prev => {
                    const updated = { ...prev, rank: rankData.rank, points: rankData.points };
                    localStorage.setItem('pollverse_user', JSON.stringify(updated));
                    return updated;
                });
            }
        } catch (e) {
            console.error("Failed to fetch rank", e);
        }
    };


    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(MOCK_USER);
        localStorage.removeItem('pollverse_user');
        setPage({ name: 'feed' });
    };

    const handleCreatePoll = async (newPollData: Partial<Poll>) => {
        setGlobalLoading(true);
        try {
            let newPoll: Poll;
            const isUpdate = !!newPollData.id;

            if (isUpdate) {
                newPoll = await PollService.updatePoll(newPollData.id!, { ...newPollData, creator: currentUser });
            } else {
                newPoll = await PollService.createPoll({ ...newPollData, creator: currentUser });
            }

            if (newPoll.status === 'PUBLISHED') {
                if (isUpdate) {
                    setPolls(prev => prev.map(p => p.id === newPoll.id ? newPoll : p));
                    showToast('Poll updated!');
                } else {
                    setPolls(prevPolls => [newPoll, ...prevPolls]);
                    showToast('Poll published! +50 Points');
                }
            } else {
                // It's pending - don't add to main feed, but give feedback
                if (isUpdate) {
                    // Remove from local feed if it was there (though draft polls usually aren't)
                    setPolls(prev => prev.filter(p => p.id !== newPoll.id));
                }
                showToast(isUpdate ? 'Update submitted for review!' : 'Poll submitted for review!');
            }


            if (newPoll.status === 'PUBLISHED') {
                const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
                const rankData = await fetch(`${BASE_URL}/points/rank/${currentUser.id}`).then(r => r.json());
                const updatedUser = {
                    ...currentUser,
                    points: rankData?.points || currentUser.points,
                    pollsCount: isUpdate ? currentUser.pollsCount : (currentUser.pollsCount || 0) + 1
                };
                setCurrentUser(updatedUser);
                localStorage.setItem('pollverse_user', JSON.stringify(updatedUser));
            }

            setPage({ name: 'feed' });

        } catch (e) {
            console.error('Failed to create poll:', e);
            showToast('Failed to create poll');
        } finally {
            setGlobalLoading(false);
        }
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

    const handleUpdateUser = async (updatedUserData: User) => {
        setGlobalLoading(true);
        try {
            const response = await UserService.updateProfile(Number(currentUser.id), updatedUserData);
            if (response) {
                const newUser = { ...currentUser, ...response };
                setCurrentUser(newUser);
                localStorage.setItem('pollverse_user', JSON.stringify(newUser));
                showToast('Profile updated!');
            }
        } catch (e) {
            console.error("Failed to update profile", e);
            showToast('Failed to sync profile');
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleVote = (pollId: number | string, pointsEarned?: number, updatedVotes?: Record<string | number, number>) => {
        const hasVoted = currentUser.pollsVotedOn.some(id => String(id) === String(pollId));
        if (!hasVoted) {
            const updatedUser = {
                ...currentUser,
                pollsVotedOn: [...currentUser.pollsVotedOn, pollId],
                points: (currentUser.points || 0) + (pointsEarned || 0)
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('pollverse_user', JSON.stringify(updatedUser));

            if (updatedVotes) {
                setPolls(prev => prev.map(p => String(p.id) === String(pollId) ? { ...p, votes: updatedVotes } : p));
            }

            // Sync with profile page if it's the current user's profile
            if (page.name === 'profile' && page.data && String(page.data.id) === String(currentUser.id)) {
                setPage(prev => ({ ...prev, data: { ...prev.data, points: updatedUser.points } }));
            }

            if (pointsEarned && pointsEarned > 0) {
                showToast(`+${pointsEarned} Points!`);
            }
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

        setGlobalLoading(true);
        try {
            let response;
            if (isFollowing) {
                response = await UserService.unfollow(Number(currentUser.id), targetId);
            } else {
                response = await UserService.follow(Number(currentUser.id), targetId);
            }

            const pointsEarned = response?.pointsEarned || 0;

            setCurrentUser(prev => {
                const following = prev.following.includes(String(targetId)) || prev.following.includes(targetId)
                    ? prev.following.filter(id => String(id) !== String(targetId))
                    : [...prev.following, String(targetId)];
                const updated = {
                    ...prev,
                    following,
                    points: (prev.points || 0) + pointsEarned
                };
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

            if (isFollowing) {
                showToast('Unfollowed successfully');
            } else {
                if (pointsEarned > 0) {
                    showToast(`Followed successfully! +${pointsEarned} Points`);
                } else {
                    showToast('Followed successfully!');
                }
            }
        } catch (e) {
            console.error("Failed to toggle follow:", e);
            showToast('Failed to update follow status');
        } finally {
            setGlobalLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        const fetchFeed = async () => {
            try {
                // Determine filters
                const filters: any = {};
                if (activeCategory === 'Following' && !isLoggedIn) {
                    requireLogin(() => setActiveCategory('Following'));
                    setActiveCategory('For You');
                    return;
                }
                if (activeCategory !== 'For You') filters.category = activeCategory;
                if (searchQuery.trim() !== '') filters.search = searchQuery;
                if (isLoggedIn) filters.userId = currentUser.id;

                const data = await PollService.getFeed(filters);
                setPolls(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
                setGlobalLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchFeed();
        }, 300); // Debounce search

        return () => clearTimeout(debounceTimer);
    }, [activeCategory, searchQuery, currentUser.following, isLoggedIn]);

    useEffect(() => {
        if (page.name === 'feed' && page.data?.targetPollId && !isLoading && polls.length > 0) {
            const pollId = page.data.targetPollId;
            setTimeout(() => {
                const element = document.getElementById(`poll-${pollId}`);
                if (element && scrollContainerRef.current) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }, [page.name, page.data, isLoading, polls.length]);

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
                return <AddPollPage onBack={() => setPage({ name: 'feed' })} onPollCreate={handleCreatePoll} initialData={page.data} loading={globalLoading} currentUser={currentUser} />;
            case 'login':
                return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setPage({ name: 'feed' })} />;
            case 'editProfile':
                return <EditProfilePage onBack={() => handleNavigation('profile', currentUser)} currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
            case 'survey':
                return (
                    <SurveyPage
                        poll={page.data}
                        onBack={() => setPage({ name: 'feed' })}
                        onComplete={async (pid, pts) => {
                            setGlobalLoading(true);
                            try {
                                if (isLoggedIn) {
                                    const result = await PollService.vote(Number(pid), Number(currentUser.id), 'completed');
                                    handleVote(pid, result.pointsEarned || pts);
                                } else {
                                    handleVote(pid, pts);
                                }
                            } catch (e) {
                                console.error(e);
                                handleVote(pid, pts);
                            } finally {
                                setGlobalLoading(false);
                            }
                        }}
                    />
                );
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
                        setGlobalLoading={setGlobalLoading}
                    />
                );
            case 'admin':
                return <AdminPage onBack={() => setPage({ name: 'feed' })} />;
            case 'leaderboard':
                return <LeaderboardPage onBack={() => setPage({ name: 'feed' })} onNavigate={handleNavigation} currentUser={currentUser} />;
            case 'pointsLedger':
                return <PointsLedgerPage onBack={() => handleNavigation('profile', currentUser)} onNavigate={handleNavigation} currentUser={currentUser} />;
            case 'explore':
                return <ExplorePage onNavigate={handleNavigation} setSearchQuery={setSearchQuery} trendingTags={topHashtags} />;
            case 'reviewQueue':
                return <ReviewQueuePage onBack={() => setPage({ name: 'feed' })} onNavigate={handleNavigation} currentUser={currentUser} showToast={showToast} setGlobalLoading={setGlobalLoading} />;
            default:

                return null;
        }
    }

    const isDetailPage = page.name !== 'feed';
    const isFullPage = ['reviewQueue', 'admin', 'survey', 'profile'].includes(page.name);

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
            <div className="min-h-screen w-full bg-white dark:bg-black font-sans text-gray-900 dark:text-gray-100 flex justify-center">

                {/* Desktop Layout Container: Max width constraint for large screens to keep content centered like Twitter */}
                <div className="w-full max-w-[1300px] flex justify-center md:px-0">

                    {/* LEFT SIDEBAR (Desktop) */}
                    <Sidebar
                        page={page.name}
                        onNavigate={handleNavigation}
                        currentUser={currentUser}
                    />

                    {/* MAIN FEED COLUMN */}
                    <main className="flex-grow w-full max-w-[600px] border-x border-gray-100 dark:border-gray-800 min-h-screen relative md:mx-4 lg:mx-8">

                        {/* Mobile Header (Hidden on Desktop) */}
                        <div className={`sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between md:hidden ${isDetailPage ? 'hidden' : 'flex'}`}>
                            <button onClick={() => setSearchActive(!searchActive)} className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-100"><SearchIcon /></button>
                            <div className="flex items-center space-x-2">
                                <AppLogo />
                                <h1 className="text-xl font-bold tracking-tighter">PollVerse</h1>
                            </div>
                            <div className="flex items-center">
                                <button onClick={() => handleNavigation('notifications')}><BellIcon /></button>
                            </div>
                        </div>

                        {/* Desktop Header (Sticky at top of feed) */}
                        <div className="hidden md:flex sticky top-0 z-40 bg-white dark:bg-black/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 items-center justify-between cursor-pointer" onClick={() => {
                            if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                            <h2 className="text-lg font-bold">{page.name === 'feed' ? 'Home' : page.name.charAt(0).toUpperCase() + page.name.slice(1)}</h2>
                            <div className="flex items-center gap-4">
                                {isLoggedIn && (currentUser?.rank || 999) <= 4 && (
                                    <button onClick={(e) => { e.stopPropagation(); setPage({ name: 'reviewQueue' }) }} title="Moderation Queue">
                                        <ShieldCheck className="w-5 h-5 text-gray-500 hover:text-blue-500" />
                                    </button>
                                )}
                                <div title="Auto-scroll" onClick={(e) => e.stopPropagation()}>
                                    <Toggle enabled={autoScrollEnabled} onChange={() => setAutoScrollEnabled(!autoScrollEnabled)} />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Search Overlay */}
                        {searchActive && (
                            <div className="md:hidden p-4 bg-white dark:bg-black border-b border-gray-200">
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-sm"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Category Filter (Visible on both, scroller) */}
                        {page.name === 'feed' && (
                            <>
                                <div className="overflow-x-auto py-2.5 px-4 flex space-x-2.5 scrollbar-hide border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur-md sticky top-[60px] md:top-[51px] z-30">
                                    {CATEGORIES.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-3.5 py-1 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeCategory === category
                                                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                                                : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>

                                {searchQuery && (
                                    <div className="px-4 py-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Searching:</span>
                                            <span className="text-sm font-black text-blue-800 dark:text-blue-200">"{searchQuery}"</span>
                                        </div>
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                                            title="Clear search"
                                        >
                                            <XIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Content Area */}
                        <div ref={scrollContainerRef} className="h-[calc(100vh-120px)] md:h-auto overflow-y-auto md:overflow-visible no-scrollbar pb-20 md:pb-0">
                            {isLoading ? (
                                <div className="p-4 space-y-4">
                                    <PollCardSkeleton />
                                    <PollCardSkeleton />
                                </div>
                            ) : (
                                filteredPolls.map(poll => (
                                    <div key={poll.id} className="border-b border-gray-100 dark:border-gray-800 md:border-none md:mb-6">
                                        <PollCard
                                            poll={poll}
                                            onNavigate={handleNavigation}
                                            isLoggedIn={isLoggedIn}
                                            requireLogin={requireLogin}
                                            showToast={showToast}
                                            onVote={(pid, pts, votes) => handleVote(pid, pts, votes)}
                                            onVoteComplete={handleVoteComplete}
                                            currentUser={currentUser}
                                            setGlobalLoading={setGlobalLoading}
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Dynamic Content (Modal-like) */}
                        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-0 ${isFullPage ? '' : 'md:p-4'} transition-all duration-300 ${isDetailPage ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                            <div
                                onClick={() => setPage({ name: 'feed' })}
                                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-pointer"
                            ></div>
                            <div className={`bg-white dark:bg-black w-full h-full ${isFullPage ? '' : 'md:h-[85vh] md:max-w-2xl md:rounded-3xl'} shadow-2xl relative overflow-hidden transition-all duration-500 ${isDetailPage ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'} ${!isDetailPage ? 'pointer-events-none' : ''}`}>
                                <div className="h-full overflow-hidden flex flex-col">
                                    {renderDetailContent()}
                                </div>
                            </div>
                        </div>
                        {/* Bottom Navigation (Mobile Only) */}
                        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-100 flex justify-around items-center h-[60px] z-30 pb-safe">
                            <button onClick={() => setPage({ name: 'feed' })} className={`p-2 ${page.name === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}><HomeIcon active={page.name === 'feed'} /></button>
                            <button onClick={() => setPage({ name: 'explore' })} className={`p-2 ${page.name === 'explore' ? 'text-blue-600' : 'text-gray-400'}`}><SearchIcon /></button>
                            <button onClick={() => handleNavigation('addPoll')} className="p-2 -mt-8"><div className="bg-blue-600 text-white p-3 rounded-full shadow-lg"><PlusIcon /></div></button>
                            <button onClick={() => handleNavigation('leaderboard')} className={`p-2 ${page.name === 'leaderboard' ? 'text-blue-600' : 'text-gray-400'}`}><TrophyIcon /></button>
                            <button onClick={() => handleNavigation('profile', currentUser)} className={`p-2 ${page.name === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}><UserIcon active={page.name === 'profile'} /></button>
                        </nav>
                    </main>

                    {/* RIGHT PANEL (Desktop) */}
                    <RightPanel
                        onNavigate={handleNavigation}
                        trendingTags={topHashtags}
                        setSearchQuery={(q: string) => { setSearchQuery(q); setActiveCategory('For You'); /* Reset cat to search globally */ }}
                    />

                </div>

                <Toast message={toast.message} show={toast.show} />
                <LoadingOverlay show={globalLoading} />
            </div>
        </ThemeProvider>
    );
}

export default App;
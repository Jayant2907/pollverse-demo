import { useState, useEffect, useMemo, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { PageState, Poll, User } from './types';
import { INITIAL_MOCK_POLLS, MOCK_USER, CATEGORIES, getTotalVotes } from './constants';
import {
    HomeIcon, UserIcon, PlusIcon, SearchIcon, BellIcon, AppLogo, XIcon
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
        setTimeout(() => {
            setPolls([...INITIAL_MOCK_POLLS].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            setIsLoading(false);
        }, 1500);
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

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        if (loginRedirectAction) {
            loginRedirectAction();
            setLoginRedirectAction(null);
        } else {
            setPage({ name: 'feed' });
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setPage({ name: 'feed' });
    };

    const handleCreatePoll = (newPollData: Partial<Poll>) => {
        const newPoll: Poll = {
            ...newPollData,
            id: Date.now(),
            creator: currentUser,
            votes: {},
            comments: [],
            likes: 0,
            dislikes: 0,
            timestamp: new Date(),
        } as Poll;
        setPolls(prevPolls => [newPoll, ...prevPolls]);
        setPage({ name: 'feed' });
    };

    const handleNavigation = (name: string, data?: any) => {
        const protectedPages = ['profile', 'addPoll', 'notifications', 'settings', 'comments', 'results', 'editProfile', 'survey'];
        const action = () => setPage({ name, data });

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

    const handleToggleFollow = (userId: string | number) => {
        setCurrentUser(prev => {
            const following = prev.following.includes(userId)
                ? prev.following.filter(id => id !== userId)
                : [...prev.following, userId];
            return { ...prev, following };
        });
    };

    const filteredPolls = useMemo(() => {
        let tempPolls = [...polls];

        if (activeCategory === 'Following') {
            tempPolls = tempPolls.filter(p => currentUser.following.includes(p.creator.id));
        } else if (activeCategory === 'Trending') {
            tempPolls.sort((a, b) => getTotalVotes(b.votes) - getTotalVotes(a.votes));
        } else if (activeCategory !== 'For You') {
            tempPolls = tempPolls.filter(p => p.category === activeCategory);
        }

        if (searchQuery.trim() !== '') {
            tempPolls = tempPolls.filter(p =>
                p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
            );
        }

        return tempPolls;
    }, [polls, activeCategory, searchQuery, currentUser.following]);

    const renderDetailContent = () => {
        switch (page.name) {
            case 'profile':
                return <ProfilePage user={page.data || currentUser} currentUser={currentUser} onBack={() => setPage({ name: 'feed' })} onNavigate={handleNavigation} onLogout={handleLogout} onToggleFollow={handleToggleFollow} allPolls={polls} />;
            case 'results':
                return <ResultsPage poll={page.data} onBack={() => setPage({ name: 'feed' })} />;
            case 'comments':
                return <CommentsPage poll={page.data} onBack={() => setPage({ name: 'feed' })} isLoggedIn={isLoggedIn} requireLogin={requireLogin} />;
            case 'notifications':
                return <NotificationsPage onBack={() => setPage({ name: 'feed' })} />;
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
            default:
                return null;
        }
    }

    const isDetailPage = page.name !== 'feed';

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
                                <button onClick={() => handleNavigation('notifications')} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><BellIcon /></button>
                            </div>
                        </div>

                        {searchActive ?
                            <div className="flex-shrink-0 w-full p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex items-center space-x-2 animate-fade-in">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search polls..."
                                    className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button onClick={() => { setSearchActive(false); setSearchQuery(''); }} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><XIcon /></button>
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
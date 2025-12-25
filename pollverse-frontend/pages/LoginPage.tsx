import { useState, useEffect, useRef } from 'react';
import { AppLogo, ChevronLeftIcon } from '../components/Icons';

interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
    onBack: () => void;
}

// Pre-populated user emails for quick login
const QUICK_LOGIN_USERS = [
    { email: 'alice@pollverse.com', username: 'alice_polls' },
    { email: 'bob@pollverse.com', username: 'bob_voter' },
    { email: 'charlie@pollverse.com', username: 'charlie_tech' },
    { email: 'diana@pollverse.com', username: 'diana_sports' },
    { email: 'evan@pollverse.com', username: 'evan_movies' },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
    const [email, setEmail] = useState('alice@pollverse.com'); // Default to alice
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleLogin = async () => {
        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Try to find user by email in backend
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: '' }) // No password required
            });

            const result = await response.json();

            if (result.success && result.user) {
                onLoginSuccess(result.user);
            } else {
                // If user not found, create a mock user for now
                const mockUser = {
                    id: Date.now(),
                    username: email.split('@')[0],
                    email: email,
                    avatar: `https://i.pravatar.cc/150?u=${email}`,
                    points: 0,
                    following: [],
                    pollsVotedOn: []
                };
                onLoginSuccess(mockUser);
            }
        } catch (err) {
            console.error('Login error:', err);
            // Fallback to mock login if backend is down
            const mockUser = {
                id: Date.now(),
                username: email.split('@')[0],
                email: email,
                avatar: `https://i.pravatar.cc/150?u=${email}`,
                points: 0,
                following: [],
                pollsVotedOn: []
            };
            onLoginSuccess(mockUser);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (userEmail: string) => {
        setEmail(userEmail);
        // Auto-submit after setting email
        setTimeout(() => {
            const btn = document.getElementById('login-btn');
            if (btn) btn.click();
        }, 100);
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in p-6 justify-center text-center overflow-y-auto">
            <button onClick={onBack} className="absolute top-4 left-4 text-blue-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronLeftIcon />
            </button>

            <div className="w-full max-w-sm mx-auto">
                <div className="flex justify-center"><AppLogo /></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">Welcome to PollVerse</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Enter your email to continue.</p>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                        ref={inputRef}
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-transparent text-lg focus:outline-none"
                    />
                </div>

                <button
                    id="login-btn"
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full mt-6 p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                {/* Quick Login Options */}
                <div className="mt-8">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Quick Login As</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {QUICK_LOGIN_USERS.map(user => (
                            <button
                                key={user.email}
                                onClick={() => handleQuickLogin(user.email)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {user.username}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
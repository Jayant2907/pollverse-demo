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
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('alice@pollverse.com');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode]);

    const handleLogin = async () => {
        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phoneNumber, password: '' })
            });

            const result = await response.json();

            if (result.success && result.user) {
                onLoginSuccess(result.user);
            } else {
                // If user not found, create a mock user with a safe integer ID
                const mockUser = {
                    id: Math.floor(Math.random() * 1000000),
                    username: email.split('@')[0],
                    email: email,
                    avatar: `https://i.pravatar.cc/150?u=${email}`,
                    phoneNumber: phoneNumber,
                    points: 0,
                    following: [],
                    pollsVotedOn: []
                };
                onLoginSuccess(mockUser);
            }
        } catch (err) {
            console.error('Login error:', err);
            const mockUser = {
                id: Math.floor(Math.random() * 1000000),
                username: email.split('@')[0],
                email: email,
                avatar: `https://i.pravatar.cc/150?u=${email}`,
                phoneNumber: phoneNumber,
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
        setMode('login');
        setEmail(userEmail);
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
                <div className="flex justify-center mb-4"><AppLogo /></div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-4 tracking-tight">
                    {mode === 'login' ? 'Welcome Back' : 'Join PollVerse'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8 text-sm">
                    {mode === 'login' ? 'Your opinion matters more than ever.' : 'Sign up to start polling and earn points.'}
                </p>

                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left mb-1">Email Address</label>
                        <input
                            ref={inputRef}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-transparent text-gray-900 dark:text-white font-semibold focus:outline-none"
                        />
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${mode === 'signup' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left mb-1">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1 234 567 890"
                                className="w-full bg-transparent text-gray-900 dark:text-white font-semibold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <button
                    id="login-btn"
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full mt-8 p-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>

                <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
                    <span className="text-gray-500">
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    </span>
                    <button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>

                {error && <p className="text-red-500 font-bold text-xs mt-4 animate-shake">{error}</p>}

                {/* Quick Login Options */}
                <div className="mt-12">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.2em]">Quick Access</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {QUICK_LOGIN_USERS.map(user => (
                            <button
                                key={user.email}
                                onClick={() => handleQuickLogin(user.email)}
                                className="px-4 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
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
import { PollService } from '../services/PollService';
import { INITIAL_MOCK_POLLS } from '../constants';
import { useState } from 'react';
import { DuplicateIcon } from '../components/Icons';

const AdminPage = ({ onBack }: { onBack: () => void }) => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        setStatus('Seeding database...');
        try {
            // Transform ID to ensure they don't conflict (or backend handles it)
            // Backend will likely generate new IDs unless we force them.
            // Letting backend handle ID generation is safer.
            const pollsToSeed = INITIAL_MOCK_POLLS.map(({ id, ...rest }) => ({
                ...rest,
                creatorId: 1 // Default creator for now
            }));

            // Seed Users (Basic Mock User + others if needed)
            const usersToSeed = [
                { id: 1, username: 'User 1', avatar: 'https://i.pravatar.cc/150?u=1', points: 100, following: [] },
                { id: 2, username: 'User 2', avatar: 'https://i.pravatar.cc/150?u=2', points: 50, following: [] }
            ];

            await PollService.seedUsers(usersToSeed);
            await PollService.seedPolls(pollsToSeed);
            setStatus('Success! Database (Users & Polls) populated.');
        } catch (error) {
            console.error(error);
            setStatus('Error seeding database. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black p-4">
            <div className="flex items-center space-x-2 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-2xl font-bold dark:text-white">Admin / Dev Tools</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                        <DuplicateIcon />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white mb-2">Seed Database</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Populate your local PostgreSQL database with the initial set of 15 mock polls.</p>

                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'}`}
                    >
                        {loading ? 'Seeding...' : 'Load Mock Data'}
                    </button>

                    {status && (
                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${status.includes('Success') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

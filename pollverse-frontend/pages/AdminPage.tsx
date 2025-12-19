import { PollService } from '../services/PollService';
import { UserService } from '../services/UserService';
import { CommentService } from '../services/CommentService';
import { useState } from 'react';
import { DuplicateIcon } from '../components/Icons';

// 10 Mock Users with login credentials
const MOCK_USERS = [
    { id: 1, username: 'alice_polls', email: 'alice@pollverse.com', password: 'alice123', avatar: 'https://i.pravatar.cc/150?u=alice', points: 150, following: [] },
    { id: 2, username: 'bob_voter', email: 'bob@pollverse.com', password: 'bob123', avatar: 'https://i.pravatar.cc/150?u=bob', points: 120, following: [] },
    { id: 3, username: 'charlie_tech', email: 'charlie@pollverse.com', password: 'charlie123', avatar: 'https://i.pravatar.cc/150?u=charlie', points: 200, following: [] },
    { id: 4, username: 'diana_sports', email: 'diana@pollverse.com', password: 'diana123', avatar: 'https://i.pravatar.cc/150?u=diana', points: 80, following: [] },
    { id: 5, username: 'evan_movies', email: 'evan@pollverse.com', password: 'evan123', avatar: 'https://i.pravatar.cc/150?u=evan', points: 90, following: [] },
    { id: 6, username: 'fiona_food', email: 'fiona@pollverse.com', password: 'fiona123', avatar: 'https://i.pravatar.cc/150?u=fiona', points: 110, following: [] },
    { id: 7, username: 'george_travel', email: 'george@pollverse.com', password: 'george123', avatar: 'https://i.pravatar.cc/150?u=george', points: 70, following: [] },
    { id: 8, username: 'hannah_biz', email: 'hannah@pollverse.com', password: 'hannah123', avatar: 'https://i.pravatar.cc/150?u=hannah', points: 130, following: [] },
    { id: 9, username: 'ivan_gamer', email: 'ivan@pollverse.com', password: 'ivan123', avatar: 'https://i.pravatar.cc/150?u=ivan', points: 160, following: [] },
    { id: 10, username: 'julia_news', email: 'julia@pollverse.com', password: 'julia123', avatar: 'https://i.pravatar.cc/150?u=julia', points: 140, following: [] },
];

// Poll templates for each type
const POLL_TEMPLATES = {
    multiple_choice: [
        { question: 'Best programming language for beginners?', description: 'Help newbies choose their first language', options: [{ id: 'a', text: 'Python' }, { id: 'b', text: 'JavaScript' }, { id: 'c', text: 'Java' }, { id: 'd', text: 'C++' }], category: 'Technology', tags: ['coding', 'programming'] },
        { question: 'Favorite streaming platform?', description: 'Where do you watch your shows?', options: [{ id: 'a', text: 'Netflix' }, { id: 'b', text: 'Disney+' }, { id: 'c', text: 'Prime Video' }, { id: 'd', text: 'HBO Max' }], category: 'Movies', tags: ['streaming', 'entertainment'] },
        { question: 'Best time to workout?', description: 'When do you hit the gym?', options: [{ id: 'a', text: 'Morning' }, { id: 'b', text: 'Afternoon' }, { id: 'c', text: 'Evening' }, { id: 'd', text: 'Night' }], category: 'Sports', tags: ['fitness', 'health'] },
        { question: 'Favorite coffee type?', description: 'What fuels your day?', options: [{ id: 'a', text: 'Espresso' }, { id: 'b', text: 'Latte' }, { id: 'c', text: 'Cappuccino' }, { id: 'd', text: 'Black Coffee' }], category: 'Food', tags: ['coffee', 'drinks'] },
        { question: 'Best travel destination 2024?', description: 'Where should we go next?', options: [{ id: 'a', text: 'Japan' }, { id: 'b', text: 'Italy' }, { id: 'c', text: 'Maldives' }, { id: 'd', text: 'Switzerland' }], category: 'Travel', tags: ['travel', 'vacation'] },
    ],
    binary: [
        { question: 'Dogs or Cats?', description: 'The eternal debate', options: [{ id: 'a', text: '🐕 Dogs' }, { id: 'b', text: '🐈 Cats' }], category: 'For You', tags: ['pets', 'animals'] },
        { question: 'Morning person or Night owl?', description: 'When are you most productive?', options: [{ id: 'a', text: '🌅 Morning' }, { id: 'b', text: '🌙 Night' }], category: 'For You', tags: ['lifestyle'] },
        { question: 'iOS or Android?', description: 'Which team are you on?', options: [{ id: 'a', text: '🍎 iOS' }, { id: 'b', text: '🤖 Android' }], category: 'Technology', tags: ['tech', 'phones'] },
        { question: 'Pizza or Burger?', description: 'Choose your comfort food', options: [{ id: 'a', text: '🍕 Pizza' }, { id: 'b', text: '🍔 Burger' }], category: 'Food', tags: ['food', 'fastfood'] },
        { question: 'Beach or Mountains?', description: 'Your ideal vacation spot', options: [{ id: 'a', text: '🏖️ Beach' }, { id: 'b', text: '⛰️ Mountains' }], category: 'Travel', tags: ['travel', 'vacation'] },
    ],
    image: [
        { question: 'Which logo design is better?', description: 'Help us choose our new brand identity', options: [{ id: 'a', text: 'Design A - Modern' }, { id: 'b', text: 'Design B - Classic' }], category: 'Business', tags: ['design', 'branding'] },
        { question: 'Ferrari vs Lamborghini?', description: 'Which supercar wins your heart?', options: [{ id: 'a', text: 'Ferrari 🔴' }, { id: 'b', text: 'Lamborghini 🟡' }], category: 'For You', tags: ['cars', 'luxury'] },
        { question: 'Marvel vs DC?', description: 'The ultimate superhero showdown', options: [{ id: 'a', text: 'Marvel 🦸' }, { id: 'b', text: 'DC 🦇' }], category: 'Movies', tags: ['movies', 'superheroes'] },
        { question: 'Coke vs Pepsi?', description: 'The cola wars continue', options: [{ id: 'a', text: 'Coca-Cola' }, { id: 'b', text: 'Pepsi' }], category: 'Food', tags: ['drinks', 'brands'] },
        { question: 'Nike vs Adidas?', description: 'Your go-to sports brand', options: [{ id: 'a', text: 'Nike ✓' }, { id: 'b', text: 'Adidas ≡' }], category: 'Sports', tags: ['sports', 'fashion'] },
    ],
    ranking: [
        { question: 'Rank the Star Wars trilogies', description: 'From best to worst', options: [{ id: 'a', text: 'Original Trilogy' }, { id: 'b', text: 'Prequel Trilogy' }, { id: 'c', text: 'Sequel Trilogy' }], category: 'Movies', tags: ['starwars', 'movies'] },
        { question: 'Rank social media platforms', description: 'By importance to you', options: [{ id: 'a', text: 'Instagram' }, { id: 'b', text: 'TikTok' }, { id: 'c', text: 'Twitter/X' }, { id: 'd', text: 'LinkedIn' }], category: 'Technology', tags: ['social', 'tech'] },
        { question: 'Rank pizza toppings', description: 'Best to worst', options: [{ id: 'a', text: 'Pepperoni' }, { id: 'b', text: 'Mushrooms' }, { id: 'c', text: 'Pineapple' }, { id: 'd', text: 'Olives' }], category: 'Food', tags: ['pizza', 'food'] },
        { question: 'Rank these sports', description: 'By excitement level', options: [{ id: 'a', text: 'Football' }, { id: 'b', text: 'Basketball' }, { id: 'c', text: 'Cricket' }, { id: 'd', text: 'Tennis' }], category: 'Sports', tags: ['sports'] },
        { question: 'Rank programming frameworks', description: 'For web development', options: [{ id: 'a', text: 'React' }, { id: 'b', text: 'Vue' }, { id: 'c', text: 'Angular' }, { id: 'd', text: 'Svelte' }], category: 'Technology', tags: ['coding', 'web'] },
    ],
    slider: [
        { question: 'Rate your work-life balance', description: '0 = All Work, 100 = All Life', options: [{ id: 'min', text: 'All Work' }, { id: 'max', text: 'All Life' }], category: 'Business', tags: ['work', 'lifestyle'] },
        { question: 'How spicy do you like your food?', description: '0 = Mild, 100 = Ghost Pepper', options: [{ id: 'min', text: 'Mild' }, { id: 'max', text: 'Extreme' }], category: 'Food', tags: ['food', 'spicy'] },
        { question: 'Early bird vs Night owl scale', description: 'Where do you fall?', options: [{ id: 'min', text: '5AM Wakeup' }, { id: 'max', text: '5AM Bedtime' }], category: 'For You', tags: ['lifestyle'] },
        { question: 'Introvert to Extrovert scale', description: 'Rate yourself honestly', options: [{ id: 'min', text: 'Introvert' }, { id: 'max', text: 'Extrovert' }], category: 'For You', tags: ['personality'] },
        { question: 'Tech dependency level', description: 'How much do you rely on tech?', options: [{ id: 'min', text: 'Analog Life' }, { id: 'max', text: 'Full Digital' }], category: 'Technology', tags: ['tech', 'lifestyle'] },
    ],
    swipe: [
        { question: 'Are you Gen Z or Boomer?', description: 'Swipe through these trends to find out!', options: [{ id: 'a', text: 'TikTok dances' }, { id: 'b', text: 'Facebook posts' }, { id: 'c', text: 'Vinyl records' }, { id: 'd', text: 'Skinny jeans' }, { id: 'e', text: 'Side parts' }], category: 'For You', tags: ['genz', 'trends'], swipeResults: { lowScoreTitle: 'You are a Boomer 👴', highScoreTitle: 'You are Gen Z 🧒' } },
        { question: 'City Life or Country Life?', description: 'Swipe to reveal your true preference', options: [{ id: 'a', text: 'Skyscrapers' }, { id: 'b', text: 'Open fields' }, { id: 'c', text: 'Coffee shops' }, { id: 'd', text: 'Farms' }, { id: 'e', text: 'Traffic' }], category: 'Travel', tags: ['lifestyle', 'travel'], swipeResults: { lowScoreTitle: 'Country Soul 🌾', highScoreTitle: 'City Slicker 🌆' } },
        { question: 'Foodie Test: Healthy or Indulgent?', description: 'Swipe your food preferences', options: [{ id: 'a', text: 'Kale smoothie' }, { id: 'b', text: 'Double cheeseburger' }, { id: 'c', text: 'Organic salad' }, { id: 'd', text: 'Deep fried oreos' }, { id: 'e', text: 'Avocado toast' }], category: 'Food', tags: ['food', 'health'], swipeResults: { lowScoreTitle: 'Health Nut 🥗', highScoreTitle: 'Indulgence King 🍩' } },
        { question: 'Are you a Risk Taker?', description: 'Swipe through these scenarios', options: [{ id: 'a', text: 'Skydiving' }, { id: 'b', text: 'Bungee jumping' }, { id: 'c', text: 'Staying home' }, { id: 'd', text: 'Investing in crypto' }, { id: 'e', text: 'Starting a business' }], category: 'Business', tags: ['risk', 'adventure'], swipeResults: { lowScoreTitle: 'Play it Safe 🛡️', highScoreTitle: 'Risk Taker 🎲' } },
        { question: 'Movie Buff Test', description: 'Swipe your movie preferences', options: [{ id: 'a', text: 'Action blockbusters' }, { id: 'b', text: 'Indie films' }, { id: 'c', text: 'Romantic comedies' }, { id: 'd', text: 'Horror movies' }, { id: 'e', text: 'Documentaries' }], category: 'Movies', tags: ['movies', 'entertainment'], swipeResults: { lowScoreTitle: 'Art House Fan 🎭', highScoreTitle: 'Blockbuster Lover 🎬' } },
    ],
    survey: [
        {
            question: 'Help us improve PollVerse!', description: 'Take this quick survey about your experience', options: [], category: 'For You', tags: ['feedback', 'survey'],
            surveyQuestions: [
                { id: 'q1', text: 'How did you hear about PollVerse?', options: [{ id: 'a', text: 'Social Media' }, { id: 'b', text: 'Friend' }, { id: 'c', text: 'Search Engine' }] },
                { id: 'q2', text: 'How often do you create polls?', options: [{ id: 'a', text: 'Daily' }, { id: 'b', text: 'Weekly' }, { id: 'c', text: 'Monthly' }] },
                { id: 'q3', text: 'What features would you like to see?', options: [{ id: 'a', text: 'More poll types' }, { id: 'b', text: 'Better analytics' }, { id: 'c', text: 'Social sharing' }] },
            ]
        },
        {
            question: 'Tech Stack Survey 2024', description: 'Tell us about your development preferences', options: [], category: 'Technology', tags: ['developer', 'survey'],
            surveyQuestions: [
                { id: 'q1', text: 'Primary programming language?', options: [{ id: 'a', text: 'JavaScript' }, { id: 'b', text: 'Python' }, { id: 'c', text: 'Java' }, { id: 'd', text: 'Other' }] },
                { id: 'q2', text: 'Preferred frontend framework?', options: [{ id: 'a', text: 'React' }, { id: 'b', text: 'Vue' }, { id: 'c', text: 'Angular' }, { id: 'd', text: 'Svelte' }] },
            ]
        },
        {
            question: 'Travel Preferences Survey', description: 'Help us understand how you travel', options: [], category: 'Travel', tags: ['travel', 'survey'],
            surveyQuestions: [
                { id: 'q1', text: 'How many trips do you take per year?', options: [{ id: 'a', text: '1-2' }, { id: 'b', text: '3-5' }, { id: 'c', text: '5+' }] },
                { id: 'q2', text: 'Preferred accommodation?', options: [{ id: 'a', text: 'Hotels' }, { id: 'b', text: 'Airbnb' }, { id: 'c', text: 'Hostels' }] },
            ]
        },
    ],
};

const SAMPLE_COMMENTS = [
    "Great poll! Really makes you think.",
    "I voted for the first option, curious to see results!",
    "This is so relevant right now 🔥",
    "Hard choice but I went with option 2",
    "Love this community!",
    "Interesting perspective here",
    "Can't wait to see how this turns out",
    "My friends said option 1 but I disagree 😅",
    "Finally someone asked this question!",
    "Voting from India 🇮🇳",
];

const AdminPage = ({ onBack }: { onBack: () => void }) => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const seedUsers = async () => {
        setLoading(true);
        setStatus('Seeding users...');
        try {
            await UserService.seedUsers(MOCK_USERS);
            setStatus('✅ 10 Users seeded successfully!');
        } catch (error) {
            console.error(error);
            setStatus('❌ Error seeding users');
        } finally {
            setLoading(false);
        }
    };

    const seedPollsByType = async (pollType: string) => {
        setLoading(true);
        setStatus(`Seeding ${pollType} polls...`);
        try {
            const users = await UserService.getUsers();
            if (!users || users.length === 0) {
                setStatus('❌ No users found. Seed users first!');
                return;
            }

            const templates = POLL_TEMPLATES[pollType as keyof typeof POLL_TEMPLATES] || [];
            const pollsToSeed = templates.map((template, index) => ({
                ...template,
                pollType,
                creatorId: users[index % users.length].id,
                votes: template.options.reduce((acc: any, opt: any) => {
                    acc[opt.id] = Math.floor(Math.random() * 50);
                    return acc;
                }, {}),
                likes: Math.floor(Math.random() * 100),
                dislikes: Math.floor(Math.random() * 20),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                maxVotes: null,
            }));
            await PollService.seedPolls(pollsToSeed);
            setStatus(`✅ ${templates.length} ${pollType} polls seeded!`);
        } catch (error) {
            console.error(error);
            setStatus(`❌ Error seeding ${pollType} polls`);
        } finally {
            setLoading(false);
        }
    };

    const seedAllPolls = async () => {
        setLoading(true);
        setStatus('Seeding all poll types...');
        try {
            for (const pollType of Object.keys(POLL_TEMPLATES)) {
                const templates = POLL_TEMPLATES[pollType as keyof typeof POLL_TEMPLATES];
                const pollsToSeed = templates.map((template, index) => ({
                    ...template,
                    pollType,
                    creatorId: (index % 10) + 1,
                    votes: {},
                    likes: Math.floor(Math.random() * 100),
                    dislikes: Math.floor(Math.random() * 20),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    maxVotes: null,
                }));
                await PollService.seedPolls(pollsToSeed);
            }
            setStatus('✅ All poll types seeded (35+ polls)!');
        } catch (error) {
            console.error(error);
            setStatus('❌ Error seeding polls');
        } finally {
            setLoading(false);
        }
    };

    const seedComments = async () => {
        setLoading(true);
        setStatus('Fetching polls to comment on...');
        try {
            const polls = await PollService.getFeed();
            if (!polls || polls.length === 0) {
                setStatus('❌ No polls found to seed comments on.');
                return;
            }

            setStatus('Seeding comments...');
            const users = await UserService.getUsers();
            const commentsToSeed: { pollId: number; userId: number; text: string }[] = [];
            // Take up to 20 polls
            const targetPolls = polls.slice(0, 20);

            for (const poll of targetPolls) {
                const numComments = Math.floor(Math.random() * 4) + 2;
                for (let j = 0; j < numComments; j++) {
                    commentsToSeed.push({
                        pollId: Number(poll.id),
                        userId: (users && users.length) ? users[Math.floor(Math.random() * users.length)].id : 1,
                        text: SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)]
                    });
                }
            }
            await CommentService.seedComments(commentsToSeed);
            setStatus(`✅ Comments seeded on ${targetPolls.length} polls!`);
        } catch (error) {
            console.error(error);
            setStatus('❌ Error seeding comments');
        } finally {
            setLoading(false);
        }
    };

    const seedEverything = async () => {
        setLoading(true);
        try {
            setStatus('Step 1/3: Seeding users...');
            const seededUsers = await UserService.seedUsers(MOCK_USERS);
            // Fallback if seededUsers is not array or valid
            let usersInfo = seededUsers;
            if (!Array.isArray(usersInfo) || usersInfo.length === 0) {
                usersInfo = await UserService.getUsers();
            }
            if (!usersInfo || usersInfo.length === 0) throw new Error("No users found");

            setStatus('Step 2/3: Seeding all poll types...');
            const allSeededPolls: any[] = [];
            for (const pollType of Object.keys(POLL_TEMPLATES)) {
                const templates = POLL_TEMPLATES[pollType as keyof typeof POLL_TEMPLATES];
                const pollsToSeed = templates.map((template, index) => ({
                    ...template,
                    pollType,
                    creatorId: usersInfo[index % usersInfo.length].id, // Use valid ID
                    votes: template.options.reduce((acc: any, opt: any) => {
                        acc[opt.id] = Math.floor(Math.random() * 50);
                        return acc;
                    }, {}),
                    likes: Math.floor(Math.random() * 100),
                    dislikes: Math.floor(Math.random() * 20),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    maxVotes: null,
                }));
                const seeded = await PollService.seedPolls(pollsToSeed);
                if (Array.isArray(seeded)) {
                    allSeededPolls.push(...seeded);
                }
            }

            setStatus('Step 3/3: Seeding comments...');
            const commentsToSeed: { pollId: number; userId: number; text: string }[] = [];

            // Use seeded polls if available, otherwise fallback logic (but dangerous)
            // Ideally we only comment on what we just created to be safe.
            const targetPolls = allSeededPolls.length > 0 ? allSeededPolls : [];

            for (const poll of targetPolls) {
                const numComments = Math.floor(Math.random() * 4) + 2;
                for (let j = 0; j < numComments; j++) {
                    commentsToSeed.push({
                        pollId: Number(poll.id),
                        userId: usersInfo[Math.floor(Math.random() * usersInfo.length)].id,
                        text: SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)]
                    });
                }
            }

            if (commentsToSeed.length > 0) {
                await CommentService.seedComments(commentsToSeed);
            }

            setStatus(`✅ Seed Complete! Created ${MOCK_USERS.length} users, ${allSeededPolls.length} polls, and ${commentsToSeed.length} comments.`);
        } catch (error) {
            console.error(error);
            setStatus('❌ Error during full seed');
        } finally {
            setLoading(false);
        }
    };

    const POLL_TYPES = ['multiple_choice', 'binary', 'image', 'ranking', 'slider', 'swipe', 'survey'];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black p-4 overflow-y-auto">
            <div className="flex items-center space-x-2 mb-4">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-2xl font-bold dark:text-white">Admin / Dev Tools</h1>
            </div>

            {status && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${status.includes('✅') || status.includes('🎉') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : status.includes('❌') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {status}
                </div>
            )}

            <div className="space-y-4">
                {/* Master Seed Button */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-xl text-white">
                    <div className="flex items-center space-x-3 mb-3">
                        <DuplicateIcon />
                        <h2 className="text-lg font-bold">Seed Everything</h2>
                    </div>
                    <p className="text-blue-100 text-sm mb-3">Users + All Poll Types + Comments</p>
                    <button onClick={seedEverything} disabled={loading} className="w-full py-2 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 disabled:opacity-50">
                        {loading ? 'Seeding...' : '🚀 Seed All Data'}
                    </button>
                </div>

                {/* Individual Seed Buttons */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
                    <h2 className="font-bold dark:text-white mb-3">Individual Seed Options</h2>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button onClick={seedUsers} disabled={loading} className="py-2 px-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium rounded-lg text-sm hover:bg-purple-200 disabled:opacity-50">
                            👥 10 Users
                        </button>
                        <button onClick={seedAllPolls} disabled={loading} className="py-2 px-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium rounded-lg text-sm hover:bg-green-200 disabled:opacity-50">
                            📊 All Polls
                        </button>
                        <button onClick={seedComments} disabled={loading} className="py-2 px-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium rounded-lg text-sm hover:bg-yellow-200 disabled:opacity-50 col-span-2">
                            💬 Seed Comments
                        </button>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Seed by Poll Type (5 each):</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {POLL_TYPES.map(type => (
                            <button key={type} onClick={() => seedPollsByType(type)} disabled={loading} className="py-2 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 capitalize">
                                {type.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User Credentials */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
                    <h2 className="font-bold dark:text-white mb-2">🔐 Test Credentials</h2>
                    <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                        {MOCK_USERS.map(user => (
                            <div key={user.id} className="flex justify-between items-center p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                                <span className="font-medium dark:text-white">{user.email}</span>
                                <span className="text-gray-500 font-mono">{user.password}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

import React, { useState } from 'react';
import { Poll, PollOption } from '../types';
import { CATEGORIES } from '../constants';
import { ChevronLeftIcon, ListIcon, ImageIcon, RankIcon, SliderIcon, HeartIcon, ChartBarIcon } from '../components/Icons';

interface AddPollPageProps {
    onBack: () => void;
    onPollCreate: (pollData: Partial<Poll>) => void;
    initialData?: Poll;
}

const AddPollPage: React.FC<AddPollPageProps> = ({ onBack, onPollCreate, initialData }) => {
    const [pollType, setPollType] = useState<Poll['pollType']>(initialData?.pollType || 'multiple_choice');
    const [question, setQuestion] = useState(initialData ? `${initialData.question} (Copy)` : '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [tags, setTags] = useState(initialData?.tags?.join(' ') || '');
    const [category, setCategory] = useState(initialData?.category || CATEGORIES[1]);
    const [options, setOptions] = useState<PollOption[]>(
        initialData?.options?.map(opt => ({ ...opt, id: Date.now() + Math.random() })) || [
            { id: 1, text: '' },
            { id: 2, text: '' },
        ]);

    // Swipe result config
    const [swipeResults, setSwipeResults] = useState(initialData?.swipeResults || { lowScoreTitle: 'You are Basic', highScoreTitle: 'You are Unique' });

    // Advanced Config
    const [expiresAt, setExpiresAt] = useState('');
    const [maxVotes, setMaxVotes] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const pollTypes = [
        { id: 'multiple_choice', name: 'Single Choice', icon: <ListIcon /> },
        { id: 'survey', name: 'Survey (Multi)', icon: <ChartBarIcon /> },
        { id: 'image', name: 'Image', icon: <ImageIcon /> },
        { id: 'ranking', name: 'Ranking', icon: <RankIcon /> },
        { id: 'slider', name: 'Slider', icon: <SliderIcon /> },
        { id: 'swipe', name: 'Swipe', icon: <HeartIcon /> },
    ];

    const handleAddOption = () => {
        if (options.length >= 10) return; // Allow more for swipe/survey
        setOptions([...options, { id: Date.now(), text: '' }]);
    };

    const handleRemoveOption = (id: string | number) => {
        // Allow removing down to 1 option ONLY for 'swipe' polls to enable single-card survey
        const minOptions = pollType === 'swipe' ? 1 : 2;
        if (options.length <= minOptions) return;
        setOptions(options.filter(opt => opt.id !== id));
    };

    const handleOptionTextChange = (id: string | number, text: string) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
    };

    const isFormValid = () => {
        if (!question.trim()) return false;
        if (pollType === 'slider') {
            return options.slice(0, 2).every(opt => opt.text.trim());
        }
        return options.every(opt => opt.text.trim());
    };

    const handleSubmit = () => {
        if (!isFormValid()) return;

        const finalOptions = pollType === 'slider' ? options.slice(0, 2) : options;

        const newPollData: Partial<Poll> = {
            question,
            description,
            pollType,
            options: finalOptions.map(opt => ({ ...opt, id: `opt-${Math.random()}` })),
            category,
            tags: tags.split(' ').map(t => t.trim().replace(/^#/, '')).filter(t => t.length > 0),
            ...(pollType === 'swipe' ? { swipeResults } : {}),
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            maxVotes: maxVotes ? parseInt(maxVotes) : undefined,
        };

        onPollCreate(newPollData);
    };

    const InputLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">{children}</label>;

    const renderOptionsUI = () => {
        switch (pollType) {
            case 'image':
                return options.slice(0, 2).map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-3 my-2">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <ImageIcon />
                        </div>
                        <input
                            type="text"
                            placeholder={`Option ${index + 1} Label`}
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                ));
            case 'slider':
                return (
                    <div>
                        <input
                            type="text"
                            placeholder="Start Label (e.g., Not Likely)"
                            value={options[0].text}
                            onChange={(e) => handleOptionTextChange(options[0].id, e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="End Label (e.g., Very Likely)"
                            value={options[1].text}
                            onChange={(e) => handleOptionTextChange(options[1].id, e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                );
            case 'multiple_choice':
            case 'ranking':
            case 'swipe':
            case 'survey':
            default:
                return (
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder={pollType === 'swipe' ? `Card ${index + 1} Text` : `Option ${index + 1}`}
                                    value={option.text}
                                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {(options.length > (pollType === 'swipe' ? 1 : 2)) && (
                                    <button onClick={() => handleRemoveOption(option.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        {options.length < (pollType === 'swipe' || pollType === 'survey' ? 15 : 6) && (
                            <button onClick={handleAddOption} className="w-full text-sm font-semibold text-blue-600 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 mt-2 transition-colors">
                                + Add {pollType === 'swipe' ? 'Card' : 'Option'}
                            </button>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto text-gray-900 dark:text-gray-100">Create Poll</h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-grow p-4 space-y-6 overflow-y-auto">
                <section>
                    <InputLabel>What's your question?</InputLabel>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., Who will win the next match?"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                        rows={2}
                    ></textarea>
                </section>

                <section>
                    <InputLabel>Description (Optional)</InputLabel>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add more context to your poll..."
                        className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                    ></textarea>
                </section>

                <section>
                    <InputLabel>Hashtags (Optional)</InputLabel>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g. #sports #cricket (separated by space)"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate tags with spaces.</p>
                </section>

                <section>
                    <InputLabel>Poll Type</InputLabel>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {pollTypes.map(pt => (
                            <button key={pt.id} onClick={() => setPollType(pt.id as any)} className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 border-2 transition-all ${pollType === pt.id ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                {pt.icon}
                                <span className="text-[10px] font-semibold">{pt.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {pollType === 'swipe' && (
                    <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <InputLabel>Result Persona (Results)</InputLabel>
                        <p className="text-xs text-gray-500 mb-2">If you only add 1 card, this is essentially a 'Like/Dislike' survey.</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Result if they swipe Left (Low Score)</label>
                                <input type="text" value={swipeResults.lowScoreTitle} onChange={e => setSwipeResults({ ...swipeResults, lowScoreTitle: e.target.value })} className="w-full bg-white dark:bg-gray-800 rounded px-3 py-1 text-sm border border-gray-200 dark:border-gray-700" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Result if they swipe Right (High Score)</label>
                                <input type="text" value={swipeResults.highScoreTitle} onChange={e => setSwipeResults({ ...swipeResults, highScoreTitle: e.target.value })} className="w-full bg-white dark:bg-gray-800 rounded px-3 py-1 text-sm border border-gray-200 dark:border-gray-700" />
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    <InputLabel>{pollType === 'slider' ? 'Slider Labels' : 'Options'}</InputLabel>
                    {renderOptionsUI()}
                </section>

                <section>
                    <InputLabel>Category</InputLabel>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 font-semibold">
                        {CATEGORIES.filter(c => c !== 'For You' && c !== 'Trending').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </section>

                {/* Advanced Settings */}
                <section className="border-t border-gray-200 dark:border-gray-800 pt-4">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-left font-semibold text-gray-700 dark:text-gray-300">
                        <span>Advanced Settings (Optional)</span>
                        <ChevronLeftIcon /> {/* Rotated via CSS if needed, or simple icon reuse */}
                    </button>
                    {showAdvanced && (
                        <div className="mt-4 space-y-4 animate-fade-in bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <div>
                                <InputLabel>Expiration Date & Time</InputLabel>
                                <input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Poll will automatically close after this time.</p>
                            </div>
                            <div>
                                <InputLabel>Maximum Votes</InputLabel>
                                <input
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={maxVotes}
                                    onChange={(e) => setMaxVotes(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Poll will close once it reaches this many votes.</p>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                <button onClick={handleSubmit} disabled={!isFormValid()} className="w-full p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors">
                    Post Poll
                </button>
            </footer>
        </div>
    );
};

export default AddPollPage;
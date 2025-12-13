import React, { useState } from 'react';
import { Poll, Comment } from '../types';
import { timeAgo, MOCK_USER } from '../constants';
import { ChevronLeftIcon, HeartIcon, PaperAirplaneIcon } from '../components/Icons';

interface CommentsPageProps {
    poll: Poll;
    onBack: () => void;
    isLoggedIn: boolean;
    requireLogin: (action: () => void) => void;
}

const CommentsPage: React.FC<CommentsPageProps> = ({ poll, onBack, isLoggedIn, requireLogin }) => {
    const [comments, setComments] = useState<Comment[]>(poll.comments);
    const [newComment, setNewComment] = useState('');

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '') return;

        if (!isLoggedIn) {
            requireLogin(() => handleAddComment(e));
            return;
        }

        const commentToAdd: Comment = { id: Date.now(), user: MOCK_USER, text: newComment, likes: 0, timestamp: new Date() };
        setComments(prev => [...prev, commentToAdd]);
        setNewComment('');
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold mx-auto text-gray-900 dark:text-gray-100">Comments</h1>
                <div className="w-10"></div>
            </header>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                        <img src={comment.user.avatar} alt={comment.user.username} className="w-9 h-9 rounded-full mt-1" />
                        <div className="flex-grow">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{comment.user.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(comment.timestamp)}</p>
                                </div>
                                <p className="text-gray-800 dark:text-gray-300 mt-1">{comment.text}</p>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1 px-2"><button className="font-semibold hover:underline">Reply</button><button className="flex items-center space-x-1 hover:text-red-500"><HeartIcon /><span>{comment.likes}</span></button></div>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddComment} className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                <div className="flex items-center space-x-2">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-full px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    <button type="submit" className="p-2 text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"><PaperAirplaneIcon /></button>
                </div>
            </form>
        </div>
    );
};

export default CommentsPage;
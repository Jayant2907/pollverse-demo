import React, { useState, useEffect, useRef } from 'react';
import { Poll, Comment, User } from '../types';
import { timeAgo } from '../constants';
import { ChevronLeftIcon, HeartIcon, PaperAirplaneIcon, XIcon } from '../components/Icons';
import { CommentService } from '../services/CommentService';
import ReactionPicker from '../components/ui/ReactionPicker';

interface CommentsPageProps {
    poll: Poll;
    onBack: () => void;
    isLoggedIn: boolean;
    requireLogin: (action: () => void) => void;
    currentUser: User;
}

const CommentItem: React.FC<{
    comment: Comment;
    onReply: (c: Comment) => void;
    onReact: (c: Comment, emoji: string) => void;
    pollCreatorId?: number | string;
    isReply?: boolean;
}> = ({ comment, onReply, onReact, pollCreatorId, isReply }) => {
    const isAuthor = pollCreatorId && String(comment.user?.id) === String(pollCreatorId);

    return (
        <div className={`flex flex-col ${isReply ? 'ml-10 mt-2' : 'mt-4 animate-fade-in'}`}>
            <div className="flex items-start space-x-3">
                <img
                    src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.username}`}
                    alt={comment.user?.username || 'User'}
                    className={`${isReply ? 'w-7 h-7' : 'w-10 h-10'} rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm`}
                />
                <div className="flex-grow min-w-0">
                    <div className={`relative group p-3 rounded-2xl ${isAuthor ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-xs text-gray-900 dark:text-gray-100 truncate">
                                    {comment.user?.username || 'Unknown'}
                                </p>
                                {isAuthor && (
                                    <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-tighter">Author</span>
                                )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">{timeAgo(comment.timestamp)}</p>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">{comment.text}</p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mt-1.5 px-2">
                        <ReactionPicker onSelect={(emoji) => onReact(comment, emoji)} currentReaction={comment.userInteraction}>
                            <button
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all active:scale-95 ${comment.userInteraction
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600'
                                    }`}
                            >
                                {comment.userInteraction && !['like', '👍'].includes(comment.userInteraction) ? (
                                    <span className="text-sm animate-fade-in-scale">{comment.userInteraction}</span>
                                ) : (
                                    <HeartIcon className={`h-3.5 w-3.5 ${comment.userInteraction === 'like' ? 'fill-red-500 text-red-500 animate-bounce' : ''}`} />
                                )}
                                <span className="text-xs font-black">
                                    {Object.values(comment.reactions || {}).reduce((a, b) => a + b, 0) || comment.likes || 0}
                                </span>
                            </button>
                        </ReactionPicker>
                        {!isReply && (
                            <button onClick={() => onReply(comment)} className="hover:text-blue-600 transition-colors uppercase tracking-widest text-[10px]">Reply</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Render nested replies if any */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-1">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onReact={onReact}
                            pollCreatorId={pollCreatorId}
                            isReply={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentsPage: React.FC<CommentsPageProps> = ({ poll, onBack, isLoggedIn, requireLogin, currentUser }) => {
    const [comments, setComments] = useState<Comment[]>(poll.comments || []);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchComments = async () => {
        const pid = Number(poll.id);
        if (isNaN(pid)) return;

        const fetched = await CommentService.getComments(pid, currentUser?.id ? Number(currentUser.id) : undefined);
        if (fetched && Array.isArray(fetched)) {
            setComments(fetched);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [poll.id, currentUser?.id]);

    const handleReactComment = async (comment: Comment, emoji: string) => {
        if (!isLoggedIn) {
            requireLogin(() => handleReactComment(comment, emoji));
            return;
        }

        const previousInteraction = comment.userInteraction;

        // Optimistic UI
        const updateCommentInList = (list: Comment[]): Comment[] => {
            return list.map(c => {
                if (String(c.id) === String(comment.id)) {
                    const newReactions = { ...(c.reactions || {}) };
                    let newLikes = c.likes;
                    let newUserInteraction: string | null = emoji;

                    if (previousInteraction === emoji) {
                        // Toggle Off
                        newUserInteraction = null;
                        if (newReactions[emoji] > 0) newReactions[emoji]--;
                        if (emoji === 'like' || emoji === '👍') newLikes = Math.max(0, newLikes - 1);
                    } else {
                        // Switch or New
                        if (previousInteraction && newReactions[previousInteraction] > 0) {
                            newReactions[previousInteraction]--;
                            if (previousInteraction === 'like' || previousInteraction === '👍') newLikes = Math.max(0, newLikes - 1);
                        }
                        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
                        if (emoji === 'like' || emoji === '👍') newLikes++;
                    }

                    return { ...c, userInteraction: newUserInteraction, reactions: newReactions, likes: newLikes, isLiked: newUserInteraction === 'like' };
                }
                if (c.replies) {
                    return { ...c, replies: updateCommentInList(c.replies) };
                }
                return c;
            });
        };

        setComments(prev => updateCommentInList(prev));

        try {
            await CommentService.reactToComment(Number(comment.id), Number(currentUser.id), emoji);
        } catch (error) {
            console.error("Failed to react to comment", error);
            fetchComments();
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '') return;

        if (!isLoggedIn) {
            requireLogin(() => handleAddComment(e));
            return;
        }

        setLoading(true);
        try {
            const rawComment = await CommentService.addComment(
                Number(poll.id),
                Number(currentUser.id),
                newComment,
                replyingTo ? Number(replyingTo.id) : undefined
            );

            const commentToAdd: Comment = {
                ...rawComment,
                id: rawComment.id,
                text: rawComment.text,
                likes: 0,
                timestamp: new Date(),
                user: currentUser,
                replies: [],
                isLiked: false
            };

            if (replyingTo) {
                // Add to replies of the parent
                setComments(prev => prev.map(c => {
                    if (String(c.id) === String(replyingTo.id)) {
                        return { ...c, replies: [commentToAdd, ...(c.replies || [])] };
                    }
                    return c;
                }));
                setReplyingTo(null);
            } else {
                setComments(prev => [commentToAdd, ...prev]);
            }

            setNewComment('');
            // Scroll to top if new root comment
            if (!replyingTo) {
                scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in overflow-hidden">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-30">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>
                <div className="ml-2">
                    <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none">Comments</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{poll.question}</p>
                </div>
            </header>

            <div ref={scrollRef} className="flex-grow p-4 pb-24 overflow-y-auto scrollbar-hide space-y-2">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                        <span className="text-6xl mb-4">💬</span>
                        <h3 className="text-lg font-bold">No comments yet</h3>
                        <p className="text-sm">Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={(c) => setReplyingTo(c)}
                            onReact={handleReactComment}
                            pollCreatorId={poll.creator?.id || poll.creatorId}
                        />
                    ))
                )}
            </div>

            <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-3 pb-8 z-30">
                {replyingTo && (
                    <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-t-xl border-t border-x border-blue-100 dark:border-blue-800 -mt-12 mb-2 animate-slide-up">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            Replying to <span className="font-black">@{replyingTo.user?.username}</span>
                        </p>
                        <button onClick={() => setReplyingTo(null)} className="text-blue-600 dark:text-blue-400 p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full">
                            <XIcon className="h-3 w-3" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleAddComment} className="flex items-center gap-3">
                    <img src={currentUser.avatar} className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-gray-800" alt="Me" />
                    <div className="flex-grow relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                            disabled={loading}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !newComment.trim()}
                        className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommentsPage;

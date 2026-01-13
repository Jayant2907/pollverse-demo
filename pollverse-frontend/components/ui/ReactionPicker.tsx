import React, { useState, useRef } from 'react';

const TOP_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    currentReaction?: string | null;
    children: React.ReactNode;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, currentReaction, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 500);
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={`transition-transform duration-200 ${isOpen ? 'scale-105' : ''}`}>
                {children}
            </div>

            {isOpen && (
                <div
                    className="absolute bottom-full mb-3 left-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-1.5 flex items-center gap-0.5 z-[100] animate-spring-up origin-bottom-left"
                    onMouseEnter={handleMouseEnter}
                >
                    {TOP_EMOJIS.map((emoji, index) => (
                        <button
                            key={emoji}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(emoji);
                                setIsOpen(false);
                            }}
                            style={{ animationDelay: `${index * 40}ms` }}
                            className={`group relative p-2.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all rounded-xl animate-fade-in-scale ${currentReaction === emoji ? 'bg-blue-50/50 dark:bg-blue-900/30' : ''}`}
                        >
                            <span className="text-2xl leading-none transition-transform group-hover:scale-150 group-active:scale-90 inline-block">
                                {emoji}
                            </span>
                            {currentReaction === emoji && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("More expression coming soon!");
                        }}
                        className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                    >
                        <span className="text-xl font-bold leading-none">+</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReactionPicker;

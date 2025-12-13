import React, { useState } from 'react';
import { Poll } from '../../types';
import { XIcon, HeartIcon, ShareIcon } from '../Icons';
import confetti from 'canvas-confetti';

interface SwipePollProps {
  poll: Poll;
  onVoteComplete: () => void;
}

const SwipePoll: React.FC<SwipePollProps> = ({ poll, onVoteComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [lastDirection, setLastDirection] = useState<'left' | 'right' | null>(null);

  // Simple vibration helper
  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    vibrate();
    setLastDirection(direction);
    
    // Accumulate score (Right = Yes = 1 point)
    if (direction === 'right') {
      setScore(prev => prev + 1);
    }

    // Animation delay then move to next
    setTimeout(() => {
      setLastDirection(null);
      if (currentIndex < poll.options.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        finishPoll();
      }
    }, 200);
  };

  const finishPoll = () => {
    setIsFinished(true);
    // Big celebration for finishing
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    onVoteComplete();
  };

  // Calculate Result
  const getResultTitle = () => {
    const ratio = score / poll.options.length;
    return ratio > 0.5 
      ? poll.swipeResults?.highScoreTitle || "High Scorer!"
      : poll.swipeResults?.lowScoreTitle || "Low Scorer!";
  };

  if (isFinished) {
    return (
      <div className="h-64 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-xl animate-pop text-center">
        <h3 className="text-sm uppercase tracking-widest opacity-80 mb-2">Your Personality Type</h3>
        <h2 className="text-3xl font-extrabold mb-4">{getResultTitle()}</h2>
        <div className="text-6xl font-black mb-4">{Math.round((score / poll.options.length) * 100)}%</div>
        <p className="text-sm mb-4">Match Score</p>
        <button className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold flex items-center space-x-2 shadow-lg hover:scale-105 transition-transform">
          <ShareIcon /> <span>Share Result</span>
        </button>
      </div>
    );
  }

  const currentOption = poll.options[currentIndex];

  return (
    <div className="relative h-64 w-full flex flex-col items-center justify-center">
      <div className="absolute top-2 right-2 text-xs font-bold text-gray-400">
        {currentIndex + 1} / {poll.options.length}
      </div>

      {/* Card Stack Effect */}
      <div className="absolute w-full max-w-[85%] h-56 bg-gray-200 dark:bg-gray-700 rounded-xl transform translate-y-2 scale-95 -z-10"></div>
      
      {/* Active Card */}
      <div className={`w-full max-w-[90%] h-56 bg-white dark:bg-gray-800 border-2 ${lastDirection === 'left' ? 'border-red-500 rotate-[-10deg] translate-x-[-50px] opacity-0' : lastDirection === 'right' ? 'border-green-500 rotate-[10deg] translate-x-[50px] opacity-0' : 'border-gray-200 dark:border-gray-600'} rounded-xl shadow-lg flex items-center justify-center p-6 text-center transition-all duration-300`}>
        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{currentOption.text}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-8 mt-6">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 text-red-500 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <XIcon />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <HeartIcon />
        </button>
      </div>
    </div>
  );
};

export default SwipePoll;
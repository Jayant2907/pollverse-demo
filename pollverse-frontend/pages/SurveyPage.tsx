import React, { useState } from 'react';
import { Poll } from '../types';
import { ChevronLeftIcon } from '../components/Icons';
import confetti from 'canvas-confetti';

interface SurveyPageProps {
    poll: Poll;
    onBack: () => void;
    onComplete: (pollId: string | number) => void;
}

const SurveyPage: React.FC<SurveyPageProps> = ({ poll, onBack, onComplete }) => {
    const questions = poll.surveyQuestions || [];
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string | number, (string | number)[]>>({});
    const [completed, setCompleted] = useState(false);

    const currentQuestion = questions[currentStep];
    const totalSteps = questions.length;

    // Calculate progress (currentStep / totalSteps * 100)
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const handleOptionToggle = (optionId: string | number) => {
        const qId = currentQuestion.id;
        const currentAnswers = answers[qId] || [];
        const isMultiple = currentQuestion.allowMultiple;

        let newAnswers;
        if (isMultiple) {
            if (currentAnswers.includes(optionId)) {
                newAnswers = currentAnswers.filter(id => id !== optionId);
            } else {
                newAnswers = [...currentAnswers, optionId];
            }
        } else {
            newAnswers = [optionId];
        }

        setAnswers({ ...answers, [qId]: newAnswers });
    };

    const handleNext = () => {
        if (currentQuestion.required && (!answers[currentQuestion.id] || answers[currentQuestion.id].length === 0)) {
            // Shake animation or error toast could go here
            return;
        }

        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        setCompleted(true);
        const colors = ['#3b82f6', '#ef4444', '#10b981'];
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors
        });
        setTimeout(() => {
            onComplete(poll.id);
            onBack();
        }, 1500);
    };

    const isCurrentRequired = currentQuestion?.required;
    const hasAnsweredCurrent = answers[currentQuestion?.id]?.length > 0;

    if (completed) {
        return (
            <div className="h-full w-full bg-white dark:bg-black flex items-center justify-center animate-fade-in">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Survey Completed!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Thank you for your feedback.</p>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="h-full w-full bg-white dark:bg-black flex items-center justify-center animate-fade-in">
                <div className="text-center p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">No questions found</h2>
                    <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            {/* Header */}
            <header className="flex-shrink-0 p-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="text-gray-600 dark:text-gray-400 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                        <ChevronLeftIcon />
                    </button>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Survey ({currentStep + 1}/{totalSteps})</span>
                    <div className="w-8"></div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-grow p-6 overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                    {currentQuestion.text}
                </h2>
                {isCurrentRequired && <p className="text-red-500 text-xs font-semibold mb-6">* Required</p>}

                <div className="space-y-3">
                    {currentQuestion.options.map(option => {
                        const isSelected = answers[currentQuestion.id]?.includes(option.id);
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionToggle(option.id)}
                                className={`w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200 text-left group ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${isSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300 dark:border-gray-500 group-hover:border-gray-400'
                                    }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                </div>
                                <span className={`font-medium text-lg ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {option.text}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
                <button
                    onClick={handleNext}
                    disabled={isCurrentRequired && !hasAnsweredCurrent}
                    className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg ${isCurrentRequired && !hasAnsweredCurrent
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30'
                        }`}
                >
                    {currentStep === totalSteps - 1 ? 'Submit' : 'Next'}
                </button>
            </footer>
        </div>
    );
};

export default SurveyPage;
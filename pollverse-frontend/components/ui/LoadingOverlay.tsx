import React from 'react';

const LoadingOverlay: React.FC<{ show: boolean }> = ({ show }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                    <p className="font-bold text-gray-900 dark:text-white">Processing...</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Please wait a moment</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;

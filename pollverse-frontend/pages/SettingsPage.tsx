import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeftIcon, MoonIcon, SunIcon } from '../components/Icons';
import Toggle from '../components/ui/Toggle';

interface SettingsPageProps {
    onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    const { theme, toggleTheme } = useTheme();
    return (
     <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
        <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
            <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
            <h1 className="text-xl font-bold mx-auto text-gray-900 dark:text-gray-100">Settings</h1>
             <div className="w-10"></div>
        </header>
        <div className="flex-grow p-4 space-y-6 overflow-y-auto">
           <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">Appearance</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                        <span className="font-semibold">Dark Mode</span>
                    </div>
                    <Toggle enabled={theme === 'dark'} onChange={toggleTheme} />
                </div>
           </div>
        </div>
    </div>
    );
};

export default SettingsPage;
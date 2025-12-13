import React, { useState } from 'react';
import { Poll } from '../types';
import { getTotalVotes } from '../constants';
import { ChevronLeftIcon, BarChartIcon, PieChartIcon } from '../components/Icons';
import { BarChart, PieChart } from '../components/charts/PollCharts';

interface ResultsPageProps {
    poll: Poll;
    onBack: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ poll, onBack }) => {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col p-4 animate-fade-in">
            <header className="flex-shrink-0 flex items-center mb-6"><button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button><h1 className="text-xl font-bold mx-auto text-gray-900 dark:text-gray-100">Results</h1> <div className="w-10"></div></header>
            <div className="text-center mb-4"><p className="text-lg font-semibold">{poll.question}</p><p className="text-sm text-gray-500 dark:text-gray-400">{getTotalVotes(poll.votes).toLocaleString()} total votes</p></div>
            
            <div className="flex justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                <button onClick={() => setChartType('bar')} className={`w-1/2 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}><BarChartIcon /> Bar</button>
                <button onClick={() => setChartType('pie')} className={`w-1/2 flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${chartType === 'pie' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}><PieChartIcon /> Pie</button>
            </div>
            
            {chartType === 'bar' ? <BarChart data={poll.votes} options={poll.options} /> : <PieChart data={poll.votes} options={poll.options} />}
            
            <div className="space-y-3 mt-6">
                {poll.options.map(option => {
                    const percentage = (poll.votes[option.id] / getTotalVotes(poll.votes) * 100) || 0;
                    return (
                        <div key={option.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-1"><span className="font-semibold">{option.text}</span><span className="text-sm font-bold text-blue-600 dark:text-blue-400">{poll.votes[option.id]?.toLocaleString() || 0} votes</span></div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResultsPage;
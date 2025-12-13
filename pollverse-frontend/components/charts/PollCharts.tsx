import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { PollOption } from '../../types';
import { getTotalVotes } from '../../constants';

interface ChartProps {
  data: Record<string | number, number>;
  options: PollOption[];
}

export const BarChart: React.FC<ChartProps> = ({ data, options }) => {
    const chartData = options.map(opt => ({
        name: opt.text,
        votes: data[opt.id] || 0
    }));

    return (
        <div className="w-full h-64 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
             <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                        itemStyle={{ color: '#60a5fa' }}
                    />
                    <Bar dataKey="votes" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const PieChart: React.FC<ChartProps> = ({ data, options }) => {
    const total = getTotalVotes(data);
    const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6'];
    
    const chartData = options.map((opt, index) => ({
        name: opt.text,
        value: data[opt.id] || 0,
        color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);

    return (
        <div className="w-full h-64 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center animate-fade-in">
             <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    />
                </RechartsPieChart>
            </ResponsiveContainer>
             <div className="flex flex-wrap justify-center gap-2 mt-2">
                {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: entry.color }}></span>
                        {entry.name} ({((entry.value / total) * 100).toFixed(0)}%)
                    </div>
                ))}
            </div>
        </div>
    );
};
import React, { useEffect, useState } from 'react';
import { ModerationLog } from '../../types';
import { ShieldCheck, ShieldAlert, FileEdit, Clock } from '../Icons';

interface ModerationTimelineProps {
    pollId: number | string;
}

const ModerationTimeline: React.FC<ModerationTimelineProps> = ({ pollId }) => {
    const [logs, setLogs] = useState<ModerationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`http://localhost:3000/polls/${pollId}/moderation-history`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [pollId]);

    if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading moderation history...</div>;
    if (logs.length === 0) return <div className="text-sm text-gray-500">No moderation history yet.</div>;

    return (
        <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 my-4 space-y-6">
            {logs.map((log) => (
                <div key={log.id} className="relative pl-6">
                    <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-gray-800
            ${log.action === 'APPROVE' ? 'text-green-500 border-green-200' :
                            log.action === 'REJECT' ? 'text-red-500 border-red-200' :
                                log.action === 'RESUBMITTED' ? 'text-blue-500 border-blue-200' : 'text-yellow-500 border-yellow-200'}`}>
                        {log.action === 'APPROVE' && <ShieldCheck className="w-3 h-3" />}
                        {log.action === 'REJECT' && <ShieldAlert className="w-3 h-3" />}
                        {log.action === 'REQUEST_CHANGES' && <FileEdit className="w-3 h-3" />}
                        {log.action === 'RESUBMITTED' && <ShieldCheck className="w-3 h-3" />}
                    </div>

                    <div className="flex items-center gap-2 mb-1">

                        <span className={`font-semibold text-sm 
              ${log.action === 'APPROVE' ? 'text-green-600' :
                                log.action === 'REJECT' ? 'text-red-600' :
                                    log.action === 'RESUBMITTED' ? 'text-blue-600' : 'text-yellow-600'}`}>
                            {log.action === 'APPROVE' ? 'Approved' :
                                log.action === 'REJECT' ? 'Rejected' :
                                    log.action === 'RESUBMITTED' ? 'Resubmitted' : 'Changes Requested'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                    </div>

                    <div className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-medium text-gray-900 dark:text-white">{log.moderator?.username || 'Moderator'}</span>
                        {log.comment && <span className="ml-1 text-gray-600 dark:text-gray-400">- "{log.comment}"</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ModerationTimeline;

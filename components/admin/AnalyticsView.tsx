import React, { useMemo, useState } from 'react';
import { LogEntry, Project } from '../../types';

const BarChart = ({ data, title }: { data: { label: string; value: number, color: string }[], title: string }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-brand-light mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(item => (
                    <div key={item.label} className="grid grid-cols-4 items-center gap-4">
                        <span className="text-sm text-gray-400 col-span-1 truncate">{item.label}</span>
                        <div className="col-span-3 bg-gray-700 rounded-full h-6">
                            <div
                                className={`h-6 rounded-full flex items-center justify-end px-2 ${item.color}`}
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            >
                                <span className="text-xs font-bold text-white">{item.value}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LogLevelPill = ({ level }: { level: LogEntry['level'] }) => {
    const levelColors: Record<LogEntry['level'], string> = {
        'INFO': 'bg-blue-600/30 text-blue-300 border-blue-500',
        'WARN': 'bg-yellow-600/30 text-yellow-300 border-yellow-500',
        'ERROR': 'bg-red-600/30 text-red-300 border-red-500',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${levelColors[level]}`}>{level}</span>;
}


interface AnalyticsViewProps {
    logs: LogEntry[];
    projects: Project[];
}

export const AnalyticsView = ({ logs, projects }: AnalyticsViewProps) => {
    const [logFilter, setLogFilter] = useState<LogEntry['level'] | 'ALL'>('ALL');
    const [logSearchTerm, setLogSearchTerm] = useState('');

    const analysisSuccessRate = useMemo(() => {
        const success = logs.filter(l => l.message.includes('completed successfully')).length;
        const failure = logs.filter(l => l.message.includes('Failed')).length;
        return [
            { label: 'Success', value: success, color: 'bg-green-600' },
            { label: 'Failure', value: failure, color: 'bg-red-600' },
        ];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => logFilter === 'ALL' || log.level === logFilter)
            .filter(log => log.message.toLowerCase().includes(logSearchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, logFilter, logSearchTerm]);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand-light">System Analytics</h2>
            
            <BarChart data={analysisSuccessRate} title="AI Analysis Success Rate" />

            <div>
                <h3 className="text-lg font-semibold text-brand-light mb-4">System Event Logs</h3>
                <div className="flex gap-4 mb-4">
                     <input
                        type="text"
                        placeholder="Search logs..."
                        value={logSearchTerm}
                        onChange={(e) => setLogSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan"
                    />
                     <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value as any)}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2"
                    >
                        <option value="ALL">All Levels</option>
                        <option value="INFO">Info</option>
                        <option value="WARN">Warning</option>
                        <option value="ERROR">Error</option>
                    </select>
                </div>
                 <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900 text-sm text-gray-300 uppercase sticky top-0">
                            <tr>
                                <th className="px-6 py-3 w-1/5">Timestamp</th>
                                <th className="px-6 py-3 w-24">Level</th>
                                <th className="px-6 py-3">Message</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-200 text-sm font-mono">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-3 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-3"><LogLevelPill level={log.level} /></td>
                                    <td className="px-6 py-3">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
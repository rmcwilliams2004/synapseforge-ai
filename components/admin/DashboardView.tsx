import React, { useMemo } from 'react';
// FIX: Changed Project to ProjectIndexEntry to avoid needing the full 'history' object.
import { User, ProjectIndexEntry, LogEntry } from '../../types';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}
const StatCard = ({ title, value, icon }: StatCardProps) => (
    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg flex items-center gap-6">
        <div className="bg-gray-700 p-4 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const BarChart = ({ data, title }: { data: { label: string; value: number, color?: string }[], title: string }) => {
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
                                className={`${item.color || 'bg-purple-600'} h-6 rounded-full flex items-center justify-end px-2`}
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

const Icons = {
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>,
    Projects: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    Analyses: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3M5.636 5.636l-1.414-1.414m15.152 0l-1.414 1.414M5.636 18.364l-1.414 1.414m15.152 0l-1.414-1.414M12 12a5 5 0 11-10 0 5 5 0 0110 0z" /></svg>,
    LogInfo: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>,
    LogWarn: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
};


interface DashboardViewProps {
    users: User[];
    // FIX: Changed projects prop to use ProjectIndexEntry.
    projects: ProjectIndexEntry[];
    logs: LogEntry[];
}

export const DashboardView = ({ users, projects, logs }: DashboardViewProps) => {

    // FIX: Changed totalAnalyses calculation to be based on user.analysesRun.
    // This is more accurate to the metric "Analyses Run" and removes the dependency on the full project.history object.
    const totalAnalyses = useMemo(() => {
        return users.reduce((sum, user) => sum + user.analysesRun, 0);
    }, [users]);

    const modelUsageData = useMemo(() => {
        const coreAnalysisCount = logs.filter(log => log.message.includes('Core Analysis Failed') || log.message.includes('completed successfully')).length;
        const drawingCount = logs.filter(log => log.message.includes('2D drawing generation')).length / 2;
        const videoCount = logs.filter(log => log.message.includes('video generation')).length / 2;
        const devinciCount = logs.filter(log => log.message.includes('DeVinci session')).length / 2;

        return [
            { label: 'Core Analysis', value: Math.round(coreAnalysisCount) },
            { label: '2D Drawings', value: Math.round(drawingCount) },
            { label: 'Video Animations', value: Math.round(videoCount) },
            { label: 'DeVinci Sessions', value: Math.round(devinciCount) },
        ].sort((a,b) => b.value - a.value);
    }, [logs]);

    const recentActivity = useMemo(() => {
        return logs
            .filter(log => log.level !== 'ERROR')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);
    }, [logs]);

    const topUsersData = useMemo(() => {
        return [...users]
            .sort((a, b) => b.analysesRun - a.analysesRun)
            .slice(0, 5)
            .map(user => ({ label: user.name, value: user.analysesRun, color: 'bg-cyan-600' }));
    }, [users]);
    
    const factionUsageData = useMemo(() => {
        const counts: Record<string, number> = {};
        const factionRegex = /with faction "([^"]+)"/;
        logs.forEach(log => {
            const match = log.message.match(factionRegex);
            if (match && match[1]) {
                counts[match[1]] = (counts[match[1]] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([label, value]) => ({ label, value, color: 'bg-teal-600' }))
            .sort((a, b) => b.value - a.value);
    }, [logs]);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand-light">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={users.length} icon={<Icons.Users />} />
                <StatCard title="Total Projects" value={projects.length} icon={<Icons.Projects />} />
                <StatCard title="Total Analyses Run" value={totalAnalyses} icon={<Icons.Analyses />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <BarChart data={modelUsageData} title="AI Model Usage" />
                 <BarChart data={topUsersData} title="Top Active Users (by Analyses)" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <BarChart data={factionUsageData} title="Faction Usage Distribution" />

                 <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-brand-light mb-4">Recent Activity</h3>
                    <ul className="space-y-3">
                        {recentActivity.map(log => (
                            <li key={log.id} className="flex items-start gap-3 text-sm">
                                <div className="flex-shrink-0 mt-1">
                                    {log.level === 'INFO' ? <Icons.LogInfo /> : <Icons.LogWarn />}
                                </div>
                                <div>
                                    <p className="text-gray-300">{log.message}</p>
                                    <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
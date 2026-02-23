
import React, { useMemo, useState } from 'react';
import { User, ComputeEvent } from '../../types';
import { CreditCard, Zap, Activity, HardDrive, DollarSign, Plus, ArrowUpRight, ShieldCheck, Download } from 'lucide-react';

interface MonetizationViewProps {
    users: User[];
    events: ComputeEvent[];
    onUpdateUser: (user: User) => void;
}

export const MonetizationView: React.FC<MonetizationViewProps> = ({ users, events, onUpdateUser }) => {
    // ADMIN RATE CONTROLLER: Define the "Sovereign Export" and "Compute" rates
    const [computeRates, setComputeRates] = useState({
        videoIngestion: 1.50,
        physicsAudit: 10.00,
        sovereignExport: 25.00
    });

    const totalCost = useMemo(() => events.reduce((sum, e) => sum + e.cost, 0), [events]);
    const exportEvents = useMemo(() => events.filter(e => e.type === 'SOVEREIGN_EXPORT'), [events]);
    const totalExportRevenue = useMemo(() => exportEvents.reduce((sum, e) => sum + e.cost, 0), [exportEvents]);
    
    // Updated Stats with Credit Tracker and Export Revenue
    const stats = [
        { label: 'Total Compute Spend', val: `$${totalCost.toFixed(2)}`, icon: DollarSign, color: 'text-brand-cyan' },
        { label: 'Export Revenue', val: `$${totalExportRevenue.toFixed(2)}`, icon: ShieldCheck, color: 'text-purple-500' },
        { label: 'Active Credit Reserve', val: '42K', icon: Zap, color: 'text-amber-500' }
    ];

    const adjustCredits = (user: User, amount: number) => {
        onUpdateUser({
            ...user,
            forgeCredits: (user.forgeCredits || 0) + amount
        });
    };

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Compute & Monetization</h2>
                    <div className="flex items-center gap-3 mt-4">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Sovereign Ledger & Resource Management</p>
                        <div className="h-3 w-px bg-slate-300"></div>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <HardDrive className="w-3 h-3" />
                            <span>PostgreSQL: compute_credits</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                        Generate Financial Export
                    </button>
                </div>
            </div>

            {/* Compute Credit Tracker Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-8 rounded-[2rem] flex items-center justify-between shadow-sm group hover:border-brand-cyan/30 transition-all">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                            <span className={`text-4xl font-black italic tracking-tighter ${stat.color}`}>{stat.val}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-brand-cyan transition-colors">
                            <stat.icon className="w-8 h-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Admin Rate Controller for Sovereignty Fees */}
            <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] ml-1">Global Rate Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(computeRates).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-mono font-black text-slate-900">${value.toFixed(2)}</span>
                                <button className="text-[9px] font-black text-brand-cyan uppercase hover:underline">Update Rate</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Forge Credit Management */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] ml-1">Identity Credit Management</h3>
                    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="p-8 space-y-6">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-300">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[100px]">{user.name}</p>
                                            <p className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">{user.forgeCredits || 0} CR</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => adjustCredits(user, 100)} className="p-2 bg-white border border-slate-200 rounded-lg hover:text-brand-cyan transition-colors shadow-sm"><Plus className="w-3 h-3" /></button>
                                        <button onClick={() => adjustCredits(user, -100)} className="p-2 bg-white border border-slate-200 rounded-lg hover:text-red-500 transition-colors shadow-sm"><ArrowUpRight className="w-3 h-3 rotate-180" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Compute & Export Event Ledger */}
                <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] ml-1">Event & Export Ledger</h3>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 w-[25%]">Timestamp</th>
                                    <th className="px-8 py-5 w-[35%]">Context</th>
                                    <th className="px-8 py-5 w-[20%]">User</th>
                                    <th className="px-8 py-5 w-[20%] text-right">Credit Burn</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] font-bold text-slate-700">
                                {events.map(ev => (
                                    <tr key={ev.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    ev.type === 'SOVEREIGN_EXPORT' ? 'bg-green-500' : 
                                                    ev.type === 'GENESIS_AUDIT' ? 'bg-brand-cyan' : 'bg-purple-500'
                                                }`} />
                                                <span className="uppercase tracking-widest">{ev.type.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500">{ev.user}</td>
                                        <td className={`px-8 py-5 text-right font-black ${ev.type === 'SOVEREIGN_EXPORT' ? 'text-green-600' : 'text-slate-900'}`}>
                                            -${ev.cost.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

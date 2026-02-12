import React, { useState, useEffect } from 'react';
import { Milestone } from '../types';

export const SystemToast: React.FC = () => {
    const [milestone, setMilestone] = useState<Milestone | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleMilestone = (e: any) => {
            const data = e.detail;
            setMilestone({
                ...data,
                timestamp: new Date().toISOString()
            });
            setVisible(true);
            
            // Auto-hide after 8 seconds
            setTimeout(() => setVisible(false), 8000);
        };

        window.addEventListener('forge-milestone', handleMilestone);
        return () => window.removeEventListener('forge-milestone', handleMilestone);
    }, []);

    if (!visible || !milestone) return null;

    const getIcon = () => {
        switch (milestone.type) {
            case 'STRUCTURAL':
                return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
            case 'LEGAL':
                return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
            default:
                return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 00 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 00 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[70] animate-slide-in-up">
            <div className="bg-gray-950/90 border-2 border-brand-cyan/40 px-8 py-5 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] flex items-center gap-6 backdrop-blur-2xl max-w-md">
                <div className="w-12 h-12 bg-brand-cyan/20 rounded-2xl flex items-center justify-center text-brand-cyan shadow-inner">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <h5 className="text-[10px] font-black text-brand-cyan uppercase tracking-widest leading-none">Milestone Achieved</h5>
                        <span className="text-[8px] font-mono text-gray-600">{new Date(milestone.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-white text-md font-black leading-tight italic uppercase tracking-tighter mb-1">{milestone.title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{milestone.description}</p>
                </div>
                <button onClick={() => setVisible(false)} className="self-start text-gray-600 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {/* Success Chime Effect */}
            <div className="absolute inset-0 bg-brand-cyan/10 rounded-3xl blur-xl animate-pulse"></div>
        </div>
    );
};

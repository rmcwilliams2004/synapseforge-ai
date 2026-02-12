import React, { useState, useEffect } from 'react';

interface SectionProps {
  id?: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
}

export const Section: React.FC<SectionProps> = ({ id, title, children, actions, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        const handleHighlight = (e: any) => {
            if (id && e.detail === id) {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 3000);
            }
            // Agnostic Capability Mappings for Orientation Highlights
            if (id === 'ai_suggestions' && e.detail === 'structural') {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 3000);
            }
             if (id === 'manufacturing_analysis' && e.detail === 'logic') {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 3000);
            }
             if (id === 'patent_application' && e.detail === 'sovereignty') {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 3000);
            }
        };
        window.addEventListener('forge-highlight', handleHighlight);
        return () => window.removeEventListener('forge-highlight', handleHighlight);
    }, [id]);

    return (
        <div id={id} className={`mb-6 animate-fade-in transition-all duration-500 ${isPulsing ? 'ring-4 ring-brand-cyan/50 rounded-xl bg-brand-cyan/5 scale-[1.01]' : ''}`} style={{ animationDelay: '150ms' }}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-cyan-500/30 dark:border-cyan-800/50">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-brand-cyan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <h3 className="text-xl font-bold text-brand-cyan flex items-center gap-2">
                        {title}
                        {isPulsing && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>}
                    </h3>
                </div>
                {actions && <div className="flex gap-2 items-center">{actions}</div>}
            </div>
            {isOpen && <div className="pl-8">{children}</div>}
        </div>
    );
}

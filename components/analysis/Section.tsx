import React, { useState } from 'react';

interface SectionProps {
  id?: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
}

export const Section: React.FC<SectionProps> = ({ id, title, children, actions, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div id={id} className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-cyan-800/50">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-brand-cyan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <h3 className="text-xl font-bold text-brand-cyan">{title}</h3>
                </div>
                {actions && <div className="flex gap-2 items-center">{actions}</div>}
            </div>
            {isOpen && <div className="pl-8">{children}</div>}
        </div>
    );
}

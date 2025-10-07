import React, { useState, useRef, useEffect } from 'react';
import { Role, User } from '../types';

interface HeaderProps {
    onStartTour: () => void;
    onOpenUserManual: () => void;
    authenticatedUser: User | null;
    onLogout: () => void;
    onOpenProfile: () => void;
    viewMode: 'app' | 'admin';
    onToggleViewMode: () => void;
}

export const Header = ({ onStartTour, onOpenUserManual, authenticatedUser, onLogout, onOpenProfile, viewMode, onToggleViewMode }: HeaderProps) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <header className="py-4 px-6 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-brand-cyan" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-brand-light tracking-wider">
              Synapse<span className="text-brand-cyan">Forge</span> AI
            </h1>
            <p className="text-xs text-gray-400 -mt-1">{viewMode === 'app' ? 'AI-Powered Reverse Engineering & Product Analysis' : 'Administration Dashboard'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {authenticatedUser && (
                <div className="flex items-center gap-4">
                    {authenticatedUser.role === Role.Admin && (
                        <button
                            onClick={onToggleViewMode}
                            className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition-transform active:scale-95 text-sm flex items-center gap-2"
                        >
                            {viewMode === 'app' ? (
                                <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
                                Admin Dashboard
                                </>
                            ) : (
                                <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m15 15-6 6m0 0-6-6m6 6V9a6 6 0 0 1 12 0v3" /></svg>
                                 Back to App
                                </>
                            )}
                        </button>
                    )}
                   <button
                    onClick={onOpenUserManual}
                    className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition-transform active:scale-95 text-sm flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                      User Manual
                  </button>
                  <button
                    onClick={onStartTour}
                    className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition-transform active:scale-95 text-sm flex items-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                      </svg>
                    Tour
                  </button>
                   <div className="h-8 border-l border-gray-600"></div>
                   <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 text-white font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 p-1.5 bg-gray-700 rounded-full"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                            {authenticatedUser.name}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                        </button>
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-30 animate-fade-in" style={{animationDuration: '0.15s'}}>
                                <button onClick={() => { onOpenProfile(); setIsProfileOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Profile</button>
                                <button onClick={() => { onLogout(); setIsProfileOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Sign Out</button>
                            </div>
                        )}
                   </div>
               </div>
           )}
        </div>
      </header>
    );
}
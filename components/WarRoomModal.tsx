import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { InnovationCouncil, Innovator } from '../types';
import { INNOVATORS } from '../constants';

interface WarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  council: InnovationCouncil | null;
  isLoading: boolean;
  onOpenWarRoom: (council: InnovationCouncil) => void;
  projectName?: string;
}

export const WarRoomModal: React.FC<WarRoomModalProps> = ({ isOpen, onClose, council, isLoading, onOpenWarRoom, projectName = "Technical Proposal" }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen && !isLoading && council) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, isLoading, council]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] animate-fade-in" style={{ animationDuration: '0.4s' }} onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] w-full max-w-5xl h-[85vh] flex flex-col border border-gray-700 animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header Section */}
        <header className="flex-shrink-0 px-8 py-6 border-b border-white/5 bg-gradient-to-r from-blue-900/10 to-transparent">
          <div className="flex justify-between items-start">
             <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                  <span>Talent Scout Analysis</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-none">Council Assembled</h2>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-brand-cyan"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                   {projectName}
                </p>
             </div>
             <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-6">
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full animate-pulse" />
                  <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white mb-2">Scanning Technical Core...</h3>
                  <p className="text-gray-500 text-sm italic font-mono uppercase tracking-widest animate-pulse">Matching theoretical bottlenecks against historical roster...</p>
               </div>
            </div>
          ) : council ? (
            <div className={`space-y-10 transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
              
              {/* Recruiter Insight */}
              <div className="bg-blue-600/5 border-l-4 border-blue-500/50 p-6 rounded-r-xl">
                 <h4 className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-2">Recruiter Analysis</h4>
                 <p className="text-gray-200 text-lg leading-relaxed font-serif italic italic opacity-90">
                    "{council.project_analysis}"
                 </p>
              </div>

              {/* Council Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {council.recommended_council.map((rec, idx) => {
                  const innovator = INNOVATORS.find(i => i.id === rec.innovator_id);
                  if (!innovator) return null;
                  
                  // Module based theme colors
                  const theme = innovator.module === 'Visionary Architect' ? 'border-purple-500/30 text-purple-300' 
                             : innovator.module === 'Empirical Optimizer' ? 'border-emerald-500/30 text-emerald-300'
                             : innovator.module === 'Lateral Thinker' ? 'border-cyan-500/30 text-cyan-300'
                             : 'border-amber-500/30 text-amber-300';

                  return (
                    <div 
                        key={idx} 
                        className={`bg-gray-800/40 p-6 rounded-2xl border ${theme} transition-all duration-700 hover:bg-gray-800/60 flex flex-col gap-4`}
                        style={{ transitionDelay: `${idx * 150}ms` }}
                    >
                       <div className="flex justify-between items-start">
                          <div className={`p-3 bg-gray-900 rounded-xl border border-white/5 ${theme.split(' ')[1]}`}>
                             <span className="text-2xl font-black">{innovator.name.charAt(0)}</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 border border-current px-2 py-0.5 rounded">
                             {rec.role_in_room}
                          </span>
                       </div>
                       <div>
                          <h5 className="text-white font-black text-xl mb-1">{innovator.name}</h5>
                          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono mb-4">{innovator.era}</p>
                          <div className="space-y-2">
                             <h6 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Selection Logic</h6>
                             <p className="text-xs text-gray-300 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{rec.reason_for_selection}</p>
                          </div>
                       </div>
                    </div>
                  );
                })}
              </div>

              {/* Opening Probe Footer */}
              <div className="bg-gray-800/20 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-full animate-pulse flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375-3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Recommended Opening Probe</h4>
                    <p className="text-white text-lg font-medium leading-tight">"{council.suggested_opening_question}"</p>
                  </div>
                </div>

                <button 
                  onClick={() => onOpenWarRoom(council)}
                  className="group relative inline-flex items-center justify-center px-10 py-4 font-black text-white transition-all duration-300 bg-blue-600 rounded-xl hover:bg-blue-500 active:scale-95 whitespace-nowrap shadow-[0_0_30px_rgba(37,99,235,0.4)] uppercase tracking-widest text-sm"
                >
                  <span className="mr-3">Enter War Room</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-red-400 gap-4">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
               <p className="font-bold">Recruitment Sequence Failed</p>
               <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">Retry Manual Scan</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

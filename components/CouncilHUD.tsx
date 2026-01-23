import React from 'react';
import { InnovationCouncil, Innovator } from '../types';
import { INNOVATORS } from '../constants';

interface CouncilHUDProps {
  council: InnovationCouncil;
  onLaunchPartner: (innovator: Innovator) => void;
  activePartnerId?: string;
}

export const CouncilHUD: React.FC<CouncilHUDProps> = ({ council, onLaunchPartner, activePartnerId }) => {
  return (
    <div className="sticky top-[88px] z-10 flex justify-center w-full pointer-events-none mb-6">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto animate-slide-in-up">
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Active Council</span>
            <span className="text-[11px] text-gray-400 font-mono">War Room Link</span>
        </div>
        
        <div className="h-8 w-px bg-white/5" />

        <div className="flex items-center gap-4">
          {council.recommended_council.map((rec, idx) => {
            const innovator = INNOVATORS.find(i => i.id === rec.innovator_id);
            if (!innovator) return null;

            const isActive = activePartnerId === innovator.id;
            const themeColor = innovator.module === 'Visionary Architect' ? '#a855f7' : innovator.module === 'Empirical Optimizer' ? '#10b981' : innovator.module === 'Lateral Thinker' ? '#06b6d4' : '#f59e0b';

            return (
              <button
                key={idx}
                onClick={() => onLaunchPartner(innovator)}
                className={`group flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-300 border ${
                  isActive 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                }`}
                title={`${innovator.name}: ${rec.role_in_room} | Expertise: ${rec.friction_point.toUpperCase()}`}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${themeColor}20`, color: themeColor, border: `1px solid ${themeColor}40` }}
                >
                  {innovator.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-[10px] font-bold text-white leading-tight">{innovator.name}</p>
                  <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter">{rec.friction_point}</p>
                </div>
                {isActive && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-8 w-px bg-white/5" />

        <div className="hidden lg:flex flex-col max-w-[200px]">
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Focus Probe</span>
             <p className="text-[10px] text-gray-300 italic truncate" title={council.suggested_opening_question}>"{council.suggested_opening_question}"</p>
        </div>
      </div>
    </div>
  );
};
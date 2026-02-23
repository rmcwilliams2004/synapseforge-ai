import React from 'react';
import { CreditGate } from '../monetization/CreditGate';
import { Zap, Shield } from 'lucide-react';

export const ReadAloudButton = ({ text, tts, voice }: { text: string, tts: any, voice: string }) => (
    <button onClick={() => tts.speak(text, voice)} className="p-2 text-gray-400 hover:text-brand-cyan transition" title="Read Aloud">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${tts.isPlaying ? 'text-brand-cyan' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
    </button>
);

export const CommentButton = ({ sectionId, sectionTitle, onToggle, count, isOpen }: any) => (
    <button onClick={() => onToggle(sectionId, sectionTitle)} className={`flex items-center gap-1.5 p-2 rounded-md transition-colors ${isOpen ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-400 hover:text-gray-600'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.023c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.023c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03 8.25-9 8.25s9 3.694 9 8.25Z" /></svg>
        {count > 0 && <span className="text-xs font-bold">{count}</span>}
    </button>
);

export const AnalysisButtons = ({ onEngage }: { onEngage: (type: string) => void }) => {
  return (
    <div className="flex gap-4">
      {/* Gated 360° Ingestion Action */}
      <CreditGate 
        cost={10} 
        actionName="360° Kinematic Intake"
      >
        <button 
          onClick={() => onEngage('INGESTION')}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-black text-[10px] tracking-widest uppercase flex items-center gap-2"
        >
          <Zap className="w-3 h-3" /> Engage Holistic Intake
        </button>
      </CreditGate>

      {/* Gated Physics Audit Action */}
      <CreditGate 
        cost={25} 
        actionName="Genesis 4D Audit"
      >
        <button 
          onClick={() => onEngage('AUDIT')}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-full font-black text-[10px] tracking-widest uppercase flex items-center gap-2"
        >
          <Shield className="w-3 h-3" /> Run 4D Stability Audit
        </button>
      </CreditGate>
    </div>
  );
};

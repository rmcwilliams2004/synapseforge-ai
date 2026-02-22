import React from 'react';
import { getActivePortrait } from '../../services/PortraitResolver';

interface NeuralResearchPanelProps {
  activeMemberId: string;
  results: any[];
}

export const NeuralResearchPanel: React.FC<NeuralResearchPanelProps> = ({ activeMemberId, results }) => {
  const portrait = getActivePortrait(activeMemberId);

  return (
    <div className="research-grid bg-slate-900/80 p-6 rounded-2xl border border-amber-500/30">
      <div className="flex items-center gap-6 mb-4">
        {/* NEW: High-fidelity portrait with the Innovation Boardroom glow */}
        <div className="w-24 h-24 rounded-full border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] overflow-hidden">
          <img src={portrait} alt="Council Lead" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-amber-400 font-mono text-xs uppercase tracking-widest">Archive Scour Lead</h2>
          <p className="text-white text-lg font-bold uppercase">{activeMemberId}</p>
        </div>
      </div>

      <div className="archive-results space-y-2">
        {results.map(doc => (
          <div key={doc.id} className="p-3 bg-black/40 rounded border border-slate-700 text-xs">
            <span className="text-cyan-400 font-mono">[{doc.year}]</span> 
            <span className="text-white ml-2">{doc.title}</span>
            <p className="text-slate-400 text-[10px] mt-1 line-clamp-2">{doc.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

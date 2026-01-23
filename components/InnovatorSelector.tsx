import React, { useState, useMemo } from 'react';
import { Innovator, InnovatorId, InnovatorModule } from '../types';
import { INNOVATORS } from '../constants';

interface InnovatorSelectorProps {
  selectedId?: InnovatorId;
  onSelect: (id: InnovatorId) => void;
  disabled: boolean;
}

const MODULE_THEMES: Record<InnovatorModule, { bg: string, border: string, text: string, accent: string, badge: string }> = {
    'Visionary Architect': { bg: 'bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-400', accent: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
    'Empirical Optimizer': { bg: 'bg-emerald-900/40', border: 'border-emerald-500', text: 'text-emerald-400', accent: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
    'Lateral Thinker': { bg: 'bg-cyan-900/40', border: 'border-cyan-500', text: 'text-cyan-400', accent: 'text-cyan-300', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
    'Systematic Problem Solver': { bg: 'bg-amber-900/40', border: 'border-amber-500', text: 'text-amber-400', accent: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
};

export const InnovatorSelector: React.FC<InnovatorSelectorProps> = ({ selectedId, onSelect, disabled }) => {
  const [activeTab, setActiveTab] = useState<'All' | InnovatorModule>('All');

  const filteredInnovators = useMemo(() => {
    if (activeTab === 'All') return INNOVATORS;
    return INNOVATORS.filter(i => i.module === activeTab);
  }, [activeTab]);

  const tabs: ('All' | InnovatorModule)[] = ['All', 'Visionary Architect', 'Empirical Optimizer', 'Lateral Thinker', 'Systematic Problem Solver'];

  const selectedInnovator = useMemo(() => INNOVATORS.find(i => i.id === selectedId), [selectedId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-brand-light flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            Forge Innovation Board
        </h2>
        {selectedId && (
            <button onClick={() => onSelect(selectedId)} className="text-xs text-purple-400 hover:text-purple-300 transition uppercase tracking-tighter font-bold">Deselect Partner</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pb-1 border-b border-gray-700">
        {tabs.map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={disabled}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all duration-200 border-x border-t ${
                    activeTab === tab 
                    ? 'bg-gray-800 border-purple-500 text-purple-300' 
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
                {tab === 'All' ? 'Full Board' : tab.split(' ')[0]}
            </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredInnovators.map((innovator) => {
          const theme = MODULE_THEMES[innovator.module];
          const isSelected = selectedId === innovator.id;
          
          return (
            <button
              key={innovator.id}
              onClick={() => onSelect(innovator.id)}
              disabled={disabled}
              className={`group p-3 text-left rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? `${theme.bg} ${theme.border} shadow-lg ring-2 ring-opacity-20`
                  : 'bg-gray-800 border-gray-700 hover:border-gray-500 shadow-sm'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold truncate ${isSelected ? theme.text : 'text-brand-light'}`}>{innovator.name}</span>
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-2">{innovator.era}</p>
                <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight group-hover:text-gray-200 transition-colors">
                  {innovator.methodology}
                </p>
              </div>
              <div className={`absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 rounded-full opacity-5 transition-opacity group-hover:opacity-10 ${theme.bg}`} />
            </button>
          );
        })}
      </div>

      {selectedInnovator && (
        <div className={`p-4 ${MODULE_THEMES[selectedInnovator.module].bg} border-l-4 ${MODULE_THEMES[selectedInnovator.module].border} rounded-r-xl animate-fade-in space-y-4`}>
           <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${MODULE_THEMES[selectedInnovator.module].text} bg-black/20`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${MODULE_THEMES[selectedInnovator.module].text}`}>{selectedInnovator.module} Partner</h4>
                    <span className="text-[10px] text-gray-500 font-mono">[{selectedInnovator.era}]</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed italic">
                  " {selectedInnovator.mentalModel} "
                </p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Solving Heuristic</h5>
                  <p className="text-xs text-gray-300 leading-relaxed">{selectedInnovator.solvingHeuristic}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Lexical Fingerprint</h5>
                  <div className="flex flex-wrap gap-1.5">
                      {selectedInnovator.lexicalFingerprint.map(word => (
                          <span key={word} className={`px-1.5 py-0.5 text-[9px] font-mono border rounded uppercase ${MODULE_THEMES[selectedInnovator.module].badge}`}>{word}</span>
                      ))}
                  </div>
              </div>
           </div>
           <p className="text-[10px] text-white/40 pl-11 font-mono uppercase tracking-tighter">Initializing {selectedInnovator.methodology} logic path via {selectedInnovator.historicalAnchor}...</p>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo, useEffect } from 'react';
import { Material, StandardComponent } from '../../../types';
import { MOCK_MATERIALS, MOCK_COMPONENTS } from '../../../constants';

type Tab = 'materials' | 'components';

interface MaterialSelectorProps {
    onSelectForAnalysis?: (material: Material) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({ onSelectForAnalysis }) => {
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<StandardComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulated data fetching effect
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Initial selection logic
      if (activeTab === 'materials' && MOCK_MATERIALS.length > 0 && !selectedMaterial) {
          setSelectedMaterial(MOCK_MATERIALS[0]);
      } else if (activeTab === 'components' && MOCK_COMPONENTS.length > 0 && !selectedComponent) {
          setSelectedComponent(MOCK_COMPONENTS[0]);
      }
    }, 750);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const filteredMaterials = useMemo(() =>
    MOCK_MATERIALS.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]);

  const filteredComponents = useMemo(() =>
    MOCK_COMPONENTS.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]);

  const renderSelectedDetails = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                 <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-cyan animate-[shimmer_1.5s_infinite] w-full" style={{ background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)' }}></div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Properties...</p>
            </div>
        );
    }

    if (activeTab === 'materials' && selectedMaterial) {
      return (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-xl font-bold text-brand-cyan">{selectedMaterial.name}</h3>
                  <p className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full inline-block mt-1">{selectedMaterial.category}</p>
              </div>
              {onSelectForAnalysis && (
                  <button 
                    onClick={() => onSelectForAnalysis(selectedMaterial)}
                    className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition flex items-center gap-2 shadow-lg shadow-purple-900/20"
                    title="Send this material data to the Structural Analysis module"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                      Use in Analysis
                  </button>
              )}
          </div>
          <div className="border-t border-gray-700 pt-3">
            <h4 className="font-semibold text-brand-light mb-2">Properties</h4>
            <ul className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(selectedMaterial.properties).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    if (activeTab === 'components' && selectedComponent) {
      return (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-xl font-bold text-brand-cyan">{selectedComponent.name}</h3>
          <p className="text-sm font-mono text-gray-400">PN: {selectedComponent.partNumber}</p>
          <p className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full inline-block">{selectedComponent.category}</p>
          <div className="border-t border-gray-700 pt-3">
            <h4 className="font-semibold text-brand-light mb-2">Specifications</h4>
            <ul className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(selectedComponent.specifications).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    return <div className="text-gray-500 text-center p-8">Select an item to see details.</div>;
  };

  const listItems = activeTab === 'materials' ? filteredMaterials : filteredComponents;
  const selectedId = activeTab === 'materials' ? selectedMaterial?.id : selectedComponent?.id;
  
  const handleSelect = (item: Material | StandardComponent) => {
    if (activeTab === 'materials') {
        setSelectedMaterial(item as Material);
        setSelectedComponent(null);
    } else {
        setSelectedComponent(item as StandardComponent);
        setSelectedMaterial(null);
    }
  }


  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-brand-light mb-4">Material & Component Selector</h1>
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {/* List Panel */}
        <div className="col-span-1 flex flex-col bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex border-b border-gray-600 mb-4">
            <button onClick={() => setActiveTab('materials')} className={`flex-1 pb-2 font-semibold transition-colors ${activeTab === 'materials' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-400 hover:text-gray-200'}`}>Materials</button>
            <button onClick={() => setActiveTab('components')} className={`flex-1 pb-2 font-semibold transition-colors ${activeTab === 'components' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-400 hover:text-gray-200'}`}>Components</button>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan transition-all"
            />
            {isLoading && (
                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-brand-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                    <svg className="animate-spin h-8 w-8 text-brand-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Retrying Master Ledger...</p>
                </div>
            ) : (
                <ul className="h-full overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {listItems.length === 0 ? (
                        <li className="text-center py-8 text-gray-500 text-sm italic">No items match current filter.</li>
                    ) : (
                        listItems.map(item => (
                            <li key={item.id} className="animate-fade-in">
                                <button
                                onClick={() => handleSelect(item)}
                                className={`w-full text-left p-2 rounded-md transition-all duration-200 ${item.id === selectedId ? 'bg-cyan-900/60 text-white shadow-lg border-l-4 border-brand-cyan' : 'hover:bg-gray-700/50 text-gray-400'}`}
                                >
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-[10px] uppercase font-bold tracking-tighter opacity-60">{item.category}</p>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg p-6 overflow-y-auto">
          {renderSelectedDetails()}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

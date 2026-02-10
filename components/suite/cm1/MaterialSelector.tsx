
import React, { useState, useMemo } from 'react';
import { Material, StandardComponent } from '../../../types';
import { MOCK_MATERIALS, MOCK_COMPONENTS } from '../../../constants';

type Tab = 'materials' | 'components';

interface MaterialSelectorProps {
    onSelectForAnalysis?: (material: Material) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({ onSelectForAnalysis }) => {
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(MOCK_MATERIALS[0]);
  const [selectedComponent, setSelectedComponent] = useState<StandardComponent | null>(null);

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
    if (activeTab === 'materials' && selectedMaterial) {
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-xl font-bold text-brand-cyan">{selectedMaterial.name}</h3>
                  <p className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full inline-block mt-1">{selectedMaterial.category}</p>
              </div>
              {onSelectForAnalysis && (
                  <button 
                    onClick={() => onSelectForAnalysis(selectedMaterial)}
                    className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition flex items-center gap-2"
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
        <div className="space-y-3">
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
            <button onClick={() => setActiveTab('materials')} className={`flex-1 pb-2 font-semibold ${activeTab === 'materials' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-400'}`}>Materials</button>
            <button onClick={() => setActiveTab('components')} className={`flex-1 pb-2 font-semibold ${activeTab === 'components' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-400'}`}>Components</button>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg px-4 py-2 mb-4 text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan"
          />
          <ul className="flex-1 overflow-y-auto space-y-1 pr-2">
            {listItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-2 rounded-md transition-colors ${item.id === selectedId ? 'bg-cyan-900/60 text-white' : 'hover:bg-gray-700/50'}`}
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Details Panel */}
        <div className="col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          {renderSelectedDetails()}
        </div>
      </div>
    </div>
  );
};

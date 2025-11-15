import React, { useMemo, useState } from 'react';
import { CadComponent, CadMeasurement, CadViewerTool } from '../../types';

interface CadViewerSidebarProps {
  components: CadComponent[];
  visibleIds: Set<string>;
  selectedComponentName: string | null;
  onToggleVisibility: (name: string) => void;
  onSelectComponent: (name: string) => void;
  onToggleAll: (visible: boolean) => void;
  onToggleGroup: (names: string[], visible: boolean) => void;
  isExploded: boolean;
  onToggleExplode: () => void;
  explodeFactor: number;
  onExplodeFactorChange: (factor: number) => void;
  isSectionEnabled: boolean;
  onToggleSection: () => void;
  sectionPlaneConfig: { axis: string, constant: number, inverted: boolean };
  onSectionPlaneConfigChange: (config: { axis: string, constant: number, inverted: boolean }) => void;
  measurements: CadMeasurement[];
  onClearMeasurements: () => void;
  units: string;
  activeTool: CadViewerTool;
  isMeasuring: boolean; // Is a measurement in progress (first point clicked)
}

const ComponentListItem: React.FC<{ component: CadComponent; isVisible: boolean; isSelected: boolean; onToggleVisibility: (name: string) => void; onSelectComponent: (name: string) => void; }> = 
({ component, isVisible, isSelected, onToggleVisibility, onSelectComponent }) => {
    const liClasses = `flex items-center gap-3 p-2 w-full cursor-pointer rounded-md transition-all duration-150 ${!isVisible ? 'opacity-50 hover:opacity-100' : ''} ${isSelected ? 'bg-yellow-500/20 hover:bg-yellow-500/30' : 'hover:bg-gray-700'}`;
    return (
        <li onClick={() => onSelectComponent(component.name)} className={liClasses}>
            <input type="checkbox" checked={isVisible} onChange={(e) => { e.stopPropagation(); onToggleVisibility(component.name); }} className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-700" />
            <span className={`text-sm truncate ${isSelected ? 'font-bold text-yellow-300' : ''}`} title={component.name}>{component.name}</span>
        </li>
    );
};

const ComponentGroup: React.FC<{ groupName: string; components: CadComponent[]; visibleIds: Set<string>; selectedComponentName: string | null; onToggleVisibility: (name: string) => void; onSelectComponent: (name: string) => void; onToggleGroup: (names: string[], visible: boolean) => void; }> = 
({ groupName, components, visibleIds, selectedComponentName, onToggleVisibility, onSelectComponent, onToggleGroup }) => {
    const [isOpen, setIsOpen] = useState(true);
    const allInGroupVisible = components.every(c => visibleIds.has(c.name));

    return (
        <div>
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-700/50">
                <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-left flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    <span className="font-semibold text-sm capitalize">{groupName}s ({components.length})</span>
                </button>
                <input type="checkbox" title={`Toggle all ${groupName}s`} checked={allInGroupVisible} onChange={(e) => onToggleGroup(components.map(c => c.name), e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-700" />
            </div>
            {isOpen && <ul className="pl-4 pt-1 space-y-1">{components.map(comp => <ComponentListItem key={comp.name} component={comp} isSelected={selectedComponentName === comp.name} isVisible={visibleIds.has(comp.name)} onToggleVisibility={onToggleVisibility} onSelectComponent={onSelectComponent} />)}</ul>}
        </div>
    );
};

export const CadViewerSidebar = ({ components, visibleIds, selectedComponentName, onToggleVisibility, onSelectComponent, onToggleAll, onToggleGroup, isExploded, onToggleExplode, explodeFactor, onExplodeFactorChange, isSectionEnabled, onToggleSection, sectionPlaneConfig, onSectionPlaneConfigChange, measurements, onClearMeasurements, units, activeTool, isMeasuring }: CadViewerSidebarProps) => {
  const allVisible = components.length > 0 && components.every(c => visibleIds.has(c.name));
  
  const groupedComponents = useMemo(() => {
      return components.reduce((acc, comp) => {
          const shape = comp.shape || 'complex';
          if (!acc[shape]) acc[shape] = [];
          acc[shape].push(comp);
          return acc;
      }, {} as Record<string, CadComponent[]>);
  }, [components]);

  const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="border-t border-gray-600 pt-3 mt-3">
        <h4 className="text-md font-bold text-brand-light mb-2">{title}</h4>
        <div className="space-y-3 text-sm">{children}</div>
    </div>
  );

  return (
    <div className="w-80 bg-gray-800/80 backdrop-blur-sm border-l border-gray-600 p-4 flex flex-col h-full text-white">
      <h3 className="text-lg font-bold text-brand-cyan mb-3">Viewer Controls</h3>
      <div className="flex-1 overflow-y-auto pr-2">
        <Section title="View Controls">
             <label className="flex items-center justify-between cursor-pointer"><span className="text-gray-300">Explode Assembly</span><input type="checkbox" checked={isExploded} onChange={onToggleExplode} className="toggle-switch" /></label>
             {isExploded && <input type="range" min="0.1" max="2" step="0.1" value={explodeFactor} onChange={e => onExplodeFactorChange(parseFloat(e.target.value))} className="w-full" />}

            <label className="flex items-center justify-between cursor-pointer mt-3"><span className="text-gray-300">Section View</span><input type="checkbox" checked={isSectionEnabled} onChange={onToggleSection} className="toggle-switch" /></label>
            {isSectionEnabled && (
                <div className="pl-2 space-y-2">
                    <select value={sectionPlaneConfig.axis} onChange={e => onSectionPlaneConfigChange({ ...sectionPlaneConfig, axis: e.target.value })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded">
                        <option value="x">X-Axis</option><option value="y">Y-Axis</option><option value="z">Z-Axis</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <input type="range" min="-250" max="250" step="1" value={sectionPlaneConfig.constant} onChange={e => onSectionPlaneConfigChange({ ...sectionPlaneConfig, constant: parseFloat(e.target.value)})} className="w-full" title="Offset" />
                        <span className="text-xs font-mono text-gray-400 w-12 text-right">{sectionPlaneConfig.constant}</span>
                         <button 
                            onClick={() => onSectionPlaneConfigChange({...sectionPlaneConfig, constant: 0})}
                            title="Reset offset"
                            className="p-1 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v4.992" /></svg>
                        </button>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer"><span className="text-gray-300">Invert Plane</span><input type="checkbox" checked={sectionPlaneConfig.inverted} onChange={e => onSectionPlaneConfigChange({ ...sectionPlaneConfig, inverted: e.target.checked })} className="toggle-switch" /></label>
                </div>
            )}
        </Section>
        
        {(activeTool === 'measure' || measurements.length > 0) &&
            <Section title="Measurements">
                {activeTool === 'measure' && (
                    <div className="p-2 text-center bg-cyan-900/40 border border-brand-cyan rounded-md text-cyan-300 text-xs">
                        {isMeasuring ? 'Click a second point (snaps to vertices) to complete the measurement.' : 'Click a point on a vertex or surface to start measuring.'}
                    </div>
                )}
                {measurements.length > 0 && (
                    <>
                        <ul className="space-y-1 text-gray-300">
                            {/* FIX: Use the map index for measurement numbering instead of performing a modulo operation on the string ID. */}
                            {measurements.map((m, index) => (
                                <li key={m.id} className="bg-gray-700/50 p-2 rounded flex justify-between items-center">
                                    <span>{`Measurement ${index + 1}:`}</span>
                                    <span className="font-mono text-yellow-300">{m.distance.toFixed(2)} {units}</span>
                                    <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded-full font-mono">{m.type}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={onClearMeasurements} className="w-full text-center text-xs py-1 px-2 bg-red-700/80 text-white rounded hover:bg-red-600">Clear All</button>
                    </>
                )}
            </Section>
        }

        <Section title="Components">
            <div className="flex justify-between items-center mb-2 text-xs">
                <label htmlFor="toggle-all" className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="toggle-all" checked={allVisible} onChange={(e) => onToggleAll(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-700" /> Toggle All
                </label>
            </div>
            <ul className="space-y-2">{Object.entries(groupedComponents).sort(([a], [b]) => a.localeCompare(b)).map(([shape, comps]) => <ComponentGroup key={shape} groupName={shape} components={comps} visibleIds={visibleIds} selectedComponentName={selectedComponentName} onToggleVisibility={onToggleVisibility} onSelectComponent={onSelectComponent} onToggleGroup={onToggleGroup} />)}</ul>
        </Section>
      </div>
      <style>{`.toggle-switch { appearance: none; width: 36px; height: 20px; background-color: #4b5563; border-radius: 9999px; position: relative; cursor: pointer; transition: background-color 0.2s ease-in-out; } .toggle-switch:checked { background-color: #06b6d4; } .toggle-switch::before { content: ''; position: absolute; width: 16px; height: 16px; background-color: white; border-radius: 9999px; top: 2px; left: 2px; transition: transform 0.2s ease-in-out; } .toggle-switch:checked::before { transform: translateX(16px); }`}</style>
    </div>
  );
};
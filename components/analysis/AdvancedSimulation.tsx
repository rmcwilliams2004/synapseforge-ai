
import React, { useState } from 'react';
import { BillOfMaterialsItem, SimulationResult, SimulationType, User } from '../../types';
import { useSimulation } from '../../hooks/useSimulation';

interface AdvancedSimulationProps {
    bom: BillOfMaterialsItem[];
    simulation: ReturnType<typeof useSimulation>;
    productContext: string;
    isViewer: boolean;
}

const SimulationTypeButton = ({ type, currentType, setType }: { type: SimulationType, currentType: SimulationType, setType: (type: SimulationType) => void }) => {
    const isActive = type === currentType;
    return (
        <button onClick={() => setType(type)} className={`py-2 px-4 rounded-lg font-semibold transition-colors text-sm ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'}`}>
            {type === 'FEA' && 'Finite Element Analysis (FEA)'}
            {type === 'CFD' && 'Computational Fluid Dynamics (CFD)'}
            {type === 'THERMAL' && 'Thermal Analysis'}
        </button>
    );
};


export const AdvancedSimulation: React.FC<AdvancedSimulationProps> = ({ bom, simulation, productContext, isViewer }) => {
    const [selectedType, setSelectedType] = useState<SimulationType>('FEA');
    const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<string[]>([]);
    
    const handleToggleComponent = (name: string) => {
        setSelectedComponents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) newSet.delete(name);
            else newSet.add(name);
            return newSet;
        });
    };

    const runSimulation = async () => {
        const componentNames = Array.from(selectedComponents);
        if (componentNames.length === 0) return;

        const updateInterval = setInterval(() => {
            const messages = {
                'FEA': ['Initializing mesh generator...', 'Applying boundary conditions...', 'Solving for stress and strain...', 'Post-processing results...'],
                'CFD': ['Building fluid volume...', 'Meshing surfaces...', 'Solving Navier-Stokes equations...', 'Visualizing flow vectors...'],
                'THERMAL': ['Applying thermal loads...', 'Calculating heat transfer coefficients...', 'Solving for temperature distribution...', 'Generating thermal map...'],
            };
            setStatus(prev => prev.length < messages[selectedType].length ? [...prev, messages[selectedType][prev.length]] : prev);
        }, 1500);

        await simulation.runSimulation(selectedType, componentNames, productContext);
        
        clearInterval(updateInterval);
        setStatus([]);
    };
    
    const { simulationResult } = simulation;

    return (
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-cyan-500/30 dark:border-cyan-800/50">
                <h3 className="text-xl font-bold text-brand-cyan">Advanced Simulation Studio</h3>
            </div>
            <div className="pl-8">
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6 transition-colors duration-300">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-brand-light mb-3">1. Select Simulation Type</h4>
                        <div className="flex flex-wrap gap-2">
                            <SimulationTypeButton type="FEA" currentType={selectedType} setType={setSelectedType} />
                            <SimulationTypeButton type="CFD" currentType={selectedType} setType={setSelectedType} />
                            <SimulationTypeButton type="THERMAL" currentType={selectedType} setType={setSelectedType} />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-brand-light mb-3">2. Select Component(s) for Analysis</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-md">
                            {bom.map(item => (
                                <label key={item.part_number} className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700/50 transition cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedComponents.has(item.name)}
                                        onChange={() => handleToggleComponent(item.name)}
                                        className="h-4 w-4 rounded border-gray-500 text-purple-500 focus:ring-purple-500 bg-gray-100 dark:bg-gray-700"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name} <span className="text-gray-500">({item.material})</span></span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {!isViewer && (
                         <button
                            onClick={runSimulation}
                            disabled={selectedComponents.size === 0 || simulationResult?.isLoading}
                            className="w-full py-3 px-5 bg-purple-600 text-white font-bold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                        >
                            {simulationResult?.isLoading ? 'Simulation in Progress...' : `Run ${selectedType} Simulation`}
                        </button>
                    )}

                    {simulationResult && (
                         <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                             <h4 className="text-xl font-semibold text-gray-900 dark:text-brand-light mb-4">Simulation Results: {simulationResult.type} on {simulationResult.componentName}</h4>
                             {simulationResult.isLoading && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                                    <svg className="animate-spin h-8 w-8 text-purple-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <p className="text-purple-600 dark:text-purple-300 font-semibold">Running Simulation...</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-2 h-6">{status[status.length - 1]}</p>
                                </div>
                             )}
                             {simulationResult.error && (
                                 <p className="text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">{simulationResult.error}</p>
                             )}
                             {!simulationResult.isLoading && !simulationResult.error && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Summary</h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 p-3 rounded">{simulationResult.summary}</p>
                                        </div>
                                         <div>
                                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Key Findings</h5>
                                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                {simulationResult.keyFindings.map((finding, i) => <li key={i}>{finding}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        {simulationResult.imageUrl ? (
                                             <img src={simulationResult.imageUrl} alt={`Simulation result for ${simulationResult.componentName}`} className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600" />
                                        ) : (
                                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">Visualization not available</div>
                                        )}
                                    </div>
                                </div>
                             )}
                         </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

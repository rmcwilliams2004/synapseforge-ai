import React, { useState, useEffect } from 'react';
import { FabricationPlan, ManufacturingProcessType, AnalysisResult, User } from '../../types';
import { useFabricationPlanner } from '../../hooks/useFabricationPlanner';
import { useGCodeVisualizer } from '../../hooks/useGCodeVisualizer';
import { Loader2, Wrench, Settings, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface FabricationPlannerProps {
    fabricationPlanner: ReturnType<typeof useFabricationPlanner>;
    analysisResult: AnalysisResult;
    isViewer: boolean;
    gcodeVisualizer: ReturnType<typeof useGCodeVisualizer>;
}

const processOptions: ManufacturingProcessType[] = [
    'CNC Machining', 
    '3D Printing', 
    'Sheet Metal', 
    'Injection Molding', 
    'Die Casting', 
    'Forging', 
    'Laser Cutting', 
    'Waterjet Cutting', 
    'Extrusion', 
    'Robotic Assembly', 
    'Manual Assembly', 
    'Composite Layup'
];

const DFM_CHECKS = [
    'Wall Thickness', 'Undercuts', 'Draft Angles', 'Hole Depth', 
    'Tool Access', 'Corner Radii', 'Material Hardness', 
    'Surface Finish', 'Tolerances', 'Overhangs', 
    'Support Removal', 'Bend Radii', 'Hole Proximity', 'Flat Pattern'
];

const getRecommendedChecks = (process: ManufacturingProcessType): string[] => {
    switch (process) {
        case 'CNC Machining': return ['Tool Access', 'Corner Radii', 'Tolerances', 'Hole Depth'];
        case '3D Printing': return ['Overhangs', 'Wall Thickness', 'Support Removal'];
        case 'Injection Molding': return ['Draft Angles', 'Undercuts', 'Wall Thickness'];
        case 'Sheet Metal': return ['Bend Radii', 'Hole Proximity', 'Flat Pattern'];
        case 'Die Casting': return ['Draft Angles', 'Wall Thickness', 'Undercuts'];
        default: return ['Tolerances', 'Material Hardness'];
    }
};

export const FabricationPlanner: React.FC<FabricationPlannerProps> = ({ fabricationPlanner, analysisResult, isViewer, gcodeVisualizer }) => {
    const [selectedProcess, setSelectedProcess] = useState<ManufacturingProcessType>('CNC Machining');
    const [selectedMaterial, setSelectedMaterial] = useState<string>(analysisResult.material_suggestions[0]?.name || 'Aluminum 6061');
    const [selectedChecks, setSelectedChecks] = useState<string[]>([]);

    // Update recommended checks when process changes
    useEffect(() => {
        const recommended = getRecommendedChecks(selectedProcess);
        setSelectedChecks(recommended);
    }, [selectedProcess]);

    const handleCheckToggle = (check: string) => {
        if (selectedChecks.includes(check)) {
            setSelectedChecks(selectedChecks.filter(c => c !== check));
        } else {
            setSelectedChecks([...selectedChecks, check]);
        }
    };

    const handleRunPlanner = () => {
        if (fabricationPlanner.isLoading) return; 

        const productContext = `
        Product: ${analysisResult.product_name}.
        Summary: ${analysisResult.executive_summary}.
        BOM: ${analysisResult.billOfMaterials.map(item => item.name).join(', ')}.
        Key Components: ${analysisResult.designDocument.component_designs.map(c => `${c.component_name}: ${c.design_details}`).join('; ')}.
        `;
        
        setTimeout(() => {
            fabricationPlanner.runPlanner(selectedProcess, selectedMaterial, productContext, selectedChecks);
        }, 500); 
    };

    const { plan, isLoading, error } = fabricationPlanner;
    const recommendedChecks = getRecommendedChecks(selectedProcess);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6 transition-colors duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Select Manufacturing Process</label>
                        <select
                            value={selectedProcess}
                            onChange={(e) => setSelectedProcess(e.target.value as ManufacturingProcessType)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={isLoading || isViewer}
                        >
                            {processOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Confirm Material</label>
                        <select
                            value={selectedMaterial}
                            onChange={(e) => setSelectedMaterial(e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 transition-colors"
                            disabled={isLoading || isViewer}
                        >
                            {analysisResult.material_suggestions.map(mat => <option key={mat.name} value={mat.name}>{mat.name}</option>)}
                            <option value="Custom">-- Enter Custom --</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        3. Prioritize DFM Checks
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Recommended checks highlighted)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {DFM_CHECKS.map(check => {
                            const isRecommended = recommendedChecks.includes(check);
                            const isSelected = selectedChecks.includes(check);
                            return (
                                <button
                                    key={check}
                                    onClick={() => !isViewer && handleCheckToggle(check)}
                                    disabled={isLoading || isViewer}
                                    className={`
                                        px-3 py-2 rounded-md text-xs font-medium border transition-all text-left flex items-center justify-between
                                        ${isSelected 
                                            ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' 
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'}
                                        ${isRecommended && !isSelected ? 'ring-1 ring-yellow-400/50' : ''}
                                    `}
                                >
                                    {check}
                                    {isRecommended && (
                                        <span className="ml-1 text-yellow-500" title="Recommended for this process">★</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {!isViewer && (
                    <button
                        onClick={handleRunPlanner}
                        disabled={isLoading}
                        className={`w-full py-3 px-5 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl border border-purple-500 hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden ${isLoading ? 'shadow-inner' : 'shadow-lg shadow-purple-900/30'}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="animate-breathe">Synthesizing fabrication data...</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer -translate-x-full"></div>
                            </>
                        ) : (
                            'Generate Fabrication Plan'
                        )}
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="text-center p-8 bg-gray-800/20 rounded-2xl border border-gray-700 border-dashed animate-pulse">
                    <div className="relative w-fit mx-auto mb-4">
                        <Settings className="h-10 w-10 text-purple-400 animate-spin opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-purple-200 animate-bounce" />
                        </div>
                    </div>
                    <p className="text-purple-600 dark:text-purple-300 font-bold uppercase tracking-widest text-xs">AI is analyzing manufacturability...</p>
                </div>
            )}
            {error && <p className="text-red-500 dark:text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-900/50">{error}</p>}

            {plan && (
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6 animate-fade-in transition-colors duration-300">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-brand-light">Fabrication Plan Results</h4>
                        {plan.criticalChecksForProcess && plan.criticalChecksForProcess.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                                <Info className="w-3 h-3" />
                                <span>Critical: {plan.criticalChecksForProcess.join(', ')}</span>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Design for Manufacturability (DFM) Checks
                        </h5>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2">Severity</th>
                                        <th className="px-4 py-2">Component</th>
                                        <th className="px-4 py-2">Issue</th>
                                        <th className="px-4 py-2">Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.dfmChecks.map((check, i) => (
                                        <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-4 py-2">
                                                {check.severity === 'Critical' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Critical</span>}
                                                {check.severity === 'Major' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Major</span>}
                                                {(!check.severity || check.severity === 'Minor') && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Minor</span>}
                                            </td>
                                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{check.component}</td>
                                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{check.issue}</td>
                                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{check.recommendation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" />
                                Tolerancing Notes
                            </h5>
                            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    {plan.tolerancingNotes.map((note, i) => <li key={i}>{note}</li>)}
                                </ul>
                            </div>
                        </div>
                        
                        <div>
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-purple-500" />
                                {plan.processSpecificOutput.title}
                            </h5>
                            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                <pre className="text-cyan-700 dark:text-cyan-300 text-xs overflow-x-auto font-mono custom-scrollbar max-h-60">
                                    <code>{plan.processSpecificOutput.data}</code>
                                </pre>
                            </div>
                            {selectedProcess === 'CNC Machining' && plan.processSpecificOutput.data && (
                                <button
                                    onClick={() => gcodeVisualizer.openModal(plan.processSpecificOutput.data)}
                                    className="mt-3 w-full py-2 px-4 bg-cyan-600 text-white font-semibold rounded-lg border border-cyan-500 hover:bg-cyan-500 transition active:scale-95 text-sm flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5v4.5m0-.75h4.5" /></svg>
                                    Visualize Toolpath & Summary
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
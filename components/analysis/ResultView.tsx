import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, Faction, MaterialSuggestion, BillOfMaterials, TestPlan, ComplianceAndSafety, Project, User, GeneratedDrawing, CadData, ProjectVersion, EngineeringChangeOrder, PreliminaryCostEstimate, GeneratedImage, RotorModel, RotorShaftElement, RotorDiskElement, RotorBearingElement, RotorMaterial, GoogleDocContent } from '../../types';
import { exportFullReportPDF } from '../../services/pdfService';
import { Modal } from '../Modal';
import { useTts } from '../../hooks/useTts';
import { useSimulation } from '../../hooks/useSimulation';
import { AdvancedSimulation } from './AdvancedSimulation';
import { useCollaboration } from '../../hooks/useCollaboration';
import { CommentSidebar } from './CommentSidebar';
import { useCommentCounts } from '../../hooks/useCommentCounts';
import { useFabricationPlanner } from '../../hooks/useFabricationPlanner';
import { FabricationPlanner } from './FabricationPlanner';
import { useGCodeVisualizer } from '../../hooks/useGCodeVisualizer';
import { useSuggestionExplorer } from '../../hooks/useSuggestionExplorer';
// FIX: Add missing import for useBomSourcing to be used in props and component.
import { useBomSourcing } from '../../hooks/useBomSourcing';
// FIX: Added imports for the Live Costing feature to resolve compilation error.
import { useLiveCosting } from '../../hooks/useLiveCosting';
import { LiveCostingDashboard } from './LiveCostingDashboard';
import { useNextStepAssistant } from '../../hooks/useNextStepAssistant';
import { NextStepAssistant } from './NextStepAssistant';
import { Section } from './Section';
import { createDrawingsZip } from '../../services/zipService';

const defaultDrawingViews = {
    'Top': false,
    'Front': false,
    'Side': false,
    'Isometric': false,
    'Exploded': false,
    'Cross-Section': false,
};

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const ExportDropdown = ({ onExportPDF, onExportGoogle, onGoogleSignIn, onGoogleSignOut, isGoogleAuthLoading, isGoogleAuthenticated, googleExporterUser, isGoogleExporting, googleExportStatus, googleExportError, googleDocContent, onOpenGoogleDocPreview }: { onExportPDF: () => void, onExportGoogle: () => void, onGoogleSignIn: () => void, onGoogleSignOut: () => void, isGoogleAuthLoading: boolean, isGoogleAuthenticated: boolean, googleExporterUser: { name: string; email: string; } | null, isGoogleExporting: boolean, googleExportStatus: string, googleExportError: string | null, googleDocContent: GoogleDocContent | null, onOpenGoogleDocPreview: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
    const GoogleDriveIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M19.34 9.47l-3.53-6.12L12 9.47h7.34z" /><path fill="#34A853" d="M12 15.65l3.54-6.12H8.46l3.54 6.12z" /><path fill="#F9BC05" d="M5.13 9.94l3.53-6.11L4.81 15.6l-3.3-5.66z" /><path fill="#EA4335" d="M12 9.47L8.46 3.35l-7.15 12.25h14.16z" opacity="0.5" /><path fill-opacity="0.2" fill="#263238" d="M15.82 15.65l3.52-6.18h-7.06z"/></svg>;
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2"
            >
                <ExportIcon />
                Export Report
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-30 animate-fade-in" style={{ animationDuration: '0.15s' }}>
                    <button onClick={() => { onExportPDF(); setIsOpen(false); }} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12.75h4.875c.621 0 1.125-.504 1.125-1.125V11.25a2.25 2.25 0 0 0-2.25-2.25H6.375a2.25 2.25 0 0 0-2.25 2.25v6.75c0 .621.504 1.125 1.125 1.125H6.375m1.5-12.75-1.5-1.5m0 0A2.25 2.25 0 0 1 6.375 3h.625c.621 0 1.125.504 1.125 1.125v1.5m-1.5-1.5Z" /></svg>
                        Export as PDF
                    </button>
                    <div className="border-t border-gray-700 my-1 px-4 py-2">
                        {isGoogleAuthLoading ? (
                             <div className="py-3 text-sm text-center text-gray-400">Checking auth...</div>
                        ) : !isGoogleAuthenticated ? (
                            <button onClick={onGoogleSignIn} className="flex items-center justify-center gap-3 w-full text-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 rounded-lg my-1">
                                <GoogleDriveIcon />
                                Sign in with Google
                            </button>
                        ) : (
                           <div className="space-y-2">
                                <div className="text-center text-xs text-gray-400">
                                    Signed in as <br/>
                                    <span className="font-semibold text-gray-300 truncate">{googleExporterUser?.email}</span>
                                </div>

                                {isGoogleExporting ? (
                                    <div className="py-3 text-sm text-center text-yellow-300 flex items-center gap-2 justify-center">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {googleExportStatus}...
                                    </div>
                                ) : googleExportError ? (
                                    <div className="py-3 text-xs text-center text-red-400">{googleExportError}</div>
                                ) : googleDocContent ? (
                                    <button onClick={() => { onOpenGoogleDocPreview(); setIsOpen(false); }} className="block w-full text-center py-2 text-sm bg-green-600 text-white rounded-md my-1 hover:bg-green-500">
                                        Preview Google Doc
                                    </button>
                                ) : (
                                    <button onClick={onExportGoogle} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 rounded-lg">
                                        <GoogleDriveIcon />
                                        Export to Google Drive
                                    </button>
                                )}

                                <button onClick={() => { onGoogleSignOut(); setIsOpen(false); }} className="w-full text-center text-xs text-gray-500 hover:text-white pt-1">
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SubTitle = ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-md font-semibold text-gray-300 mt-4 mb-2">{children}</h4>
);

const BillOfMaterialsTable = ({ bom, bomSourcing, isViewer }: { bom: BillOfMaterials; bomSourcing: ReturnType<typeof useBomSourcing>; isViewer: boolean }) => {
    const { sourceItem, sourcingResults, loadingStates, errorStates } = bomSourcing;
    
    return (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-4 py-2">Part #</th>
                    <th scope="col" className="px-4 py-2">Name</th>
                    <th scope="col" className="px-4 py-2">Qty</th>
                    <th scope="col" className="px-4 py-2">Material</th>
                    <th scope="col" className="px-4 py-2">Description</th>
                    <th scope="col" className="px-4 py-2 text-center">Sourcing</th>
                </tr>
            </thead>
            <tbody>
                {(bom || []).map((item, i) => {
                    const partNumber = item.part_number;
                    const isLoading = loadingStates.get(partNumber);
                    const error = errorStates.get(partNumber);
                    const results = sourcingResults.get(partNumber);
                    return (
                        <React.Fragment key={partNumber || i}>
                            <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">{partNumber}</td>
                                <td className="px-4 py-2 font-medium text-gray-200">{item.name}</td>
                                <td className="px-4 py-2">{item.quantity}</td>
                                <td className="px-4 py-2">{item.material}</td>
                                <td className="px-4 py-2">{item.description}</td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => sourceItem(item)}
                                        disabled={isLoading || isViewer}
                                        className="py-1 px-3 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 transition flex items-center gap-1 mx-auto"
                                    >
                                        {isLoading ? 'Sourcing...' : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg> Source</>}
                                    </button>
                                </td>
                            </tr>
                            {(error || results) && (
                                <tr className="bg-gray-800/50">
                                    <td colSpan={6} className="p-3 border-b border-gray-700">
                                        {error && <p className="text-red-400 text-xs">Error: {error}</p>}
                                        {results && (
                                            <div>
                                                <h5 className="font-semibold text-gray-300 text-xs mb-2">Potential Suppliers for "{item.name}":</h5>
                                                {results.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {results.map((res, j) => (
                                                        <li key={j} className="text-xs text-gray-400 flex gap-2 items-center">
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-semibold">{res.supplier}</a> 
                                                            <span className="text-gray-500">|</span>
                                                            <span>Cost: {res.estimatedCost}</span> 
                                                            <span className="text-gray-500">|</span>
                                                            <span>Lead Time: {res.leadTime}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">No suppliers found.</p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    </div>
);};

const CostEstimateTable = ({ estimate }: { estimate: PreliminaryCostEstimate }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-4 py-2">Item</th>
                    <th scope="col" className="px-4 py-2">Cost Estimate</th>
                    <th scope="col" className="px-4 py-2">Rationale</th>
                </tr>
            </thead>
            <tbody>
                {(estimate.breakdown || []).map((item, i) => (
                    <tr key={i} className="border-b border-gray-700">
                        <td className="px-4 py-2 font-medium text-gray-200">{item.item}</td>
                        <td className="px-4 py-2">{item.cost_estimate}</td>
                        <td className="px-4 py-2">{item.rationale}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const TestPlanTable = ({ testPlan }: { testPlan: TestPlan }) => (
    <div className="space-y-3">
        {(testPlan.test_cases || []).map((tc, i) => (
            <div key={tc.id || i} className="p-3 border border-gray-700 rounded bg-gray-800/50">
                <p className="font-semibold text-gray-200">{tc.id}: {tc.description}</p>
                <p className="text-xs mt-1"><strong className="text-gray-400">Procedure:</strong> {tc.procedure}</p>
                <p className="text-xs mt-1"><strong className="text-gray-400">Expected Results:</strong> {tc.expected_results}</p>
            </div>
        ))}
    </div>
);

const ComplianceAndSafetyTable = ({ compliance }: { compliance: ComplianceAndSafety }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-4 py-2">Risk</th>
                    <th scope="col" className="px-4 py-2">Likelihood</th>
                    <th scope="col" className="px-4 py-2">Impact</th>
                    <th scope="col" className="px-4 py-2">Mitigation</th>
                </tr>
            </thead>
            <tbody>
                {(compliance.safety_risks || []).map((risk, i) => (
                    <tr key={i} className="border-b border-gray-700">
                        <td className="px-4 py-2 font-medium text-gray-200">{risk.risk}</td>
                        <td className="px-4 py-2">{risk.likelihood}</td>
                        <td className="px-4 py-2">{risk.impact}</td>
                        <td className="px-4 py-2">{risk.mitigation}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ECOTable = ({ ecos }: { ecos: EngineeringChangeOrder[] }) => (
    <div className="space-y-3">
        {(ecos || []).map((eco, i) => (
            <div key={eco.eco_id || i} className="p-3 border border-gray-700 rounded bg-gray-800/50">
                <p className="font-semibold text-gray-200">{eco.eco_id}: {eco.change_title}</p>
                <p className="text-xs mt-2"><strong className="text-gray-400">Description:</strong> {eco.description}</p>
                <p className="text-xs mt-1"><strong className="text-gray-400">Reason:</strong> {eco.reason_for_change}</p>
                <p className="text-xs mt-1"><strong className="text-gray-400">Impact:</strong> {eco.impact_analysis}</p>
            </div>
        ))}
    </div>
);

const RotordynamicsStudio = ({ id, model, onModelChange, rossAnalysis, isViewer }: { id?: string; model?: RotorModel, onModelChange: (model: RotorModel) => void, rossAnalysis: ResultViewProps['rossAnalysis'], isViewer: boolean }) => {
    const plotRef = useRef<HTMLDivElement>(null);
    const defaultMaterial: RotorMaterial = { name: 'Steel', E: 211e9, G_s: 81.2e9, rho: 7850 };

    const handleRunAnalysis = (type: 'critical_speed' | 'campbell') => {
        if (model) {
            rossAnalysis.runAnalysis(model, type);
        }
    };

    useEffect(() => {
        if (rossAnalysis.rossResult?.type === 'campbell' && plotRef.current) {
            try {
                const plotJson = JSON.parse(rossAnalysis.rossResult.plot_json);
                (window as any).Plotly.newPlot(plotRef.current, plotJson.data, plotJson.layout);
            } catch (e) {
                console.error("Failed to parse or render Campbell plot:", e);
            }
        }
    }, [rossAnalysis.rossResult]);

    // FIX: Safely update model properties, especially when the model is initially undefined.
    const handleShaftChange = (index: number, field: keyof RotorShaftElement, value: any) => {
        const newShaft = [...(model?.shaft || [])];
        if (newShaft[index]) {
            if (typeof (newShaft[index] as any)[field] === 'number') {
                value = parseFloat(value) || 0;
            }
            (newShaft[index] as any)[field] = value;
        }
        onModelChange({
            shaft: newShaft,
            disks: model?.disks || [],
            bearings: model?.bearings || [],
        });
    };

    const addShaftElement = () => {
        const currentShaft = model?.shaft || [];
        const nextNode = currentShaft.length;
        const newElement: RotorShaftElement = { id: `s-${Date.now()}`, n: nextNode, L: 0.25, idl: 0, odl: 0.05, material: defaultMaterial };
        onModelChange({ shaft: [...currentShaft, newElement], disks: model?.disks || [], bearings: model?.bearings || [] });
    };
    
    // FIX: Safely update model properties, especially when the model is initially undefined.
    const addDiskElement = () => {
         const newElement: RotorDiskElement = { id: `d-${Date.now()}`, n: 0, m: 1, Id: 0.05, Ip: 0.1 };
         onModelChange({
            shaft: model?.shaft || [],
            disks: [...(model?.disks || []), newElement],
            bearings: model?.bearings || []
        });
    };
    
    // FIX: Safely update model properties, especially when the model is initially undefined.
    const addBearingElement = () => {
        const newElement: RotorBearingElement = { id: `b-${Date.now()}`, n: 0, kxx: 1e6, kyy: 1e6, cxx: 1e3, cyy: 1e3, kxy: 0, kyx: 0, cxy: 0, cyx: 0 };
        onModelChange({
            shaft: model?.shaft || [],
            disks: model?.disks || [],
            bearings: [...(model?.bearings || []), newElement]
        });
    };


    return (
        <Section id={id} title="Rotordynamics Studio (ross)" defaultOpen={false}>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="mb-4 p-2 bg-gray-900/50 rounded text-center border border-gray-600">
                    <p className="text-sm font-semibold text-brand-light">Environment Status: <span className="font-mono text-yellow-300">{rossAnalysis.rossStatus}</span></p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold text-brand-light mb-2">Rotor Model Editor</h4>
                        {/* Shaft Elements */}
                        <SubTitle>Shaft Elements</SubTitle>
                        <div className="space-y-2">
                             {(model?.shaft || []).map((elem, i) => <div key={elem.id} className="p-2 border rounded-md border-gray-600 bg-gray-900/30 text-xs">Node {elem.n} to {elem.n+1}: L={elem.L}m, OD={elem.odl}m</div>)}
                        </div>
                        {!isViewer && <button onClick={addShaftElement} className="mt-2 text-xs py-1 px-2 bg-gray-600 rounded hover:bg-gray-500">+ Add Shaft</button>}

                        {/* Disk Elements */}
                        <SubTitle>Disk Elements</SubTitle>
                         <div className="space-y-2">
                             {(model?.disks || []).map((elem, i) => <div key={elem.id} className="p-2 border rounded-md border-gray-600 bg-gray-900/30 text-xs">Node {elem.n}: Mass={elem.m}kg</div>)}
                        </div>
                        {!isViewer && <button onClick={addDiskElement} className="mt-2 text-xs py-1 px-2 bg-gray-600 rounded hover:bg-gray-500">+ Add Disk</button>}

                        {/* Bearing Elements */}
                        <SubTitle>Bearing Elements</SubTitle>
                         <div className="space-y-2">
                             {(model?.bearings || []).map((elem, i) => <div key={elem.id} className="p-2 border rounded-md border-gray-600 bg-gray-900/30 text-xs">Node {elem.n}: Kxx={elem.kxx.toExponential(0)} N/m</div>)}
                        </div>
                        {!isViewer && <button onClick={addBearingElement} className="mt-2 text-xs py-1 px-2 bg-gray-600 rounded hover:bg-gray-500">+ Add Bearing</button>}
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-brand-light mb-2">Analysis & Results</h4>
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => handleRunAnalysis('critical_speed')} disabled={!rossAnalysis.isRossReady || rossAnalysis.isRossRunning || isViewer} className="py-2 px-4 text-sm bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:opacity-50">Run Critical Speed</button>
                            <button onClick={() => handleRunAnalysis('campbell')} disabled={!rossAnalysis.isRossReady || rossAnalysis.isRossRunning || isViewer} className="py-2 px-4 text-sm bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:opacity-50">Run Campbell Plot</button>
                        </div>
                         {rossAnalysis.isRossRunning && <p className="text-yellow-300">Analysis in progress...</p>}
                         {rossAnalysis.rossError && <p className="text-red-400">{rossAnalysis.rossError}</p>}
                         {rossAnalysis.rossResult?.type === 'critical_speed' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-700"><tr><th className="px-2 py-1">Crit. Speed (rad/s)</th><th className="px-2 py-1">Log Dec</th><th className="px-2 py-1">Whirl</th></tr></thead>
                                    <tbody>
                                        {rossAnalysis.rossResult.critical_speeds.map((speed: number, i: number) => (
                                            <tr key={i} className="border-b border-gray-700">
                                                <td className="px-2 py-1">{speed.toFixed(2)}</td>
                                                <td className="px-2 py-1">{rossAnalysis.rossResult.log_dec[i].toFixed(3)}</td>
                                                <td className="px-2 py-1">{rossAnalysis.rossResult.whirl_direction[i]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         )}
                         {rossAnalysis.rossResult?.type === 'campbell' && (
                            <div ref={plotRef} className="w-full h-96 bg-white rounded-lg"></div>
                         )}
                    </div>
                </div>
            </div>
        </Section>
    )
};

const ReadAloudButton = ({ text, tts, voice }: { text: string; tts: ReturnType<typeof useTts>; voice: string }) => {
    if (!text) return null;

    const isCurrent = tts.speakingText === text;
    const isLoading = isCurrent && tts.isLoading;
    const isPlaying = isCurrent && tts.isPlaying;

    const title = isLoading ? "Generating audio..." : isPlaying ? "Stop reading" : "Read aloud";
    const Icon = () => {
        if (isLoading) {
            return <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
        }
        if (isPlaying) {
            return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3-3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" /></svg>;
        }
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>;
    };

    return (
        <button
            onClick={() => tts.speak(text, voice)}
            title={title}
            className={`p-1.5 rounded-full transition-colors duration-200 ${isPlaying ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-700 hover:text-brand-cyan'}`}
        >
            <Icon />
        </button>
    );
};


const TTS_VOICES = [
    { id: 'Kore', name: 'Kore (Female)' },
    { id: 'Puck', name: 'Puck (Male)' },
    { id: 'Charon', name: 'Charon (Male, Deep)' },
    { id: 'Fenrir', name: 'Fenrir (Male, Deep)' },
];

const InspirationalImageGenerator = ({ onRequest, isLoading, isViewer }: { onRequest: (prompt: string, aspectRatio: string) => void, isLoading: boolean, isViewer: boolean }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');

    const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onRequest(prompt, aspectRatio);
            setPrompt('');
        }
    };

    if (isViewer) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
            <h4 className="text-lg font-semibold text-brand-light">Generate Photorealistic Concept</h4>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic product shot of a sleek smart ring on a marble surface"
                    className="w-full h-24 p-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full p-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                    disabled={isLoading}
                >
                    {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                </select>
            </div>
            <button type="submit" disabled={!prompt.trim() || isLoading} className="w-full py-2 px-5 bg-purple-600 text-white font-bold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Generating...
                    </>
                ) : 'Generate Image'}
            </button>
        </form>
    );
};

const ImageHistory = ({ history, onReinsert, onDelete, currentImages, isViewer }: { history: GeneratedImage[], onReinsert: (image: GeneratedImage) => void, onDelete: (id: string) => void, currentImages: GeneratedImage[], isViewer: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!history || history.length === 0) {
        return null;
    }

    const currentImageIds = useMemo(() => new Set(currentImages.map(img => img.id)), [currentImages]);

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mt-6">
            <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full">
                <h4 className="text-lg font-semibold text-brand-light">Image Generation History ({history.length})</h4>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isOpen && (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                    {history.map(image => (
                        <div key={image.id} className="flex items-center gap-4 bg-gray-900/50 p-2 rounded-md border border-gray-600">
                            <div className="w-24 h-16 flex-shrink-0 bg-gray-700 rounded-sm">
                                {image.url && <img src={image.url} alt={image.prompt} className="w-full h-full object-cover rounded-sm" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-400 truncate" title={image.prompt}>"{image.prompt}"</p>
                                <p className="text-xs text-gray-500">Aspect Ratio: {image.aspectRatio || 'N/A'}</p>
                            </div>
                            {!isViewer && (
                                <div className="flex flex-col gap-1.5 flex-shrink-0">
                                    <button 
                                        onClick={() => onReinsert(image)}
                                        disabled={currentImageIds.has(image.id)}
                                        className="py-1 px-2 text-[10px] bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Re-insert
                                    </button>
                                    <button 
                                        onClick={() => onDelete(image.id)}
                                        className="py-1 px-2 text-[10px] bg-red-700/80 text-white rounded hover:bg-red-600 transition-transform active:scale-95"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ResultViewProps {
  projectName: string;
  result: AnalysisResult;
  selectedFaction: Faction | null;
  onClear: () => void;
  isLoading: boolean;
  onGenerateVideo: (prompt: string, imageFile?: File, aspectRatio?: '16:9' | '9:16') => void;
  isVideoLoading: boolean;
  videoUrl: string | null;
  videoError: string | null;
  drawings: GeneratedDrawing[];
  onRequestDrawing: (prompt: string, result: AnalysisResult, fileUrls?: string[]) => void;
  onRequestDrawingFromImage: (imageFile: File, prompt: string) => void;
  onRemoveDrawing: (id: string) => void;
  onToggleDrawingReportInclusion: (id: string) => void;
  onSetCover: (id: string, type: 'drawing' | 'image') => void;
  inspirationalImages: GeneratedImage[];
  onRemoveInspirationalImage: (id: string) => void;
  onRequestInspirationalImage: (prompt: string, aspectRatio: string) => void;
  onToggleImageReportInclusion: (id: string) => void;
  onIncorporateSuggestions: (suggestionTexts: string[]) => void;
  onLaunchDeVinci: () => void;
  activeProject: Project | null;
  activeVersion: ProjectVersion | null;
  authenticatedUser: User;
  onGenerateSummary: (result: AnalysisResult) => Promise<string | null>;
  isSummaryLoading: boolean;
  summaryError: string | null;
  cadData: CadData | null;
  onGenerateCad: (drawings: GeneratedDrawing[], result: AnalysisResult) => Promise<CadData | null>;
  isCadLoading: boolean;
  cadError: string | null;
  onOpenCadViewer: () => void;
  isGoogleExporterAuthenticated: boolean;
  googleExporterUser: { name: string; email: string } | null;
  isGoogleAuthLoading: boolean;
  onGoogleExporterSignIn: () => void;
  onGoogleExporterSignOut: () => void;
  isGoogleExporting: boolean;
  googleExportStatus: string;
  googleExportError: string | null;
  googleDocContent: GoogleDocContent | null;
  onOpenGoogleDocPreview: () => void;
  onExportToGoogle: () => void;
  rotorModel?: RotorModel;
  onRotorModelChange: (model: RotorModel) => void;
  rossAnalysis: {
    isRossReady: boolean;
    isRossRunning: boolean;
    rossStatus: string;
    rossResult: any;
    rossError: string | null;
    runAnalysis: (rotorModel: RotorModel, analysisType: 'critical_speed' | 'campbell') => void;
  };
  tts: ReturnType<typeof useTts>;
  inspirationalImageHistory: GeneratedImage[];
  onReinsertInspirationalImage: (image: GeneratedImage) => void;
  onDeleteInspirationalImageFromHistory: (imageId: string) => void;
  simulation: ReturnType<typeof useSimulation>;
  fabricationPlanner: ReturnType<typeof useFabricationPlanner>;
  gcodeVisualizer: ReturnType<typeof useGCodeVisualizer>;
  suggestionExplorer: ReturnType<typeof useSuggestionExplorer>;
  bomSourcing: ReturnType<typeof useBomSourcing>;
  liveCosting: ReturnType<typeof useLiveCosting>;
  nextStepAssistant: ReturnType<typeof useNextStepAssistant>;
}

const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375-3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" />
    </svg>
);

const CommentButton = ({ sectionId, sectionTitle, onToggle, count, isOpen }: { sectionId: string; sectionTitle: string; onToggle: (id: string, title: string) => void; count: number; isOpen: boolean; }) => (
    <button onClick={() => onToggle(sectionId, sectionTitle)} title={isOpen ? "Hide comments" : "Show comments"} className={`relative p-1.5 rounded-full transition-colors ${isOpen ? 'bg-cyan-900/50 text-brand-cyan ring-2 ring-brand-cyan' : 'text-gray-400 hover:bg-gray-700 hover:text-brand-cyan'}`}>
        <CommentIcon />
        {count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{count}</span>}
    </button>
);


export const ResultView = ({
  projectName,
  result,
  selectedFaction,
  onClear,
  isLoading,
  onGenerateVideo,
  isVideoLoading,
  videoUrl,
  videoError,
  drawings,
  onRequestDrawing,
  onRequestDrawingFromImage,
  onRemoveDrawing,
  onToggleDrawingReportInclusion,
  onSetCover,
  inspirationalImages,
  onRemoveInspirationalImage,
  onRequestInspirationalImage,
  onToggleImageReportInclusion,
  onIncorporateSuggestions,
  onLaunchDeVinci,
  activeProject,
  activeVersion,
  authenticatedUser,
  onGenerateSummary,
  isSummaryLoading,
  summaryError,
  cadData,
  onGenerateCad,
  isCadLoading,
  cadError,
  onOpenCadViewer,
  isGoogleExporterAuthenticated,
  googleExporterUser,
  isGoogleAuthLoading,
  onGoogleExporterSignIn,
  onGoogleExporterSignOut,
  isGoogleExporting,
  googleExportStatus,
  googleExportError,
  googleDocContent,
  onOpenGoogleDocPreview,
  onExportToGoogle,
  rotorModel,
  onRotorModelChange,
  rossAnalysis,
  tts,
  inspirationalImageHistory,
  onReinsertInspirationalImage,
  onDeleteInspirationalImageFromHistory,
  simulation,
  fabricationPlanner,
  gcodeVisualizer,
  suggestionExplorer,
  bomSourcing,
  liveCosting,
  nextStepAssistant,
}: ResultViewProps) => {
  const Icon = selectedFaction?.icon;
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoImageFile, setVideoImageFile] = useState<File | null>(null);
  const [videoImagePreview, setVideoImagePreview] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const isViewer = authenticatedUser.role === 'Viewer';
  const [selectedTtsVoice, setSelectedTtsVoice] = useState('Kore');
  const [commentSection, setCommentSection] = useState<{ id: string; title: string } | null>(null);
  const collaboration = useCollaboration(commentSection?.id, authenticatedUser);
  const commentCounts = useCommentCounts();


  // State for advanced drawing requests
  const [drawingSubject, setDrawingSubject] = useState('');
  const [drawingToView, setDrawingToView] = useState<GeneratedDrawing | GeneratedImage | null>(null);
  const [drawingViews, setDrawingViews] = useState(defaultDrawingViews);
  const [drawingImageFile, setDrawingImageFile] = useState<File | null>(null);
  const [drawingImagePreview, setDrawingImagePreview] = useState<string | null>(null);
  const drawingImageInputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading: isAssistantLoading, error: assistantError, fetchSuggestions, clearSuggestions } = nextStepAssistant;

  useEffect(() => {
    if (result) {
      fetchSuggestions(result, drawings, inspirationalImages);
    }
    // Cleanup when component unmounts or result changes
    return () => {
      clearSuggestions();
    }
  }, [result, drawings, inspirationalImages, fetchSuggestions, clearSuggestions]);

  const handleSuggestionAction = (actionId: string) => {
    if (actionId === 'launch_devinci') {
      onLaunchDeVinci();
    } else {
      const element = document.getElementById(actionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRefreshSuggestions = () => {
      if (result) {
          fetchSuggestions(result, drawings, inspirationalImages);
      }
  };

  const viewGroups = {
      "Standard Projections": ['Top', 'Front', 'Side', 'Isometric'],
      "Specialized Views": ['Exploded', 'Cross-Section']
  };

  const isDrawingInProgress = useMemo(() => (drawings || []).some(d => d.isLoading), [drawings]);
  const isAnyImageLoading = useMemo(() => inspirationalImages.some(img => img.isLoading), [inspirationalImages]);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const [openMaterialProperties, setOpenMaterialProperties] = useState<Set<number>>(new Set());

  const incorporatedSuggestions = useMemo(() => new Set(activeVersion?.incorporatedSuggestions || []), [activeVersion]);

  const handleToggleCommentSection = (sectionId: string, sectionTitle: string) => {
    setCommentSection(prev => prev?.id === sectionId ? null : { id: sectionId, title: sectionTitle });
  };

  useEffect(() => {
    if (videoImageFile) {
        const objectUrl = URL.createObjectURL(videoImageFile);
        setVideoImagePreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    } else {
        setVideoImagePreview(null);
    }
  }, [videoImageFile]);
  
  useEffect(() => {
    if (drawingImageFile) {
        const objectUrl = URL.createObjectURL(drawingImageFile);
        setDrawingImagePreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    } else {
        setDrawingImagePreview(null);
    }
  }, [drawingImageFile]);


  const toggleMaterialProperties = (index: number) => {
    setOpenMaterialProperties(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        return newSet;
    });
  };

  const materialSuggestionTexts = useMemo(() => 
    (result.material_suggestions || []).map(mat => `Material Suggestion: ${mat.name}. Rationale: ${mat.rationale}`),
    [result.material_suggestions]
  );

  const systemSuggestionTexts = useMemo(() => 
    (result.suggested_systems || []).map(sys => `System Suggestion: ${sys.name}. Description: ${sys.description}`),
    [result.suggested_systems]
  );
  
  const toggleSuggestion = (suggestionText: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionText)) {
        newSet.delete(suggestionText);
      } else {
        newSet.add(suggestionText);
      }
      return newSet;
    });
  };

  const handleIncorporate = () => {
    onIncorporateSuggestions(Array.from(selectedSuggestions));
    setSelectedSuggestions(new Set());
  };
  
  const handleExportFullReport = () => {
    if (activeProject) {
      exportFullReportPDF(activeProject, drawings, inspirationalImages);
    }
  };

  const handleRequestDrawing = () => {
    if (drawingImageFile) {
        // New image-to-drawing workflow
        const prompt = drawingSubject.trim() || `An engineering drawing of the provided image`;
        onRequestDrawingFromImage(drawingImageFile, prompt);
    } else {
        // Existing text-to-drawing workflow
        const subject = drawingSubject.trim();
        if (!subject) return;

        const selectedViews = Object.entries(drawingViews)
            .filter(([, isSelected]) => isSelected)
            .map(([name]) => name);

        if (selectedViews.length === 0) return;

        for (const view of selectedViews) {
            const fullPrompt = `${view} view of ${subject}`;
            onRequestDrawing(fullPrompt, result, activeVersion?.fileUrls);
        }
    }

    // Reset the form for the next request.
    setDrawingSubject('');
    setDrawingViews(defaultDrawingViews);
    setDrawingImageFile(null);
  };

  const handleRequestAssemblyOverview = () => {
    const prompt = "An isometric view of the main product assembly, showing overall dimensions and key features.";
    onRequestDrawing(prompt, result, activeVersion?.fileUrls);
  };

  const handleGenerateAndViewCad = async () => {
    const data = await onGenerateCad(drawings, result);
    if (data) {
        onOpenCadViewer();
    }
  };

  const handleExportCad = () => {
      if (!cadData) return;
      const jsonString = JSON.stringify(cadData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s/g, '_')}.step.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleGenerateSummary = async () => {
    const summary = await onGenerateSummary(result);
    if (summary) {
      setSummaryText(summary);
      setIsSummaryModalOpen(true);
    }
  };
  
  const handleCopySummary = () => {
      navigator.clipboard.writeText(summaryText);
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
  }
  
  const handleGenerateVideo = () => {
    if (!videoPrompt.trim() && !videoImageFile) return;
    onGenerateVideo(videoPrompt, videoImageFile || undefined, videoAspectRatio);
    setShowVideoModal(false);
    setVideoPrompt('');
    setVideoImageFile(null);
    setVideoAspectRatio('16:9');
  };

  const handleGenerateFutureConcept = () => {
    if (!result) return;
    const prompt = `A photorealistic concept image of a futuristic, upgraded version of the '${result.product_name}'. The image should visualize advanced integrations and potential future enhancements, hinting at next-generation materials and smart, connected features. The style should be sleek, modern, and inspirational, set against a clean, minimalist background. Focus on innovation and the evolution of the product's design.`;
    onRequestInspirationalImage(prompt, '16:9');
  };


  const selectedViewCount = Object.values(drawingViews).filter(Boolean).length;
  
  const generateButtonText = () => {
    if (isDrawingInProgress) return 'Generation in Progress...';
    if (drawingImageFile) return 'Generate Drawing from Image';
    return `Generate ${selectedViewCount > 0 ? selectedViewCount : ''} Drawing${selectedViewCount > 1 ? 's' : ''}`;
  };
  const isGenerateDisabled = isDrawingInProgress || (drawingImageFile ? false : (!drawingSubject.trim() || selectedViewCount === 0));
  const completedDrawingsCount = useMemo(() => drawings.filter(d => d.url && !d.isLoading).length, [drawings]);

  return (
    <div id="tour-step-5" className="bg-gray-900 border-2 border-gray-700 rounded-lg animate-fade-in relative overflow-hidden">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-light mb-1">{projectName}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {Icon && <Icon className="w-5 h-5 text-brand-cyan" />}
              <span>Analysis via: <span className="font-semibold text-brand-cyan">{selectedFaction?.name}</span></span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-2">
                  <label htmlFor="tts-voice" className="text-sm font-medium text-gray-400">Voice:</label>
                  <select
                      id="tts-voice"
                      value={selectedTtsVoice}
                      onChange={(e) => setSelectedTtsVoice(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2"
                  >
                      {TTS_VOICES.map(voice => (
                          <option key={voice.id} value={voice.id}>{voice.name}</option>
                      ))}
                  </select>
              </div>
              <button 
                onClick={handleGenerateSummary} 
                disabled={isSummaryLoading || isViewer}
                className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSummaryLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                )}
                Generate Summary
              </button>
              <ExportDropdown 
                  onExportPDF={handleExportFullReport}
                  onExportGoogle={onExportToGoogle}
                  onGoogleSignIn={onGoogleExporterSignIn}
                  onGoogleSignOut={onGoogleExporterSignOut}
                  isGoogleAuthLoading={isGoogleAuthLoading}
                  isGoogleAuthenticated={isGoogleExporterAuthenticated}
                  googleExporterUser={googleExporterUser}
                  isGoogleExporting={isGoogleExporting}
                  googleExportStatus={googleExportStatus}
                  googleExportError={googleExportError}
                  googleDocContent={googleDocContent}
                  onOpenGoogleDocPreview={onOpenGoogleDocPreview}
              />
              {!isViewer && <button onClick={onClear} className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm">New Analysis</button>}
          </div>
        </div>

        {/* Main Content */}
        <NextStepAssistant
          suggestions={suggestions}
          isLoading={isAssistantLoading}
          error={assistantError}
          onAction={handleSuggestionAction}
          onRefresh={handleRefreshSuggestions}
        />

        <Section id="executive_summary" title="Executive Summary" actions={<>
            <ReadAloudButton text={result.executive_summary} tts={tts} voice={selectedTtsVoice} />
            <CommentButton
                sectionId="executive_summary"
                sectionTitle="Executive Summary"
                onToggle={handleToggleCommentSection}
                count={commentCounts['executive_summary'] || 0}
                isOpen={commentSection?.id === 'executive_summary'}
            />
          </>}>
          <p className="text-gray-300 leading-relaxed">{result.executive_summary}</p>
        </Section>
        <Section id="faction_rationale" title="Faction Rationale" actions={
            <CommentButton
                sectionId="faction_rationale"
                sectionTitle="Faction Rationale"
                onToggle={handleToggleCommentSection}
                count={commentCounts['faction_rationale'] || 0}
                isOpen={commentSection?.id === 'faction_rationale'}
            />
        }>
          <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
                  <h4 className="text-lg font-semibold text-green-300 mb-2">Pros</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-300/90">
                      {(result.faction_rationale?.pros || []).map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
              </div>
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-700">
                  <h4 className="text-lg font-semibold text-red-300 mb-2">Cons</h4>
                  <ul className="list-disc pl-5 space-y-1 text-red-300/90">
                      {(result.faction_rationale?.cons || []).map((con, i) => <li key={i}>{con}</li>)}
                  </ul>
              </div>
          </div>
          <p className="mt-4 text-gray-400"><strong className="text-gray-200">Summary:</strong> {result.faction_rationale?.summary}</p>
        </Section>
        <Section id="ai_suggestions" title="AI Suggestions & Brainstorming" actions={
            <CommentButton
                sectionId="ai_suggestions"
                sectionTitle="AI Suggestions & Brainstorming"
                onToggle={handleToggleCommentSection}
                count={commentCounts['ai_suggestions'] || 0}
                isOpen={commentSection?.id === 'ai_suggestions'}
            />
        }>
          <div>
            <SubTitle>Material Suggestions</SubTitle>
              {(result.material_suggestions || []).map((mat, i) => {
                  const suggestionText = materialSuggestionTexts[i];
                  const isSelected = selectedSuggestions.has(suggestionText);
                  const arePropertiesOpen = openMaterialProperties.has(i);
                  const isIncorporated = incorporatedSuggestions.has(suggestionText);
                  return (
                  <div key={i} className={`relative mb-4 p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-cyan-900/40 border-brand-cyan' : 'bg-gray-800/50 border-gray-700'} ${isIncorporated ? 'opacity-60 bg-gray-800' : ''}`}>
                      <div className="flex items-start gap-4">
                          {!isViewer && (
                              <input
                                  id={`mat-sugg-${i}`}
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isIncorporated}
                                  onChange={() => toggleSuggestion(suggestionText)}
                                  className="mt-1 h-4 w-4 rounded border-gray-600 text-brand-cyan focus:ring-brand-cyan bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                               />
                          )}
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-brand-light">{mat.name}</h4>
                                  <div className="flex items-center gap-2">
                                     <button
                                        onClick={() => {
                                            const productContext = `Product: ${projectName}. Summary: ${result.executive_summary}`;
                                            suggestionExplorer.explore(suggestionText, productContext);
                                        }}
                                        disabled={isViewer || suggestionExplorer.isExploring}
                                        className="py-1 px-3 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 transition-transform active:scale-95 flex items-center gap-1.5"
                                        title="Explore this suggestion with AI"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                                        Explore
                                    </button>
                                      <ReadAloudButton text={mat.rationale} tts={tts} voice={selectedTtsVoice} />
                                  </div>
                              </div>
                              <p className="text-sm text-gray-400 mb-3 pr-8">{mat.rationale}</p>
                              <div className="mt-4 border-t border-gray-700/50 pt-3">
                                  <button 
                                      type="button" 
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMaterialProperties(i); }} 
                                      className="flex justify-between items-center w-full text-left text-sm font-semibold text-gray-300 hover:text-white transition"
                                  >
                                      <span>Material Properties</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${arePropertiesOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                  </button>
                                  {arePropertiesOpen && (
                                      <div className="mt-2 text-xs text-gray-400 grid grid-cols-2 gap-x-4 gap-y-1 animate-fade-in" style={{animationDuration: '0.3s'}}>
                                          <span><strong>Density:</strong> {mat.properties.density}</span>
                                          <span><strong>Tensile Strength:</strong> {mat.properties.tensile_strength}</span>
                                          <span><strong>Melting Point:</strong> {mat.properties.melting_point}</span>
                                          <span><strong>Conductivity:</strong> {mat.properties.conductivity}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      {isIncorporated && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-900/50 px-2 py-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                              Incorporated
                          </div>
                      )}
                  </div>
              )})}
              <SubTitle>System Suggestions</SubTitle>
                {(result.suggested_systems || []).map((sys, i) => {
                    const suggestionText = systemSuggestionTexts[i];
                    const isSelected = selectedSuggestions.has(suggestionText);
                    const isIncorporated = incorporatedSuggestions.has(suggestionText);
                    return (
                        <div key={i} className={`relative p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-cyan-900/40 border-brand-cyan' : 'bg-gray-800/50 border-gray-700'} ${isIncorporated ? 'opacity-60 bg-gray-800' : ''}`}>
                            <div className="flex items-start gap-4">
                               {!isViewer && (
                                   <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={isIncorporated}
                                        onChange={() => toggleSuggestion(suggestionText)}
                                        className="mt-1 h-4 w-4 rounded border-gray-600 text-brand-cyan focus:ring-brand-cyan bg-gray-700 disabled:opacity-50"
                                   />
                               )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-brand-light">{sys.name}</h4>
                                         <div className="flex items-center gap-2">
                                             <button
                                                onClick={() => {
                                                    const productContext = `Product: ${projectName}. Summary: ${result.executive_summary}`;
                                                    suggestionExplorer.explore(suggestionText, productContext);
                                                }}
                                                disabled={isViewer || suggestionExplorer.isExploring}
                                                className="py-1 px-3 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 transition-transform active:scale-95 flex items-center gap-1.5"
                                                title="Explore this suggestion with AI"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                                                Explore
                                            </button>
                                             <ReadAloudButton text={sys.description} tts={tts} voice={selectedTtsVoice} />
                                         </div>
                                    </div>
                                    <p className="text-sm text-gray-400">{sys.description}</p>
                                </div>
                            </div>
                              {isIncorporated && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-900/50 px-2 py-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                                    Incorporated
                                </div>
                            )}
                        </div>
                    )
                })}
              
            {!isViewer && (
                <div className="mt-6 flex justify-between items-center">
                    <button
                      onClick={handleIncorporate}
                      disabled={selectedSuggestions.size === 0 || isLoading}
                      className="py-2 px-5 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v4.992" /></svg>
                      Incorporate {selectedSuggestions.size > 0 ? `(${selectedSuggestions.size})` : ''} Selected Suggestions & Re-Analyze
                    </button>
                     <button
                        onClick={onLaunchDeVinci}
                        className="py-2 px-5 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 flex items-center gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375-3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" /></svg>
                        Discuss with DeVinci
                    </button>
                </div>
            )}
          </div>
        </Section>
        
        <Section id="visual_documentation" title="Visual Documentation & Media Generation" actions={
            <div className='flex items-center gap-2'>
                {!isViewer && <button onClick={() => createDrawingsZip([...drawings, ...inspirationalImages], projectName)} className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Download Drawings (.zip)
                </button>}
                <CommentButton
                    sectionId="visual_documentation"
                    sectionTitle="Visual Documentation"
                    onToggle={handleToggleCommentSection}
                    count={commentCounts['visual_documentation'] || 0}
                    isOpen={commentSection?.id === 'visual_documentation'}
                />
            </div>
        }>
            {/* Video Generation */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-6">
                <h4 className="text-lg font-semibold text-brand-light mb-2">Product Video</h4>
                {isVideoLoading ? (
                    <div className="text-center p-4">
                        <svg className="animate-spin h-8 w-8 text-purple-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-purple-300">Generating video, this may take a few minutes...</p>
                    </div>
                ) : videoError ? (
                    <p className="text-red-400">{videoError}</p>
                ) : videoUrl ? (
                    <video src={videoUrl} controls className="w-full rounded-lg" />
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-gray-400 mb-3">Generate a short video animation of your product concept.</p>
                        {!isViewer && <button onClick={() => setShowVideoModal(true)} className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition">Generate Product Video</button>}
                    </div>
                )}
            </div>

            {/* Technical Drawings */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-6">
                 <h4 className="text-lg font-semibold text-brand-light mb-3">Generate Technical Drawings</h4>
                 {!isViewer && (
                    <div className="space-y-4 p-4 border border-gray-600 rounded-md bg-gray-900/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-2">Drawing Subject</label>
                                <input 
                                  type="text" 
                                  value={drawingSubject} 
                                  onChange={e => setDrawingSubject(e.target.value)}
                                  placeholder="e.g., The main gearbox assembly"
                                  className="w-full p-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500"
                                  disabled={isDrawingInProgress}
                                />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-2">...or Generate from Image</label>
                               <input 
                                  type="file" 
                                  ref={drawingImageInputRef}
                                  onChange={e => setDrawingImageFile(e.target.files ? e.target.files[0] : null)}
                                  accept="image/*"
                                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                                  disabled={isDrawingInProgress}
                                />
                                {drawingImagePreview && <img src={drawingImagePreview} alt="Drawing Preview" className="mt-2 rounded-md max-h-20" />}
                            </div>
                        </div>
                        {!drawingImageFile && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Required Views</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(viewGroups).map(([groupName, views]) => (
                                        <div key={groupName}>
                                            <h5 className="text-xs font-semibold text-gray-400 mb-1">{groupName}</h5>
                                            {views.map(view => (
                                                <label key={view} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={drawingViews[view as keyof typeof drawingViews]}
                                                        onChange={() => setDrawingViews(prev => ({ ...prev, [view]: !prev[view as keyof typeof drawingViews] }))}
                                                        className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-700"
                                                        disabled={isDrawingInProgress}
                                                    />
                                                    {view}
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex items-stretch gap-4">
                            <button onClick={handleRequestDrawing} disabled={isGenerateDisabled} className="flex-1 py-2 px-5 bg-purple-600 text-white font-bold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                {generateButtonText()}
                            </button>
                             <button
                                onClick={handleRequestAssemblyOverview}
                                disabled={isDrawingInProgress}
                                className="py-2 px-5 bg-teal-600 text-white font-semibold rounded-lg border border-teal-500 hover:bg-teal-500 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                title="Generate an isometric view of the main product assembly, showing overall dimensions and key features."
                            >
                                <SparklesIcon />
                                Assembly Overview
                            </button>
                        </div>
                    </div>
                 )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {drawings.map(d => (
                        <div key={d.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
                            <div className="aspect-[16/9] bg-gray-700 flex items-center justify-center p-2">
                                {d.isLoading ? <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> :
                                d.error ? <span className="text-red-400 text-xs p-2">{d.error}</span> :
                                d.url ? <img src={d.url} alt={d.prompt} className="max-w-full max-h-full object-contain cursor-pointer" onClick={() => setDrawingToView(d)} /> : null}
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                                <p className="text-xs text-gray-400 mb-2 truncate" title={d.prompt}>{d.prompt}</p>
                                {!isViewer && (
                                    <div className="flex items-center justify-between gap-1 text-xs">
                                        <button onClick={() => onRemoveDrawing(d.id)} className="text-red-400 hover:text-red-300">Remove</button>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onSetCover(d.id, 'drawing')} title="Set as cover image for PDF export" className={`px-2 py-1 rounded ${d.isCoverImage ? 'bg-yellow-500/80 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>Cover</button>
                                            <label className="flex items-center gap-1 cursor-pointer" title="Include in PDF report"><input type="checkbox" checked={d.includeInReport} onChange={() => onToggleDrawingReportInclusion(d.id)} className="h-3 w-3 rounded text-brand-cyan bg-gray-600 border-gray-500 focus:ring-brand-cyan" /> PDF</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Photorealistic Concepts */}
             <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <InspirationalImageGenerator onRequest={onRequestInspirationalImage} isLoading={isAnyImageLoading} isViewer={isViewer} />
                {!isViewer && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50 text-center">
                        <p className="text-sm text-gray-400 mb-2">Or, let the AI envision the future of your product:</p>
                        <button
                            onClick={handleGenerateFutureConcept}
                            disabled={isAnyImageLoading || isLoading}
                            className="py-2 px-4 bg-teal-600 text-white font-semibold rounded-lg border border-teal-500 hover:bg-teal-500 transition active:scale-95 text-sm flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                            Generate Future Upgrade Concept
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {inspirationalImages.map(img => (
                         <div key={img.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
                            <div className="aspect-[16/9] bg-gray-700 flex items-center justify-center p-2">
                                {img.isLoading ? <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> :
                                img.error ? <span className="text-red-400 text-xs p-2">{img.error}</span> :
                                img.url ? <img src={img.url} alt={img.prompt} className="w-full h-full object-cover cursor-pointer" onClick={() => setDrawingToView(img)} /> : null}
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                                <p className="text-xs text-gray-400 mb-2 truncate" title={img.prompt}>{img.prompt}</p>
                                {!isViewer && (
                                    <div className="flex items-center justify-between gap-1 text-xs">
                                        <button onClick={() => onRemoveInspirationalImage(img.id)} className="text-red-400 hover:text-red-300">Remove</button>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onSetCover(img.id, 'image')} title="Set as cover image for PDF export" className={`px-2 py-1 rounded ${img.isCoverImage ? 'bg-yellow-500/80 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>Cover</button>
                                            <label className="flex items-center gap-1 cursor-pointer" title="Include in PDF report"><input type="checkbox" checked={img.includeInReport} onChange={() => onToggleImageReportInclusion(img.id)} className="h-3 w-3 rounded text-brand-cyan bg-gray-600 border-gray-500 focus:ring-brand-cyan" /> PDF</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                 <ImageHistory 
                    history={inspirationalImageHistory} 
                    onReinsert={onReinsertInspirationalImage} 
                    onDelete={onDeleteInspirationalImageFromHistory} 
                    currentImages={inspirationalImages}
                    isViewer={isViewer}
                />
             </div>
        </Section>

        <Section id="cad_export" title="Interactive 3D CAD Model">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-4">Generate a simplified 3D representation of your product's assembly based on the generated Technical Drawings. The model can be explored in an interactive 3D viewer.</p>
                {cadError && <p className="text-red-400 p-3 bg-red-900/30 rounded-md mb-3">{cadError}</p>}
                <div className="flex gap-4 items-center">
                    {!cadData ? (
                        <button
                            onClick={handleGenerateAndViewCad}
                            disabled={isCadLoading || isViewer || completedDrawingsCount === 0}
                            title={completedDrawingsCount === 0 ? "Generate at least one technical drawing first to enable CAD generation." : "Generate & View 3D Model"}
                            className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isCadLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
                                    <span>Generate & View 3D Model</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onOpenCadViewer}
                                className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5V18M15 7.5V18M3 16.5V12M12 12V3M12 12v3.75m0-3.75H9.75m2.25 0h2.25M12 12v3.75m0-3.75H9.75M12 12H7.5m4.5 0H16.5m-4.5 3.75h.008v.008H12v-.008Zm0 0H9.75m2.25 0h2.25" /></svg>
                                <span>Open 3D Viewer</span>
                            </button>
                            <button
                                onClick={handleExportCad}
                                disabled={isViewer}
                                className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                <span>Export .step.json</span>
                            </button>
                        </>
                    )}
                </div>
                 <p className="text-xs text-gray-500 mt-2">The 3D model is generated based on the technical drawings from the "Visual Documentation" section. Please generate drawings before creating the CAD model.</p>
            </div>
        </Section>

        {/* --- Generated Documents Sections --- */}
        <Section id="bom" title="Bill of Materials (BOM)" actions={
             <CommentButton
                sectionId="bom"
                sectionTitle="Bill of Materials (BOM)"
                onToggle={handleToggleCommentSection}
                count={commentCounts['bom'] || 0}
                isOpen={commentSection?.id === 'bom'}
            />
        }>
            <BillOfMaterialsTable bom={result.billOfMaterials} bomSourcing={bomSourcing} isViewer={isViewer} />
        </Section>
        
        <Section id="live_costing" title="Live Costing Dashboard" defaultOpen={false}>
            <LiveCostingDashboard liveCosting={liveCosting} isViewer={isViewer} />
        </Section>
        
        <Section id="advanced_simulation" title="Advanced Simulation Studio" defaultOpen={false}>
            <AdvancedSimulation bom={result.billOfMaterials} simulation={simulation} productContext={`Product: ${projectName}, Summary: ${result.executive_summary}`} isViewer={isViewer} />
        </Section>

        <RotordynamicsStudio id="rotordynamics_studio" model={rotorModel} onModelChange={onRotorModelChange} rossAnalysis={rossAnalysis} isViewer={isViewer} />
        
        <Section id="fabrication_planner" title="⚙️ Forge Fabrication Planner" defaultOpen={false}>
            <FabricationPlanner fabricationPlanner={fabricationPlanner} analysisResult={result} isViewer={isViewer} gcodeVisualizer={gcodeVisualizer} />
        </Section>
        
        <Section id="test_plan" title="Test Plan">
            <p className="text-gray-400 mb-4">{result.testPlan.overview}</p>
            <TestPlanTable testPlan={result.testPlan} />
        </Section>
        <Section id="compliance_safety" title="Compliance & Safety">
             <p className="text-gray-400 mb-2">{result.complianceAndSafety.overview}</p>
             <SubTitle>Applicable Standards</SubTitle>
             <ul className="list-disc pl-5 text-sm text-gray-400">
                {(result.complianceAndSafety.applicable_standards || []).map((s,i) => <li key={i}>{s}</li>)}
             </ul>
             <SubTitle>Safety Risk Assessment</SubTitle>
            <ComplianceAndSafetyTable compliance={result.complianceAndSafety} />
        </Section>
         <Section id="change_orders" title="Engineering Change Orders (ECOs)">
            <ECOTable ecos={result.engineeringChangeOrders} />
        </Section>

      </div>
      <CommentSidebar
        isOpen={commentSection !== null}
        sectionId={commentSection?.id || ''}
        sectionTitle={commentSection?.title || ''}
        onClose={() => setCommentSection(null)}
        authenticatedUser={authenticatedUser}
        comments={collaboration.comments}
        onAddComment={collaboration.addComment}
       />
      {/* Modals */}
      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} onConfirm={handleCopySummary} title="AI-Generated Summary" confirmText={copyButtonText}>
          <p className="text-sm text-gray-400 mb-4">A concise, executive-level summary of the full analysis report.</p>
          <div className="bg-gray-700/50 p-4 rounded-lg text-gray-300 max-h-96 overflow-y-auto">
              {summaryError ? <span className="text-red-400">{summaryError}</span> : summaryText}
          </div>
      </Modal>
       <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} onConfirm={handleGenerateVideo} title="Generate Product Video" confirmText="Generate Video" confirmDisabled={(!videoPrompt.trim() && !videoImageFile) || isVideoLoading}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Prompt (Optional if image is provided)</label>
                    <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} rows={3} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200" placeholder="e.g., A cinematic shot of the drill being used on a wooden plank..."></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Starting Image (Optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setVideoImageFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
                    {videoImagePreview && <img src={videoImagePreview} alt="preview" className="mt-2 rounded-md max-h-32"/>}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                    <select value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value as any)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200">
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                    </select>
                </div>
            </div>
      </Modal>
      {drawingToView && (
          <Modal isOpen={!!drawingToView} onClose={() => setDrawingToView(null)} title={drawingToView.prompt} confirmText="Close" onConfirm={() => setDrawingToView(null)}>
              <img src={drawingToView.url || ''} alt={drawingToView.prompt} className="w-full h-auto rounded-lg bg-gray-900" />
          </Modal>
      )}
    </div>
  );
};
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, Faction, MaterialSuggestion, BillOfMaterials, TestPlan, ComplianceAndSafety, Project, User, GeneratedDrawing, CadData, ProjectVersion, EngineeringChangeOrder, PreliminaryCostEstimate, GeneratedImage, RotorModel, RotorShaftElement, RotorDiskElement, RotorBearingElement, RotorMaterial, GoogleDocContent, EngineeringBranch } from '../../types';
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
import { useBomSourcing } from '../../hooks/useBomSourcing';
import { useLiveCosting } from '../../hooks/useLiveCosting';
import { LiveCostingDashboard } from './LiveCostingDashboard';
import { useNextStepAssistant } from '../../hooks/useNextStepAssistant';
import { NextStepAssistant } from './NextStepAssistant';
import { Section } from './Section';
import { createDrawingsZip } from '../../services/zipService';
import { ProjectDashboard } from './ProjectDashboard';
import { generateFactionInspirationalPrompts } from '../../services/geminiService';
import { PatentModule } from './PatentModule';
import { usePatentGenerator } from '../../hooks/usePatentGenerator';

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

const AgentVerificationBadge = ({ branch }: { branch: string }) => (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900/20 border border-green-500/30 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.15)]">
        <span className="animate-pulse w-1.5 h-1.5 bg-green-400 rounded-full"></span>
        <span className="text-[9px] font-black text-green-400 uppercase tracking-tight">{branch} PhD Verified</span>
    </div>
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
    const GoogleDriveIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.5" /><path fill-opacity="0.2" fill="#263238" d="M15.82 15.65l3.52-6.18h-7.06z"/></svg>;
    
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
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 animate-fade-in" style={{ animationDuration: '0.15s' }}>
                    <button onClick={() => { onExportPDF(); setIsOpen(false); }} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12.75h4.875c.621 0 1.125-.504 1.125-1.125V11.25a2.25 2.25 0 0 0-2.25-2.25H6.375a2.25 2.25 0 0 0-2.25 2.25v6.75c0 .621.504 1.125 1.125 1.125H6.375m1.5-12.75-1.5-1.5m0 0A2.25 2.25 0 0 1 6.375 3h.625c.621 0 1.125.504 1.125 1.125v1.5m-1.5-1.5Z" /></svg>
                        Export as PDF
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1 px-4 py-2">
                        {isGoogleAuthLoading ? (
                             <div className="py-3 text-sm text-center text-gray-400">Checking auth...</div>
                        ) : !isGoogleAuthenticated ? (
                            <button onClick={onGoogleSignIn} className="flex items-center justify-center gap-3 w-full text-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg my-1">
                                <GoogleDriveIcon />
                                Sign in with Google
                            </button>
                        ) : (
                           <div className="space-y-2">
                                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    Signed in as <br/>
                                    <span className="font-semibold text-gray-800 dark:text-gray-300 truncate">{googleExporterUser?.email}</span>
                                </div>

                                {isGoogleExporting ? (
                                    <div className="py-3 text-sm text-center text-yellow-600 dark:text-yellow-300 flex items-center gap-2 justify-center">
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
                                    <button onClick={onExportGoogle} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                        <GoogleDriveIcon />
                                        Export to Google Drive
                                    </button>
                                )}

                                <button onClick={() => { onGoogleSignOut(); setIsOpen(false); }} className="w-full text-center text-xs text-gray-500 hover:text-gray-800 dark:hover:white pt-1">
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
    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">{children}</h4>
);

const BillOfMaterialsTable = ({ bom, bomSourcing, isViewer }: { bom: BillOfMaterials; bomSourcing: ReturnType<typeof useBomSourcing>; isViewer: boolean }) => {
    const { sourceItem, sourcingResults, loadingStates, errorStates } = bomSourcing;
    
    return (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700/50">
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
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-2">{partNumber}</td>
                                <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
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
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <td colSpan={6} className="p-3 border-b border-gray-200 dark:border-gray-700">
                                        {error && <p className="text-red-400 text-xs">Error: {error}</p>}
                                        {results && (
                                            <div>
                                                <h5 className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-2">Potential Suppliers for "{item.name}":</h5>
                                                {results.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {results.map((res, j) => (
                                                        <li key={j} className={`text-xs flex gap-2 items-center ${res.verified ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">{res.supplier}</a> 
                                                            <span className="text-gray-400 dark:text-gray-500">|</span>
                                                            <span>Cost: {res.estimatedCost}</span> 
                                                            <span className="text-gray-400 dark:text-gray-500">|</span>
                                                            <span>Lead Time: {res.leadTime}</span>
                                                            {res.verified && (
                                                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-1.5 rounded" title={`AI Confidence: ${Math.round((res.confidence || 0) * 100)}%`}>
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                                                    Verified
                                                                </span>
                                                            )}
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
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-4 py-2">Item</th>
                    <th scope="col" className="px-4 py-2">Cost Estimate</th>
                    <th scope="col" className="px-4 py-2">Rationale</th>
                </tr>
            </thead>
            <tbody>
                {(estimate.breakdown || []).map((item, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{item.item}</td>
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
            <div key={tc.id || i} className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{tc.id}: {tc.description}</p>
                <p className="text-xs mt-1"><strong className="text-gray-600 dark:text-gray-400">Procedure:</strong> {tc.procedure}</p>
                <p className="text-xs mt-1"><strong className="text-gray-600 dark:text-gray-400">Expected Results:</strong> {tc.expected_results}</p>
            </div>
        ))}
    </div>
);

const ComplianceAndSafetyTable = ({ compliance }: { compliance: ComplianceAndSafety }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-4 py-2">Risk</th>
                    <th scope="col" className="px-4 py-2">Likelihood</th>
                    <th scope="col" className="px-4 py-2">Impact</th>
                    <th scope="col" className="px-4 py-2">Mitigation</th>
                </tr>
            </thead>
            <tbody>
                {(compliance.safety_risks || []).map((risk, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{risk.risk}</td>
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
            <div key={eco.eco_id || i} className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{eco.eco_id}: {eco.change_title}</p>
                <p className="text-xs mt-2"><strong className="text-gray-600 dark:text-gray-400">Description:</strong> {eco.description}</p>
                <p className="text-xs mt-1"><strong className="text-gray-600 dark:text-gray-400">Reason:</strong> {eco.reason_for_change}</p>
                <p className="text-xs mt-1"><strong className="text-gray-600 dark:text-gray-400">Impact:</strong> {eco.impact_analysis}</p>
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
    
    const addDiskElement = () => {
         const newElement: RotorDiskElement = { id: `d-${Date.now()}`, n: 0, m: 1, Id: 0.05, Ip: 0.1 };
         onModelChange({
            shaft: model?.shaft || [],
            disks: [...(model?.disks || []), newElement],
            bearings: model?.bearings || []
        });
    };
    
    const addBearingElement = () => {
        const newElement: RotorBearingElement = { id: `b-${Date.now()}`, n: 0, kxx: 1e6, kyy: 1e6, cxx: 1e3, cyy: 1e3, kxy: 0, kyx: 0, cxy: 0, cyx: 0 };
        onModelChange({
            shaft: model?.shaft || [],
            disks: model?.disks || [],
            bearings: [...(model?.bearings || []), newElement]
        });
    };


    return (
        <div id={id} className="mb-6 animate-fade-in">
             <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="mb-4 p-2 bg-white dark:bg-gray-900/50 rounded text-center border border-gray-300 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-800 dark:text-brand-light">Environment Status: <span className="font-mono text-yellow-600 dark:text-yellow-300">{rossAnalysis.rossStatus}</span></p>
                </div>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-brand-light mb-2">Rotor Model Editor</h4>
                        {/* Shaft Elements */}
                        <SubTitle>Shaft Elements</SubTitle>
                        <div className="space-y-2">
                             {(model?.shaft || []).map((elem, i) => <div key={elem.id} className="p-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-xs text-gray-700 dark:text-gray-300">Node {elem.n} to {elem.n+1}: L={elem.L}m, OD={elem.odl}m</div>)}
                        </div>
                        {!isViewer && <button onClick={addShaftElement} className="mt-2 text-xs py-1 px-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white">+ Add Shaft</button>}

                        {/* Disk Elements */}
                        <SubTitle>Disk Elements</SubTitle>
                         <div className="space-y-2">
                             {(model?.disks || []).map((elem, i) => <div key={elem.id} className="p-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-xs text-gray-700 dark:text-gray-300">Node {elem.n}: Mass={elem.m}kg</div>)}
                        </div>
                        {!isViewer && <button onClick={addDiskElement} className="mt-2 text-xs py-1 px-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white">+ Add Disk</button>}

                        {/* Bearing Elements */}
                        <SubTitle>Bearing Elements</SubTitle>
                         <div className="space-y-2">
                             {(model?.bearings || []).map((elem, i) => <div key={elem.id} className="p-2 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 text-xs text-gray-700 dark:text-gray-300">Node {elem.n}: Kxx={elem.kxx.toExponential(0)} N/m</div>)}
                        </div>
                        {!isViewer && <button onClick={addBearingElement} className="mt-2 text-xs py-1 px-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white">+ Add Bearing</button>}
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-brand-light mb-2">Analysis & Results</h4>
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => handleRunAnalysis('critical_speed')} disabled={!rossAnalysis.isRossReady || rossAnalysis.isRossRunning || isViewer} className="py-2 px-4 text-sm bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:opacity-50">Run Critical Speed</button>
                            <button onClick={() => handleRunAnalysis('campbell')} disabled={!rossAnalysis.isRossReady || rossAnalysis.isRossRunning || isViewer} className="py-2 px-4 text-sm bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:opacity-50">Run Campbell Plot</button>
                        </div>
                         {rossAnalysis.isRossRunning && <p className="text-yellow-600 dark:text-yellow-300">Analysis in progress...</p>}
                         {rossAnalysis.rossError && <p className="text-red-500 dark:text-red-400">{rossAnalysis.rossError}</p>}
                         {rossAnalysis.rossResult?.type === 'critical_speed' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                                    <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase bg-gray-200 dark:bg-gray-700"><tr><th className="px-2 py-1">Crit. Speed (rad/s)</th><th className="px-2 py-1">Log Dec</th><th className="px-2 py-1">Whirl</th></tr></thead>
                                    <tbody>
                                        {rossAnalysis.rossResult.critical_speeds.map((speed: number, i: number) => (
                                            <tr key={i} className="border-b border-gray-300 dark:border-gray-700">
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
        </div>
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
            return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 1 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" /></svg>;
        }
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>;
    };

    return (
        <button
            onClick={() => tts.speak(text, voice)}
            title={title}
            className={`p-1.5 rounded-full transition-colors duration-200 ${isPlaying ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-brand-cyan'}`}
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
            <h4 className="text-lg font-semibold text-gray-900 dark:text-brand-light">Generate Photorealistic Concept</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic product shot of a sleek smart ring on a marble surface"
                    className="w-full h-24 p-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aspect Ratio</label>
                <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
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
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mt-6">
            <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-brand-light">Image Generation History ({history.length})</h4>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isOpen && (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                    {history.map(image => (
                        <div key={image.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-400">
                            <div className="w-24 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden">
                                {image.url && <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate" title={image.prompt}>"{image.prompt}"</p>
                                <p className="text-[10px] text-gray-500 mt-1">Aspect: {image.aspectRatio || '16:9'}</p>
                            </div>
                            {!isViewer && (
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => onReinsert(image)}
                                        disabled={currentImageIds.has(image.id)}
                                        className="px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded border border-cyan-500/30 hover:bg-cyan-600/40 disabled:opacity-50"
                                    >
                                        Insert
                                    </button>
                                    <button 
                                        onClick={() => onDelete(image.id)}
                                        className="px-2 py-1 bg-red-900/20 text-red-400 rounded border border-red-500/30 hover:bg-red-900/40"
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
  patentGenerator: ReturnType<typeof usePatentGenerator>;
}

const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375 3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" />
    </svg>
);

const CommentButton = ({ sectionId, sectionTitle, onToggle, count, isOpen }: { sectionId: string; sectionTitle: string; onToggle: (id: string, title: string) => void; count: number; isOpen: boolean; }) => (
    <button onClick={() => onToggle(sectionId, sectionTitle)} title={isOpen ? "Hide comments" : "Show comments"} className={`relative p-1.5 rounded-full transition-colors ${isOpen ? 'bg-cyan-900/50 text-brand-cyan ring-2 ring-brand-cyan' : 'text-gray-400 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-brand-cyan'}`}>
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
  patentGenerator,
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
  const collaboration = useCollaboration(commentSection?.id || null, authenticatedUser);
  const commentCounts = useCommentCounts();


  // State for advanced drawing requests
  const [drawingSubject, setDrawingSubject] = useState('');
  const [drawingViews, setDrawingViews] = useState(defaultDrawingViews);
  const [drawingImageFile, setDrawingImageFile] = useState<File | null>(null);
  const [drawingImagePreview, setDrawingImagePreview] = useState<string | null>(null);

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

  const isDrawingInProgress = useMemo(() => (drawings || []).some(d => d.isLoading), [drawings]);
  const isAnyImageLoading = useMemo(() => inspirationalImages.some(img => img.isLoading), [inspirationalImages]);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const [openMaterialProperties, setOpenMaterialProperties] = useState<Set<number>>(new Set());

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

  const handleGenerateFactionConcepts = async () => {
    if (!result) return;
    try {
        const prompts = await generateFactionInspirationalPrompts(result);
        for (const prompt of prompts) {
            onRequestInspirationalImage(prompt, '16:9');
        }
    } catch (e) {
        console.error("Failed to generate faction-based concepts:", e);
    }
  };


  const selectedViewCount = Object.values(drawingViews).filter(Boolean).length;
  
  const generateButtonText = () => {
    if (isDrawingInProgress) return 'Generation in Progress...';
    if (drawingImageFile) return 'Generate Drawing from Image';
    return `Generate ${selectedViewCount > 0 ? selectedViewCount : ''} Drawing${selectedViewCount > 1 ? 's' : ''}`;
  };
  const isGenerateDisabled = isDrawingInProgress || (drawingImageFile ? false : (!drawingSubject.trim() || selectedViewCount === 0));

  return (
    <div id="tour-step-5" className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg animate-fade-in relative overflow-hidden">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-brand-light mb-1">{projectName}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {Icon && <Icon className="w-5 h-5 text-brand-cyan" />}
              <span>Analysis via: <span className="font-semibold text-brand-cyan">{selectedFaction?.name}</span></span>
              {result.branch && <span className="ml-2 px-2 py-0.5 bg-indigo-900/40 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-black uppercase tracking-widest">{result.branch} Branch</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-2">
                  <label htmlFor="tts-voice" className="text-sm font-medium text-gray-600 dark:text-gray-400">Voice:</label>
                  <select
                      id="tts-voice"
                      value={selectedTtsVoice}
                      onChange={(e) => setSelectedTtsVoice(e.target.value)}
                      className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2"
                  >
                      {TTS_VOICES.map(voice => (
                          <option key={voice.id} value={voice.id}>{voice.name}</option>
                      ))}
                  </select>
              </div>
              <button 
                onClick={handleGenerateSummary} 
                disabled={isSummaryLoading || isViewer}
                className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {!isViewer && <button onClick={onClear} className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 text-sm">New Analysis</button>}
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

        {/* Safety Audit Section */}
        {result.safety_audit && result.safety_audit.length > 0 && (
            <Section id="safety_audit" title="Agentic Safety Audit Interlock" actions={<span className="text-[10px] font-black text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-[0.2em]">PhD Agents Active</span>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.safety_audit.map((finding, i) => (
                        <div key={i} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex items-start gap-4 hover:border-gray-600 transition-colors">
                            <div className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full ${finding.status === 'Pass' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : finding.status === 'Warn' ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                            <div>
                                <h5 className="font-bold text-sm text-gray-200 mb-1">{finding.protocol}</h5>
                                <p className="text-xs text-gray-400 leading-relaxed">{finding.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        )}

        <Section id="executive_summary" title="Executive Summary" actions={<>
            <AgentVerificationBadge branch={result.branch || "General"} />
            <ReadAloudButton text={result.executive_summary} tts={tts} voice={selectedTtsVoice} />
            <CommentButton
                sectionId="executive_summary"
                sectionTitle="Executive Summary"
                onToggle={handleToggleCommentSection}
                count={commentCounts['executive_summary'] || 0}
                isOpen={commentSection?.id === 'executive_summary'}
            />
          </>}>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{result.executive_summary}</p>
          <ProjectDashboard result={result} />
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
          <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-green-600 dark:text-green-300 mb-2">Pros</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-700 dark:text-green-300/90">
                      {(result.faction_rationale?.pros || []).map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-700">
                  <h4 className="text-lg font-semibold text-red-600 dark:text-red-300 mb-2">Cons</h4>
                  <ul className="list-disc pl-5 space-y-1 text-red-700 dark:text-red-300/90">
                      {(result.faction_rationale?.cons || []).map((con, i) => <li key={i}>{con}</li>)}
                  </ul>
              </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400"><strong className="text-gray-800 dark:text-gray-200">Summary:</strong> {result.faction_rationale?.summary}</p>
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
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                     <h4 className="text-lg font-semibold text-brand-light mb-3">Material Suggestions</h4>
                     <div className="space-y-3">
                        {result.material_suggestions.map((mat, idx) => (
                            <div key={idx} className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded border border-gray-300 dark:border-gray-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-brand-cyan">{mat.name}</p>
                                        <p className="text-sm text-gray-300">{mat.rationale}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <button
                                            onClick={() => suggestionExplorer.explore(mat.name, result.executive_summary)}
                                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 transition"
                                        >
                                            Explore
                                        </button>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedSuggestions.has(`Material: ${mat.name}`)}
                                            onChange={() => toggleSuggestion(`Material: ${mat.name}`)}
                                            className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-700"
                                        />
                                    </div>
                                </div>
                                <button onClick={() => toggleMaterialProperties(idx)} className="text-xs text-gray-400 hover:text-white mt-2 flex items-center gap-1">
                                    {openMaterialProperties.has(idx) ? 'Hide' : 'Show'} Properties
                                </button>
                                {openMaterialProperties.has(idx) && (
                                    <ul className="mt-2 text-xs text-gray-400 grid grid-cols-2 gap-2 bg-gray-800 p-2 rounded">
                                        {Object.entries(mat.properties).map(([key, value]) => (
                                            <li key={key}><span className="font-semibold">{key}:</span> {value}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                     </div>
                </div>

                 <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                     <h4 className="text-lg font-semibold text-brand-light mb-3">System Suggestions</h4>
                     <div className="space-y-3">
                        {result.suggested_systems.map((sys, idx) => (
                            <div key={idx} className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded border border-gray-300 dark:border-gray-600 flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-brand-cyan">{sys.name}</p>
                                    <p className="text-sm text-gray-300">{sys.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">Rationale: {sys.rationale}</p>
                                </div>
                                 <div className="flex items-center gap-2">
                                     <button
                                        onClick={() => suggestionExplorer.explore(sys.name, result.executive_summary)}
                                        className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 transition"
                                    >
                                        Explore
                                    </button>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSuggestions.has(`System: ${sys.name}`)}
                                        onChange={() => toggleSuggestion(`System: ${sys.name}`)}
                                        className="h-4 w-4 rounded border-gray-500 text-brand-cyan focus:ring-brand-cyan bg-gray-700"
                                    />
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                
                {!isViewer && selectedSuggestions.size > 0 && (
                    <button onClick={handleIncorporate} className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-500 transition">
                        Incorporate {selectedSuggestions.size} Suggestion(s) into Next Version
                    </button>
                )}
            </div>
        </Section>

        <Section id="visual_documentation" title="Visual Documentation" actions={
            <CommentButton
                sectionId="visual_documentation"
                sectionTitle="Visual Documentation"
                onToggle={handleToggleCommentSection}
                count={commentCounts['visual_documentation'] || 0}
                isOpen={commentSection?.id === 'visual_documentation'}
            />
        }>
            {/* Drawings and Images UI */}
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Technical Drawings */}
                     <div className="space-y-4">
                         <h4 className="text-lg font-semibold text-brand-light">Technical Drawings</h4>
                         {drawings.map(d => (
                             <div key={d.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                 {d.url ? <img src={d.url} alt={d.prompt} className="w-full h-48 object-contain bg-white" /> : <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500">{d.error ? 'Error' : 'Generating...'}</div>}
                                 
                                 {/* Cover Badge Overlay */}
                                 {d.isCoverImage && (
                                     <div className="absolute top-2 left-2 bg-brand-cyan text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg z-10 flex items-center gap-1">
                                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" /></svg>
                                         REPORT COVER
                                     </div>
                                 )}

                                 <div className="p-2 bg-gray-50 dark:bg-gray-700 flex justify-between items-center text-xs">
                                     <span className="truncate flex-1 text-gray-700 dark:text-gray-300" title={d.prompt}>{d.prompt}</span>
                                     <div className="flex gap-2">
                                        {!isViewer && (
                                            <>
                                                <button 
                                                    onClick={() => onSetCover(d.id, 'drawing')} 
                                                    className={`transition-colors font-bold ${d.isCoverImage ? 'text-brand-cyan' : 'text-gray-400 hover:text-brand-cyan'}`}
                                                    title="Set as report cover"
                                                >
                                                    {d.isCoverImage ? 'Selected' : 'Set Cover'}
                                                </button>
                                                <button onClick={() => onRemoveDrawing(d.id)} className="text-red-500 hover:text-red-400">Remove</button>
                                            </>
                                        )}
                                     </div>
                                 </div>
                             </div>
                         ))}
                         {!isViewer && (
                             <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                 <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Generate New Drawing</h5>
                                 <input 
                                    type="text" 
                                    value={drawingSubject} 
                                    onChange={e => setDrawingSubject(e.target.value)} 
                                    placeholder="Describe the view (e.g. Exploded view of motor)" 
                                    className="w-full p-2 mb-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                 />
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {Object.keys(drawingViews).map(view => (
                                        <label key={view} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                            <input type="checkbox" checked={(drawingViews as any)[view]} onChange={e => setDrawingViews(prev => ({...prev, [view]: e.target.checked}))} />
                                            {view}
                                        </label>
                                    ))}
                                  </div>
                                  <button onClick={handleRequestDrawing} disabled={isGenerateDisabled} className="w-full py-2 bg-brand-cyan text-white text-sm rounded hover:bg-cyan-500 disabled:opacity-50">
                                    {generateButtonText()}
                                  </button>
                             </div>
                         )}
                     </div>
                     
                     {/* Inspirational Images */}
                     <div className="space-y-4">
                         <h4 className="text-lg font-semibold text-brand-light">Concept Art</h4>
                         {inspirationalImages.map(img => (
                             <div key={img.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                  {img.url ? <img src={img.url} alt={img.prompt} className="w-full h-48 object-cover" /> : <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500">{img.error ? 'Error' : 'Generating...'}</div>}
                                   
                                   {/* Cover Badge Overlay */}
                                   {img.isCoverImage && (
                                       <div className="absolute top-2 left-2 bg-brand-cyan text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg z-10 flex items-center gap-1">
                                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" /></svg>
                                           REPORT COVER
                                       </div>
                                   )}

                                   <div className="p-2 bg-gray-50 dark:bg-gray-700 flex justify-between items-center text-xs">
                                     <span className="truncate flex-1 text-gray-700 dark:text-gray-300" title={img.prompt}>{img.prompt}</span>
                                     <div className="flex gap-2">
                                        {!isViewer && (
                                            <>
                                                <button 
                                                    onClick={() => onSetCover(img.id, 'image')} 
                                                    className={`transition-colors font-bold ${img.isCoverImage ? 'text-brand-cyan' : 'text-gray-400 hover:text-brand-cyan'}`}
                                                    title="Set as report cover"
                                                >
                                                    {img.isCoverImage ? 'Selected' : 'Set Cover'}
                                                </button>
                                                <button onClick={() => onRemoveInspirationalImage(img.id)} className="text-red-500 hover:text-red-400">Remove</button>
                                            </>
                                        )}
                                     </div>
                                 </div>
                             </div>
                         ))}
                         {!isViewer && <InspirationalImageGenerator onRequest={onRequestInspirationalImage} isLoading={isAnyImageLoading} isViewer={isViewer} />}
                     </div>
                 </div>
                 
                 <div className="flex justify-center gap-4 mt-4">
                    <button onClick={() => setShowVideoModal(true)} className="py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-500 transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        Generate Video
                    </button>
                    <button onClick={handleGenerateFactionConcepts} className="py-2 px-4 bg-teal-600 text-white rounded hover:bg-teal-500 transition flex items-center gap-2">
                        <SparklesIcon />
                        Auto-Generate Concepts
                    </button>
                 </div>
                 
                 <ImageHistory history={inspirationalImageHistory} onReinsert={onReinsertInspirationalImage} onDelete={onDeleteInspirationalImageFromHistory} currentImages={inspirationalImages} isViewer={isViewer} />
            </div>
        </Section>

        <Section id="cad_export" title="3D CAD & Export">
            <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-300 mb-4">Generate a simplified 3D representation of the assembly based on the analysis and drawings.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={handleGenerateAndViewCad} disabled={isCadLoading} className="py-2 px-4 bg-brand-cyan text-white rounded hover:bg-cyan-500 disabled:opacity-50 transition">
                        {isCadLoading ? 'Generating 3D Model...' : 'View 3D Model'}
                    </button>
                    {cadData && <button onClick={handleExportCad} className="py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition">Export STEP (JSON)</button>}
                </div>
                {cadError && <p className="text-red-400 mt-2">{cadError}</p>}
            </div>
        </Section>

        <Section id="bom" title="Bill of Materials (BOM)" actions={
            <CommentButton sectionId="bom" sectionTitle="Bill of Materials" onToggle={handleToggleCommentSection} count={commentCounts['bom'] || 0} isOpen={commentSection?.id === 'bom'} />
        }>
            <BillOfMaterialsTable bom={result.billOfMaterials} bomSourcing={bomSourcing} isViewer={isViewer} />
        </Section>

        <Section id="live_costing" title="Live Costing Analysis">
            <LiveCostingDashboard liveCosting={liveCosting} isViewer={isViewer} />
        </Section>
        
        <Section id="advanced_simulation" title="Advanced Simulation" actions={result.branch === EngineeringBranch.NUCLEAR && <AgentVerificationBadge branch="Nuclear" />}>
             <AdvancedSimulation bom={result.billOfMaterials} simulation={simulation} productContext={result.executive_summary} isViewer={isViewer} />
        </Section>

        <Section id="rotordynamics_studio" title="Rotordynamics Studio">
            <RotordynamicsStudio model={rotorModel} onModelChange={onRotorModelChange} rossAnalysis={rossAnalysis} isViewer={isViewer} />
        </Section>

        <Section id="fabrication_planner" title="Fabrication Planner" actions={result.branch === EngineeringBranch.AEROSPACE && <AgentVerificationBadge branch="Aerospace" />}>
            <FabricationPlanner fabricationPlanner={fabricationPlanner} analysisResult={result} isViewer={isViewer} gcodeVisualizer={gcodeVisualizer} />
        </Section>

        <PatentModule result={result} patentGenerator={patentGenerator} isViewer={isViewer} knowledgeBase={activeProject?.knowledgeBase || []} authenticatedUser={authenticatedUser} />

        <Section id="test_plan" title="Test Plan">
            <TestPlanTable testPlan={result.testPlan} />
        </Section>

        <Section id="compliance_safety" title="Compliance & Safety" actions={<>
            {result.branch === EngineeringBranch.AEROSPACE && <AgentVerificationBadge branch="Aerospace" />}
            {result.branch === EngineeringBranch.NUCLEAR && <AgentVerificationBadge branch="Nuclear" />}
            <CommentButton sectionId="compliance_safety" sectionTitle="Compliance & Safety" onToggle={handleToggleCommentSection} count={commentCounts['compliance_safety'] || 0} isOpen={commentSection?.id === 'compliance_safety'} />
        </>}>
             <ComplianceAndSafetyTable compliance={result.complianceAndSafety} />
        </Section>
        
        <Section id="change_orders" title="Engineering Change Orders">
            <ECOTable ecos={result.engineeringChangeOrders} />
        </Section>

      </div>

      {/* Modals */}
      <CommentSidebar
        isOpen={!!commentSection}
        sectionId={commentSection?.id || ''}
        sectionTitle={commentSection?.title || ''}
        onClose={() => setCommentSection(null)}
        authenticatedUser={authenticatedUser}
        comments={collaboration.comments}
        onAddComment={collaboration.addComment}
      />
      
      <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="Executive Summary" confirmText={copyButtonText} onConfirm={handleCopySummary}>
        <div className="p-4 bg-gray-800 rounded border border-gray-700 max-h-96 overflow-y-auto">
            <p className="text-gray-300 whitespace-pre-wrap">{summaryText}</p>
        </div>
      </Modal>
      
      <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} title="Generate Video Animation" confirmText={isVideoLoading ? 'Generating...' : 'Generate'} confirmDisabled={isVideoLoading} onConfirm={handleGenerateVideo}>
           <div className="space-y-4">
               <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
                   <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" placeholder="Describe the video..." />
               </div>
               <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Starting Image (Optional)</label>
                    <input type="file" accept="image/*" onChange={e => setVideoImageFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-cyan file:text-white hover:file:bg-cyan-500"/>
                    {videoImagePreview && <img src={videoImagePreview} alt="Preview" className="mt-2 h-32 object-contain rounded" />}
               </div>
               <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                   <select value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as any)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                       <option value="16:9">16:9 (Landscape)</option>
                       <option value="9:16">9:16 (Portrait)</option>
                   </select>
               </div>
               {videoUrl && (
                   <div className="mt-4">
                       <p className="text-sm text-green-400 mb-2">Video Generated!</p>
                       <video src={videoUrl} controls className="w-full rounded" />
                   </div>
               )}
               {videoError && <p className="text-sm text-red-400">{videoError}</p>}
           </div>
      </Modal>
    </div>
  );
};
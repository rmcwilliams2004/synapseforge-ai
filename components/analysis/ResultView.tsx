import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, Faction, MaterialSuggestion, BillOfMaterials, TestPlan, ComplianceAndSafety, Project, User, GeneratedDrawing, CadData, ProjectVersion, EngineeringChangeOrder, PreliminaryCostEstimate, GeneratedImage, RotorModel, RotorShaftElement, RotorDiskElement, RotorBearingElement, RotorMaterial, GoogleDocContent, EngineeringBranch, FoundryCadResult, IoStatus, ProcessFmeaEntry } from '../../types';
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
import { ProjectDashboard } from './ProjectDashboard';
import { PatentModule } from './PatentModule';
import { usePatentGenerator } from '../../hooks/usePatentGenerator';
import { CadViewerModal } from '../cad/CadViewerModal';
import { MATERIAL_LIBRARY } from '../../constants/materialLibrary';

const defaultDrawingViews = {
    'Top': false,
    'Front': false,
    'Side': false,
    'Isometric': false,
    'Exploded': false,
    'Cross-Section': false,
};

// --- Missing Constants & Sub-Components ---

const TTS_VOICES = [
    { id: 'Zephyr', name: 'Zephyr (Professional)' },
    { id: 'Puck', name: 'Puck (Energetic)' },
    { id: 'Charon', name: 'Charon (Deep)' },
    { id: 'Kore', name: 'Kore (Friendly)' },
    { id: 'Fenrir', name: 'Fenrir (Authoritative)' },
];

const ReadAloudButton = ({ text, tts, voice }: { text: string, tts: any, voice: string }) => (
    <button onClick={() => tts.speak(text, voice)} className="p-2 text-gray-400 hover:text-brand-cyan transition" title="Read Aloud">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${tts.isPlaying ? 'animate-pulse text-brand-cyan' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
    </button>
);

const CommentButton = ({ sectionId, sectionTitle, onToggle, count, isOpen }: any) => (
    <button onClick={() => onToggle(sectionId, sectionTitle)} className={`flex items-center gap-1.5 p-2 rounded-md transition-colors ${isOpen ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-400 hover:text-gray-200'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.023c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03 8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
        {count > 0 && <span className="text-xs font-bold">{count}</span>}
    </button>
);

const ExportDropdown = ({ onExportPDF, onExportGoogle, onGoogleSignIn, onGoogleSignOut, isGoogleAuthLoading, isGoogleAuthenticated, googleExporterUser, isGoogleExporting, googleExportStatus, googleExportError, googleDocContent, onOpenGoogleDocPreview }: any) => {
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 border border-gray-300 dark:border-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                More
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30 p-2 space-y-1">
                    <button onClick={() => { onExportPDF(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm text-gray-200">Export as PDF (Legacy)</button>
                    {isGoogleAuthenticated ? (
                        <>
                            <button onClick={() => { onExportGoogle(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm text-gray-200" disabled={isGoogleExporting}>
                                {isGoogleExporting ? `Exporting: ${googleExportStatus}` : 'Export to Google Drive'}
                            </button>
                            <button onClick={() => { onGoogleSignOut(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm text-red-400">Sign out of Google ({googleExporterUser?.email})</button>
                        </>
                    ) : (
                        <button onClick={() => { onGoogleSignIn(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm text-blue-400" disabled={isGoogleAuthLoading}>
                            {isGoogleAuthLoading ? 'Connecting...' : 'Sign in to Google Drive'}
                        </button>
                    )}
                    {/* Fix: Resolved truncated code and fixed call to onOpenGoogleDocPreview (line 97) */}
                    {googleDocContent && (
                        <button onClick={() => { onOpenGoogleDocPreview(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm text-brand-cyan">Preview Google Doc</button>
                    )}
                </div>
            )}
        </div>
    );
};

export interface ResultViewProps {
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
  foundryResult: FoundryCadResult | null;
  onGenerateCad: (drawings: GeneratedDrawing[], result: AnalysisResult) => Promise<CadData | null>;
  isCadLoading: boolean;
  cadError: string | null;
  onOpenCadViewer: () => void;
  // Added onAddLocalSnapshot to ResultViewProps interface to support prop-drilling for snapshots
  onAddLocalSnapshot?: (dataUrl: string, prompt: string) => void;
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

// Fix: Exported ResultView correctly to resolve AnalysisDisplay.tsx import error.
export const ResultView: React.FC<ResultViewProps> = (props) => {
    const { projectName, result, tts, authenticatedUser } = props;
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [activeSectionTitle, setActiveSectionTitle] = useState('');
    const commentCounts = useCommentCounts();
    const { comments, addComment } = useCollaboration(activeSection, authenticatedUser);

    const toggleComments = (sectionId: string, sectionTitle: string) => {
        if (activeSection === sectionId) {
            setActiveSection(null);
        } else {
            setActiveSection(sectionId);
            setActiveSectionTitle(sectionTitle);
        }
    };

    const handleExportPDF = () => {
        if (props.activeProject) {
            exportFullReportPDF(props.activeProject, props.drawings, props.inspirationalImages);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <header className="flex justify-between items-center sticky top-0 bg-gray-50 dark:bg-brand-dark py-4 z-20 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={props.onClear} className="p-2 text-gray-500 hover:text-brand-cyan transition">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                    </button>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-brand-light tracking-tighter uppercase italic">{projectName}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <ExportDropdown 
                        onExportPDF={handleExportPDF}
                        onExportGoogle={props.onExportToGoogle}
                        onGoogleSignIn={props.onGoogleExporterSignIn}
                        onGoogleSignOut={props.onGoogleExporterSignOut}
                        isGoogleAuthLoading={props.isGoogleAuthLoading}
                        isGoogleAuthenticated={props.isGoogleExporterAuthenticated}
                        googleExporterUser={props.googleExporterUser}
                        isGoogleExporting={props.isGoogleExporting}
                        googleExportStatus={props.googleExportStatus}
                        googleExportError={props.googleExportError}
                        googleDocContent={props.googleDocContent}
                        onOpenGoogleDocPreview={props.onOpenGoogleDocPreview}
                    />
                </div>
            </header>

            <ProjectDashboard result={result} />

            <Section id="executive_summary" title="Executive Summary" actions={<><ReadAloudButton text={result.executive_summary} tts={tts} voice="Zephyr" /><CommentButton sectionId="executive_summary" sectionTitle="Executive Summary" count={commentCounts['executive_summary'] || 0} onToggle={toggleComments} isOpen={activeSection === 'executive_summary'} /></>}>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{result.executive_summary}</p>
            </Section>

            <Section id="faction_rationale" title="Faction Rationale" actions={<CommentButton sectionId="faction_rationale" sectionTitle="Faction Rationale" count={commentCounts['faction_rationale'] || 0} onToggle={toggleComments} isOpen={activeSection === 'faction_rationale'} />}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 uppercase text-xs tracking-widest">Optimizations (Pros)</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-green-800 dark:text-green-300">
                                {result.faction_rationale.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 uppercase text-xs tracking-widest">Compromises (Cons)</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-red-800 dark:text-red-300">
                                {result.faction_rationale.cons.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase text-xs tracking-widest">Philosophical Summary</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">{result.faction_rationale.summary}</p>
                    </div>
                </div>
            </Section>

            <Section id="ai_suggestions" title="Material Suggestions" actions={<CommentButton sectionId="ai_suggestions" sectionTitle="Material Suggestions" count={commentCounts['ai_suggestions'] || 0} onToggle={toggleComments} isOpen={activeSection === 'ai_suggestions'} />}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.material_suggestions.map((mat, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-cyan transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-brand-light">{mat.name}</h4>
                                <button 
                                    onClick={() => props.suggestionExplorer.explore(mat.name + " in " + result.product_name, result.executive_summary)}
                                    className="text-[10px] font-black uppercase text-brand-cyan hover:underline transition-all opacity-0 group-hover:opacity-100"
                                >
                                    Explore & Visualize
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{mat.rationale}</p>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                <div className="text-gray-400">Density: <span className="text-gray-700 dark:text-gray-200">{mat.properties.density}</span></div>
                                <div className="text-gray-400">Strength: <span className="text-gray-700 dark:text-gray-200">{mat.properties.tensile_strength}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section id="cad_export" title="CAD Synthesis & Foundry" actions={<CommentButton sectionId="cad_export" sectionTitle="CAD Export" count={commentCounts['cad_export'] || 0} onToggle={toggleComments} isOpen={activeSection === 'cad_export'} />}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center text-brand-cyan">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-brand-light">Interactive CAD Environment</h4>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">Generate a parametric 3D representation based on the analysis and drawings. Perform real-time physics audits in the Sovereign Foundry.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => props.onGenerateCad(props.drawings, result)}
                            disabled={props.isCadLoading}
                            className="py-2 px-6 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {props.isCadLoading ? 'Synthesizing...' : 'Synthesize 3D Mesh'}
                        </button>
                        {props.cadData && (
                            <button 
                                onClick={props.onOpenCadViewer}
                                className="py-2 px-6 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition active:scale-95"
                            >
                                Open Foundry Viewer
                            </button>
                        )}
                    </div>
                    {props.cadError && <p className="text-xs text-red-500 mt-2">{props.cadError}</p>}
                </div>
            </Section>

            <Section id="bom" title="Bill of Materials" actions={<CommentButton sectionId="bom" sectionTitle="BOM" count={commentCounts['bom'] || 0} onToggle={toggleComments} isOpen={activeSection === 'bom'} />}>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="px-4 py-3">Part #</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Material</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-300">
                            {result.billOfMaterials.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">{item.part_number}</td>
                                    <td className="px-4 py-3 font-bold">{item.name}</td>
                                    <td className="px-4 py-3">{item.quantity}</td>
                                    <td className="px-4 py-3">{item.material}</td>
                                    <td className="px-4 py-3 text-xs leading-relaxed opacity-70">{item.description}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => props.bomSourcing.sourceItem(item)}
                                            disabled={props.bomSourcing.loadingStates.get(item.part_number)}
                                            className="text-[10px] font-black uppercase text-brand-cyan hover:underline disabled:opacity-30"
                                        >
                                            {props.bomSourcing.loadingStates.get(item.part_number) ? 'Sourcing...' : 'Source'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section id="live_costing" title="Live Costing Dashboard" actions={<CommentButton sectionId="live_costing" sectionTitle="Live Costing" count={commentCounts['live_costing'] || 0} onToggle={toggleComments} isOpen={activeSection === 'live_costing'} />}>
                <LiveCostingDashboard liveCosting={props.liveCosting} isViewer={props.authenticatedUser.role === 'Viewer'} />
            </Section>

            <Section id="fabrication_planner" title="Fabrication Planner" actions={<CommentButton sectionId="fabrication_planner" sectionTitle="Fabrication Planner" count={commentCounts['fabrication_planner'] || 0} onToggle={toggleComments} isOpen={activeSection === 'fabrication_planner'} />}>
                <FabricationPlanner fabricationPlanner={props.fabricationPlanner} analysisResult={result} isViewer={props.authenticatedUser.role === 'Viewer'} gcodeVisualizer={props.gcodeVisualizer} />
            </Section>

            <Section id="test_plan" title="Engineering Test Plan" actions={<CommentButton sectionId="test_plan" sectionTitle="Test Plan" count={commentCounts['test_plan'] || 0} onToggle={toggleComments} isOpen={activeSection === 'test_plan'} />}>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4 italic">"{result.testPlan.overview}"</p>
                    <div className="grid grid-cols-1 gap-4">
                        {result.testPlan.test_cases.map((tc, idx) => (
                            <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-brand-cyan bg-cyan-100 dark:bg-cyan-900/30 px-2 py-0.5 rounded uppercase tracking-widest">{tc.id}</span>
                                    <h4 className="font-bold text-gray-900 dark:text-brand-light flex-1 ml-4">{tc.description}</h4>
                                </div>
                                <div className="mt-2 space-y-2 text-xs">
                                    <p className="text-gray-500"><strong className="text-gray-700 dark:text-gray-300">Procedure:</strong> {tc.procedure}</p>
                                    <p className="text-gray-500"><strong className="text-gray-700 dark:text-gray-300">Expected:</strong> {tc.expected_results}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section id="compliance_safety" title="Compliance & Safety" actions={<CommentButton sectionId="compliance_safety" sectionTitle="Compliance" count={commentCounts['compliance_safety'] || 0} onToggle={toggleComments} isOpen={activeSection === 'compliance_safety'} />}>
                 <div className="space-y-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                        <h4 className="text-xs font-black text-yellow-700 dark:text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            Safety Overview
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.complianceAndSafety.overview}</p>
                    </div>
                    <div>
                         <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase text-xs tracking-widest">Applicable Standards</h4>
                         <div className="flex flex-wrap gap-2">
                            {result.complianceAndSafety.applicable_standards.map((s, i) => <span key={i} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold border border-gray-300 dark:border-gray-600">{s}</span>)}
                         </div>
                    </div>
                </div>
            </Section>

            <Section id="patent_application" title="Intellectual Property Status">
                 <PatentModule 
                    result={result} 
                    patentGenerator={props.patentGenerator} 
                    isViewer={props.authenticatedUser.role === 'Viewer'} 
                    authenticatedUser={props.authenticatedUser} 
                    onUpdateUser={() => {}} // Integration handled via higher-level state in full app context
                    project={props.activeProject} 
                    foundryState={props.foundryResult ? {
                        selectedMaterial: MATERIAL_LIBRARY.find(m => m.name === props.foundryResult?.metadata.material) || MATERIAL_LIBRARY[0],
                        parameters: props.foundryResult.scad_params.parameters,
                        scadString: props.foundryResult.scad_params.raw_scad,
                        safetyFactor: 3.2,
                        isLocked: true,
                        jurisdiction: 'USPTO',
                        designHash: 'COMMITTED_HASH_SAMPLE'
                    } : undefined}
                />
            </Section>
            
            <NextStepAssistant suggestions={props.nextStepAssistant.suggestions} isLoading={props.nextStepAssistant.isLoading} error={props.nextStepAssistant.error} onAction={() => {}} onRefresh={() => props.nextStepAssistant.fetchSuggestions(result, props.drawings, props.inspirationalImages)} />

            <CommentSidebar 
                isOpen={activeSection !== null} 
                sectionId={activeSection || ''} 
                sectionTitle={activeSectionTitle} 
                onClose={() => setActiveSection(null)} 
                authenticatedUser={authenticatedUser} 
                comments={comments} 
                onAddComment={addComment} 
            />
        </div>
    );
};

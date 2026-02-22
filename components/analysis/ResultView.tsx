import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, Faction, MaterialSuggestion, BillOfMaterials, TestPlan, ComplianceAndSafety, Project, User, GeneratedDrawing, CadData, ProjectVersion, EngineeringChangeOrder, PreliminaryCostEstimate, GeneratedImage, RotorModel, RotorShaftElement, RotorDiskElement, RotorBearingElement, RotorMaterial, GoogleDocContent, EngineeringBranch, FoundryCadResult, IoStatus, ProcessFmeaEntry, SimulationResult, ProjectTask, Role } from '../../types';
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
import { TaskBoard } from './TaskBoard';
import { ReadAloudButton, CommentButton } from './AnalysisButtons';
import { ConceptSynthesisSection } from './ConceptSynthesisSection';
import { CadSynthesisSection } from './CadSynthesisSection';
import { MaterialProposalsSection } from './MaterialProposalsSection';
import { BomSection } from './BomSection';

const ExportDropdown = ({ onExportPDF }: any) => {
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
            <button onClick={() => setIsOpen(!isOpen)} className="py-2 px-4 bg-white dark:bg-slate-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 transition text-sm flex items-center gap-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export Report
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2">
                    <button onClick={() => { onExportPDF(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-200">Export as PDF</button>
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
  isCadViewerOpen: boolean;
  onOpenCadViewer: () => void;
  onAddLocalSnapshot?: (dataUrl: string, prompt: string) => void;
  // --- Google Exporter Related Props ---
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
  // -------------------------------------
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
  onSaveSimulation?: (result: SimulationResult) => void;
  onUpdateTasks?: (tasks: ProjectTask[]) => void;
}

export const ResultView: React.FC<ResultViewProps> = (props) => {
    const { projectName, result, tts, authenticatedUser, cadData, simulation } = props;
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
        <div className="space-y-6 animate-fade-in pb-12">
            <header className="flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <button onClick={props.onClear} className="p-2 text-gray-500 hover:text-brand-cyan transition-colors" title="Back to Inputs">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">{projectName}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => props.onGenerateSummary(result)} 
                        disabled={props.isSummaryLoading}
                        className="py-2 px-4 bg-brand-cyan text-white font-semibold rounded-lg hover:bg-cyan-600 transition text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {props.isSummaryLoading ? 'Generating...' : 'Generate Summary'}
                    </button>
                    <ExportDropdown onExportPDF={handleExportPDF} />
                </div>
            </header>

            {props.summaryError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800/30">
                    {props.summaryError}
                </div>
            )}

            <ProjectDashboard result={result} />

            <Section id="executive_summary" title="Executive Summary" actions={<><ReadAloudButton text={result.executive_summary} tts={tts} voice="Zephyr" /><CommentButton sectionId="executive_summary" sectionTitle="Executive Summary" count={commentCounts['executive_summary'] || 0} onToggle={toggleComments} isOpen={activeSection === 'executive_summary'} /></>}>
                <p className="whitespace-pre-wrap">{result.executive_summary}</p>
            </Section>

            <ConceptSynthesisSection 
                result={result}
                inspirationalImages={props.inspirationalImages}
                onRemoveInspirationalImage={props.onRemoveInspirationalImage}
                onRequestInspirationalImage={props.onRequestInspirationalImage}
                onToggleImageReportInclusion={props.onToggleImageReportInclusion}
                commentCounts={commentCounts}
                toggleComments={toggleComments}
                activeSection={activeSection}
            />

            <CadSynthesisSection 
                cadData={cadData}
                physicsResult={simulation.physicsResult}
                isPhysicsActive={simulation.isPhysicsActive}
                onOpenCadViewer={props.onOpenCadViewer}
                onGenerateCad={props.onGenerateCad}
                isCadLoading={props.isCadLoading}
                drawings={props.drawings}
                result={result}
                onAddLocalSnapshot={props.onAddLocalSnapshot}
                onRunAudit={() => simulation.runGenesisVerification(cadData!)}
                onAutoCorrect={simulation.autoCorrectGeometry}
            />

            <MaterialProposalsSection 
                result={result}
                suggestionExplorer={props.suggestionExplorer}
                commentCounts={commentCounts}
                toggleComments={toggleComments}
                activeSection={activeSection}
            />

            <BomSection 
                result={result}
                bomSourcing={props.bomSourcing}
                commentCounts={commentCounts}
                toggleComments={toggleComments}
                activeSection={activeSection}
            />

            <Section id="fabrication_plan" title="Fabrication & Assembly" actions={<CommentButton sectionId="fabrication_plan" sectionTitle="Fabrication & Assembly" count={commentCounts['fabrication_plan'] || 0} onToggle={toggleComments} isOpen={activeSection === 'fabrication_plan'} />}>
                <FabricationPlanner 
                    fabricationPlanner={props.fabricationPlanner}
                    analysisResult={result}
                    isViewer={props.authenticatedUser.role === Role.Viewer}
                    gcodeVisualizer={props.gcodeVisualizer}
                />
            </Section>

            <Section id="patent_application" title="IP & Patent Drafting">
                 <PatentModule 
                    result={result} 
                    patentGenerator={props.patentGenerator} 
                    // Fix: Use Role.Viewer from enum instead of string literal to resolve "unintentional comparison" type error.
                    isViewer={props.authenticatedUser.role === Role.Viewer} 
                    authenticatedUser={props.authenticatedUser} 
                    onUpdateUser={() => {}} 
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

            <CommentSidebar 
                isOpen={activeSection !== null} 
                sectionId={activeSection || ''} 
                sectionTitle={activeSectionTitle} 
                onClose={() => setActiveSection(null)} 
                authenticatedUser={authenticatedUser} 
                comments={comments} 
                onAddComment={addComment} 
            />

            {props.isCadViewerOpen && props.cadData && (
                // Fix: Use Role.Viewer from enum instead of string literal to resolve "unintentional comparison" type error.
                <CadViewerModal 
                    isOpen={props.isCadViewerOpen} 
                    onClose={props.onOpenCadViewer} 
                    cadData={props.cadData} 
                    isViewer={props.authenticatedUser.role === Role.Viewer}
                    physicsResult={simulation.physicsResult}
                    isPhysicsActive={simulation.isPhysicsActive}
                    onAutoCorrect={simulation.autoCorrectGeometry}
                />
            )}
        </div>
    );
};

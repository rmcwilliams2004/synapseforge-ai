
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, Faction, MaterialSuggestion, BillOfMaterials, TestPlan, ComplianceAndSafety, Project, User, GeneratedDrawing, CadData, ProjectVersion, EngineeringChangeOrder, PreliminaryCostEstimate, GeneratedImage, RotorModel, RotorShaftElement, RotorDiskElement, RotorBearingElement, RotorMaterial, GoogleDocContent, InnovatorId, InnovatorModule, Innovator, InnovationCouncil } from '../../types';
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
import { INNOVATORS } from '../../constants';
import { TickerOverlay, VerdictType } from '../TickerOverlay';
import { CouncilHUD } from '../CouncilHUD';

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
  onLaunchDeVinci: (partner?: Innovator) => void;
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

const MODULE_THEMES: Record<InnovatorModule, { bg: string, border: string, text: string, score: string, accent: string }> = {
    'Visionary Architect': { bg: 'bg-purple-900/20', border: 'border-purple-500/40', text: 'text-purple-300', score: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]', accent: 'border-purple-500' },
    'Empirical Optimizer': { bg: 'bg-emerald-900/20', border: 'border-emerald-500/40', text: 'text-emerald-300', score: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', accent: 'border-emerald-500' },
    'Lateral Thinker': { bg: 'bg-cyan-900/20', border: 'border-cyan-500/40', text: 'text-cyan-300', score: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]', accent: 'border-cyan-500' },
    'Systematic Problem Solver': { bg: 'bg-amber-900/20', border: 'border-amber-500/40', text: 'text-amber-300', score: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]', accent: 'border-amber-500' },
};

const InnovatorInsightCard: React.FC<{ insight: any, onLaunchDeVinci: (p: Innovator) => void }> = ({ insight, onLaunchDeVinci }) => {
  const innovator = INNOVATORS.find(i => i.id === insight.innovator_id);
  if (!innovator) return null;

  const theme = MODULE_THEMES[innovator.module] || MODULE_THEMES['Lateral Thinker'];
  const score = insight.synthesis_score || Math.floor(Math.random() * 20) + 75; 

  return (
    <div className={`p-5 rounded-xl ${theme.bg} border ${theme.border} relative overflow-hidden group hover:border-white/20 transition-all duration-500 shadow-xl flex flex-col h-full`}>
      <div className="absolute -top-4 -right-4 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={`w-32 h-32 ${theme.text}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h4 className={`text-lg font-bold ${theme.text} mb-0.5`}>{innovator.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{innovator.era}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${theme.text}`}>{innovator.module}</span>
          </div>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Methodology Alignment</p>
            <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full ${theme.score} rounded-full transition-all duration-1000 delay-300`} style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-gray-300">{score}%</span>
            </div>
        </div>
      </div>

      <div className="relative z-10 space-y-4 flex-grow">
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
          <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Cognitive Anchor</h5>
          <p className="text-sm text-gray-200 leading-relaxed italic">"{innovator.mentalModel}"</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <h5 className={`text-[10px] font-bold uppercase tracking-widest mb-1 text-white/40`}>Synthesis Reasoning</h5>
            <p className="text-sm text-gray-300 leading-relaxed font-serif italic line-clamp-4 group-hover:line-clamp-none transition-all duration-500">{insight.application_rationale}</p>
          </div>
          <div className="pt-3 border-t border-white/5">
            <h5 className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest mb-1">Tactical Redesign Proposal</h5>
            <p className="text-md text-white font-semibold tracking-tight leading-tight">{insight.specific_suggestion}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onLaunchDeVinci(innovator)}
        className={`mt-6 w-full py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative z-10 bg-black/20 hover:bg-black/40 ${theme.text} ${theme.border} hover:border-white/40`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v1.5m-6 0v-1.5a6 6 0 0 1 6-6v1.5m0 0v1.5m0-1.5a6 6 0 0 0-6 6v1.5m6-7.5a6 6 0 0 1 6 6v1.5" /></svg>
        Enter The Lab Session
      </button>
    </div>
  );
};

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
  const [showInternalMonologue, setShowInternalMonologue] = useState(false);

  // Derived verdicts for the Ticker component
  const designVerdicts = useMemo(() => {
    const verdicts: { type: VerdictType; message: string }[] = [];
    if (result.faction_rationale.pros.length > 3) {
      verdicts.push({ type: 'positive', message: 'Architecture aligns with lens core' });
    }
    if (result.faction_rationale.cons.length > 2) {
      verdicts.push({ type: 'negative', message: 'Structural contradictions detected' });
    }
    if (result.complianceAndSafety.safety_risks.some(r => r.impact === 'High')) {
      verdicts.push({ type: 'caution', message: 'Critical failure points identified' });
    }
    if (result.billOfMaterials.length > 15) {
      verdicts.push({ type: 'info', message: 'High complexity detected' });
    }
    return verdicts;
  }, [result]);

  return (
    <div id="tour-step-5" className="bg-gray-900 border-2 border-gray-700 rounded-lg animate-fade-in relative overflow-hidden">
      
      {/* Workflow HUD: Recruited Council Persistence */}
      {activeVersion?.activeCouncil && (
          <CouncilHUD council={activeVersion.activeCouncil} onLaunchPartner={onLaunchDeVinci} />
      )}

      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-brand-light mb-1">{projectName}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {selectedFaction?.icon && <selectedFaction.icon className="w-5 h-5 text-brand-cyan" />}
              <span>Lens: <span className="font-semibold text-brand-cyan">{selectedFaction?.name}</span></span>
              <span className="mx-1 opacity-30">|</span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                Board Active
              </span>
            </div>
          </div>
          <div className="w-full lg:w-72">
             <TickerOverlay verdicts={designVerdicts} />
          </div>
        </div>

        <NextStepAssistant 
          suggestions={nextStepAssistant.suggestions} 
          isLoading={nextStepAssistant.isLoading} 
          error={nextStepAssistant.error} 
          onAction={(actionId) => document.getElementById(actionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} 
          onRefresh={() => nextStepAssistant.fetchSuggestions(result, drawings, inspirationalImages)} 
        />

        <Section id="partner_synthesis" title="Innovation Partner Synthesis" actions={
            <button 
                onClick={() => setShowInternalMonologue(!showInternalMonologue)}
                className="text-xs font-mono text-purple-400 hover:text-purple-300 underline uppercase tracking-tighter"
            >
                {showInternalMonologue ? 'Hide Engine Reasoning' : 'View Synthesis Monologue'}
            </button>
        }>
            {showInternalMonologue && (
                <div className="mb-6 p-5 bg-gray-800/40 border-l-4 border-purple-500 rounded-r-xl animate-fade-in">
                    <p className="text-xs font-mono text-purple-300 uppercase mb-3 tracking-widest">Board Synthesis Logic</p>
                    <div className="space-y-3 text-sm text-gray-400 leading-relaxed italic">
                        <p>1. <span className="text-purple-200 not-italic font-bold">Deconstruction:</span> Evaluated technical bottlenecks through first-principles reduction.</p>
                        <p>2. <span className="text-purple-200 not-italic font-bold">Mapping:</span> Cross-referenced design trade-offs with the active roster's heuristics.</p>
                        <p>3. <span className="text-purple-200 not-italic font-bold">Translation:</span> Mapped {result.innovator_insights.length} historical breakthroughs to the modern product architecture.</p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.innovator_insights.map((insight, idx) => (
                    <InnovatorInsightCard key={idx} insight={insight} onLaunchDeVinci={onLaunchDeVinci} />
                ))}
            </div>
        </Section>

        <Section id="summary" title="Executive Summary">
          <p className="text-gray-300 leading-relaxed">{result.executive_summary}</p>
        </Section>

        <Section id="faction_analysis" title="Analytical Rationale">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-lg">
                        <h4 className="text-emerald-400 font-bold mb-2 uppercase text-xs tracking-widest">Alignment (Pros)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-100/70">
                            {result.faction_rationale.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                   </div>
                   <div className="bg-rose-900/10 border border-rose-500/20 p-4 rounded-lg">
                        <h4 className="text-rose-400 font-bold mb-2 uppercase text-xs tracking-widest">Contradictions (Cons)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-rose-100/70">
                            {result.faction_rationale.cons.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                   </div>
                </div>
                <div className="bg-gray-800/40 p-5 rounded-lg border border-gray-700">
                    <h4 className="text-brand-cyan font-bold mb-3 uppercase text-xs tracking-widest">Analysis Summary</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.faction_rationale.summary}</p>
                </div>
            </div>
        </Section>
      </div>
    </div>
  );
};

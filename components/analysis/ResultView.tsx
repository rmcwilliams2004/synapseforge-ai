
import React, { useState, useMemo } from 'react';
import { AnalysisResult, Faction, MaterialSuggestion, ManufacturingProcess, ComparativeAnalysis, Risk, BillOfMaterialsItem, AssemblyInstructionStep, SystemSuggestion, Project, User, GeneratedDrawing } from '../../types';
import { exportFullReportPDF, exportCostEstimatePDF, exportRiskAssessmentPDF, exportDrawingSpecPDF } from '../../services/pdfService';
import { Modal } from '../Modal';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
}
const Section: React.FC<SectionProps> = ({ title, children, actions, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-cyan-800/50">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-brand-cyan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <h3 className="text-xl font-bold text-brand-cyan">{title}</h3>
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>
            {isOpen && <div className="pl-8">{children}</div>}
        </div>
    );
}

interface ResultViewProps {
  projectName: string;
  result: AnalysisResult;
  selectedFaction: Faction | null;
  onClear: () => void;
  isLoading: boolean;
  onGenerateVideo: () => void;
  isVideoLoading: boolean;
  videoUrl: string | null;
  videoError: string | null;
  drawings: GeneratedDrawing[];
  onRequestDrawing: (prompt: string) => void;
  onRemoveDrawing: (id: string) => void;
  onIncorporateSuggestions: (suggestionTexts: string[]) => void;
  onLaunchDeVinci: () => void;
  activeProject: Project | null;
  authenticatedUser: User;
}

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
  onRemoveDrawing,
  onIncorporateSuggestions,
  onLaunchDeVinci,
  activeProject,
  authenticatedUser
}: ResultViewProps) => {
  const Icon = selectedFaction?.icon;
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [drawingPrompt, setDrawingPrompt] = useState('');
  const isViewer = authenticatedUser.role === 'Viewer';
  const isDrawingInProgress = useMemo(() => (drawings || []).some(d => d.isLoading), [drawings]);

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

  const handleSelectAll = (suggestionTexts: string[]) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      const allSelected = suggestionTexts.length > 0 && suggestionTexts.every(text => newSet.has(text));
      
      if (allSelected) {
        suggestionTexts.forEach(text => newSet.delete(text));
      } else {
        suggestionTexts.forEach(text => newSet.add(text));
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
      exportFullReportPDF(activeProject, drawings);
    }
  };

  const handleRequestDrawing = () => {
    if (drawingPrompt.trim()) {
        onRequestDrawing(drawingPrompt.trim());
        setDrawingPrompt('');
    }
  };

  const handleExportBOM = () => {
    const bom = result.drawingSpecification?.bill_of_materials || [];
    const jsonString = JSON.stringify(bom, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_BOM.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="tour-step-5" className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 md:p-8 animate-fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-light mb-1">{projectName}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {Icon && <Icon className="w-5 h-5 text-brand-cyan" />}
            <span>Analysis via: <span className="font-semibold text-brand-cyan">{selectedFaction?.name}</span></span>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExportFullReport} className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export Full Report
            </button>
            {!isViewer && <button onClick={onClear} className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 text-sm">New Analysis</button>}
        </div>
      </div>

      {/* Main Content */}
      <Section title="Executive Summary"><p className="text-gray-300 leading-relaxed">{result.executive_summary}</p></Section>
      
      <Section title="Exploded View Animation" defaultOpen={false}>
          {/* Video Generation UI */}
           <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
             {!videoUrl && !isVideoLoading && !videoError && (
                 <>
                    <p className="text-gray-400 mb-4">Generate a 3D animated exploded view of the product to visualize its components and assembly.</p>
                    <button onClick={() => setShowVideoModal(true)} disabled={isViewer} className="py-2 px-5 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isViewer ? 'Generation Disabled for Viewers' : 'Generate Video'}
                    </button>
                 </>
             )}
             {isVideoLoading && <p>Loading...</p>}
             {videoError && <p className="text-red-400">{videoError}</p>}
             {videoUrl && <video src={videoUrl} controls autoPlay muted loop className="w-full rounded-lg" />}
           </div>
      </Section>
      
      <Section title="Generated 2D Technical Drawings" defaultOpen={true}>
         <div className="space-y-4">
            {!isViewer && (
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={drawingPrompt}
                        onChange={(e) => setDrawingPrompt(e.target.value)}
                        placeholder="e.g., Detailed view of the gearbox assembly"
                        className="flex-grow p-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition disabled:opacity-50"
                        disabled={isDrawingInProgress}
                        onKeyDown={(e) => e.key === 'Enter' && handleRequestDrawing()}
                    />
                    <button onClick={handleRequestDrawing} disabled={!drawingPrompt.trim() || isDrawingInProgress} className="py-2 px-5 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        Generate Drawing
                    </button>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(drawings || []).map(drawing => (
                    <div key={drawing.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-center relative group">
                       <h4 className="text-sm font-semibold text-brand-light mb-2 truncate" title={drawing.prompt}>"{drawing.prompt}"</h4>
                       <div className="aspect-video bg-gray-900/50 rounded flex items-center justify-center">
                          {drawing.isLoading && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Generating...</span>
                            </div>
                          )}
                          {drawing.error && <p className="text-red-400 text-xs p-2">{drawing.error}</p>}
                          {drawing.url && <img src={drawing.url} alt={`Technical drawing of ${drawing.prompt}`} className="w-full h-full object-contain rounded bg-white p-1" />}
                       </div>
                       {!isViewer && (
                           <button 
                                onClick={() => onRemoveDrawing(drawing.id)} 
                                className="absolute top-2 right-2 p-1.5 bg-red-600/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500/80 active:scale-95"
                                title="Delete this drawing"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                           </button>
                       )}
                    </div>
                ))}
            </div>
            {(drawings || []).length === 0 && <p className="text-center text-gray-500 italic py-4">No technical drawings generated for this version yet.</p>}
         </div>
      </Section>

      <Section title="Technical Specification">
        <div className="space-y-6 text-gray-300">
          <div>
            <h4 className="text-md font-semibold text-gray-100 mb-2">Introduction</h4>
            <p className="leading-relaxed border-l-2 border-gray-700 pl-4">{result.technicalSpecification?.introduction}</p>
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-100 mb-2">Functional Requirements</h4>
            <ul className="list-disc pl-5 space-y-1 marker:text-brand-cyan">
              {(result.technicalSpecification?.functional_requirements || []).map((req, i) => (
                <li key={i} className="pl-2">{req}</li>
              ))}
            </ul>
            {(result.technicalSpecification?.functional_requirements || []).length === 0 && <p className="text-gray-500 italic pl-5">No functional requirements specified.</p>}
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-100 mb-2">Performance Targets</h4>
            <ul className="list-disc pl-5 space-y-1 marker:text-brand-cyan">
              {(result.technicalSpecification?.performance_targets || []).map((target, i) => (
                <li key={i} className="pl-2">{target}</li>
              ))}
            </ul>
            {(result.technicalSpecification?.performance_targets || []).length === 0 && <p className="text-gray-500 italic pl-5">No performance targets specified.</p>}
          </div>
        </div>
      </Section>

      <Section title="Faction Rationale">
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

      <Section 
          title="Material Suggestions"
          actions={!isViewer && (
            <button
                onClick={() => handleSelectAll(materialSuggestionTexts)}
                className="py-1 px-3 text-xs bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition active:scale-95"
                disabled={materialSuggestionTexts.length === 0}
            >
                {materialSuggestionTexts.length > 0 && materialSuggestionTexts.every(text => selectedSuggestions.has(text)) ? 'Deselect All' : 'Select All'}
            </button>
          )}
      >
          {(result.material_suggestions || []).map((mat, i) => {
            const suggestionText = materialSuggestionTexts[i];
            const isSelected = selectedSuggestions.has(suggestionText);
            return (
              <div key={i} className={`mb-4 p-4 rounded-lg border transition-colors duration-200 ${isSelected ? 'bg-cyan-900/40 border-brand-cyan' : 'bg-gray-800/50 border-gray-700'}`}>
                <label htmlFor={`mat-sugg-${i}`} className={`flex items-start gap-4 ${isViewer ? '' : 'cursor-pointer'}`}>
                    {!isViewer && (
                        <input
                            id={`mat-sugg-${i}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSuggestion(suggestionText)}
                            className="mt-1 h-4 w-4 rounded border-gray-600 text-brand-cyan focus:ring-brand-cyan bg-gray-700"
                        />
                    )}
                    <div className="flex-1">
                        <h4 className="font-bold text-brand-light">{mat.name}</h4>
                        <p className="text-sm text-gray-400 mb-3">{mat.rationale}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="bg-gray-700/50 p-2 rounded"><strong>Density:</strong> {mat.properties.density}</div>
                            <div className="bg-gray-700/50 p-2 rounded"><strong>Tensile Strength:</strong> {mat.properties.tensile_strength}</div>
                            <div className="bg-gray-700/50 p-2 rounded"><strong>Melting Point:</strong> {mat.properties.melting_point}</div>
                            <div className="bg-gray-700/50 p-2 rounded"><strong>Conductivity:</strong> {mat.properties.conductivity}</div>
                        </div>
                    </div>
                </label>
            </div>
            )
          })}
          {(result.material_suggestions || []).length === 0 && <p className="text-gray-500 italic">No material suggestions were generated.</p>}
      </Section>
      
      <Section 
        title="AI System Suggestions"
        actions={!isViewer && (
            <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectAll(systemSuggestionTexts)}
                  className="py-1 px-3 text-xs bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition active:scale-95"
                  disabled={systemSuggestionTexts.length === 0}
                >
                  {systemSuggestionTexts.length > 0 && systemSuggestionTexts.every(text => selectedSuggestions.has(text)) ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={onLaunchDeVinci}
                  disabled={isLoading || isViewer}
                  className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v1.5m-6 0v-1.5a6 6 0 0 1 6-6v1.5m0 0v1.5m0-1.5a6 6 0 0 0-6 6v1.5m6-7.5a6 6 0 0 1 6 6v1.5" /></svg>
                  Discuss with DeVinci
                </button>
            </div>
        )}
      >
          {(result.suggested_systems || []).map((sys, i) => {
             const suggestionText = systemSuggestionTexts[i];
             const isSelected = selectedSuggestions.has(suggestionText);
             return (
               <div key={i} className={`bg-gray-800/50 p-4 rounded-lg border transition-colors duration-200 mb-4 ${isSelected ? 'bg-cyan-900/40 border-brand-cyan' : 'border-gray-700'}`}>
                  <label htmlFor={`sys-sugg-${i}`} className={`flex items-start gap-4 ${isViewer ? '' : 'cursor-pointer'}`}>
                      {!isViewer && (
                        <input
                          id={`sys-sugg-${i}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSuggestion(suggestionText)}
                          className="mt-1.5 h-4 w-4 rounded border-gray-600 text-brand-cyan focus:ring-brand-cyan bg-gray-700"
                        />
                      )}
                      <div className="flex-grow">
                          <h4 className="text-lg font-semibold text-brand-light">{sys.name}</h4>
                          <p className="text-sm text-gray-300 mt-2">{sys.description}</p>
                          <p className="text-sm mt-3"><strong className="text-purple-400">Rationale:</strong> {sys.rationale}</p>
                      </div>
                  </label>
               </div>
             )
          })}
           {(result.suggested_systems || []).length === 0 && <p className="text-gray-500 italic">No system suggestions were generated.</p>}
      </Section>
      
      {/* All other documentation sections can follow this pattern */}

      {selectedSuggestions.size > 0 && !isViewer && (
          <div className="sticky bottom-4 inset-x-0 mx-auto w-fit z-30 animate-slide-in-up">
            <div className="flex items-center gap-4 rounded-lg border-2 border-brand-cyan bg-gray-900/80 p-3 shadow-2xl shadow-cyan-900/50 backdrop-blur-sm">
                <span className="font-semibold text-brand-light">
                    {selectedSuggestions.size} suggestion{selectedSuggestions.size > 1 ? 's' : ''} selected.
                </span>
                <button
                    onClick={handleIncorporate}
                    disabled={isLoading}
                    className="py-2 px-5 bg-brand-cyan font-bold text-white rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50"
                >
                    Incorporate Selected
                </button>
                <button
                    onClick={() => setSelectedSuggestions(new Set())}
                    className="text-gray-400 transition hover:text-white active:scale-95"
                    title="Clear selection"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
            </div>
          </div>
        )}
      
      <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} onConfirm={() => { onGenerateVideo(); setShowVideoModal(false); }} title="Confirm Video Generation" confirmText="Generate">
        <p>Video generation is a computationally intensive process and may take several minutes.</p>
        <p className="mt-2 text-sm text-gray-400">In a production environment, this could be a premium feature that consumes significant resources.</p>
      </Modal>
    </div>
  );
};

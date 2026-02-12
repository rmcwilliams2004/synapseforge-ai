
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Faction, ProjectVersion, Project, AnalysisResult, User, LogEntry, Role, GeneratedDrawing, FactionId, GeneratedImage, EditorState, RotorModel, CadData, InProgressState, IngestedDocument, ProjectIndexEntry, SubscriptionStatus, EngineeringBranch, DomainCategory, SystemState, FoundryCadResult, NalPrecision } from './types';
import { ENGINEERING_PHILOSOPHIES, TOUR_STEPS, MOCK_USERS } from './constants';
import { useAnalysis } from './hooks/useAnalysis';
import { useVideoGenerator } from './hooks/useVideoGenerator';
import { Header } from './components/Header';
import { FactionSelector } from './components/FactionSelector';
import { PromptInput } from './components/PromptInput';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { Tour } from './components/Tour';
import { ProjectManager } from './components/ProjectManager';
import { useProjects } from './hooks/useProjects';
import { DeVinciModal } from './components/DeVinciModal';
import { useDrawingGenerator } from './hooks/useDrawingGenerator';
import { useAnalysisPersistence } from './hooks/useAnalysisPersistence';
import { UserManualModal } from './components/UserManualModal';
import { TechnicalDocumentModal } from './components/TechnicalDocumentModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProjectModal } from './components/ProjectModal';
import { AuthPage } from './components/AuthPage';
import { ProfileModal } from './components/ProfileModal';
import { ImageIdentifierModal } from './components/ImageIdentifierModal';
import { VoiceCommanderWidget } from './components/VoiceCommanderWidget';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useSummaryGenerator } from './hooks/useSummaryGenerator';
import { useCadGenerator } from './hooks/useCadGenerator';
import { useDeVinci } from './hooks/useDeVinci';
import { 
    extractProjectDetailsFromPdf,
    extractProjectDetailsFromImage,
    extractProjectDetailsFromVideo,
    extractProjectDetailsFromVideoUrl,
    parseApiError,
    ExtractedProjectDetails,
    createProjectFunctionDeclaration,
} from './services/geminiService';
import * as googleApiService from './services/googleApiService';
import { projectApi } from './services/productionApiService';
import { useInspirationalImageGenerator } from './hooks/useInspirationalImageGenerator';
import { useSetupAssistant } from './hooks/useSetupAssistant';
import { useGoogleExporter } from './hooks/useGoogleExporter';
import { useTts } from './hooks/useTts';
import { useSimulation } from './hooks/useSimulation';
import { useFabricationPlanner } from './hooks/useFabricationPlanner';
import { useImageIdentifier } from './hooks/useImageIdentifier';
import { useVersionComparer } from './hooks/useVersionComparer';
import { useGCodeVisualizer } from './hooks/useGCodeVisualizer';
import { useSuggestionExplorer } from './hooks/useSuggestionExplorer';
import { useBomSourcing } from './hooks/useBomSourcing';
import { usePromptValidator } from './hooks/usePromptValidator';
import { useLiveCosting } from './hooks/useLiveCosting';
import { useNextStepAssistant } from './hooks/useNextStepAssistant';
import { useVoiceCommander } from './hooks/useVoiceCommander';
import { useAppVoice } from './hooks/useAppVoice';
import { createDrawingsZip } from './services/zipService';
import { persistProjectData } from './services/StorageManager';
import { useAiChat } from './hooks/useAiChat';
import { AiChatModal } from './components/AiChatModal';
import { ToolSuite } from './components/suite/ToolSuite';
import { VideoImportModal } from './components/VideoImportModal';
import { usePatentGenerator } from './hooks/usePatentGenerator';
import { PricingPage } from './components/PricingPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { AccountPage } from './components/AccountPage';
import { LegalGuard } from './components/LegalGuard';
import { Footer } from './components/Footer';
import { PartnerIndemnityModal } from './components/PartnerIndemnityModal';
import { SystemStatusIndicator, DiagnosticsPanel } from './components/SystemActivationOverlay';
import { SystemToast } from './components/SystemToast';
import { ConfigurationGateModal } from './components/ConfigurationGateModal';
import { useForgeController } from './hooks/useForgeController';
import { useProjectExport } from './hooks/useProjectExport';
import { useForgeVoice } from './hooks/useForgeVoice';
import { MATERIAL_LIBRARY } from './constants/materialLibrary';

const useRossAnalysis = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const workerRef = useRef<Worker | null>(null);
    const [isRossReady, setIsRossReady] = useState(false);
    const [isRossRunning, setIsRossRunning] = useState(false);
    const [rossStatus, setRossStatus] = useState('Not initialized');
    const [rossResult, setRossResult] = useState<any>(null);
    const [rossError, setRossError] = useState<string | null>(null);

    const workerCode = `
      let pyodide = null;
      let rossInstalled = false;

      self.onmessage = async (event) => {
        const { type, payload } = event.data;

        if (type === 'INIT') {
          try {
            if (!pyodide) {
              self.postMessage({ type: 'STATUS', message: 'Loading Pyodide environment...' });
              importScripts("https://cdn.plot.ly/plotly-latest.min.js");
              importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");
              pyodide = await loadPyodide();
              self.postMessage({ type: 'STATUS', message: 'Pyodide loaded. Loading micropip...' });
              await pyodide.loadPackage("micropip");
              const micropip = pyodide.micropip;
              self.postMessage({ type: 'STATUS', message: 'Installing ross library...' });
              await micropip.install('ross-rotordynamics');
              rossInstalled = true;
              self.postMessage({ type: 'READY' });
            } else {
              self.postMessage({ type: 'READY' });
            }
          } catch (error) {
            self.postMessage({ type: 'ERROR', message: error.message });
          }
        } else if (type === 'RUN_ANALYSIS') {
          if (!pyodide || !rossInstalled) {
            self.postMessage({ type: 'ERROR', message: 'Environment not ready.' });
            return;
          }

          self.postMessage({ type: 'STATUS', message: 'Running analysis: ' + payload.analysisType });

          try {
            pyodide.globals.set("rotor_model_json", JSON.stringify(payload.rotorModel));
            pyodide.globals.set("analysis_type", payload.analysisType);

            const pythonCode = \`
import json
import js
import ross as rs
import numpy as np
import plotly.graph_objects as go

rs.config_plot(backend="plotly")

rotor_model = json.loads(rotor_model_json)
analysis = analysis_type

shaft_elements = [
    rs.ShaftElement(
        L=elem['L'],
        idl=elem['idl'],
        odl=elem['odl'],
        material=rs.Material(name=elem['material']['name'], E=elem['material']['E'], G_s=elem['material']['G_s'], rho=elem['material']['rho']),
        n=elem['n']
    ) for elem in rotor_model.get('shaft', [])
]

disk_elements = [
    rs.DiskElement(
        n=elem['n'],
        m=elem['m'],
        Id=elem['Id'],
        Ip=elem['Ip']
    ) for elem in rotor_model.get('disks', [])
]

bearing_elements = [
    rs.BearingElement(
        n=elem['n'],
        kxx=elem.get('kxx', 0), kxy=elem.get('kxy', 0),
        kyx=elem.get('kyy', 0), kyy=elem.get('kyy', 0),
        cxx=elem.get('cxx', 0), cxy=elem.get('cxy', 0),
        cyx=elem.get('cyx', 0), cyy=elem.get('cyy', 0)
    ) for elem in rotor_model.get('bearings', [])
]

# Ensure at least one shaft element exists to create a rotor
if not shaft_elements:
    raise ValueError("Rotor model must have at least one shaft element.")

rotor = rs.Rotor(shaft_elements, disk_elements, bearing_elements)

results = {}

if analysis == 'critical_speed':
    solution = rotor.run_critical_speed()
    results = {
        "type": "critical_speed",
        "critical_speeds": solution.wd.tolist(),
        "log_dec": solution.log_dec.tolist(),
        "whirl_direction": solution.whirl_direction.tolist()
    }
elif analysis == 'campbell':
    speed_range = np.linspace(0, 1000, 101)
    fig = rotor.campbell(speed_range, frequencies=6)
    results = {
        "type": "campbell",
        "plot_json": fig.to_json()
    }

json.dumps(results)
            \`;
            
            const resultsJson = await pyodide.runPythonAsync(pythonCode);
            self.postMessage({ type: 'RESULT', payload: JSON.parse(resultsJson) });

          } catch (error) {
            self.postMessage({ type: 'ERROR', message: error.message });
          }
        }
      };
    `;

    useEffect(() => {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;

        worker.onmessage = (event) => {
            const { type, payload, message } = event.data;
            switch (type) {
                case 'STATUS':
                    setRossStatus(message);
                    break;
                case 'READY':
                    setIsRossReady(true);
                    setRossStatus('Ready for analysis');
                    addLog('INFO', 'Rotordynamics environment (ross) is ready.');
                    break;
                case 'RESULT':
                    setRossResult(payload);
                    setIsRossRunning(false);
                    setRossStatus('Analysis complete');
                    addLog('INFO', 'Rotordynamics analysis completed successfully.');
                    break;
                case 'ERROR':
                    setRossError(message);
                    setIsRossRunning(false);
                    setRossStatus('Error occurred');
                    addLog('ERROR', 'Rotordynamics analysis failed: ' + message);
                    break;
            }
        };

        worker.postMessage({ type: 'INIT' });

        return () => {
            worker.terminate();
        };
    }, [addLog]);

    const runAnalysis = (rotorModel: RotorModel, analysisType: 'critical_speed' | 'campbell') => {
        if (!isRossReady || !workerRef.current) {
            setRossError('Analysis environment is not ready.');
            return;
        }
        setIsRossRunning(true);
        setRossError(null);
        setRossResult(null);
        addLog('INFO', `Starting rotordynamics analysis: ${analysisType}`);
        workerRef.current.postMessage({ type: 'RUN_ANALYSIS', payload: { rotorModel, analysisType } });
    };

    return { isRossReady, isRossRunning, rossStatus, rossResult, rossError, runAnalysis };
};


const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const fileToGenerativePart = (file: File) => {
  return new Promise<{inlineData: {data: string, mimeType: string}}>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const data = (reader.result as string).split(',')[1];
        resolve({
            inlineData: {
                data,
                mimeType: file.type,
            }
        });
    };
    reader.onerror = (error) => reject(error);
  });
};

export function App() {
  const { 
    projects, 
    activeProject, 
    onNewProject,
    updateProjectDetails,
    onDeleteProject, 
    onSelectProject,
    saveNewVersion,
    revertToVersion,
    addIngestedDocument,
    removeIngestedDocument,
    loadProject,
  } = useProjects();
  
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [rotorModel, setRotorModel] = useState<RotorModel | undefined>();

  const {
    state: editorState,
    setState: setEditorState,
    undo: undoEditorState,
    redo: redoEditorState,
    canUndo: canUndoEditorState,
    canRedo: canRedoEditorState,
    resetState: resetEditorState,
  } = useUndoRedo<EditorState>({ prompt: '', selectedFaction: null, tags: [] });
  const { prompt, selectedFaction, tags } = editorState;
  
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<'app' | 'admin' | 'suite' | 'pricing' | 'account'>('app');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isConfigGateOpen, setIsConfigGateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [initialProjectData, setInitialProjectData] = useState<ExtractedProjectDetails | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const [isTechDocOpen, setIsTechDocOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isGoogleDocPreviewOpen, setIsGoogleDocPreviewOpen] = useState(false);
  const [isCadViewerOpen, setIsCadViewerOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isIdentifierModalOpen, setIsIdentifierModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isVideoImportModalOpen, setIsVideoImportModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const addLog = useCallback((level: LogEntry['level'], message: string, overrideContext?: { user?: string, project?: string }) => {
    const user = overrideContext?.user || authenticatedUser?.name || 'System';
    const project = overrideContext?.project || activeProject?.name || '';
    setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toISOString(), level, message, user, context: project }]);
  }, [authenticatedUser, activeProject]);

  const { result, isLoading, error, generateAnalysis: performAnalysis, clearAnalysis, setResult } = useAnalysis(addLog);
  const { saveInProgressAnalysis, loadInProgressAnalysis, clearInProgressAnalysis } = useAnalysisPersistence();
  
  const activeVersion: ProjectVersion | null = useMemo(() => {
    if (!activeProject) return null;
    return (activeProject.history || [])[activeVersionIndex] || (activeProject.history || [])[0];
  }, [activeProject, activeVersionIndex]);
  
  const displayedResult = result || activeVersion?.result || null;

  const { isSummaryLoading, generateSummary, clearSummary } = useSummaryGenerator(addLog);
  const { cadData, foundryResult, isCadLoading, cadError, generateCad, clearCad } = useCadGenerator(addLog);

  const creationDeVinci = useDeVinci();
  const [deVinciMode, setDeVinciMode] = useState<'creation' | 'brainstorm' | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isParsingImage, setIsParsingImage] = useState(false);
  const [isParsingVideo, setIsParsingVideo] = useState(false);
  const [isParsingForBrainstorm, setIsParsingForBrainstorm] = useState(false);
  const setupAssistant = useSetupAssistant();
  const rossAnalysis = useRossAnalysis(addLog);
  const tts = useTts(addLog);
  const simulation = useSimulation(addLog);
  const fabricationPlanner = useFabricationPlanner(addLog);
  const imageIdentifier = useImageIdentifier(addLog);
  const versionComparer = useVersionComparer(addLog);
  const gcodeVisualizer = useGCodeVisualizer(addLog);
  const suggestionExplorer = useSuggestionExplorer(addLog);
  const bomSourcing = useBomSourcing(addLog);
  const promptValidator = usePromptValidator();
  const liveCosting = useLiveCosting(addLog);
  const nextStepAssistant = useNextStepAssistant(addLog);
  const aiChat = useAiChat(addLog, activeProject?.knowledgeBase || []);
  const patentGenerator = usePatentGenerator(addLog);

  const forgeController = useForgeController(authenticatedUser);
  const projectExport = useProjectExport(addLog, tts);

  const { drawings, requestDrawing, requestDrawingFromImage, removeDrawing, setDrawings, clearAllDrawings, toggleDrawingReportInclusion } = useDrawingGenerator(addLog);
  const { inspirationalImages, requestInspirationalImage, removeInspirationalImage, setInspirationalImages, clearAllInspirationalImages, toggleImageReportInclusion } = useInspirationalImageGenerator(addLog);
  const { videoUrl, isVideoLoading, videoError, generateVideo, clearVideo } = useVideoGenerator(addLog);
  
  const isViewer = authenticatedUser?.role === Role.Viewer;

  const handleDownloadDrawings = useCallback((): string => {
    const projectNameForZip = activeProject?.name || 'SynapseForge_Analysis';
    const imagesToZip = [...drawings, ...inspirationalImages];
    if (imagesToZip.length > 0) {
        createDrawingsZip(imagesToZip, projectNameForZip);
        addLog('INFO', `Voice command triggered download of ${imagesToZip.length} visual assets.`);
        return `Download started for ${imagesToZip.length} files.`;
    } else {
        addLog('WARN', 'Voice command for download triggered, but no drawings were available.');
        return "No drawings found to download.";
    }
  }, [activeProject, drawings, inspirationalImages, addLog]);

  const handleGenerateVideoCommand = useCallback((prompt: string, useUploadedImage: boolean): string => {
    if (isViewer) {
        addLog('WARN', 'Voice command for video blocked in viewer mode.');
        return "Video generation is blocked in viewer mode.";
    }

    let imageFile: File | undefined = undefined;
    if (useUploadedImage) {
        imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) {
            addLog('WARN', 'Voice command for video from image failed: No image found in file input.');
            return "No uploaded image found to use as reference.";
        }
    }
    
    generateVideo(prompt, imageFile);
    addLog('INFO', `Voice command triggered video generation for: "${prompt}" ${imageFile ? `using image ${imageFile.name}`: ''}.`);
    return "Video generation started.";

  }, [files, generateVideo, addLog, isViewer]);

  // ANALYSIS ENGAGEMENT (Extracted for voice trigger)
  const handleEngage = useCallback(async (isReanalysis = false) => {
    if (!selectedFaction || !prompt.trim() || !projectName.trim()) {
      addLog('WARN', 'Engagement failed: Missing lens, name, or prompt.');
      return;
    }

    const newResult = await performAnalysis(projectName, prompt, selectedFaction, { 
        files, 
        fileUrls: activeProject?.knowledgeBase?.map(d => d.id) ? [] : activeVersion?.fileUrls,
        knowledgeBase: activeProject?.knowledgeBase || []
    });

    if (newResult) {
      const commitMessage = isReanalysis ? `Re-analyzed with ${selectedFaction.name}` : 'New analysis from workspace';
      const fileUrls = files.length > 0 ? await Promise.all(files.map(fileToDataUrl)) : activeVersion?.fileUrls || [];

      const versionData: Omit<ProjectVersion, 'versionId' | 'createdAt' | 'commitMessage'> = {
          prompt,
          factionId: selectedFaction.id,
          result: newResult,
          fileUrls: fileUrls,
          drawings: [],
          inspirationalImages: [],
      };

      if (!activeProject) {
         onNewProject({ name: projectName, description: 'New Analysis', tags }, { 
            prompt, 
            factionId: selectedFaction.id,
            result: newResult,
            fileUrls: fileUrls
         });
      } else {
          saveNewVersion(versionData, commitMessage);
      }

      setActiveVersionIndex(0);
      clearAllDrawings();
      clearAllInspirationalImages();
      clearVideo();
      clearCad();
      clearSummary();
      liveCosting.initialize(newResult);
      patentGenerator.clearPatent();
      setRotorModel(undefined);
      setHasUnsavedChanges(false);
      clearInProgressAnalysis();
    }
  }, [selectedFaction, prompt, projectName, activeProject, files, activeVersion, saveNewVersion, clearAllDrawings, clearAllInspirationalImages, clearVideo, clearCad, clearSummary, liveCosting, clearInProgressAnalysis, onNewProject, tags, patentGenerator, addLog, performAnalysis]);

  const voiceCommander = useVoiceCommander({
    onNavigate: (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        addLog('INFO', `Voice navigation to: ${sectionId}`);
    },
    onDownloadDrawings: handleDownloadDrawings,
    onGenerateVideo: handleGenerateVideoCommand,
    onSwitchView: (view: any) => {
        setViewMode(view);
        addLog('INFO', `Voice Trigger: Switched view to ${view}`);
    },
    onToggleDoc: (type, open) => {
        if (type === 'manual') setIsUserManualOpen(open);
        else if (type === 'technical') setIsTechDocOpen(open);
        addLog('INFO', `Voice Trigger: ${open ? 'Opened' : 'Closed'} ${type} documentation`);
    },
    onEngageAnalysis: () => {
        handleEngage();
        addLog('INFO', 'Voice Trigger: Engaging project analysis');
    }
  });

  const handleVoiceSetMaterial = useCallback((materialName: string) => {
      const preset = MATERIAL_LIBRARY.find(m => m.name.toLowerCase().includes(materialName.toLowerCase()));
      if (preset) {
          window.dispatchEvent(new CustomEvent('forge-voice-material', { detail: preset.id }));
          addLog('INFO', `Voice Trigger: Set material to ${preset.name}`);
      }
  }, [addLog]);

  const forgeVoice = useForgeVoice(forgeController.voiceMode, tts, {
      onSwitchLens: (factionId) => {
          const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === factionId) || null;
          setEditorState({ ...editorState, selectedFaction: faction });
          addLog('INFO', `Voice Trigger: Switched lens to ${faction?.name}`);
      },
      onSetMaterial: handleVoiceSetMaterial,
      onUpdateParam: (param, delta) => {
          window.dispatchEvent(new CustomEvent('forge-voice-param', { detail: { param, delta } }));
          addLog('INFO', `Voice Trigger: Adjusted ${param} by ${delta}`);
      },
      onGenerateCertificate: () => {
          window.dispatchEvent(new CustomEvent('forge-voice-secure-ip'));
          addLog('INFO', 'Voice Trigger: IP Synthesis initialized.');
      },
      onSealBundle: () => {
          if (activeProject) projectExport.exportSovereignBundle(activeProject, drawings, inspirationalImages);
          addLog('INFO', 'Voice Trigger: Sovereign Bundle sealed.');
      },
      onStartAnalysis: () => handleEngage(),
      onOpenManual: () => setIsUserManualOpen(true),
      onOpenTechDoc: () => setIsTechDocOpen(true),
      onSwitchView: (view) => setViewMode(view),
      onNavigateSection: (sectionId) => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          addLog('INFO', `Voice navigation to: ${sectionId}`);
      },
      onAddLog: addLog
  });
  
  const handleUpdateProfile = useCallback((updatedUser: User | Partial<User>) => {
    setAuthenticatedUser(prev => {
        if (!prev) return null;
        const next = { ...prev, ...updatedUser } as User;
        setUsers(usersPrev => usersPrev.map(u => u.id === next.id ? next : u));
        return next;
    });
    addLog('INFO', `User profile updated: ${authenticatedUser?.name}`);
  }, [addLog, authenticatedUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (authenticatedUser?.role === Role.Admin && e.ctrlKey && (e.key === '~' || e.key === '`')) {
            e.preventDefault();
            setShowDiagnostics(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authenticatedUser]);

  const { isActivating } = useAppVoice(tts, authenticatedUser, viewMode, (u) => handleUpdateProfile(u), activeProject?.name, activeProject?.domainCategory);

  const googleExporter = useGoogleExporter(addLog);

  useEffect(() => {
    const restoreSession = async () => {
        const savedState = await loadInProgressAnalysis();
        if (savedState) {
            setProjectName(savedState.projectName);
            setEditorState({
                prompt: savedState.prompt,
                selectedFaction: ENGINEERING_PHILOSOPHIES.find(f => f.id === savedState.factionId) || null,
                tags: savedState.tags || []
            });
            setResult(savedState.result);
            setDrawings(savedState.drawings || []);
            setInspirationalImages(savedState.inspirationalImages || []);
            addLog('INFO', 'Recovery Layer: Restored previous work state from IndexedDB.');
        }
    };
    restoreSession();
  }, [loadInProgressAnalysis, setEditorState, setResult, setDrawings, setInspirationalImages, addLog]);

  useEffect(() => {
    const autoSave = async () => {
        if (displayedResult && selectedFaction) {
            await saveInProgressAnalysis({
                projectName,
                prompt,
                tags,
                factionId: selectedFaction.id,
                result: displayedResult,
                drawings,
                inspirationalImages,
                domainCategory: activeProject?.domainCategory
            });
        }
    };
    const interval = setInterval(autoSave, 30000); 
    return () => clearInterval(interval);
  }, [projectName, prompt, selectedFaction, displayedResult, drawings, inspirationalImages, tags, saveInProgressAnalysis, activeProject]);

  const handleGoogleAuth = async () => {
    try {
        const googleData = await googleApiService.signInWithGoogle();
        let user = users.find(u => u.email === googleData.email);

        if (user) {
            user = { ...user, lastActive: new Date().toISOString(), picture: googleData.picture };
            setUsers(prev => prev.map(u => u.id === user!.id ? user! : u));
            setAuthenticatedUser(user);
        } else {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: googleData.name,
                email: googleData.email,
                picture: googleData.picture,
                role: Role.Editor,
                analysesRun: 0,
                lastActive: new Date().toISOString(),
                subscriptionStatus: SubscriptionStatus.FREE,
                hasAcceptedLegal: false,
                hasSignedPartnerProtocol: false,
                is_first_login: true,
                isSilenced: false,
            };
            setUsers(prev => [...prev, newUser]);
            setAuthenticatedUser(newUser);
            setIsOnboarding(true);
        }
        addLog('INFO', `User logged in: ${googleData.name}`, { user: googleData.name });
    } catch (error) {
        console.error("Google Authentication failed:", error);
        addLog('ERROR', 'Google Sign-In failed.');
    }
  };
  
  const handleSignup = (name: string, email: string) => {
    const newUser: User = {
        id: `user-${Date.now()}`,
        name: name,
        email: email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=06b6d4&color=fff`,
        role: Role.Editor,
        analysesRun: 0,
        lastActive: new Date().toISOString(),
        subscriptionStatus: SubscriptionStatus.FREE,
        hasAcceptedLegal: false,
        hasSignedPartnerProtocol: false,
        is_first_login: true,
        isSilenced: false,
    };
    
    setUsers(prev => [...prev, newUser]);
    setAuthenticatedUser(newUser);
    setIsOnboarding(true);
    addLog('INFO', `New account created for: ${name}`, { user: name });
  };

  const handleOnboardingComplete = (updatedUser: User) => {
      handleUpdateProfile(updatedUser);
      setIsOnboarding(false);
      addLog('INFO', `Onboarding complete for: ${updatedUser.name}. Identity set to ${updatedUser.use_company_attribution ? updatedUser.company_name : updatedUser.legal_identity}.`);
  };

  const handleAcceptLegal = () => {
    if (!authenticatedUser) return;
    const updatedUser = { 
        ...authenticatedUser, 
        hasAcceptedLegal: true, 
        lastAcceptedLegal: new Date().toISOString() 
    };
    handleUpdateProfile(updatedUser);
    addLog('INFO', 'Legal protocols accepted. Vault initialized.');
  };

  const handleSignPartnerProtocol = (signature: string) => {
      if (!authenticatedUser) return;
      const updatedUser = { 
          ...authenticatedUser, 
          hasSignedPartnerProtocol: true 
      };
      handleUpdateProfile(updatedUser);
      setIsPartnerModalOpen(false);
      addLog('INFO', `Partner Protocol signed by ${signature}. Advanced fabrication tools enabled.`);
  };

  const handleLogout = () => {
    addLog('INFO', `User logged out: ${authenticatedUser?.name}`);
    googleApiService.signOutFromGoogle();
    setAuthenticatedUser(null);
     if (viewMode === 'admin' || viewMode === 'pricing' || viewMode === 'account') {
      setViewMode('app');
    }
  };

  const handleDemoLogin = (userName: string) => {
    const user = users.find(u => u.name === userName);
    if (user) {
        const updatedUser = { ...user, lastActive: new Date().toISOString() };
        setAuthenticatedUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        addLog('INFO', `Demo user logged in: ${userName}`, { user: userName });
    }
  };

  const handleDeVinciProjectCreation = async (functionCall: { name: string, args: any, id: string }) => {
      if (functionCall.name === 'create_project') {
          const { name, description, tags, factionId } = functionCall.args;
          if (name && description && factionId) {
              const newProjectId = onNewProject({ name, description, tags: tags || [] }, { factionId });
              onSelectProject(newProjectId);
              creationDeVinci.stopConversation();
              setDeVinciMode(null);
              return { success: true, message: `Excellent! I've created the project "${name}" for you.` };
          }
      }
      return { success: false, message: 'Missing some information.' };
  };

  const handleLaunchCreationDeVinci = () => {
      if (!authenticatedUser) return;
      creationDeVinci.startConversation({
          systemInstruction: "You are DeVinci. Help the user define a project. Call create_project when they have a name and goal.",
          voice: 'Zephyr',
          tools: [{ functionDeclarations: [createProjectFunctionDeclaration] }],
          onFunctionCall: handleDeVinciProjectCreation,
          authenticatedUser,
      });
      setDeVinciMode('creation');
  };

  const handleLoadVersion = useCallback((index: number) => {
    if (!activeProject) return;
    const history = activeProject.history || [];
    const version = history[index];
    if (!version) return;

    setActiveVersionIndex(index);
    setResult(version.result);
    setDrawings(version.drawings || []);
    setInspirationalImages(version.inspirationalImages || []);
    setRotorModel(version.rotorModel);
    setFiles([]); 
    
    const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === version.factionId) || null;
    resetEditorState({
        prompt: version.prompt,
        selectedFaction: faction,
        tags: activeProject.tags
    });
    setProjectName(activeProject.name);
    
    liveCosting.initialize(version.result);
    bomSourcing.clearSourcing();
    fabricationPlanner.clearPlanner();
    imageIdentifier.clearIdentification();
    versionComparer.clearComparison();
    gcodeVisualizer.closeModal();
    suggestionExplorer.clearExploration();
    patentGenerator.clearPatent();
    clearCad();
    clearSummary();
    
    setHasUnsavedChanges(false);
    addLog('INFO', `Loaded version: "${version.commitMessage}"`);

  }, [activeProject, resetEditorState, bomSourcing, fabricationPlanner, liveCosting, simulation, clearCad, imageIdentifier, versionComparer, gcodeVisualizer, suggestionExplorer, clearSummary, addLog, setResult, setDrawings, setInspirationalImages, patentGenerator]);
  
  const handleProjectSelect = useCallback((projectId: string) => {
    if (activeProject?.id === projectId) return;
    onSelectProject(projectId);
  }, [activeProject, onSelectProject]);

  const handleNewProjectClick = () => {
    setIsConfigGateOpen(true);
  };

  const handleConfigGateComplete = (config: { name: string, category: DomainCategory, branch: EngineeringBranch, description: string }) => {
      const newId = onNewProject({ name: config.name, description: config.description, tags: [config.category] }, { factionId: FactionId.PRAGMATIC_PRODUCTION });
      updateProjectDetails(newId, { domainCategory: config.category });
      onSelectProject(newId);
      setProjectName(config.name);
      setIsConfigGateOpen(false);
      addLog('INFO', `Forged blank environment for '${config.name}' [${config.category}] with PhD [${config.branch}] Agent active.`);
  };

  const handleSaveProjectDetails = (details: {name: string, description: string, tags: string[]}) => {
    if (projectToEdit) {
      updateProjectDetails(projectToEdit.id, details);
      setProjectName(details.name);
      setEditorState({ ...editorState, tags: details.tags });
    } else {
      const newId = onNewProject(details, { prompt: initialProjectData?.initialPrompt, factionId: selectedFaction?.id });
      onSelectProject(newId);
    }
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
    setInitialProjectData(null);
  };

  const handleExportAsset = () => {
      if (activeProject) {
          projectExport.exportSovereignBundle(activeProject, drawings, inspirationalImages);
      }
  };

  const handleImportAsset = async (file: File) => {
      try {
          const content = await persistProjectData(file);
          addLog('INFO', `Imported Sovereign Asset: ${file.name}. Identity established.`);
      } catch (e) {
          addLog('ERROR', `Asset import failed: Invalid bundle format.`);
      }
  };

  const handleStartFromImage = async (file: File) => {
      setIsParsingImage(true);
      addLog('INFO', `Analyzing image "${file.name}" to extract project details...`);
      try {
          const imagePart = await fileToGenerativePart(file);
          const details = await extractProjectDetailsFromImage(imagePart);
          setInitialProjectData(details);
          setIsProjectModalOpen(true);
          addLog('INFO', `Extracted details for "${details.name}" from image.`);
      } catch (e) {
          addLog('ERROR', `Image parsing failed: ${parseApiError(e)}`);
      } finally {
          setIsParsingImage(false);
      }
  };

  const handleStartFromPdf = async (file: File) => {
      setIsParsingPdf(true);
      addLog('INFO', `Analyzing PDF "${file.name}" to extract project details...`);
      try {
          const pdfPart = await fileToGenerativePart(file);
          const details = await extractProjectDetailsFromPdf(pdfPart);
          setInitialProjectData(details);
          setIsProjectModalOpen(true);
          addLog('INFO', `Extracted details for "${details.name}" from PDF.`);
      } catch (e) {
          addLog('ERROR', `PDF parsing failed: ${parseApiError(e)}`);
      } finally {
          setIsParsingPdf(false);
      }
  };

  const handleStartBrainstormFromPdf = async (file: File) => {
      setIsParsingForBrainstorm(true);
      addLog('INFO', `Starting AI brainstorming session based on PDF "${file.name}"...`);
      try {
          const pdfPart = await fileToGenerativePart(file);
          const details = await extractProjectDetailsFromPdf(pdfPart);
          const newId = onNewProject(
            { name: `Brainstorm: ${details.name}`, description: details.description, tags: [...details.tags, 'brainstorm'] },
            { prompt: `System Brainstorm request based on technical manual: ${details.initialPrompt}`, factionId: FactionId.ADVANCED_MATERIALS }
          );
          onSelectProject(newId);
          addLog('INFO', `Created brainstorming project for "${details.name}".`);
      } catch (e) {
          addLog('ERROR', `Brainstorming failed: ${parseApiError(e)}`);
      } finally {
          setIsParsingForBrainstorm(false);
      }
  };

  const handleIdentifyUrl = async (url: string) => {
      setIsParsingVideo(true);
      addLog('INFO', `Searching web and identifying video content at ${url}...`);
      try {
          const details = await extractProjectDetailsFromVideoUrl(url);
          setInitialProjectData(details);
          setIsProjectModalOpen(true);
          setIsVideoImportModalOpen(false);
          addLog('INFO', `Identified video content for "${details.name}".`);
      } catch (e) {
          addLog('ERROR', `Video identification failed: ${parseApiError(e)}`);
      } finally {
          setIsParsingVideo(false);
      }
  };

  const handleIdentifyFile = async (file: File) => {
      setIsParsingVideo(true);
      addLog('INFO', `Analyzing video file "${file.name}" frame-by-frame...`);
      try {
          const videoPart = await fileToGenerativePart(file);
          const details = await extractProjectDetailsFromVideo(videoPart);
          setInitialProjectData(details);
          setIsProjectModalOpen(true);
          setIsVideoImportModalOpen(false);
          addLog('INFO', `Video file analysis complete for "${details.name}".`);
      } catch (e) {
          addLog('ERROR', `Video analysis failed: ${parseApiError(e)}`);
      } finally {
          setIsParsingVideo(false);
      }
  };

  const handleSetCover = useCallback((id: string, type: 'drawing' | 'image') => {
    setDrawings(prev => prev.map(d => ({
        ...d,
        isCoverImage: type === 'drawing' && d.id === id
    })));
    setInspirationalImages(prev => prev.map(img => ({
        ...img,
        isCoverImage: type === 'image' && img.id === id
    })));
    addLog('INFO', `Set new report cover image (${type}: ${id}).`);
  }, [setDrawings, setInspirationalImages, addLog]);

  const handlePlanSelect = async (status: SubscriptionStatus) => {
      if (!authenticatedUser) return;
      
      let updatedUser = { ...authenticatedUser, subscriptionStatus: status };
      
      if (status === SubscriptionStatus.PRO_TRIAL) {
          const trialResult = await projectApi.activateTrial(authenticatedUser.id);
          updatedUser = { ...updatedUser, subscriptionStatus: trialResult.status, trialEndsAt: trialResult.trialEndsAt };
          addLog('INFO', `Started 1-week free trial for Professional plan.`);
      } else {
          addLog('INFO', `Upgraded to ${status} plan.`);
      }
      handleUpdateProfile(updatedUser);
      setViewMode('app');
  };

  const handleGatedAction = <T,>(action: () => T): T | void => {
      if (!authenticatedUser) return;
      if (authenticatedUser.subscriptionStatus === SubscriptionStatus.FREE) {
          setViewMode('pricing');
          addLog('WARN', 'Professional tier required for advanced engineering exports.');
          return;
      }
      if (!authenticatedUser.hasSignedPartnerProtocol) {
          setIsPartnerModalOpen(true);
          return;
      }
      return action();
  };

  const toggleDiagnostics = useCallback(() => {
    if (authenticatedUser?.role === Role.Admin) {
        setShowDiagnostics(prev => !prev);
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (activeProject) {
        handleLoadVersion(0);
    }
  }, [activeProject, handleLoadVersion]);

  if (!authenticatedUser) {
    return <AuthPage onGoogleAuth={handleGoogleAuth} onDemoLogin={handleDemoLogin} onSignup={handleSignup} />;
  }

  if (isOnboarding) {
      return <OnboardingFlow user={authenticatedUser} onComplete={handleOnboardingComplete} />;
  }

  if (!authenticatedUser.hasAcceptedLegal) {
      return <LegalGuard onAccept={handleAcceptLegal} />;
  }

  if (viewMode === 'pricing') {
      return (
        <PricingPage 
            currentPlan={authenticatedUser.subscriptionStatus}
            onSelectPlan={handlePlanSelect}
            onBack={() => setViewMode('app')}
        />
      );
  }

  if (viewMode === 'account') {
      return (
        <AccountPage 
            user={authenticatedUser}
            onUpdate={handleUpdateProfile}
            onNavigateToPricing={() => setViewMode('pricing')}
            onBack={() => setViewMode('app')}
        />
      )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-brand-dark text-gray-900 dark:text-brand-light overflow-hidden transition-colors duration-300">
      <SystemStatusIndicator isVoiceActive={voiceCommander.state === 'listening'} />
      <DiagnosticsPanel 
        isOpen={showDiagnostics} 
        user={authenticatedUser} 
        tts={tts} 
        onUpdateUser={handleUpdateProfile} 
        systemState={forgeController.systemState}
        ioStatus={forgeController.ioStatus}
        exportStatus={forgeController.exportStatus}
        voiceMode={forgeController.voiceMode}
        setVoiceMode={forgeController.setVoiceMode}
        voiceTranscripts={forgeVoice.transcripts}
        nalPrecision={forgeController.nalPrecision}
        targetPrecision={forgeController.targetPrecision}
        setTargetPrecision={forgeController.setTargetPrecision}
        onForceFlush={forgeController.forceFlush}
        onForceStable={forgeController.forceStable}
        onDefrost={forgeController.performDefrost}
      />
      <SystemToast />
      
      <Header
        onStartTour={() => setIsTourOpen(true)}
        onOpenUserManual={() => setIsUserManualOpen(true)}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        viewMode={viewMode === 'app' || viewMode === 'pricing' || viewMode === 'account' ? 'app' : viewMode}
        onSwitchView={(v) => setViewMode(v as any)}
        onMobileDiagnostics={toggleDiagnostics}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {viewMode === 'app' && (
          <div className="w-full bg-white dark:bg-gray-800 p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 space-y-6 transition-colors duration-300">
             <div className="max-w-5xl mx-auto space-y-6">
                 <ProjectManager
                    projects={projects}
                    activeProject={activeProject}
                    activeVersionIndex={activeVersionIndex}
                    onSelectProject={handleProjectSelect}
                    onNewProject={handleNewProjectClick}
                    onOpenFile={handleImportAsset}
                    onSaveProject={handleExportAsset}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onCommitVersion={() => setIsCommitModalOpen(true)}
                    onStartWithDeVinci={handleLaunchCreationDeVinci}
                    onStartFromImage={handleStartFromImage} 
                    isParsingImage={isParsingImage}
                    onStartFromPdf={handleStartFromPdf}
                    isParsingPdf={isParsingPdf}
                    onStartBrainstormFromPdf={handleStartBrainstormFromPdf}
                    isParsingForBrainstorm={isParsingForBrainstorm}
                    onIdentifyImage={(file) => { imageIdentifier.identifyImage(file); setIsIdentifierModalOpen(true); }}
                    isIdentifyingImage={imageIdentifier.isLoading}
                    onOpenVideoImport={() => setIsVideoImportModalOpen(true)}
                    isParsingVideo={isParsingVideo}
                    onEditProject={(p) => { setProjectToEdit(p); setIsProjectModalOpen(true); }}
                    onDeleteProject={onDeleteProject}
                    onLoadVersion={handleLoadVersion}
                    onRevertVersion={revertToVersion}
                    onCompareVersions={(p, idx) => versionComparer.runComparison(p, idx)}
                    disabled={isLoading}
                    authenticatedUser={authenticatedUser}
                    onAddDocument={addIngestedDocument}
                    onRemoveDocument={removeIngestedDocument}
                    addLog={addLog}
                />
                <FactionSelector
                  selectedFaction={selectedFaction}
                  onSelectFaction={(faction) => { setEditorState({ ...editorState, selectedFaction: faction }); setHasUnsavedChanges(true); }}
                  disabled={isLoading || isViewer}
                  authenticatedUser={authenticatedUser}
                />
                <PromptInput
                  projectName={projectName}
                  onProjectNameChange={(name) => { setProjectName(name); setHasUnsavedChanges(true); }}
                  prompt={prompt}
                  onPromptChange={(p) => { setEditorState({ ...editorState, prompt: p }); setHasUnsavedChanges(true); }}
                  tags={tags}
                  onTagsChange={(t) => { setEditorState({ ...editorState, tags: t }); setHasUnsavedChanges(true); }}
                  onUndo={undoEditorState}
                  onRedo={redoEditorState}
                  canUndo={canUndoEditorState}
                  canRedo={canRedoEditorState}
                  files={files}
                  onFilesChange={(f) => { setFiles(f); setHasUnsavedChanges(true); }}
                  onEngage={() => handleEngage()}
                  isLoading={isLoading}
                  onClearFiles={() => { setFiles([]); setHasUnsavedChanges(true); }}
                  isReady={!!selectedFaction && !!prompt && !!projectName}
                  authenticatedUser={authenticatedUser}
                  setupAssistant={setupAssistant}
                  onApplyFactionSuggestion={() => {}}
                  onReanalyzeWithFaction={() => handleEngage(true)}
                  selectedFaction={selectedFaction}
                  activeVersionFactionId={activeVersion?.factionId}
                  promptValidator={promptValidator}
                  hasKnowledgeContext={(activeProject?.knowledgeBase?.length || 0) > 0}
                />
             </div>
          </div>
        )}

        <main className="flex-1 w-full bg-gray-50 dark:bg-brand-dark animate-fade-in transition-colors duration-300">
          {viewMode === 'app' ? (
            <div className="max-w-5xl mx-auto p-6">
              <AnalysisDisplay
                projectName={projectName}
                result={displayedResult}
                isLoading={isLoading}
                error={error}
                selectedFaction={selectedFaction}
                onClear={clearAnalysis}
                onGenerateVideo={generateVideo}
                isVideoLoading={isVideoLoading}
                videoUrl={videoUrl}
                videoError={videoError}
                drawings={drawings}
                onRequestDrawing={requestDrawing}
                onRequestDrawingFromImage={requestDrawingFromImage}
                onRemoveDrawing={(id) => removeDrawing(id)}
                onToggleDrawingReportInclusion={(id) => toggleDrawingReportInclusion(id)}
                onSetCover={handleSetCover}
                inspirationalImages={inspirationalImages}
                onRequestInspirationalImage={requestInspirationalImage}
                onRemoveInspirationalImage={(id) => removeInspirationalImage(id)}
                onToggleImageReportInclusion={(id) => toggleImageReportInclusion(id)}
                onIncorporateSuggestions={() => {}}
                onLaunchDeVinci={() => {}}
                activeProject={activeProject}
                activeVersion={activeVersion}
                authenticatedUser={authenticatedUser}
                onGenerateSummary={generateSummary}
                isSummaryLoading={isSummaryLoading}
                summaryError={null}
                cadData={cadData}
                foundryResult={foundryResult}
                onGenerateCad={(d, r) => handleGatedAction(() => generateCad(d, r)) || Promise.resolve(null)}
                isCadLoading={isCadLoading}
                cadError={cadError}
                onOpenCadViewer={() => handleGatedAction(() => setIsCadViewerOpen(true))}
                isGoogleExporterAuthenticated={googleExporter.isAuthenticated}
                googleExporterUser={googleExporter.authenticatedUser}
                isGoogleAuthLoading={googleExporter.isAuthLoading}
                onGoogleExporterSignIn={googleExporter.signIn}
                onGoogleExporterSignOut={googleExporter.signOut}
                isGoogleExporting={googleExporter.isExporting}
                googleExportStatus={googleExporter.exportStatus}
                googleExportError={googleExporter.exportError}
                googleDocContent={googleExporter.exportedDocContent}
                onOpenGoogleDocPreview={() => setIsGoogleDocPreviewOpen(true)}
                onExportToGoogle={() => { if(activeProject) googleExporter.exportToGoogle(activeProject, drawings, authenticatedUser!)}}
                rotorModel={rotorModel}
                onRotorModelChange={setRotorModel}
                rossAnalysis={rossAnalysis}
                tts={tts}
                inspirationalImageHistory={activeProject?.inspirationalImageHistory || []}
                onReinsertInspirationalImage={() => {}}
                onDeleteInspirationalImageFromHistory={() => {}}
                simulation={simulation}
                fabricationPlanner={fabricationPlanner}
                gcodeVisualizer={gcodeVisualizer}
                suggestionExplorer={suggestionExplorer}
                bomSourcing={bomSourcing}
                liveCosting={liveCosting}
                nextStepAssistant={nextStepAssistant}
                patentGenerator={patentGenerator}
              />
            </div>
          ) : viewMode === 'admin' ? (
            <div className="max-w-7xl mx-auto p-6">
              <AdminDashboard 
                authenticatedUser={authenticatedUser}
                users={users}
                projects={projects}
                logs={logs}
                onUpdateUser={handleUpdateProfile}
                onDeleteUser={(userId) => setUsers(prev => prev.filter(u => u.id !== userId))}
                onOpenTechDoc={() => setIsTechDocOpen(true)}
              />
            </div>
          ) : viewMode === 'suite' ? (
            <ToolSuite />
          ) : null}
        </main>
        
        <Footer />
      </div>

      <Tour isOpen={isTourOpen} stepIndex={tourStep} steps={TOUR_STEPS} onClose={() => setIsTourOpen(false)} onNext={() => setTourStep(s => s + 1)} onPrev={() => setTourStep(s => s - 1)} tts={tts} />
      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />
      <TechnicalDocumentModal isOpen={isTechDocOpen} onClose={() => setIsTechDocOpen(false)} />
      <ConfigurationGateModal 
          isOpen={isConfigGateOpen}
          onClose={() => setIsConfigGateOpen(false)}
          onForge={handleConfigGateComplete}
      />
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProjectDetails}
        project={projectToEdit}
        initialData={initialProjectData || undefined}
      />
       <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={authenticatedUser!}
        onSave={handleUpdateProfile}
        onNavigateToPricing={() => { setIsProfileModalOpen(false); setViewMode('pricing'); }}
        onNavigateToAccount={() => { setIsProfileModalOpen(false); setViewMode('account'); }}
      />
      <AiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        state={aiChat.state}
        history={aiChat.history}
        sendMessage={aiChat.sendMessage}
        error={aiChat.error}
      />
      <ImageIdentifierModal 
        isOpen={isIdentifierModalOpen}
        onClose={() => setIsIdentifierModalOpen(false)}
        isLoading={imageIdentifier.isLoading}
        error={imageIdentifier.error}
        result={imageIdentifier.result}
      />
      <VideoImportModal 
        isOpen={isVideoImportModalOpen}
        onClose={() => setIsVideoImportModalOpen(false)}
        onImportFile={handleIdentifyFile}
        onImportUrl={handleIdentifyUrl}
        isLoading={isParsingVideo}
      />
      {isPartnerModalOpen && (
          <PartnerIndemnityModal 
              onSign={handleSignPartnerProtocol} 
              onCancel={() => setIsPartnerModalOpen(false)} 
          />
      )}
      <VoiceCommanderWidget 
        state={voiceCommander.state} 
        startListening={voiceCommander.startListening} 
        stopListening={voiceCommander.stopListening} 
      />
      <DeVinciModal 
        isOpen={deVinciMode === 'creation'}
        onClose={() => { creationDeVinci.stopConversation(); setDeVinciMode(null); }}
        startConversation={() => {}} 
        stopConversation={creationDeVinci.stopConversation}
        pauseConversation={creationDeVinci.pauseConversation}
        resumeConversation={creationDeVinci.resumeConversation}
        state={creationDeVinci.state}
        transcript={creationDeVinci.transcript}
        isCreating={true}
        onFileUpload={creationDeVinci.sendFile}
        analyzableFile={creationDeVinci.analyzableFile}
        sendImageRegion={creationDeVinci.sendImageRegion}
        simulateNewSpeaker={creationDeVinci.simulateNewSpeaker}
        manualRetry={creationDeVinci.manualRetry}
        retryCount={creationDeVinci.retryCount}
      />
    </div>
  );
}

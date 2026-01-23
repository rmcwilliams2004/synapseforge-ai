import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Faction, ProjectVersion, Project, AnalysisResult, User, LogEntry, Role, GeneratedDrawing, FactionId, GeneratedImage, EditorState, RotorModel, CadData, InProgressState, InnovatorId, Innovator, InnovationCouncil } from './types';
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
import { useUndoRedo } from './hooks/useUndoRedo';
import { useSummaryGenerator } from './hooks/useSummaryGenerator';
import { useCadGenerator } from './hooks/useCadGenerator';
import { useDeVinci } from './hooks/useDeVinci';
import { 
    generateTechnicalDrawingFunctionDeclaration,
    researchWebFunctionDeclaration,
    performWebSearch,
    extractProjectDetailsFromPdf,
    extractProjectDetailsFromImage,
    parseApiError,
    ExtractedProjectDetails,
    createProjectFunctionDeclaration,
    buildDeVinciCreationSystemInstruction,
    runAnalysisWithFactionFunctionDeclaration,
    generateInspirationalImageFunctionDeclaration,
    generateSummary,
    buildDeVinciSystemInstruction,
    buildPartnerBrainstormSystemInstruction,
    summarizePdfForContext,
    downloadDrawingsFunctionDeclaration,
    generateVideoFunctionDeclaration,
    recruitInnovationCouncil,
} from './services/geminiService';
import * as googleApiService from './services/googleApiService';
import { useInspirationalImageGenerator } from './hooks/useInspirationalImageGenerator';
import { useSetupAssistant } from './hooks/useSetupAssistant';
import { useGoogleExporter } from './hooks/useGoogleExporter';
import { GoogleDocPreviewModal } from './components/GoogleDocPreviewModal';
import { useTts } from './hooks/useTts';
import { CadViewerModal } from './components/cad/CadViewerModal';
import { useSimulation } from './hooks/useSimulation';
import { useFabricationPlanner } from './hooks/useFabricationPlanner';
import { CommitModal } from './components/CommitModal';
import { useImageIdentifier } from './hooks/useImageIdentifier';
import { ImageIdentifierModal } from './components/ImageIdentifierModal';
import { useVersionComparer } from './hooks/useVersionComparer';
import { ComparisonViewerModal } from './components/cad/ComparisonViewerModal';
import { useGCodeVisualizer } from './hooks/useGCodeVisualizer';
import { useSuggestionExplorer } from './hooks/useSuggestionExplorer';
import { SuggestionExplorerModal } from './components/SuggestionExplorerModal';
import { useBomSourcing } from './hooks/useBomSourcing';
import { usePromptValidator } from './hooks/usePromptValidator';
import { useLiveCosting } from './hooks/useLiveCosting';
import { useNextStepAssistant } from './hooks/useNextStepAssistant';
import { useVoiceCommander } from './hooks/useVoiceCommander';
import { VoiceCommanderWidget } from './components/VoiceCommanderWidget';
import { useAppVoice } from './hooks/useAppVoice';
import { createDrawingsZip } from './services/zipService';
import { WarRoomModal } from './components/WarRoomModal';

// A hook to manage the Ross analysis web worker
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
        kyx=elem.get('kyx', 0), kyy=elem.get('kyy', 0),
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
    }, [addLog, workerCode]);

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

function App() {
  const { 
    projects, 
    activeProject, 
    onNewProject,
    updateProjectDetails,
    onDeleteProject, 
    onSelectProject,
    saveNewVersion,
    revertToVersion,
    updateVersion,
    loadProject,
    addImageToHistory,
    deleteImageFromHistory,
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
  } = useUndoRedo<EditorState>({ prompt: '', selectedFaction: null, tags: [], selectedInnovatorId: undefined, isDeepThought: false });
  const { prompt, selectedFaction, tags, selectedInnovatorId, isDeepThought } = editorState;
  
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'admin'>('app');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
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
  
  // War Room state
  const [isWarRoomModalOpen, setIsWarRoomModalOpen] = useState(false);
  const [recruitedCouncil, setRecruitedCouncil] = useState<InnovationCouncil | null>(null);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [warRoomProjectName, setWarRoomProjectName] = useState('');

  const addLog = useCallback((level: LogEntry['level'], message: string, overrideContext?: { user?: string, project?: string }) => {
    const user = overrideContext?.user || authenticatedUser?.name || 'System';
    const project = overrideContext?.project || activeProject?.name || '';
    setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toISOString(), level, message, user, context: project }]);
  }, [authenticatedUser, activeProject]);

  const brainstormingDeVinci = useDeVinci();
  const creationDeVinci = useDeVinci();
  const [deVinciMode, setDeVinciMode] = useState<'creation' | 'brainstorm' | null>(null);
  const [activePartner, setActivePartner] = useState<Innovator | undefined>(undefined);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isParsingImage, setIsParsingImage] = useState(false);
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
  const { drawings, requestDrawing, requestDrawingFromImage, removeDrawing, setDrawings, clearAllDrawings, toggleDrawingReportInclusion } = useDrawingGenerator(addLog);
  const { inspirationalImages, requestInspirationalImage, removeInspirationalImage, setInspirationalImages, clearAllInspirationalImages, toggleImageReportInclusion } = useInspirationalImageGenerator(addLog);
  const { videoUrl, isVideoLoading, videoError, generateVideo, clearVideo } = useVideoGenerator(addLog);

  const handleDownloadDrawings = useCallback(() => {
    const projectNameForZip = activeProject?.name || 'SynapseForge_Analysis';
    const imagesToZip = [...drawings, ...inspirationalImages];
    if (imagesToZip.length > 0) {
        createDrawingsZip(imagesToZip, projectNameForZip);
        addLog('INFO', `Voice command triggered download of ${imagesToZip.length} visual assets.`);
    }
  }, [activeProject, drawings, inspirationalImages, addLog]);

  const handleGenerateVideoCommand = useCallback((prompt: string, useUploadedImage: boolean) => {
    let imageFile: File | undefined = undefined;
    if (useUploadedImage) {
        imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) {
            tts.speak("I couldn't find an uploaded image to use as a reference.", 'Kore');
            return;
        }
    }
    generateVideo(prompt, imageFile);
  }, [files, generateVideo, tts]);

  const voiceCommander = useVoiceCommander({
    onNavigate: (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    onDownloadDrawings: handleDownloadDrawings,
    onGenerateVideo: handleGenerateVideoCommand,
  });
  useAppVoice(tts, authenticatedUser);

  const googleExporter = useGoogleExporter(addLog);

  const { result, isLoading, error, generateAnalysis: triggerAnalysis, clearAnalysis, setResult } = useAnalysis(addLog);
  const { saveInProgressAnalysis, loadInProgressAnalysis, clearInProgressAnalysis } = useAnalysisPersistence();
  const [savedSessionData, setSavedSessionData] = useState<InProgressState | null>(null);
  
  const activeVersion: ProjectVersion | null = useMemo(() => {
    if (!activeProject) return null;
    return activeProject.history[activeVersionIndex] || activeProject.history[0];
  }, [activeProject, activeVersionIndex]);
  
  const displayedResult = result || activeVersion?.result || null;

  const { isSummaryLoading, summaryError, clearSummary } = useSummaryGenerator(addLog);
  const { cadData, isCadLoading, cadError, generateCad, clearCad } = useCadGenerator(addLog);


  useEffect(() => {
    if (prompt && prompt.length > 20) {
      setupAssistant.fetchSuggestions(prompt);
    }
  }, [prompt]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
      const autoSaveInterval = setInterval(() => {
          if (displayedResult && selectedFaction && (activeProject || projectName)) {
              saveInProgressAnalysis({
                  projectName: activeProject?.name || projectName,
                  prompt,
                  factionId: selectedFaction.id,
                  result: displayedResult,
                  drawings,
                  inspirationalImages,
              });
          }
      }, 60000);

      return () => {
          clearInterval(autoSaveInterval);
      };
  }, [saveInProgressAnalysis, displayedResult, selectedFaction, activeProject, projectName, prompt, drawings, inspirationalImages]);


  const handleGoogleAuth = async () => {
    try {
        const googleData = await googleApiService.signInWithGoogle();
        let user = users.find(u => u.email === googleData.email);
        if (user) {
            user = { ...user, lastActive: new Date().toISOString(), picture: googleData.picture };
            setUsers(prev => prev.map(u => u.id === user!.id ? user! : u));
        } else {
            user = {
                id: `user-${Date.now()}`,
                name: googleData.name,
                email: googleData.email,
                picture: googleData.picture,
                role: Role.Editor,
                analysesRun: 0,
                lastActive: new Date().toISOString()
            };
            setUsers(prev => [...prev, user!]);
        }
        setAuthenticatedUser(user);
    } catch (error) {
        addLog('ERROR', 'Google Sign-In failed.');
    }
  };
  
  const handleDemoLogin = (userName: string) => {
    const user = users.find(u => u.name === userName);
    if (user) {
        const updatedUser = { ...user, lastActive: new Date().toISOString() };
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setAuthenticatedUser(updatedUser);
    }
  };
  
  const handleLogout = () => {
    googleApiService.signOutFromGoogle();
    setAuthenticatedUser(null);
     if (viewMode === 'admin') setViewMode('app');
  };
  
  const handleUpdateProfile = (updatedUser: User) => {
    setAuthenticatedUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }

  const handleRequestInspirationalImage = useCallback(async (prompt: string, aspectRatio: string) => {
    const newImage = await requestInspirationalImage(prompt, aspectRatio);
    if (newImage && !newImage.error) {
        addImageToHistory(newImage);
        setHasUnsavedChanges(true);
    }
  }, [requestInspirationalImage, addImageToHistory]);

  const handleReinsertImageFromHistory = useCallback((image: GeneratedImage) => {
    if (inspirationalImages.some(img => img.id === image.id)) return;
    setInspirationalImages(prev => [...prev, image]);
    setHasUnsavedChanges(true);
  }, [inspirationalImages, setInspirationalImages]);

  const handleDeleteImageFromHistory = useCallback((imageId: string) => {
      deleteImageFromHistory(imageId);
      setHasUnsavedChanges(true);
  }, [deleteImageFromHistory]);
  
  const handleSetCover = useCallback((id: string, type: 'drawing' | 'image') => {
    setDrawings(prev => prev.map(d => ({ ...d, isCoverImage: type === 'drawing' && d.id === id })));
    setInspirationalImages(prev => prev.map(img => ({ ...img, isCoverImage: type === 'image' && img.id === id })));
    setHasUnsavedChanges(true);
  }, [setDrawings, setInspirationalImages]);

  const handleLaunchBrainstormingDeVinci = (partner?: Innovator) => {
     if (activeProject && activeVersion && selectedFaction && authenticatedUser) {
        const projectContext = `Project: ${activeProject.name}. Context: ${JSON.stringify(activeVersion.result)}`;
        const systemInstruction = partner 
            ? buildPartnerBrainstormSystemInstruction(partner, projectContext)
            : buildDeVinciSystemInstruction(projectContext, ENGINEERING_PHILOSOPHIES);

        brainstormingDeVinci.startConversation({
            systemInstruction,
            voice: 'Zephyr',
            tools: [{ functionDeclarations: [generateTechnicalDrawingFunctionDeclaration, researchWebFunctionDeclaration, runAnalysisWithFactionFunctionDeclaration, generateInspirationalImageFunctionDeclaration] }],
            onFunctionCall: async (fc) => {
                 if (fc.name === 'generate_technical_drawing') {
                    requestDrawing(fc.args.specificPrompt, displayedResult!, activeVersion?.fileUrls);
                    return { success: true };
                 }
                 return { success: false };
            },
            authenticatedUser,
        });
        setActivePartner(partner);
        setDeVinciMode('brainstorm');
     }
  };

  const handleStartFromImage = async (file: File) => {
    setIsParsingImage(true);
    try {
        const details = await extractProjectDetailsFromImage({ inlineData: { data: (await fileToDataUrl(file)).split(',')[1], mimeType: file.type } });
        setInitialProjectData(details);
        setIsProjectModalOpen(true);
    } catch (e) {
        alert(`Analysis Failed: ${parseApiError(e)}. Please check your image format and try again.`);
    } finally { setIsParsingImage(false); }
  };

  const handleStartFromPdf = async (file: File) => {
    setIsParsingPdf(true);
    try {
        const details = await extractProjectDetailsFromPdf({ inlineData: { data: (await fileToDataUrl(file)).split(',')[1], mimeType: file.type } });
        setInitialProjectData(details);
        setIsProjectModalOpen(true);
    } catch (e) {
        alert(`PDF Parsing Failed: ${parseApiError(e)}. Ensure the document contains technical text.`);
    } finally { setIsParsingPdf(false); }
  };
  
  const handleStartWarRoomFromPdf = async (file: File) => {
      setIsRecruiting(true);
      setIsWarRoomModalOpen(true);
      setRecruitedCouncil(null);
      setWarRoomProjectName(file.name);
      addLog('INFO', `Initializing War Room recruitment from "${file.name}".`);
      try {
          const base64Pdf = (await fileToDataUrl(file)).split(',')[1];
          const summary = await summarizePdfForContext({ inlineData: { data: base64Pdf, mimeType: 'application/pdf' } });
          const council = await recruitInnovationCouncil(summary);
          setRecruitedCouncil(council);
          addLog('INFO', 'War Room council successfully assembled.');
      } catch (e) {
          const error = parseApiError(e);
          alert(`War Room recruitment failed: ${error}`);
          setIsWarRoomModalOpen(false);
          addLog('ERROR', `War Room recruitment failed: ${error}`);
      } finally {
          setIsRecruiting(false);
      }
  };

  const handleOpenWarRoom = (council: InnovationCouncil) => {
      const details = {
          name: `WAR ROOM: ${council.project_analysis.substring(0, 30)}...`,
          description: council.project_analysis,
          tags: ['War Room', 'Innovation Council']
      };
      // We pass the council to the new project so it's persisted in the history
      onNewProject(details, { 
          prompt: council.project_analysis,
          activeCouncil: council 
      });
      setIsWarRoomModalOpen(false);
      addLog('INFO', 'War Room project initialized.');
  };

  useEffect(() => {
    if(activeVersion && (drawings.length > 0 || inspirationalImages.length > 0)) {
        updateVersion(activeVersion.versionId, { drawings, inspirationalImages });
        setHasUnsavedChanges(true);
    }
  }, [drawings, inspirationalImages, activeVersion, updateVersion]);

  const handleSaveProject = (details: { name: string; description: string; tags: string[] }) => {
    if (projectToEdit) {
      updateProjectDetails(projectToEdit.id, details);
      addLog('INFO', `Updated project details: "${details.name}"`);
    } else {
      const id = onNewProject(details, initialProjectData ? { prompt: initialProjectData.initialPrompt } : undefined);
      addLog('INFO', `Created new project: "${details.name}"`);
    }
    setIsProjectModalOpen(false);
    setInitialProjectData(null);
  };

  const handleCommitVersion = (commitMessage: string) => {
    if (!activeProject || !displayedResult || !selectedFaction) return;
    
    saveNewVersion({
      prompt,
      factionId: selectedFaction.id,
      preferredInnovatorId: selectedInnovatorId,
      isDeepThought: isDeepThought,
      result: displayedResult,
      fileUrls: activeVersion?.fileUrls || [],
      drawings,
      inspirationalImages,
      incorporatedSuggestions: activeVersion?.incorporatedSuggestions || [],
      rotorModel,
      activeCouncil: activeVersion?.activeCouncil, // Ensure council persists through commits
    }, commitMessage);
    
    setIsCommitModalOpen(false);
    setHasUnsavedChanges(false);
    addLog('INFO', `Version committed: "${commitMessage}"`);
  };

  const handleStartAnalysis = async () => {
    if (!prompt || !selectedFaction || !activeProject || !authenticatedUser) return;
    
    const analysisResult = await triggerAnalysis(activeProject.name, prompt, selectedFaction, { files, fileUrls: activeVersion?.fileUrls }, selectedInnovatorId, isDeepThought);
    
    if (analysisResult) {
      setUsers(prev => prev.map(u => u.id === authenticatedUser.id ? { ...u, analysesRun: u.analysesRun + 1 } : u));
      const newFileUrls = await Promise.all(files.map(fileToDataUrl));
      const combinedUrls = [...(activeVersion?.fileUrls || []), ...newFileUrls].filter((v, i, a) => a.indexOf(v) === i);
      saveNewVersion({
          prompt,
          factionId: selectedFaction.id,
          preferredInnovatorId: selectedInnovatorId,
          isDeepThought: isDeepThought,
          result: analysisResult,
          fileUrls: combinedUrls,
          drawings: [],
          inspirationalImages: [],
          incorporatedSuggestions: [],
          rotorModel,
          activeCouncil: activeVersion?.activeCouncil, // Carry over council if it exists
      }, `Analysis: ${selectedFaction.name}${selectedInnovatorId ? ` + ${selectedInnovatorId}` : ''}${isDeepThought ? ' [Deep Thought]' : ''}`);
      setActiveVersionIndex(0);
      setFiles([]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSelectInnovator = (id: InnovatorId) => {
      setEditorState({ ...editorState, selectedInnovatorId: selectedInnovatorId === id ? undefined : id });
      setHasUnsavedChanges(true);
  };

  const handleToggleDeepThought = (active: boolean) => {
      setEditorState({ ...editorState, isDeepThought: active });
      setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (activeProject) {
        setProjectName(activeProject.name);
        const v = activeProject.history[activeVersionIndex] || activeProject.history[0];
        if (v) {
            resetEditorState({ 
                prompt: v.prompt, 
                selectedFaction: ENGINEERING_PHILOSOPHIES.find(f => f.id === v.factionId) || null, 
                tags: activeProject.tags || [],
                selectedInnovatorId: v.preferredInnovatorId,
                isDeepThought: !!v.isDeepThought
            });
            setDrawings(v.drawings || []);
            setInspirationalImages(v.inspirationalImages || []);
            setResult(v.result);
            setRotorModel(v.rotorModel);
            liveCosting.initialize(v.result);
        }
    }
  }, [activeProject, activeVersionIndex, resetEditorState, liveCosting, setDrawings, setInspirationalImages, setResult]);


  if (!authenticatedUser) return <AuthPage onGoogleAuth={handleGoogleAuth} onDemoLogin={handleDemoLogin} />;
  
  const isBusy = isLoading || isVideoLoading || drawings.some(d => d.isLoading) || inspirationalImages.some(i => i.isLoading) || isSummaryLoading || isCadLoading || isParsingPdf || isParsingImage || rossAnalysis.isRossRunning || imageIdentifier.isLoading || versionComparer.isComparing || isRecruiting;

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans">
      <Header
        onStartTour={() => { setIsTourOpen(true); setTourStep(0); }}
        onOpenUserManual={() => setIsUserManualOpen(true)}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(v => v === 'app' ? 'admin' : 'app')}
      />
      <main>
        {viewMode === 'app' ? (
          <div className="flex flex-col">
            <div className="p-6 space-y-6">
                <ProjectManager 
                  projects={projects}
                  activeProject={activeProject}
                  activeVersionIndex={activeVersionIndex}
                  onSelectProject={onSelectProject}
                  onNewProject={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                  onOpenFile={loadProject}
                  onSaveProject={() => {}} 
                  hasUnsavedChanges={hasUnsavedChanges}
                  onCommitVersion={() => setIsCommitModalOpen(true)}
                  onStartWithDeVinci={() => handleLaunchBrainstormingDeVinci()}
                  onStartFromImage={handleStartFromImage}
                  isParsingImage={isParsingImage}
                  onStartFromPdf={handleStartFromPdf}
                  isParsingPdf={isParsingPdf}
                  onStartBrainstormFromPdf={handleStartWarRoomFromPdf}
                  isParsingForBrainstorm={isRecruiting}
                  onIdentifyImage={() => {}}
                  isIdentifyingImage={false}
                  onEditProject={(p) => { setProjectToEdit(p); setIsProjectModalOpen(true); }}
                  onDeleteProject={onDeleteProject}
                  onLoadVersion={setActiveVersionIndex}
                  onRevertVersion={revertToVersion}
                  onCompareVersions={versionComparer.runComparison}
                  disabled={isBusy}
                  authenticatedUser={authenticatedUser}
                />
                <FactionSelector
                  selectedFaction={selectedFaction}
                  onSelectFaction={(f) => setEditorState({...editorState, selectedFaction: f})}
                  disabled={isBusy}
                  authenticatedUser={authenticatedUser}
                />
                <PromptInput
                  projectName={projectName}
                  onProjectNameChange={setProjectName}
                  prompt={prompt}
                  onPromptChange={(p) => setEditorState({...editorState, prompt: p})}
                  tags={tags}
                  onTagsChange={(t) => setEditorState({...editorState, tags: t})}
                  onUndo={undoEditorState}
                  onRedo={redoEditorState}
                  canUndo={canUndoEditorState}
                  canRedo={canRedoEditorState}
                  files={files}
                  onFilesChange={setFiles}
                  onEngage={handleStartAnalysis}
                  isLoading={isLoading}
                  onClearFiles={() => setFiles([])}
                  isReady={!!(prompt && selectedFaction && projectName)}
                  authenticatedUser={authenticatedUser}
                  setupAssistant={setupAssistant}
                  onApplyFactionSuggestion={(id) => setEditorState({...editorState, selectedFaction: ENGINEERING_PHILOSOPHIES.find(f => f.id === id) || null})}
                  onReanalyzeWithFaction={handleStartAnalysis}
                  selectedFaction={selectedFaction}
                  activeVersionFactionId={activeVersion?.factionId}
                  promptValidator={promptValidator}
                  selectedInnovatorId={selectedInnovatorId}
                  onSelectInnovator={handleSelectInnovator}
                  isDeepThought={isDeepThought}
                  onToggleDeepThought={handleToggleDeepThought}
                />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-brand-light mb-3">Analysis Report</h2>
              <AnalysisDisplay
                projectName={activeProject?.name || "New Analysis"}
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
                onRemoveDrawing={removeDrawing}
                onToggleDrawingReportInclusion={toggleDrawingReportInclusion}
                onSetCover={handleSetCover}
                inspirationalImages={inspirationalImages}
                onRemoveInspirationalImage={removeInspirationalImage}
                onRequestInspirationalImage={handleRequestInspirationalImage}
                onToggleImageReportInclusion={toggleImageReportInclusion}
                onIncorporateSuggestions={() => {}}
                onLaunchDeVinci={handleLaunchBrainstormingDeVinci}
                activeProject={activeProject}
                activeVersion={activeVersion}
                authenticatedUser={authenticatedUser}
                onGenerateSummary={generateSummary}
                isSummaryLoading={isSummaryLoading}
                summaryError={summaryError}
                cadData={cadData}
                onGenerateCad={generateCad}
                isCadLoading={isCadLoading}
                cadError={cadError}
                onOpenCadViewer={() => setIsCadViewerOpen(true)}
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
                onExportToGoogle={() => {}}
                rotorModel={rotorModel}
                onRotorModelChange={setRotorModel}
                rossAnalysis={rossAnalysis}
                tts={tts}
                inspirationalImageHistory={activeProject?.inspirationalImageHistory || []}
                onReinsertInspirationalImage={handleReinsertImageFromHistory}
                onDeleteInspirationalImageFromHistory={handleDeleteImageFromHistory}
                simulation={simulation}
                fabricationPlanner={fabricationPlanner}
                gcodeVisualizer={gcodeVisualizer}
                suggestionExplorer={suggestionExplorer}
                bomSourcing={bomSourcing}
                liveCosting={liveCosting}
                nextStepAssistant={nextStepAssistant}
              />
            </div>
          </div>
        ) : (
          <AdminDashboard 
            authenticatedUser={authenticatedUser}
            users={users}
            projects={projects}
            logs={logs}
            onUpdateUser={() => {}}
            onDeleteUser={() => {}}
            onOpenTechDoc={() => setIsTechDocOpen(true)}
          />
        )}
      </main>
      <Tour isOpen={isTourOpen} steps={TOUR_STEPS} stepIndex={tourStep} onClose={() => setIsTourOpen(false)} onNext={() => setTourStep(s => s + 1)} onPrev={() => setTourStep(s => s - 1)} tts={tts} />
      <TechnicalDocumentModal isOpen={isTechDocOpen} onClose={() => setIsTechDocOpen(false)} />
      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProject} project={projectToEdit} initialData={initialProjectData} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={authenticatedUser} onSave={handleUpdateProfile} />
      <GoogleDocPreviewModal isOpen={isGoogleDocPreviewOpen} onClose={() => setIsGoogleDocPreviewOpen(false)} content={googleExporter.exportedDocContent} projectName={activeProject?.name || ''} />
      <CommitModal isOpen={isCommitModalOpen} onClose={() => setIsCommitModalOpen(false)} onConfirm={handleCommitVersion} />
       {isCadViewerOpen && cadData && (
         <CadViewerModal isOpen={isCadViewerOpen} onClose={() => setIsCadViewerOpen(false)} cadData={cadData} />
       )}
       {versionComparer.comparisonData && (
         <ComparisonViewerModal 
            isOpen={!!versionComparer.comparisonData} 
            onClose={versionComparer.clearComparison} 
            isLoading={versionComparer.isComparing} 
            error={versionComparer.comparisonError} 
            comparisonData={versionComparer.comparisonData} 
          />
       )}
       <SuggestionExplorerModal isOpen={suggestionExplorer.isModalOpen} onClose={suggestionExplorer.clearExploration} isLoading={suggestionExplorer.isExploring} error={suggestionExplorer.explorationError} result={suggestionExplorer.explorationResult} />
       
       <DeVinciModal 
          isOpen={deVinciMode === 'brainstorm'}
          onClose={() => setDeVinciMode(null)}
          startConversation={() => {}}
          stopConversation={brainstormingDeVinci.stopConversation}
          state={brainstormingDeVinci.state}
          transcript={brainstormingDeVinci.transcript}
          volume={brainstormingDeVinci.volume}
          onFileUpload={brainstormingDeVinci.sendFile}
          analyzableFile={brainstormingDeVinci.analyzableFile}
          sendImageRegion={() => {}}
          simulateNewSpeaker={brainstormingDeVinci.simulateNewSpeaker}
          manualRetry={() => {}}
          retryCount={brainstormingDeVinci.retryCount}
          partnerName={activePartner?.name}
          partnerColor={activePartner ? (activePartner.module === 'Visionary Architect' ? '#a855f7' : activePartner.module === 'Empirical Optimizer' ? '#10b981' : activePartner.module === 'Lateral Thinker' ? '#06b6d4' : '#f59e0b') : undefined}
       />

       <VoiceCommanderWidget 
          state={voiceCommander.state}
          startListening={voiceCommander.startListening}
          stopListening={voiceCommander.stopListening}
       />

       <WarRoomModal 
          isOpen={isWarRoomModalOpen}
          onClose={() => setIsWarRoomModalOpen(false)}
          council={recruitedCouncil}
          isLoading={isRecruiting}
          onOpenWarRoom={handleOpenWarRoom}
          projectName={warRoomProjectName}
       />
    </div>
  );
}

export default App;
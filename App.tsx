import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Faction, ProjectVersion, Project, AnalysisResult, User, LogEntry, Role, GeneratedDrawing, FactionId, GeneratedImage, EditorState, RotorModel, CadData, InProgressState } from './types';
import { ENGINEERING_PHILOSOPHIES, TOUR_STEPS, MOCK_USERS } from './constants';
import { useAnalysis, runFullAnalysis } from './hooks/useAnalysis';
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
    extractProjectDetailsFromVideo,
    extractProjectDetailsFromVideoUrl,
    parseApiError,
    ExtractedProjectDetails,
    createProjectFunctionDeclaration,
    buildDeVinciCreationSystemInstruction,
    runAnalysisWithFactionFunctionDeclaration,
    generateInspirationalImageFunctionDeclaration,
    buildDeVinciSystemInstruction,
    summarizePdfForContext,
    downloadDrawingsFunctionDeclaration,
    generateVideoFunctionDeclaration,
    generateFactionInspirationalPrompts,
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
import { ToolpathVisualizerModal } from './components/ToolpathVisualizerModal';
import { useBomSourcing } from './hooks/useBomSourcing';
import { usePromptValidator } from './hooks/usePromptValidator';
import { useLiveCosting } from './hooks/useLiveCosting';
import { useNextStepAssistant } from './hooks/useNextStepAssistant';
import { useVoiceCommander } from './hooks/useVoiceCommander';
import { VoiceCommanderWidget } from './components/VoiceCommanderWidget';
import { useAppVoice } from './hooks/useAppVoice';
import { createDrawingsZip } from './services/zipService';
import { useAiChat } from './hooks/useAiChat';
import { AiChatModal } from './components/AiChatModal';
import { ToolSuite } from './components/suite/ToolSuite';
import { VideoImportModal } from './components/VideoImportModal';
import { useGoogleDriveStorage } from './hooks/useGoogleDriveStorage';
import { GoogleDrivePickerModal } from './components/GoogleDrivePickerModal';

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
    updateVersion,
    loadProject,
    addImageToHistory,
    deleteImageFromHistory,
  } = useProjects();
  
  // State for the "editor" or current working area
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
  
  // --- Auth, Admin & User State ---
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'admin' | 'suite'>('app');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // --- Modal States ---
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
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isVideoImportModalOpen, setIsVideoImportModalOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const addLog = useCallback((level: LogEntry['level'], message: string, overrideContext?: { user?: string, project?: string }) => {
    const user = overrideContext?.user || authenticatedUser?.name || 'System';
    const project = overrideContext?.project || activeProject?.name || '';
    setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toISOString(), level, message, user, context: project }]);
  }, [authenticatedUser, activeProject]);

  // --- AI State ---
  const brainstormingDeVinci = useDeVinci();
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
  const aiChat = useAiChat(addLog);
  const googleDriveStorage = useGoogleDriveStorage(addLog);

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
        // Find the first available image file from the main file input
        imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) {
            addLog('WARN', 'Voice command for video from image failed: No image found in file input.');
            return "No uploaded image found to use as reference.";
        }
    }
    
    generateVideo(prompt, imageFile); // This function is from useVideoGenerator
    addLog('INFO', `Voice command triggered video generation for: "${prompt}" ${imageFile ? `using image ${imageFile.name}`: ''}.`);
    return "Video generation started.";

  }, [files, generateVideo, addLog, isViewer]);

  const voiceCommander = useVoiceCommander({
    onNavigate: (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        addLog('INFO', `Voice navigation to: ${sectionId}`);
    },
    onDownloadDrawings: handleDownloadDrawings,
    onGenerateVideo: handleGenerateVideoCommand,
  });
  useAppVoice(tts, authenticatedUser);

  const googleExporter = useGoogleExporter(addLog);

  const { result, isLoading, error, generateAnalysis, clearAnalysis, setResult } = useAnalysis(addLog);
  const { saveInProgressAnalysis, loadInProgressAnalysis, clearInProgressAnalysis } = useAnalysisPersistence();
  const [savedSessionData, setSavedSessionData] = useState<InProgressState | null>(null);
  
  const activeVersion: ProjectVersion | null = useMemo(() => {
    if (!activeProject) return null;
    return activeProject.history[activeVersionIndex] || activeProject.history[0];
  }, [activeProject, activeVersionIndex]);
  
  const displayedResult = result || activeVersion?.result || null;

  const { summary, isSummaryLoading, summaryError, generateSummary, clearSummary } = useSummaryGenerator(addLog);
  const { cadData, isCadLoading, cadError, generateCad, clearCad } = useCadGenerator(addLog);

    // --- Post-Analysis Audio Feedback ---
    const prevIsLoadingRef = useRef(false);
    useEffect(() => {
        if (prevIsLoadingRef.current && !isLoading && result) {
            const feedbackMessages = [
                "Analysis complete! Here are the results of my evaluation, Creator.",
                "Excellent! The detailed analysis is ready for your review.",
                "I've finished the analysis. Take a look at what I've discovered."
            ];
            const message = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
            setTimeout(() => {
                tts.speak(message, 'Zephyr');
            }, 500);
        }
        prevIsLoadingRef.current = isLoading;
    }, [isLoading, result, tts]);


  // --- AI Setup Assistant Logic ---
  useEffect(() => {
    if (prompt && prompt.length > 20) {
      setupAssistant.fetchSuggestions(prompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  // --- Warn user about unsaved changes ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // --- Auto-Save Session Persistence ---
  useEffect(() => {
      const autoSaveInterval = setInterval(() => {
          // Check if there's something to save to avoid writing empty data
          if (displayedResult && selectedFaction && (activeProject || projectName)) {
              saveInProgressAnalysis({
                  projectName: activeProject?.name || projectName,
                  prompt,
                  factionId: selectedFaction.id,
                  result: displayedResult,
                  drawings, // These will be stripped by the hook
                  inspirationalImages, // These will be stripped by the hook
              });
              addLog('INFO', 'Project auto-saved to local storage.');
          }
      }, 60000); // 60 seconds

      return () => {
          clearInterval(autoSaveInterval);
      };
  }, [
      saveInProgressAnalysis,
      displayedResult,
      selectedFaction,
      activeProject,
      projectName,
      prompt,
      drawings,
      inspirationalImages,
      addLog,
  ]);


   // --- AUTH HANDLERS ---
  const handleGoogleAuth = async () => {
    try {
        const googleData = await googleApiService.signInWithGoogle();
        let user = users.find(u => u.email === googleData.email);

        if (user) { // User exists, sign them in
            user = { ...user, lastActive: new Date().toISOString(), picture: googleData.picture };
            setUsers(prev => prev.map(u => u.id === user!.id ? user! : u));
        } else { // User does not exist, sign them up
            user = {
                id: `user-${Date.now()}`,
                name: googleData.name,
                email: googleData.email,
                picture: googleData.picture,
                role: Role.Editor, // New users are Editors
                analysesRun: 0,
                lastActive: new Date().toISOString()
            };
            setUsers(prev => [...prev, user!]);
            addLog('INFO', `New user signed up via Google: ${user.name}`);
        }
        
        setAuthenticatedUser(user);
        addLog('INFO', `User logged in: ${user.name}`, { user: user.name });
    } catch (error) {
        console.error("Google Authentication failed:", error);
        addLog('ERROR', 'Google Sign-In failed.');
    }
  };
  
  const handleDemoLogin = (userName: string) => {
    const user = users.find(u => u.name === userName);
    if (user) {
        const updatedUser = { ...user, lastActive: new Date().toISOString() };
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setAuthenticatedUser(updatedUser);
        addLog('INFO', `User logged in as demo: ${user.name}`, { user: user.name });
    }
  };
  
  const handleLogout = () => {
    addLog('INFO', `User logged out: ${authenticatedUser?.name}`);
    googleApiService.signOutFromGoogle();
    setAuthenticatedUser(null);
     if (viewMode === 'admin') {
      setViewMode('app');
    }
  };
  
  const handleUpdateProfile = (updatedUser: User) => {
    setAuthenticatedUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addLog('INFO', `User profile updated: ${updatedUser.name}`, { user: updatedUser.name });
  }

  // --- DEVINCI & AI HANDLERS ---
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
    addLog('INFO', `Re-inserted image "${image.prompt}" into current version.`);
    setHasUnsavedChanges(true);
  }, [inspirationalImages, setInspirationalImages, addLog]);

  const handleDeleteImageFromHistory = useCallback((imageId: string) => {
      deleteImageFromHistory(imageId);
      addLog('WARN', `Permanently deleted image from project history.`);
      setHasUnsavedChanges(true);
  }, [deleteImageFromHistory, addLog]);
  
  const handleSetCover = useCallback((id: string, type: 'drawing' | 'image') => {
    setDrawings(prev => prev.map(d => ({
        ...d,
        isCoverImage: type === 'drawing' && d.id === id,
    })));
    setInspirationalImages(prev => prev.map(img => ({
        ...img,
        isCoverImage: type === 'image' && img.id === id,
    })));
    setHasUnsavedChanges(true);
  }, [setDrawings, setInspirationalImages]);

  const handleDeVinciProjectCreation = async (functionCall: { name: string, args: any, id: string }) => {
      addLog('INFO', `DeVinci initiated project creation: ${functionCall.name}`, { project: functionCall.args.name });
      if (functionCall.name === 'create_project') {
          const { name, description, tags, factionId } = functionCall.args;
          if (name && description && factionId) {
              const newProjectId = onNewProject({ name, description, tags: tags || [] }, { factionId });
              if (newProjectId) {
                  onSelectProject(newProjectId);
                  setHasUnsavedChanges(true);
              }
              creationDeVinci.stopConversation();
              setDeVinciMode(null);
              return { success: true, message: `Excellent! I've created the project "${name}" for you. Remember to save it.` };
          }
      }
      return { success: false, message: 'Sorry, I was missing some information. Could you please provide all the details?' };
  };

  const handleLaunchCreationDeVinci = () => {
      if (!authenticatedUser) return;
      creationDeVinci.startConversation({
          systemInstruction: buildDeVinciCreationSystemInstruction(ENGINEERING_PHILOSOPHIES),
          voice: 'Zephyr',
          tools: [{ functionDeclarations: [createProjectFunctionDeclaration] }],
          onFunctionCall: handleDeVinciProjectCreation,
          authenticatedUser,
      });
      setDeVinciMode('creation');
  };

  const handleDeVinciFileUpload = (file: File) => {
    if (deVinciMode === 'brainstorm') {
        brainstormingDeVinci.sendFile(file);
    }
  };

  const handleDeVinciBrainstormingFunctionCall = async (functionCall: { name: string, args: any, id: string }) => {
    addLog('INFO', `DeVinci initiated function call: ${functionCall.name}`);
    if (functionCall.name === 'generate_technical_drawing') {
        const prompt = functionCall.args.specificPrompt;
        if (prompt && displayedResult) {
            requestDrawing(prompt, displayedResult, activeVersion?.fileUrls);
            setHasUnsavedChanges(true);
            return { success: true, message: `OK, I've started generating a drawing of "${prompt}". It will appear in the 'Visual Documentation' section shortly.` };
        }
        return { success: false, message: 'I cannot generate a drawing without an active analysis result or a specific prompt.' };
    }
    
    if (functionCall.name === 'research_web') {
        const query = functionCall.args.query;
        if (query) {
            return await performWebSearch(query);
        }
        return { success: false, message: 'Missing the query for the web search.' };
    }

    if (functionCall.name === 'run_analysis_with_faction') {
        const factionId = functionCall.args.factionId;
        const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === factionId);
        if (faction && activeVersion && activeProject) {
            try {
                addLog('INFO', `DeVinci starting background analysis with faction "${faction.name}".`);
                const newAnalysis = await runFullAnalysis(activeProject.name, activeVersion.prompt, faction, { files: [], fileUrls: activeVersion.fileUrls });
                const summary = await generateSummary(newAnalysis);
                addLog('INFO', `DeVinci background analysis with faction "${faction.name}" complete.`);
                return { success: true, summary };
            } catch (e) {
                addLog('ERROR', `DeVinci background analysis failed: ${parseApiError(e)}`);
                return { success: false, message: "The new analysis failed." };
            }
        }
        return { success: false, message: "Invalid faction ID or no active project version." };
    }

    if (functionCall.name === 'generate_inspirational_image') {
        const prompt = functionCall.args.prompt;
        if (prompt) {
            handleRequestInspirationalImage(prompt, '16:9');
            setHasUnsavedChanges(true);
            return { success: true, message: `Alright, I'm generating an inspirational image based on your idea. You'll see it appear in the 'Visual Documentation' section.` };
        }
        return { success: false, message: "I need a prompt to generate an image." };
    }

    return { success: false, message: `Unknown function call: ${functionCall.name}` };
  };

  const handleLaunchBrainstormingDeVinci = () => {
     if (activeProject && activeVersion && selectedFaction && authenticatedUser) {
        const contextString = `
You have been primed with the full context of their current project, which is a reverse engineering analysis. This includes ALL generated documents like the Bill of Materials, Requirement Specifications, and Test Plans. Do not re-state the entire context. Instead, use it as your internal memory. Refer to it naturally as if you've already studied it together.

Your current guiding engineering philosophy is "${selectedFaction.name}: ${selectedFaction.philosophy}".

This is the project context you are working with:
${JSON.stringify({
    projectName: activeProject.name,
    userPrompt: activeVersion.prompt,
    analysisResult: activeVersion.result
}, null, 2)}
`;

        const systemInstruction = buildDeVinciSystemInstruction(contextString, ENGINEERING_PHILOSOPHIES);

        brainstormingDeVinci.startConversation({
            systemInstruction: systemInstruction,
            voice: 'Zephyr',
            tools: [{ functionDeclarations: [
                generateTechnicalDrawingFunctionDeclaration, 
                researchWebFunctionDeclaration,
                runAnalysisWithFactionFunctionDeclaration,
                generateInspirationalImageFunctionDeclaration,
            ] }],
            onFunctionCall: handleDeVinciBrainstormingFunctionCall,
            authenticatedUser,
        });
        setDeVinciMode('brainstorm');
     }
  };
  
  const handleLaunchAiChat = () => {
    if (activeProject && activeVersion && selectedFaction) {
        const contextString = `You are a helpful AI engineering assistant. You are having a text chat with a user about a project they are working on. You have been provided with the full context of their current analysis report. Use this context as your internal knowledge base to answer questions, brainstorm ideas, refine prompts, and explore design alternatives.

Your current guiding engineering philosophy is "${selectedFaction.name}: ${selectedFaction.philosophy}".

This is the project context you are working with:
${JSON.stringify({
    projectName: activeProject.name,
    userPrompt: activeVersion.prompt,
    analysisResult: activeVersion.result
}, null, 2)}
`;
        aiChat.startChat(contextString);
        setIsAiChatOpen(true);
    }
  };

  const handleStartFromImage = async (file: File) => {
    setIsParsingImage(true);
    addLog('INFO', `Parsing image "${file.name}" to create a new project.`);
    try {
        const filePart = await fileToGenerativePart(file);
        const details = await extractProjectDetailsFromImage(filePart);
        
        setInitialProjectData(details);
        setProjectToEdit(null); // Ensure modal is in "create" mode
        setIsProjectModalOpen(true);
        addLog('INFO', `Successfully extracted project details from "${file.name}".`, { project: details.name });
    } catch (e) {
        const errorMessage = parseApiError(e);
        addLog('ERROR', `Failed to parse image: ${errorMessage}`);
        alert(`Failed to extract project details from image: ${errorMessage}`);
    } finally {
        setIsParsingImage(false);
    }
  };

  const handleStartFromPdf = async (file: File) => {
    setIsParsingPdf(true);
    addLog('INFO', `Parsing PDF "${file.name}" to create a new project.`);
    try {
        const filePart = await fileToGenerativePart(file);
        const details = await extractProjectDetailsFromPdf(filePart);
        
        setInitialProjectData(details);
        setProjectToEdit(null); // Ensure modal is in "create" mode
        setIsProjectModalOpen(true);
        addLog('INFO', `Successfully extracted project details from "${file.name}".`, { project: details.name });
    } catch (e) {
        const errorMessage = parseApiError(e);
        addLog('ERROR', `Failed to parse PDF: ${errorMessage}`);
        alert(`Failed to extract project details from PDF: ${errorMessage}`);
    } finally {
        setIsParsingPdf(false);
    }
  };
  
  const handleStartFromVideoFile = async (file: File) => {
      setIsParsingVideo(true);
      setIsVideoImportModalOpen(false);
      addLog('INFO', `Analyzing video "${file.name}" for project creation...`);
      
      try {
          const filePart = await fileToGenerativePart(file);
          const details = await extractProjectDetailsFromVideo(filePart);
          
          setInitialProjectData(details);
          setProjectToEdit(null);
          setIsProjectModalOpen(true);
          
          // Set the file in the editor state so it's included in the full analysis
          setFiles([file]); 
          
          addLog('INFO', `Successfully extracted project details from video "${file.name}".`, { project: details.name });
      } catch (e) {
          const errorMessage = parseApiError(e);
          addLog('ERROR', `Failed to analyze video file: ${errorMessage}`);
          alert(`Failed to extract project details from video: ${errorMessage}`);
      } finally {
          setIsParsingVideo(false);
      }
  };

  const handleStartFromVideoUrl = async (url: string) => {
    setIsParsingVideo(true);
    setIsVideoImportModalOpen(false);
    addLog('INFO', `Analyzing video URL "${url}" for project creation...`);
    
    try {
        const details = await extractProjectDetailsFromVideoUrl(url);
        
        setInitialProjectData(details);
        setProjectToEdit(null);
        setIsProjectModalOpen(true);
        addLog('INFO', `Successfully extracted project details from video URL.`, { project: details.name });
    } catch (e) {
        const errorMessage = parseApiError(e);
        addLog('ERROR', `Failed to analyze video URL: ${errorMessage}`);
        alert(`Failed to extract project details from URL: ${errorMessage}`);
    } finally {
        setIsParsingVideo(false);
    }
  };
  
  const handleStartBrainstormFromPdf = async (file: File) => {
    setIsParsingForBrainstorm(true);
    addLog('INFO', `Parsing PDF "${file.name}" to start a brainstorming session.`);
    try {
        if (!authenticatedUser) throw new Error("Authentication required.");
        const filePart = await fileToGenerativePart(file);
        const summary = await summarizePdfForContext(filePart);
        const contextString = `
You have been primed with the context from a PDF document the user has uploaded. This document appears to be a previous engineering report. Use this summary as your internal memory to discuss and brainstorm with the user. Refer to it naturally as if you've already studied it together.

This is the context from the PDF:
---
${summary}
---
`;
        const systemInstruction = buildDeVinciSystemInstruction(contextString, ENGINEERING_PHILOSOPHIES);
        
        brainstormingDeVinci.startConversation({
            systemInstruction: systemInstruction,
            voice: 'Zephyr',
            tools: [{ functionDeclarations: [
                generateTechnicalDrawingFunctionDeclaration, 
                researchWebFunctionDeclaration,
                runAnalysisWithFactionFunctionDeclaration,
                generateInspirationalImageFunctionDeclaration,
            ] }],
            onFunctionCall: handleDeVinciBrainstormingFunctionCall,
            authenticatedUser,
        });
        setDeVinciMode('brainstorm');
    } catch (e) {
        const errorMessage = parseApiError(e);
        addLog('ERROR', `Failed to parse PDF for brainstorming: ${errorMessage}`);
        alert(`Failed to start brainstorm session from PDF: ${errorMessage}`);
    } finally {
        setIsParsingForBrainstorm(false);
    }
  };

  const handleIdentifyImage = async (file: File) => {
    setIsIdentifierModalOpen(true);
    await imageIdentifier.identifyImage(file);
  };

  // Sync drawings array in project version history whenever it changes
  useEffect(() => {
    if(activeVersion && (drawings.length > 0 || inspirationalImages.length > 0)) {
      const drawingsChanged = JSON.stringify(drawings) !== JSON.stringify(activeVersion.drawings || []);
      const inspirationalImagesChanged = JSON.stringify(inspirationalImages) !== JSON.stringify(activeVersion.inspirationalImages || []);

      if (drawingsChanged || inspirationalImagesChanged) {
        updateVersion(activeVersion.versionId, { drawings, inspirationalImages });
        setHasUnsavedChanges(true);
      }
    }
  }, [drawings, inspirationalImages, activeVersion, updateVersion]);

  const isReady = useMemo(() => {
      return !!selectedFaction && !!prompt.trim() && !!projectName.trim();
  }, [selectedFaction, prompt, projectName]);

  const handleApplyFactionSuggestion = (factionId: FactionId) => {
    const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === factionId);
    if (faction) {
        setEditorState({ ...editorState, selectedFaction: faction });
    }
  };
  
  const handleReanalyzeWithFaction = () => {
    if (activeProject && selectedFaction && prompt) {
        handleEngage(true);
    }
  };
  
  const handleClearAnalysis = useCallback(() => {
    if (hasUnsavedChanges && activeProject) {
        if (!window.confirm("You have unsaved changes that will be lost. Are you sure you want to start a new analysis?")) {
            return;
        }
    }
    clearAnalysis();
    clearAllDrawings();
    clearAllInspirationalImages();
    clearVideo();
    clearCad();
    clearSummary();
    liveCosting.initialize(null);
    bomSourcing.clearSourcing();
    simulation.clearSimulation();
    fabricationPlanner.clearPlanner();
    
    // Reset editor state
    setFiles([]);
    if (activeProject) {
        const newProjectId = onNewProject({ name: `${activeProject.name} - New Analysis`, description: activeProject.description, tags: activeProject.tags });
        onSelectProject(newProjectId);
    } else {
        setProjectName('New Project');
        resetEditorState({ prompt: '', selectedFaction: null, tags: [] });
    }

    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, activeProject, clearAnalysis, clearAllDrawings, clearAllInspirationalImages, clearVideo, clearCad, clearSummary, liveCosting, bomSourcing, simulation, fabricationPlanner, onNewProject, onSelectProject, resetEditorState]);
  
  const handleEngage = useCallback(async (isReanalysis = false) => {
    if (!selectedFaction || !prompt.trim() || !projectName.trim()) {
      alert("Please select a faction, provide a project name, and write a prompt before engaging the AI.");
      return;
    }

    if (activeProject && !isReanalysis && hasUnsavedChanges) {
        if (!window.confirm("You have unsaved changes. Engaging will start a new version based on your current inputs. Continue?")) {
            return;
        }
    }

    const newResult = await generateAnalysis(projectName, prompt, selectedFaction, { files, fileUrls: activeVersion?.fileUrls });

    if (newResult) {
      const commitMessage = isReanalysis ? `Re-analyzed with ${selectedFaction.name}` : 'New analysis from editor';
      
      const fileUrls = files.length > 0 ? await Promise.all(files.map(fileToDataUrl)) : activeVersion?.fileUrls || [];

      // If we don't have an active project yet, create one now
      if (!activeProject) {
         onNewProject({ name: projectName, description: 'Created from analysis', tags }, { 
            prompt, 
            factionId: selectedFaction.id,
            result: newResult,
            fileUrls: fileUrls
         });
         // The new project version is already created as part of onNewProject's initial logic
      } else {
          // Save the new version into the existing project
          saveNewVersion({
              prompt,
              factionId: selectedFaction.id,
              result: newResult,
              fileUrls: fileUrls,
              drawings: [],
              inspirationalImages: [],
            }, commitMessage);
      }

      // Reset states for the new version
      setActiveVersionIndex(0);
      clearAllDrawings();
      clearAllInspirationalImages();
      clearVideo();
      clearCad();
      clearSummary();
      liveCosting.initialize(newResult);
      setRotorModel(undefined);
      setHasUnsavedChanges(false);
      clearInProgressAnalysis();
    }
  }, [selectedFaction, prompt, projectName, activeProject, hasUnsavedChanges, generateAnalysis, files, activeVersion, saveNewVersion, clearAllDrawings, clearAllInspirationalImages, clearVideo, clearCad, clearSummary, liveCosting, clearInProgressAnalysis, onNewProject, tags]);

  const handleIncorporateSuggestions = useCallback((suggestionTexts: string[]) => {
    if (!activeVersion || !selectedFaction) return;
    
    const incorporatedPrompt = `${activeVersion.prompt}\n\n--- INCORPORATE SUGGESTIONS ---\nPlease refine the analysis by incorporating the following suggestions:\n- ${suggestionTexts.join('\n- ')}`;
    
    setEditorState({ ...editorState, prompt: incorporatedPrompt });

    // Trigger analysis after state update
    setTimeout(() => handleEngage(true), 0);
    
    updateVersion(activeVersion.versionId, {
        incorporatedSuggestions: [...(activeVersion.incorporatedSuggestions || []), ...suggestionTexts]
    });
    setHasUnsavedChanges(true);

  }, [activeVersion, selectedFaction, editorState, setEditorState, handleEngage, updateVersion]);
  
  const handleSaveProject = () => {
      if (!activeProject) return;
      const jsonString = JSON.stringify(activeProject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.replace(/\s/g, '_')}.sfp.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setHasUnsavedChanges(false);
      addLog('INFO', 'Project saved to file.');
  };
  
  const handleLoadProjectFromFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const project = JSON.parse(e.target?.result as string) as Project;
              loadProject(project);
              addLog('INFO', `Project "${project.name}" loaded from file.`);
          } catch (error) {
              alert('Failed to parse project file.');
              addLog('ERROR', 'Failed to parse project file.');
          }
      };
      reader.readAsText(file);
  };

  // --- Google Drive Integration Handlers ---
  const handleSaveToDrive = async () => {
      if (!activeProject) return;
      if (!googleDriveStorage.isAuthenticated) {
          await googleDriveStorage.signIn();
      }
      await googleDriveStorage.saveProject(activeProject);
      setHasUnsavedChanges(false);
  };

  const handleOpenFromDriveClick = () => {
      setIsDrivePickerOpen(true);
  };

  const handleLoadFromDrive = async (fileId: string) => {
      const project = await googleDriveStorage.loadProject(fileId);
      if (project) {
          loadProject(project);
          setIsDrivePickerOpen(false);
      }
  };
  
  const handleProjectSelect = useCallback((projectId: string) => {
    if (activeProject?.id === projectId) return;
    if (hasUnsavedChanges) {
        if (!window.confirm("You have unsaved changes. Switch projects without saving?")) {
            return;
        }
    }
    const projectToLoad = projects.find(p => p.id === projectId);
    if(projectToLoad) {
        // Here we'd need to load the full project history, which we don't store in the index
        // This is a limitation of the current local-first model. We alert the user.
        alert(`Switching context to "${projectToLoad.name}". To see full history, please re-open the project file.`);
        // Create a temporary project stub to make the UI update
        const stubProject: Project = { ...projectToLoad, history: [], inspirationalImageHistory: [] };
        loadProject(stubProject);
    }
  }, [activeProject, hasUnsavedChanges, projects, loadProject]);

  const handleLoadVersion = useCallback((index: number) => {
    if (!activeProject) return;
    const version = activeProject.history[index];
    if (!version) return;

    setActiveVersionIndex(index);
    
    // IMPORTANT: Rehydrate all application state from version
    setResult(version.result);
    setDrawings(version.drawings || []);
    setInspirationalImages(version.inspirationalImages || []);
    setRotorModel(version.rotorModel);
    setFiles([]); // Clear current file uploads as they are part of the new "session"
    
    const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === version.factionId) || null;
    resetEditorState({
        prompt: version.prompt,
        selectedFaction: faction,
        tags: activeProject.tags
    });
    setProjectName(activeProject.name);
    
    // Re-initialize derived tools and clear temporary results
    liveCosting.initialize(version.result);
    bomSourcing.clearSourcing();
    simulation.clearSimulation();
    fabricationPlanner.clearPlanner();
    imageIdentifier.clearIdentification();
    versionComparer.clearComparison();
    gcodeVisualizer.closeModal();
    suggestionExplorer.clearExploration();
    clearCad();
    clearSummary();
    
    setHasUnsavedChanges(false);
    addLog('INFO', `Loaded version: "${version.commitMessage}"`);

  }, [activeProject, resetEditorState, bomSourcing, fabricationPlanner, liveCosting, simulation, clearCad, imageIdentifier, versionComparer, gcodeVisualizer, suggestionExplorer, clearSummary, addLog, setResult, setDrawings, setInspirationalImages]);
  
  const handleRevertVersion = (index: number) => {
    revertToVersion(index);
    // After reverting, a new version is created at index 0 which is a copy of the old version.
    // We need to load this new version.
    setTimeout(() => handleLoadVersion(0), 100);
  };
  
  const handleNewProjectClick = () => {
    setProjectToEdit(null);
    setInitialProjectData(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProjectClick = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };
  
  const handleSaveProjectDetails = (details: {name: string, description: string, tags: string[]}) => {
    if (projectToEdit) { // Editing existing project
      updateProjectDetails(projectToEdit.id, details);
      setProjectName(details.name);
      setEditorState({ ...editorState, tags: details.tags });
      addLog('INFO', `Project details updated for "${details.name}".`);
    } else { // Creating new project
      const newId = onNewProject(details, { prompt: initialProjectData?.initialPrompt, factionId: selectedFaction?.id });
      onSelectProject(newId);
      addLog('INFO', `New project created: "${details.name}".`);
    }
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
    setInitialProjectData(null);
  };

  const handleCommitVersion = async (commitMessage: string) => {
      if (!activeVersion || !selectedFaction) return;
      
      // Handle file persistence: Convert newly uploaded files to Data URLs for storage
      let newFileUrls = activeVersion.fileUrls;
      if (files.length > 0) {
         newFileUrls = await Promise.all(files.map(fileToDataUrl));
      }

      saveNewVersion({
          prompt,
          factionId: selectedFaction.id,
          result: displayedResult,
          fileUrls: newFileUrls, 
          drawings,
          inspirationalImages,
          rotorModel,
          incorporatedSuggestions: activeVersion.incorporatedSuggestions,
      }, commitMessage);

      setHasUnsavedChanges(false);
      setIsCommitModalOpen(false);
      setActiveVersionIndex(0); // Switch to the newly created version
  };
  
  const handleCompareVersions = (project: Project, newVersionIndex: number) => {
    versionComparer.runComparison(project, newVersionIndex);
  };
  
  useEffect(() => {
    if (activeProject) {
        handleLoadVersion(activeVersionIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject]);

  // Check for saved session on initial load
  useEffect(() => {
    const saved = loadInProgressAnalysis();
    if (saved) {
        setSavedSessionData(saved);
        // Maybe open a modal here to ask the user if they want to restore
    }
  }, [loadInProgressAnalysis]);

  if (!authenticatedUser) {
    return <AuthPage onGoogleAuth={handleGoogleAuth} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-brand-dark text-gray-900 dark:text-brand-light overflow-hidden transition-colors duration-300">
      <Header
        onStartTour={() => setIsTourOpen(true)}
        onOpenUserManual={() => setIsUserManualOpen(true)}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        viewMode={viewMode}
        onSwitchView={setViewMode}
      />

      {/* Main Layout: Single Column Stack */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {viewMode === 'app' && (
          /* Input Section - Formerly Sidebar, now top block */
          <div className="w-full bg-white dark:bg-gray-800 p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 space-y-6 transition-colors duration-300">
             <div className="max-w-5xl mx-auto space-y-6">
                 <ProjectManager
                    projects={projects}
                    activeProject={activeProject}
                    activeVersionIndex={activeVersionIndex}
                    onSelectProject={handleProjectSelect}
                    onNewProject={handleNewProjectClick}
                    onOpenFile={handleLoadProjectFromFile}
                    onSaveProject={handleSaveProject}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onCommitVersion={() => setIsCommitModalOpen(true)}
                    onStartWithDeVinci={handleLaunchCreationDeVinci}
                    onStartFromImage={handleStartFromImage}
                    isParsingImage={isParsingImage}
                    onStartFromPdf={handleStartFromPdf}
                    isParsingPdf={isParsingPdf}
                    onStartBrainstormFromPdf={handleStartBrainstormFromPdf}
                    isParsingForBrainstorm={isParsingForBrainstorm}
                    onIdentifyImage={handleIdentifyImage}
                    isIdentifyingImage={imageIdentifier.isLoading}
                    onOpenVideoImport={() => setIsVideoImportModalOpen(true)}
                    isParsingVideo={isParsingVideo}
                    onEditProject={(p) => handleEditProjectClick(p as Project)}
                    onDeleteProject={onDeleteProject}
                    onLoadVersion={handleLoadVersion}
                    onRevertVersion={handleRevertVersion}
                    onCompareVersions={(p, idx) => handleCompareVersions(p, idx)}
                    disabled={isLoading}
                    authenticatedUser={authenticatedUser}
                    // Google Drive Handlers
                    onSaveToDrive={handleSaveToDrive}
                    onOpenFromDrive={handleOpenFromDriveClick}
                    isSavingToDrive={googleDriveStorage.isSaving}
                    isDriveAuthenticated={googleDriveStorage.isAuthenticated}
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
                  isReady={isReady}
                  authenticatedUser={authenticatedUser}
                  setupAssistant={setupAssistant}
                  onApplyFactionSuggestion={handleApplyFactionSuggestion}
                  onReanalyzeWithFaction={handleReanalyzeWithFaction}
                  selectedFaction={selectedFaction}
                  activeVersionFactionId={activeVersion?.factionId}
                  promptValidator={promptValidator}
                />
             </div>
          </div>
        )}

        {/* Main Output Area - Stacks below the input section */}
        <main className="flex-1 w-full bg-gray-50 dark:bg-brand-dark animate-fade-in transition-colors duration-300">
          {viewMode === 'app' ? (
            <div className="max-w-5xl mx-auto p-6">
              <AnalysisDisplay
                projectName={projectName}
                result={displayedResult}
                isLoading={isLoading}
                error={error}
                selectedFaction={selectedFaction}
                onClear={handleClearAnalysis}
                onGenerateVideo={generateVideo}
                isVideoLoading={isVideoLoading}
                videoUrl={videoUrl}
                videoError={videoError}
                drawings={drawings}
                onRequestDrawing={requestDrawing}
                onRequestDrawingFromImage={requestDrawingFromImage}
                onRemoveDrawing={(id) => { removeDrawing(id); setHasUnsavedChanges(true); }}
                onToggleDrawingReportInclusion={(id) => { toggleDrawingReportInclusion(id); setHasUnsavedChanges(true); }}
                onSetCover={handleSetCover}
                inspirationalImages={inspirationalImages}
                onRequestInspirationalImage={handleRequestInspirationalImage}
                onRemoveInspirationalImage={(id) => { removeInspirationalImage(id); setHasUnsavedChanges(true); }}
                onToggleImageReportInclusion={(id) => { toggleImageReportInclusion(id); setHasUnsavedChanges(true); }}
                onIncorporateSuggestions={handleIncorporateSuggestions}
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
                onExportToGoogle={() => { if(activeProject) googleExporter.exportToGoogle(activeProject, drawings, authenticatedUser!)}}
                rotorModel={rotorModel}
                onRotorModelChange={(m) => { setRotorModel(m); setHasUnsavedChanges(true); }}
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
          ) : (
            <ToolSuite />
          )}
        </main>
      </div>

      {/* Modals */}
      <Tour isOpen={isTourOpen} stepIndex={tourStep} steps={TOUR_STEPS} onClose={() => setIsTourOpen(false)} onNext={() => setTourStep(s => s + 1)} onPrev={() => setTourStep(s => s - 1)} tts={tts} />
      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />
      <TechnicalDocumentModal isOpen={isTechDocOpen} onClose={() => setIsTechDocOpen(false)} />
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setInitialProjectData(null); setProjectToEdit(null); }}
        onSave={handleSaveProjectDetails}
        project={projectToEdit}
        initialData={initialProjectData || undefined}
      />
       <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={authenticatedUser}
        onSave={handleUpdateProfile}
      />
      {deVinciMode && (
          <DeVinciModal
            isOpen={deVinciMode !== null}
            isCreating={deVinciMode === 'creation'}
            onClose={() => {
                if (deVinciMode === 'creation') creationDeVinci.stopConversation();
                else brainstormingDeVinci.stopConversation();
                setDeVinciMode(null);
            }}
            startConversation={() => {
                if (deVinciMode === 'creation') handleLaunchCreationDeVinci();
                else handleLaunchBrainstormingDeVinci();
            }}
            stopConversation={deVinciMode === 'creation' ? creationDeVinci.stopConversation : brainstormingDeVinci.stopConversation}
            pauseConversation={deVinciMode === 'creation' ? creationDeVinci.pauseConversation : brainstormingDeVinci.pauseConversation}
            resumeConversation={deVinciMode === 'creation' ? creationDeVinci.resumeConversation : brainstormingDeVinci.resumeConversation}
            state={deVinciMode === 'creation' ? creationDeVinci.state : brainstormingDeVinci.state}
            transcript={deVinciMode === 'creation' ? creationDeVinci.transcript : brainstormingDeVinci.transcript}
            onFileUpload={handleDeVinciFileUpload}
            analyzableFile={brainstormingDeVinci.analyzableFile}
            sendImageRegion={brainstormingDeVinci.sendImageRegion}
            simulateNewSpeaker={brainstormingDeVinci.simulateNewSpeaker}
            manualRetry={deVinciMode === 'creation' ? creationDeVinci.manualRetry : brainstormingDeVinci.manualRetry}
            retryCount={deVinciMode === 'creation' ? creationDeVinci.retryCount : brainstormingDeVinci.retryCount}
          />
      )}
      <GoogleDocPreviewModal 
        isOpen={isGoogleDocPreviewOpen}
        onClose={() => setIsGoogleDocPreviewOpen(false)}
        content={googleExporter.exportedDocContent}
        projectName={activeProject?.name || ''}
      />
      {cadData && <CadViewerModal isOpen={isCadViewerOpen} onClose={() => setIsCadViewerOpen(false)} cadData={cadData} />}
      <CommitModal 
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onConfirm={handleCommitVersion}
      />
      <ImageIdentifierModal
        isOpen={isIdentifierModalOpen}
        onClose={() => { setIsIdentifierModalOpen(false); imageIdentifier.clearIdentification(); }}
        isLoading={imageIdentifier.isLoading}
        error={imageIdentifier.error}
        result={imageIdentifier.result}
      />
      <ComparisonViewerModal
        isOpen={versionComparer.comparisonData !== null || versionComparer.isComparing || !!versionComparer.comparisonError}
        onClose={versionComparer.clearComparison}
        isLoading={versionComparer.isComparing}
        error={versionComparer.comparisonError}
        comparisonData={versionComparer.comparisonData}
      />
      <SuggestionExplorerModal
        isOpen={suggestionExplorer.isModalOpen}
        onClose={suggestionExplorer.clearExploration}
        isLoading={suggestionExplorer.isExploring}
        error={suggestionExplorer.explorationError}
        result={suggestionExplorer.explorationResult}
      />
      <ToolpathVisualizerModal 
        isOpen={gcodeVisualizer.isModalOpen}
        onClose={gcodeVisualizer.closeModal}
        gcode={gcodeVisualizer.gcodeToVisualize}
        summary={gcodeVisualizer.summary}
        isLoading={gcodeVisualizer.isLoading}
        error={gcodeVisualizer.error}
      />
      <VideoImportModal
        isOpen={isVideoImportModalOpen}
        onClose={() => setIsVideoImportModalOpen(false)}
        onImportFile={handleStartFromVideoFile}
        onImportUrl={handleStartFromVideoUrl}
        isLoading={isParsingVideo}
      />
      <GoogleDrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        isLoading={googleDriveStorage.isLoadingList || googleDriveStorage.isLoadingFile}
        files={googleDriveStorage.fileList}
        onSelect={handleLoadFromDrive}
        onRefresh={googleDriveStorage.refreshFileList}
        error={googleDriveStorage.error}
        isAuthenticated={googleDriveStorage.isAuthenticated}
        onSignIn={googleDriveStorage.signIn}
      />
      { displayedResult && !isViewer && <VoiceCommanderWidget 
        state={voiceCommander.state}
        startListening={voiceCommander.startListening}
        stopListening={voiceCommander.stopListening}
      />}
      { displayedResult && <button 
          onClick={handleLaunchAiChat} 
          className="fixed bottom-6 left-6 z-30 bg-purple-600 text-white font-semibold py-3 px-5 rounded-full shadow-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-100"
          title="Open AI Chat for brainstorming and refinement"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375-3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" /></svg>
          AI Chat
        </button>}
      <AiChatModal
        isOpen={isAiChatOpen}
        onClose={() => { aiChat.endChat(); setIsAiChatOpen(false); }}
        state={aiChat.state}
        history={aiChat.history}
        sendMessage={aiChat.sendMessage}
        error={aiChat.error}
      />

    </div>
  );
}

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
    parseApiError,
    ExtractedProjectDetails,
    createProjectFunctionDeclaration,
    buildDeVinciCreationSystemInstruction,
    runAnalysisWithFactionFunctionDeclaration,
    generateInspirationalImageFunctionDeclaration,
    generateSummary,
    buildDeVinciSystemInstruction,
    summarizePdfForContext,
    downloadDrawingsFunctionDeclaration,
    generateVideoFunctionDeclaration,
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
  const [viewMode, setViewMode] = useState<'app' | 'admin'>('app');
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

  // FIX: Moved `addLog` before its usage in `useRossAnalysis` to fix "used before declaration" error.
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
  const { drawings, requestDrawing, requestDrawingFromImage, removeDrawing, setDrawings, clearAllDrawings, toggleDrawingReportInclusion } = useDrawingGenerator(addLog);
  const { inspirationalImages, requestInspirationalImage, removeInspirationalImage, setInspirationalImages, clearAllInspirationalImages, toggleImageReportInclusion } = useInspirationalImageGenerator(addLog);
  const { videoUrl, isVideoLoading, videoError, generateVideo, clearVideo } = useVideoGenerator(addLog);

  const handleDownloadDrawings = useCallback(() => {
    const projectNameForZip = activeProject?.name || 'SynapseForge_Analysis';
    const imagesToZip = [...drawings, ...inspirationalImages];
    if (imagesToZip.length > 0) {
        createDrawingsZip(imagesToZip, projectNameForZip);
        addLog('INFO', `Voice command triggered download of ${imagesToZip.length} visual assets.`);
    } else {
        addLog('WARN', 'Voice command for download triggered, but no drawings were available.');
    }
  }, [activeProject, drawings, inspirationalImages, addLog]);

  const handleGenerateVideoCommand = useCallback((prompt: string, useUploadedImage: boolean) => {
    let imageFile: File | undefined = undefined;
    if (useUploadedImage) {
        // Find the first available image file from the main file input
        imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) {
            const message = "I couldn't find an uploaded image to use as a reference. Please upload one in the main input area first.";
            tts.speak(message, 'Kore');
            addLog('WARN', 'Voice command for video from image failed: No image found in file input.');
            return;
        }
    }
    
    generateVideo(prompt, imageFile); // This function is from useVideoGenerator
    addLog('INFO', `Voice command triggered video generation for: "${prompt}" ${imageFile ? `using image ${imageFile.name}`: ''}.`);

  }, [files, generateVideo, tts, addLog]);

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

  const { summary, isSummaryLoading, summaryError, clearSummary } = useSummaryGenerator(addLog);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, inspirationalImages, activeVersion]);

  // Load saved session on initial mount
  useEffect(() => {
    setSavedSessionData(loadInProgressAnalysis());
    addLog('INFO', `App initialized.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // --- Project Metadata Debounced Saving ---
  const debounceTimeoutRef = useRef<number | null>(null);
  
  const handleProjectNameChange = useCallback((newName: string) => {
      setProjectName(newName);
      setHasUnsavedChanges(true);
  }, []);

    const handleUndo = useCallback(() => {
        if (canUndoEditorState) {
            undoEditorState();
            setHasUnsavedChanges(true);
        }
    }, [canUndoEditorState, undoEditorState]);

    const handleRedo = useCallback(() => {
        if (canRedoEditorState) {
            redoEditorState();
            setHasUnsavedChanges(true);
        }
    }, [canRedoEditorState, redoEditorState]);

  const handlePromptChange = useCallback((newPrompt: string) => {
    if (editorState.prompt !== newPrompt) {
      setEditorState({ ...editorState, prompt: newPrompt });
      setHasUnsavedChanges(true);
    }
  }, [editorState, setEditorState]);
  
  const handleTagsChange = useCallback((newTags: string[]) => {
    if (JSON.stringify(editorState.tags) !== JSON.stringify(editorState.tags)) {
      setEditorState({ ...editorState, tags: newTags });
      setHasUnsavedChanges(true);
    }
  }, [editorState, setEditorState]);

  const handleFactionChange = useCallback((faction: Faction) => {
    if (editorState.selectedFaction?.id !== faction.id) {
        setEditorState({ ...editorState, selectedFaction: faction });
        setHasUnsavedChanges(true);
    }
  }, [editorState, setEditorState]);


  useEffect(() => {
      if (!activeProject) return;

      if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
          if (activeProject.name !== projectName || JSON.stringify(activeProject.tags) !== JSON.stringify(tags)) {
            updateProjectDetails(activeProject.id, { name: projectName, tags: tags });
            addLog('INFO', `Project "${projectName}" metadata updated.`);
          }
      }, 750);

      return () => {
          if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
          }
      };
  }, [projectName, tags, activeProject, updateProjectDetails, addLog]);


  // Effect to load data from the active project/version into the editor state
  useEffect(() => {
    if (activeProject) {
        setProjectName(activeProject.name);
        const versionToLoad = activeProject.history[activeVersionIndex] || activeProject.history[0];
        if (versionToLoad) {
            const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === versionToLoad.factionId) || null;
            resetEditorState({ prompt: versionToLoad.prompt, selectedFaction: faction, tags: activeProject.tags || [] });
            setFiles([]); // Clear staged files when loading a version
            setDrawings(versionToLoad.drawings || []); // Load drawings
            setInspirationalImages(versionToLoad.inspirationalImages || []);
            setResult(versionToLoad.result);
            setRotorModel(versionToLoad.rotorModel);
            liveCosting.initialize(versionToLoad.result); // Initialize live costing
            clearVideo();
        }
    } else {
        // Reset editor if no project is active
        setProjectName('');
        resetEditorState({ prompt: '', selectedFaction: ENGINEERING_PHILOSOPHIES[0], tags: [] });
        setFiles([]);
        clearAllDrawings();
        clearAllInspirationalImages();
        clearAnalysis();
        liveCosting.initialize(null); // Clear live costing
        setRotorModel(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject, activeVersionIndex, resetEditorState]);

  const handleStartAnalysis = async () => {
    if (!prompt || !selectedFaction || !activeProject || !authenticatedUser) {
      return;
    }

    addLog('INFO', `Starting analysis for project "${activeProject.name}" with faction "${selectedFaction.name}".`);
    
    const analysisResult = await generateAnalysis(activeProject.name, prompt, selectedFaction, { 
      files, 
      fileUrls: activeVersion?.fileUrls 
    });
    
    if (analysisResult) {
      addLog('INFO', `Analysis for "${activeProject.name}" completed successfully.`);
      setUsers(prev => prev.map(u => u.id === authenticatedUser.id ? { ...u, analysesRun: u.analysesRun + 1 } : u));
      
      const newFileUrls = await Promise.all(files.map(fileToDataUrl));
      const combinedUrls = [...(activeVersion?.fileUrls || []), ...newFileUrls].filter((v, i, a) => a.indexOf(v) === i);
      saveNewVersion({
          prompt: prompt,
          factionId: selectedFaction.id,
          result: analysisResult,
          fileUrls: combinedUrls,
          drawings: [],
          inspirationalImages: [],
          incorporatedSuggestions: [],
          rotorModel: rotorModel,
      }, `Analysis run: ${selectedFaction.name}`);
      
      setActiveVersionIndex(0);
      setFiles([]);
      setHasUnsavedChanges(false);
    }
  };
  
  const handleIncorporateSuggestions = async (suggestionTexts: string[]) => {
    if (!selectedFaction || !activeVersion || !activeProject || suggestionTexts.length === 0 || !authenticatedUser) return;

    const suggestionsFormatted = suggestionTexts.map(s => `- ${s}`).join('\n');
    const newPrompt = `${activeVersion.prompt}\n\n---\n[User Action] Incorporate the following AI suggestions into the design:\n${suggestionsFormatted}`;
    setEditorState({ ...editorState, prompt: newPrompt }); // Update UI for user to see
    
    addLog('INFO', `Incorporating ${suggestionTexts.length} suggestions into project "${activeProject.name}".`);
    
    const analysisResult = await generateAnalysis(activeProject.name, newPrompt, selectedFaction, { 
      files: [], // No new files are being added in this flow
      fileUrls: activeVersion.fileUrls
    });
    
    if (analysisResult) {
      addLog('INFO', `Analysis with incorporated suggestions for "${activeProject.name}" completed successfully.`);
      setUsers(prev => prev.map(u => u.id === authenticatedUser.id ? { ...u, analysesRun: u.analysesRun + 1 } : u));
      
      const combinedUrls = [...(activeVersion.fileUrls || [])];
      saveNewVersion({
        prompt: newPrompt,
        factionId: selectedFaction.id,
        result: analysisResult,
        fileUrls: combinedUrls,
        drawings: [],
        inspirationalImages: [],
        incorporatedSuggestions: suggestionTexts,
        rotorModel: rotorModel,
      }, `Incorporated ${suggestionTexts.length} AI suggestion(s)`);

      setActiveVersionIndex(0);
      setFiles([]);
      setHasUnsavedChanges(false);
    }
  };

  const handleCommitVersion = (commitMessage: string) => {
    if (!activeProject || !selectedFaction || !activeVersion) return;
    
    saveNewVersion({
      prompt: prompt,
      factionId: selectedFaction.id,
      result: activeVersion.result, // The result doesn't change on a manual commit
      fileUrls: activeVersion.fileUrls,
      drawings: drawings,
      inspirationalImages: inspirationalImages,
      incorporatedSuggestions: activeVersion.incorporatedSuggestions,
      rotorModel: rotorModel,
    }, commitMessage);

    setActiveVersionIndex(0);
    setHasUnsavedChanges(false);
    setIsCommitModalOpen(false);
    addLog('INFO', `New version committed for "${activeProject.name}": "${commitMessage}"`);
  };

  // --- Project Modal Handlers ---
  const handleOpenNewProjectModal = () => {
    setProjectToEdit(null);
    setInitialProjectData(null);
    setIsProjectModalOpen(true);
  };
  
  const handleOpenEditProjectModal = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (details: { name: string; description: string; tags: string[] }) => {
    if (projectToEdit) {
      // Editing existing project
      updateProjectDetails(projectToEdit.id, details);
    } else {
      // Creating new project
      onNewProject(details, { prompt: initialProjectData?.initialPrompt || '' });
    }
    setHasUnsavedChanges(true);
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
    setInitialProjectData(null);
  };
  
  // --- File Handlers ---
  const handleOpenFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const projectData = JSON.parse(event.target?.result as string);
            // Basic validation
            if (projectData.id && projectData.name && projectData.history) {
                loadProject(projectData);
                addLog('INFO', `Project file loaded: ${projectData.name}`);
            } else {
                throw new Error("Invalid project file format.");
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : "Unknown error";
            addLog('ERROR', `Failed to open project file: ${error}`);
            alert(`Error opening project file: ${error}`);
        }
    };
    reader.onerror = () => {
        addLog('ERROR', 'Failed to read the project file.');
        alert('Failed to read the project file.');
    };
    reader.readAsText(file);
  };

  const handleSaveFile = () => {
    if (!activeProject) return;
    
    // Make sure the latest rotor model is on the active version before saving
    const projectToSave = { ...activeProject };
    if (projectToSave.history[activeVersionIndex]) {
        projectToSave.history[activeVersionIndex].rotorModel = rotorModel;
    }

    const jsonString = JSON.stringify(projectToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectToSave.name.replace(/\s+/g, '_')}.sfp.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('INFO', `Project "${projectToSave.name}" saved to file.`);
    setHasUnsavedChanges(false);
  };


  const handleClear = () => {
    clearAnalysis();
    clearVideo();
    clearAllDrawings();
    clearAllInspirationalImages();
    clearInProgressAnalysis();
    clearSummary();
    clearCad();
    googleExporter.clearGoogleExport();
    fabricationPlanner.clearPlanner();
    bomSourcing.clearSourcing();
    liveCosting.initialize(null);
    nextStepAssistant.clearSuggestions();
  };

  const handleLoadVersion = (index: number) => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to switch versions? Your changes will be lost.")) {
      return;
    }
    clearInProgressAnalysis();
    clearSummary();
    clearCad();
    googleExporter.clearGoogleExport();
    fabricationPlanner.clearPlanner();
    bomSourcing.clearSourcing();
    liveCosting.initialize(null);
    nextStepAssistant.clearSuggestions();
    setActiveVersionIndex(index);
    setHasUnsavedChanges(false);
  };
  
  const handleRevertVersion = (index: number) => {
    clearInProgressAnalysis();
    revertToVersion(index);
    setActiveVersionIndex(0);
    setHasUnsavedChanges(true);
  };

  const handleSelectProject = (projectId: string) => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to switch projects? Your changes will be lost.")) {
      return;
    }
    clearInProgressAnalysis();
    clearSummary();
    clearCad();
    googleExporter.clearGoogleExport();
    fabricationPlanner.clearPlanner();
    bomSourcing.clearSourcing();
    liveCosting.initialize(null);
    nextStepAssistant.clearSuggestions();
    onSelectProject(projectId);
    setActiveVersionIndex(0); 
    setHasUnsavedChanges(false);
  };
  
  const handleDeleteProjectWithLog = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    addLog('WARN', `Project "${project?.name || projectId}" deleted.`, { project: project?.name || projectId });
    onDeleteProject(projectId);
  }

  const handleResumeSession = useCallback(() => {
    if (savedSessionData) {
        setProjectName(savedSessionData.projectName);
        resetEditorState({
          prompt: savedSessionData.prompt,
          selectedFaction: ENGINEERING_PHILOSOPHIES.find(f => f.id === savedSessionData.factionId) || null,
          tags: [], // Tags are not part of old saved session data
        });
        setResult(savedSessionData.result);
        setDrawings(savedSessionData.drawings || []);
        setInspirationalImages(savedSessionData.inspirationalImages || []);
        setSavedSessionData(null); // Hide banner
        addLog('INFO', `Resumed previous session for project "${savedSessionData.projectName}".`);
        bomSourcing.clearSourcing();
        liveCosting.initialize(savedSessionData.result);
    }
  }, [savedSessionData, setResult, addLog, resetEditorState, bomSourcing, liveCosting, setDrawings, setInspirationalImages]);

  const handleDismissResume = useCallback(() => {
    clearInProgressAnalysis();
    setSavedSessionData(null); // Hide banner
  }, [clearInProgressAnalysis]);


  if (!authenticatedUser) {
    return <AuthPage onGoogleAuth={handleGoogleAuth} onDemoLogin={handleDemoLogin} />;
  }
  
  const isBusy = isLoading || isVideoLoading || drawings.some(d => d.isLoading) || inspirationalImages.some(i => i.isLoading) || isSummaryLoading || isCadLoading || isParsingPdf || isParsingImage || isParsingForBrainstorm || rossAnalysis.isRossRunning || imageIdentifier.isLoading || versionComparer.isComparing;

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
                  onSelectProject={handleSelectProject}
                  onNewProject={handleOpenNewProjectModal}
                  onOpenFile={handleOpenFile}
                  onSaveProject={handleSaveFile}
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
                  onEditProject={handleOpenEditProjectModal}
                  onDeleteProject={handleDeleteProjectWithLog}
                  onLoadVersion={handleLoadVersion}
                  onRevertVersion={handleRevertVersion}
                  onCompareVersions={(project, index) => versionComparer.runComparison(project, index)}
                  disabled={isBusy}
                  authenticatedUser={authenticatedUser}
                />
                <FactionSelector
                  selectedFaction={selectedFaction}
                  onSelectFaction={handleFactionChange}
                  disabled={isBusy}
                  authenticatedUser={authenticatedUser}
                />
                <PromptInput
                  projectName={projectName}
                  onProjectNameChange={handleProjectNameChange}
                  prompt={prompt}
                  onPromptChange={handlePromptChange}
                  tags={tags}
                  onTagsChange={handleTagsChange}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
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
                  onApplyFactionSuggestion={(factionId) => {
                    const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === factionId);
                    if (faction) handleFactionChange(faction);
                  }}
                  onReanalyzeWithFaction={handleStartAnalysis}
                  selectedFaction={selectedFaction}
                  activeVersionFactionId={activeVersion?.factionId}
                  promptValidator={promptValidator}
                />
            </div>
            <div className="p-6">
              {savedSessionData && (
                <div className="bg-cyan-900/60 border border-brand-cyan p-4 rounded-lg mb-6 flex justify-between items-center animate-fade-in">
                  <div>
                    <h3 className="font-bold text-brand-light">Resume Session</h3>
                    <p className="text-sm text-gray-300">You have an unsaved analysis for "<strong>{savedSessionData.projectName}</strong>". Would you like to continue?</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleResumeSession} className="py-2 px-4 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition">Resume</button>
                    <button onClick={handleDismissResume} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition">Dismiss</button>
                  </div>
                </div>
              )}
              <h2 className="text-xl font-semibold text-brand-light mb-3">Analysis Report</h2>
              <AnalysisDisplay
                projectName={activeProject?.name || "New Analysis"}
                result={displayedResult}
                isLoading={isLoading}
                error={error}
                selectedFaction={selectedFaction}
                onClear={handleClear}
                onGenerateVideo={generateVideo}
                isVideoLoading={isVideoLoading}
                videoUrl={videoUrl}
                videoError={videoError}
                drawings={drawings}
                onRequestDrawing={(prompt, result, fileUrls) => requestDrawing(prompt, result, fileUrls)}
                onRequestDrawingFromImage={requestDrawingFromImage}
                onRemoveDrawing={removeDrawing}
                onToggleDrawingReportInclusion={toggleDrawingReportInclusion}
                onSetCover={handleSetCover}
                inspirationalImages={inspirationalImages}
                onRemoveInspirationalImage={removeInspirationalImage}
                onRequestInspirationalImage={handleRequestInspirationalImage}
                onToggleImageReportInclusion={toggleImageReportInclusion}
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
                onExportToGoogle={() => activeProject && authenticatedUser && googleExporter.exportToGoogle(activeProject, drawings, inspirationalImages)}
                rotorModel={rotorModel}
                onRotorModelChange={(newModel) => {
                  setRotorModel(newModel);
                  setHasUnsavedChanges(true);
                }}
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
          <div className="w-full p-6">
            <AdminDashboard 
              authenticatedUser={authenticatedUser}
              users={users}
              projects={projects}
              logs={logs}
              onUpdateUser={(updatedUser) => {
                setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
                addLog('INFO', `User "${updatedUser.name}" role changed to ${updatedUser.role}.`, { project: `User: ${updatedUser.name}`});
              }}
              onDeleteUser={(userId) => {
                 const userToDelete = users.find(u => u.id === userId);
                 if (userToDelete) {
                    addLog('WARN', `User "${userToDelete.name}" deleted.`, { project: `User: ${userToDelete.name}`});
                    setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
                    if (authenticatedUser.id === userId) {
                      handleLogout();
                    }
                 }
              }}
              onOpenTechDoc={() => setIsTechDocOpen(true)}
            />
          </div>
        )}
      </main>
      {displayedResult && viewMode === 'app' && (
          <VoiceCommanderWidget
              state={voiceCommander.state}
              startListening={voiceCommander.startListening}
              stopListening={voiceCommander.stopListening}
          />
      )}
      <Tour
        isOpen={isTourOpen}
        steps={TOUR_STEPS}
        stepIndex={tourStep}
        onClose={() => setIsTourOpen(false)}
        onNext={() => setTourStep(s => Math.min(s + 1, TOUR_STEPS.length - 1))}
        onPrev={() => setTourStep(s => Math.max(s - 1, 0))}
        tts={tts}
      />
      <DeVinciModal 
        isOpen={deVinciMode !== null}
        onClose={() => {
            if (deVinciMode === 'creation') creationDeVinci.stopConversation();
            if (deVinciMode === 'brainstorm') brainstormingDeVinci.stopConversation();
            setDeVinciMode(null);
        }}
        startConversation={deVinciMode === 'creation' ? handleLaunchCreationDeVinci : handleLaunchBrainstormingDeVinci}
        stopConversation={deVinciMode === 'creation' ? creationDeVinci.stopConversation : brainstormingDeVinci.stopConversation}
        pauseConversation={deVinciMode === 'creation' ? creationDeVinci.pauseConversation : brainstormingDeVinci.pauseConversation}
        resumeConversation={deVinciMode === 'creation' ? creationDeVinci.resumeConversation : brainstormingDeVinci.resumeConversation}
        state={deVinciMode === 'creation' ? creationDeVinci.state : brainstormingDeVinci.state}
        transcript={deVinciMode === 'creation' ? creationDeVinci.transcript : brainstormingDeVinci.transcript}
        isCreating={deVinciMode === 'creation'}
        onFileUpload={handleDeVinciFileUpload}
        analyzableFile={brainstormingDeVinci.analyzableFile}
        sendImageRegion={brainstormingDeVinci.sendImageRegion}
        simulateNewSpeaker={brainstormingDeVinci.simulateNewSpeaker}
        // FIX: Pass missing `manualRetry` and `retryCount` props to DeVinciModal.
        manualRetry={deVinciMode === 'creation' ? creationDeVinci.manualRetry : brainstormingDeVinci.manualRetry}
        retryCount={deVinciMode === 'creation' ? creationDeVinci.retryCount : brainstormingDeVinci.retryCount}
      />
      <UserManualModal
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
      />
      <TechnicalDocumentModal
        isOpen={isTechDocOpen}
        onClose={() => setIsTechDocOpen(false)}
      />
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => {
            setIsProjectModalOpen(false);
            setInitialProjectData(null);
        }}
        onSave={handleSaveProject}
        project={projectToEdit}
        initialData={initialProjectData ? { name: initialProjectData.name, description: initialProjectData.description, tags: initialProjectData.tags } : undefined}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={authenticatedUser}
        onSave={handleUpdateProfile}
      />
      <GoogleDocPreviewModal
        isOpen={isGoogleDocPreviewOpen}
        onClose={() => setIsGoogleDocPreviewOpen(false)}
        content={googleExporter.exportedDocContent}
        projectName={activeProject?.name || ''}
      />
       {cadData && (
        <CadViewerModal
          isOpen={isCadViewerOpen}
          onClose={() => setIsCadViewerOpen(false)}
          cadData={cadData}
        />
      )}
      <CommitModal 
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onConfirm={handleCommitVersion}
      />
      <ImageIdentifierModal
        isOpen={isIdentifierModalOpen}
        onClose={() => {
            setIsIdentifierModalOpen(false);
            imageIdentifier.clearIdentification();
        }}
        isLoading={imageIdentifier.isLoading}
        error={imageIdentifier.error}
        result={imageIdentifier.result}
      />
      <ComparisonViewerModal
        isOpen={versionComparer.comparisonData !== null || versionComparer.isComparing || versionComparer.comparisonError !== null}
        onClose={versionComparer.clearComparison}
        isLoading={versionComparer.isComparing}
        error={versionComparer.comparisonError}
        comparisonData={versionComparer.comparisonData}
      />
      {gcodeVisualizer.isModalOpen && (
        <ToolpathVisualizerModal
          isOpen={gcodeVisualizer.isModalOpen}
          onClose={gcodeVisualizer.closeModal}
          gcode={gcodeVisualizer.gcodeToVisualize}
          summary={gcodeVisualizer.summary}
          isLoading={gcodeVisualizer.isLoading}
          error={gcodeVisualizer.error}
        />
      )}
       <SuggestionExplorerModal
        isOpen={suggestionExplorer.isModalOpen}
        onClose={suggestionExplorer.clearExploration}
        isLoading={suggestionExplorer.isExploring}
        error={suggestionExplorer.explorationError}
        result={suggestionExplorer.explorationResult}
      />
    </div>
  );
}

export default App;
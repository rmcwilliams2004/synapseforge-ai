import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Faction, ProjectVersion, Project, AnalysisResult, User, LogEntry, Role, GeneratedDrawing } from './types';
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
import { useAnalysisPersistence, InProgressState } from './hooks/useAnalysisPersistence';
import { UserManualModal } from './components/UserManualModal';
import { TechnicalDocumentModal } from './components/TechnicalDocumentModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProjectModal } from './components/ProjectModal';
import { CommitModal } from './components/CommitModal';
import { AuthPage } from './components/AuthPage';
import { ProfileModal } from './components/ProfileModal';

type VersionDataToSave = {
    prompt: string;
    result: AnalysisResult;
    newFileUrls: string[];
} | null;


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
  } = useProjects();
  
  // State for the "editor" or current working area
  const [projectName, setProjectName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  
  // --- Auth, Admin & User State ---
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'admin'>('app');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // --- Modal States ---
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [versionDataToSave, setVersionDataToSave] = useState<VersionDataToSave>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


  const addLog = useCallback((level: 'INFO' | 'WARN' | 'ERROR', message: string) => {
    setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toISOString(), level, message }]);
  }, []);

  const { result, isLoading, error, generateAnalysis, clearAnalysis, setResult } = useAnalysis(addLog);
  const { saveInProgressAnalysis, loadInProgressAnalysis, clearInProgressAnalysis } = useAnalysisPersistence();
  const [savedSessionData, setSavedSessionData] = useState<InProgressState | null>(null);
  
  const activeVersion: ProjectVersion | null = useMemo(() => {
    if (!activeProject) return null;
    return activeProject.history[activeVersionIndex] || activeProject.history[0];
  }, [activeProject, activeVersionIndex]);
  
  const displayedResult = result || activeVersion?.result || null;

  const { videoUrl, isVideoLoading, videoError, generateVideo, clearVideo } = useVideoGenerator(displayedResult?.product_name || null, addLog);
  const { drawings, requestDrawing, removeDrawing, setDrawings, clearAllDrawings } = useDrawingGenerator(displayedResult?.product_name || null, addLog);
  
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isDeVinciOpen, setIsDeVinciOpen] = useState(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const [isTechDocOpen, setIsTechDocOpen] = useState(false);

   // --- AUTH HANDLERS ---
  const handleLogin = (name: string, pass: string): User | null => {
    const user = users.find(u => u.name === name && u.password === pass);
    if (user) {
        const updatedUser = { ...user, lastActive: new Date().toISOString() };
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setAuthenticatedUser(updatedUser);
        addLog('INFO', `User logged in: ${user.name}`);
        return updatedUser;
    }
    return null;
  };
  
  const handleSignUp = (name: string, pass: string): User | null => {
    if (users.find(u => u.name === name)) {
        return null; // User already exists
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        password: pass,
        role: Role.Editor, // New users are Editors by default
        analysesRun: 0,
        lastActive: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    setAuthenticatedUser(newUser);
    addLog('INFO', `New user signed up: ${name}`);
    return newUser;
  };
  
  const handleLogout = () => {
    addLog('INFO', `User logged out: ${authenticatedUser?.name}`);
    setAuthenticatedUser(null);
     if (viewMode === 'admin') {
      setViewMode('app');
    }
  };
  
  const handleUpdateProfile = (updatedUser: User) => {
    setAuthenticatedUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addLog('INFO', `User profile updated: ${updatedUser.name}`);
  }
  
  // Sync drawings array in project version history whenever it changes
  useEffect(() => {
    if(activeVersion && drawings.length > 0) {
      const drawingsChanged = JSON.stringify(drawings) !== JSON.stringify(activeVersion.drawings || []);
      if (drawingsChanged) {
        updateVersion(activeVersion.versionId, { drawings });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, activeVersion, updateVersion]);

  // Load saved session on initial mount
  useEffect(() => {
    setSavedSessionData(loadInProgressAnalysis());
    addLog('INFO', `App initialized. Found ${projects.length} projects.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // --- Project Name Debounced Saving ---
  const debounceTimeoutRef = useRef<number | null>(null);
  const handleProjectNameChange = useCallback((newName: string) => {
      setProjectName(newName);
      if (!activeProject) return;

      if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
          updateProjectDetails(activeProject.id, { name: newName });
          addLog('INFO', `Project "${activeProject.name}" renamed to "${newName}".`);
      }, 500);
  }, [activeProject, updateProjectDetails, addLog]);

  useEffect(() => {
    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, []);


  // Effect to load data from the active project/version into the editor state
  useEffect(() => {
    if (activeProject) {
        setProjectName(activeProject.name);
        const versionToLoad = activeProject.history[activeVersionIndex] || activeProject.history[0];
        if (versionToLoad) {
            setPrompt(versionToLoad.prompt);
            const faction = ENGINEERING_PHILOSOPHIES.find(f => f.id === versionToLoad.factionId) || null;
            setSelectedFaction(faction);
            setFiles([]); // Clear staged files when loading a version
            setDrawings(versionToLoad.drawings || []); // Load drawings
            setResult(versionToLoad.result);
            clearVideo();
        }
    } else {
        // Reset editor if no project is active
        setProjectName('');
        setPrompt('');
        setSelectedFaction(ENGINEERING_PHILOSOPHIES[0]);
        setFiles([]);
        clearAllDrawings();
        clearAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject, activeVersionIndex]);

  const prepareToSaveVersion = (analysisResult: AnalysisResult, newPrompt: string, newFileUrls: string[]) => {
      setVersionDataToSave({ result: analysisResult, prompt: newPrompt, newFileUrls });
      setIsCommitModalOpen(true);
  };
  
  const handleSaveVersionWithCommit = (commitMessage: string) => {
    if (!versionDataToSave || !selectedFaction) return;

    const { result, prompt: newPrompt, newFileUrls } = versionDataToSave;

    const combinedUrls = [...(activeVersion?.fileUrls || []), ...newFileUrls].filter((v, i, a) => a.indexOf(v) === i);
    
    saveNewVersion({
      prompt: newPrompt,
      factionId: selectedFaction.id,
      result,
      fileUrls: combinedUrls,
      drawings: [], // Start with a fresh set of drawings for the new version
    }, commitMessage);
      
    setActiveVersionIndex(0);
    setFiles([]);
    setIsCommitModalOpen(false);
    setVersionDataToSave(null);
  };


  const handleStartAnalysis = async () => {
    if (!prompt || !selectedFaction || !activeProject || !authenticatedUser) {
      return;
    }

    const newFileUrls = await Promise.all(files.map(fileToDataUrl));
    addLog('INFO', `Starting analysis for project "${activeProject.name}" with faction "${selectedFaction.name}".`);
    
    const analysisResult = await generateAnalysis(prompt, selectedFaction, { 
      files, 
      fileUrls: activeVersion?.fileUrls 
    });
    
    if (analysisResult) {
      addLog('INFO', `Analysis for "${activeProject.name}" completed successfully.`);
       setUsers(prev => prev.map(u => u.id === authenticatedUser.id ? { ...u, analysesRun: u.analysesRun + 1 } : u));
      saveInProgressAnalysis({
        projectName: activeProject.name,
        prompt,
        factionId: selectedFaction.id,
        result: analysisResult,
      });
      prepareToSaveVersion(analysisResult, prompt, newFileUrls);
    }
  };
  
  const handleIncorporateSuggestions = async (suggestionTexts: string[]) => {
    if (!selectedFaction || !activeVersion || !activeProject || suggestionTexts.length === 0 || !authenticatedUser) return;

    const suggestionsFormatted = suggestionTexts.map(s => `- ${s}`).join('\n');
    const newPrompt = `${activeVersion.prompt}\n\n---\n[User Action] Incorporate the following AI suggestions into the design:\n${suggestionsFormatted}`;
    setPrompt(newPrompt); // Update UI for user to see
    
    addLog('INFO', `Incorporating ${suggestionTexts.length} suggestions into project "${activeProject.name}".`);
    
    const analysisResult = await generateAnalysis(newPrompt, selectedFaction, { 
      files: [], // No new files are being added in this flow
      fileUrls: activeVersion.fileUrls
    });
    
    if (analysisResult) {
      addLog('INFO', `Analysis with incorporated suggestions for "${activeProject.name}" completed successfully.`);
      setUsers(prev => prev.map(u => u.id === authenticatedUser.id ? { ...u, analysesRun: u.analysesRun + 1 } : u));
      saveInProgressAnalysis({
        projectName: activeProject.name,
        prompt: newPrompt,
        factionId: selectedFaction.id,
        result: analysisResult,
      });
      prepareToSaveVersion(analysisResult, newPrompt, []);
    }
  };

  // --- Project Modal Handlers ---
  const handleOpenNewProjectModal = () => {
    setProjectToEdit(null);
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
      addLog('INFO', `Project "${details.name}" details updated.`);
    } else {
      // Creating new project
      onNewProject(details);
      addLog('INFO', `New project "${details.name}" created.`);
    }
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
  };


  const handleClear = () => {
    clearAnalysis();
    clearVideo();
    clearAllDrawings();
    clearInProgressAnalysis();
  };

  const handleLoadVersion = (index: number) => {
    clearInProgressAnalysis();
    setActiveVersionIndex(index);
  };
  
  const handleRevertVersion = (index: number) => {
    clearInProgressAnalysis();
    revertToVersion(index);
    setActiveVersionIndex(0);
  };

  const handleSelectProject = (projectId: string) => {
    clearInProgressAnalysis();
    onSelectProject(projectId);
    setActiveVersionIndex(0); 
  };
  
  const handleDeleteProjectWithLog = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    addLog('WARN', `Project "${project?.name || projectId}" deleted.`);
    onDeleteProject(projectId);
  }

  const handleResumeSession = useCallback(() => {
    if (savedSessionData) {
        setProjectName(savedSessionData.projectName);
        setPrompt(savedSessionData.prompt);
        setSelectedFaction(ENGINEERING_PHILOSOPHIES.find(f => f.id === savedSessionData.factionId) || null);
        setResult(savedSessionData.result);
        setSavedSessionData(null); // Hide banner
        addLog('INFO', `Resumed previous session for project "${savedSessionData.projectName}".`);
    }
  }, [savedSessionData, setResult, addLog]);

  const handleDismissResume = useCallback(() => {
    clearInProgressAnalysis();
    setSavedSessionData(null); // Hide banner
  }, [clearInProgressAnalysis]);


  if (!authenticatedUser) {
    return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} />;
  }
  
  const isBusy = isLoading || isVideoLoading || drawings.some(d => d.isLoading);

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
      <main className="container mx-auto p-4 md:p-6">
        {viewMode === 'app' ? (
          <>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <ProjectManager 
                  projects={projects}
                  activeProject={activeProject}
                  activeVersionIndex={activeVersionIndex}
                  onSelectProject={handleSelectProject}
                  onNewProject={handleOpenNewProjectModal}
                  onEditProject={handleOpenEditProjectModal}
                  onDeleteProject={handleDeleteProjectWithLog}
                  onLoadVersion={handleLoadVersion}
                  onRevertVersion={handleRevertVersion}
                  disabled={isBusy}
                  authenticatedUser={authenticatedUser}
                />
                <FactionSelector
                  selectedFaction={selectedFaction}
                  onSelectFaction={setSelectedFaction}
                  disabled={isBusy}
                  authenticatedUser={authenticatedUser}
                />
                <PromptInput
                  projectName={projectName}
                  onProjectNameChange={handleProjectNameChange}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  files={files}
                  onFilesChange={setFiles}
                  onEngage={handleStartAnalysis}
                  isLoading={isLoading}
                  onClearFiles={() => setFiles([])}
                  isReady={!!(prompt && selectedFaction && projectName)}
                  authenticatedUser={authenticatedUser}
                />
              </div>
              <div className="lg:col-span-2">
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
                  onRequestDrawing={requestDrawing}
                  onRemoveDrawing={removeDrawing}
                  onIncorporateSuggestions={handleIncorporateSuggestions}
                  onLaunchDeVinci={() => setIsDeVinciOpen(true)}
                  activeProject={activeProject}
                  authenticatedUser={authenticatedUser}
                />
              </div>
            </div>
          </>
        ) : (
          <AdminDashboard 
            authenticatedUser={authenticatedUser}
            users={users}
            projects={projects}
            logs={logs}
            onUpdateUser={(updatedUser) => {
              setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
              addLog('INFO', `User "${updatedUser.name}" role changed to ${updatedUser.role}.`);
            }}
            onDeleteUser={(userId) => {
               const userToDelete = users.find(u => u.id === userId);
               if (userToDelete) {
                  addLog('WARN', `User "${userToDelete.name}" deleted.`);
                  setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
                  if (authenticatedUser.id === userId) {
                    handleLogout();
                  }
               }
            }}
            onOpenTechDoc={() => setIsTechDocOpen(true)}
          />
        )}
      </main>
      <Tour
        isOpen={isTourOpen}
        steps={TOUR_STEPS}
        stepIndex={tourStep}
        onClose={() => setIsTourOpen(false)}
        onNext={() => setTourStep(s => Math.min(s + 1, TOUR_STEPS.length - 1))}
        onPrev={() => setTourStep(s => Math.max(s - 1, 0))}
      />
      <DeVinciModal 
        isOpen={isDeVinciOpen}
        onClose={() => setIsDeVinciOpen(false)}
        projectVersion={activeVersion}
        projectName={activeProject?.name || null}
        faction={selectedFaction}
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
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        project={projectToEdit}
      />
      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => {
            setIsCommitModalOpen(false);
            setVersionDataToSave(null);
        }}
        onCommit={handleSaveVersionWithCommit}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={authenticatedUser}
        onSave={handleUpdateProfile}
      />
    </div>
  );
}

export default App;

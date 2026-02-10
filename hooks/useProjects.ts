
import { useState, useCallback } from 'react';
import { Project, ProjectVersion, FactionId, ProjectIndexEntry, AnalysisResult, IngestedDocument } from '../types';

const getProjectKeywords = (projectHistory: ProjectVersion[]): string => {
    const keywords: (string | undefined)[] = [];
    projectHistory.forEach(version => {
        const result = version.result;
        if (!result) return;
        keywords.push(
            result.product_name,
            result.executive_summary,
            ...(result.material_suggestions || []).flatMap(m => [m.name, m.rationale]),
            ...(result.manufacturing_analysis || []).flatMap(m => [m.name, m.description]),
            ...(result.suggested_systems || []).flatMap(s => [s.name, s.description, s.rationale]),
        );
    });
    return keywords.filter(Boolean).join(' ').toLowerCase();
};

const createNewProject = (details: {name: string; description: string; tags: string[]}, initialVersionData?: { prompt?: string; factionId?: FactionId; result?: AnalysisResult | null; fileUrls?: string[] }): Project => {
    const timestamp = new Date().toISOString();
    const initialVersion: ProjectVersion = {
        versionId: `ver-${Date.now()}`,
        createdAt: timestamp,
        commitMessage: initialVersionData?.result ? 'Initial analysis' : 'Initial Commit',
        prompt: initialVersionData?.prompt || '',
        factionId: initialVersionData?.factionId || FactionId.PRAGMATIC_PRODUCTION,
        result: initialVersionData?.result || null,
        fileUrls: initialVersionData?.fileUrls || [],
        drawings: [],
        inspirationalImages: [],
        incorporatedSuggestions: [],
    };
    return {
        id: `proj-${Date.now()}`,
        name: details.name,
        description: details.description,
        tags: details.tags,
        createdAt: timestamp,
        updatedAt: timestamp,
        history: [initialVersion],
        inspirationalImageHistory: [],
        knowledgeBase: [],
    };
};

export const useProjects = () => {
    // Index for the sidebar/list
    const [projectsIndex, setProjectsIndex] = useState<ProjectIndexEntry[]>([]);
    // Full project data storage (simulated DB)
    const [fullProjectStore, setFullProjectStore] = useState<Map<string, Project>>(new Map());
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    const updateProjectInStores = useCallback((project: Project) => {
        setFullProjectStore(prev => new Map(prev).set(project.id, project));
        
        const { history, inspirationalImageHistory, knowledgeBase, ...indexEntry } = project;
        const searchKeywords = getProjectKeywords(history);
        const newIndexEntry: ProjectIndexEntry = { ...indexEntry, searchKeywords };

        setProjectsIndex(prev => {
            const exists = prev.some(p => p.id === project.id);
            if (exists) {
                return prev.map(p => p.id === project.id ? newIndexEntry : p);
            }
            return [newIndexEntry, ...prev];
        });

        // Always update active project if it matches
        setActiveProject(prev => prev?.id === project.id ? project : prev);
    }, []);

    const onNewProject = (details: {name: string; description: string; tags: string[]}, initialVersionData?: { prompt?: string; factionId?: FactionId; result?: AnalysisResult | null; fileUrls?: string[] }): string => {
        const newProject = createNewProject(details, initialVersionData);
        updateProjectInStores(newProject);
        setActiveProject(newProject);
        return newProject.id;
    };
    
    const loadProject = useCallback((project: Project) => {
        updateProjectInStores(project);
        setActiveProject(project);
    }, [updateProjectInStores]);

    const onDeleteProject = (projectId: string) => {
        setFullProjectStore(prev => {
            const next = new Map(prev);
            next.delete(projectId);
            return next;
        });
        setProjectsIndex(prev => prev.filter(p => p.id !== projectId));

        if (activeProject?.id === projectId) {
            setActiveProject(null);
        }
    };
    
    const onSelectProject = (projectId: string) => {
        const fullProject = fullProjectStore.get(projectId);
        if (fullProject) {
            setActiveProject(fullProject);
        }
    };

    const saveNewVersion = useCallback((versionData: Omit<ProjectVersion, 'versionId' | 'createdAt' | 'commitMessage'>, commitMessage: string) => {
        if (!activeProject) return;

        const timestamp = new Date().toISOString();
        const newVersion: ProjectVersion = {
            ...versionData,
            commitMessage,
            versionId: `ver-${Date.now()}`,
            createdAt: timestamp,
        };

        const updatedProject: Project = {
            ...activeProject,
            updatedAt: timestamp,
            history: [newVersion, ...activeProject.history],
        };
        updateProjectInStores(updatedProject);
    }, [activeProject, updateProjectInStores]);
    
    const updateVersion = useCallback((versionId: string, updates: Partial<ProjectVersion>) => {
        if (!activeProject) return;

        const newHistory = activeProject.history.map(v => 
            v.versionId === versionId ? { ...v, ...updates } : v
        );
        const updatedProject = { ...activeProject, history: newHistory };
        updateProjectInStores(updatedProject);
    }, [activeProject, updateProjectInStores]);

    const revertToVersion = useCallback((versionIndex: number) => {
        if (!activeProject || !activeProject.history[versionIndex]) return;
        
        const oldVersion = activeProject.history[versionIndex];
        const timestamp = new Date().toISOString();
        
        const newVersion: ProjectVersion = {
            ...oldVersion,
            versionId: `ver-${Date.now()}`,
            createdAt: timestamp,
            commitMessage: `Reverted to: "${oldVersion.commitMessage}"`,
        };

        const updatedProject: Project = {
            ...activeProject,
            updatedAt: timestamp,
            history: [newVersion, ...activeProject.history],
        };
        updateProjectInStores(updatedProject);
    }, [activeProject, updateProjectInStores]);

    const updateProjectDetails = useCallback((projectId: string, details: Partial<{ name: string; description: string; tags: string[] }>) => {
         const project = fullProjectStore.get(projectId);
         if (!project) return;

         const updatedProject = {
             ...project,
             ...details,
             updatedAt: new Date().toISOString()
         };
         updateProjectInStores(updatedProject);
    }, [fullProjectStore, updateProjectInStores]);

    // Added missing function to handle knowledge base ingestion
    const addIngestedDocument = useCallback((doc: IngestedDocument) => {
        if (!activeProject) return;
        const updatedProject: Project = {
            ...activeProject,
            knowledgeBase: [...(activeProject.knowledgeBase || []), doc],
            updatedAt: new Date().toISOString()
        };
        updateProjectInStores(updatedProject);
    }, [activeProject, updateProjectInStores]);

    // Added missing function to remove items from knowledge base
    const removeIngestedDocument = useCallback((docId: string) => {
        if (!activeProject) return;
        const updatedProject: Project = {
            ...activeProject,
            knowledgeBase: (activeProject.knowledgeBase || []).filter(d => d.id !== docId),
            updatedAt: new Date().toISOString()
        };
        updateProjectInStores(updatedProject);
    }, [activeProject, updateProjectInStores]);

    return {
        projects: projectsIndex,
        activeProject,
        onNewProject,
        onDeleteProject,
        onSelectProject,
        saveNewVersion,
        revertToVersion,
        updateProjectDetails,
        updateVersion,
        loadProject,
        addIngestedDocument,
        removeIngestedDocument,
    };
};

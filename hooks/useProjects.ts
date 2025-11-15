import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectVersion, FactionId, ProjectIndexEntry, GeneratedImage } from '../types';

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
            ...(result.complianceAndSafety?.safety_risks || []).flatMap(r => [r.risk, r.mitigation]),
            ...(result.billOfMaterials || []).flatMap(b => [b.name, b.material, b.description]),
        );
    });
    return keywords.filter(Boolean).join(' ').toLowerCase();
};


const createNewProject = (details: {name: string; description: string; tags: string[]}, initialVersionData?: { prompt?: string; factionId?: FactionId }): Project => {
    const timestamp = new Date().toISOString();
    const initialVersion: ProjectVersion = {
        versionId: `ver-${Date.now()}`,
        createdAt: timestamp,
        commitMessage: 'Initial Commit',
        prompt: initialVersionData?.prompt || '',
        factionId: initialVersionData?.factionId || FactionId.PRAGMATIC_PRODUCTION,
        result: null,
        fileUrls: [],
        drawings: [],
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
    };
};

export const useProjects = () => {
    const [projects, setProjects] = useState<ProjectIndexEntry[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    const onNewProject = (details: {name: string; description: string; tags: string[]}, initialVersionData?: { prompt?: string; factionId?: FactionId }): string => {
        const newProject = createNewProject(details, initialVersionData);
        
        const { history, ...indexEntry } = newProject;
        const newIndexEntry: ProjectIndexEntry = { ...indexEntry, searchKeywords: '' };

        setProjects(prev => [newIndexEntry, ...prev]);
        setActiveProject(newProject);
        return newProject.id;
    };
    
    const loadProject = useCallback((project: Project) => {
        setActiveProject(project);
        
        const { history, ...indexEntry } = project;
        const searchKeywords = getProjectKeywords(history);
        const newIndexEntry: ProjectIndexEntry = { ...indexEntry, searchKeywords };

        setProjects(prev => {
            // Avoid duplicates if the same file is opened multiple times
            if (prev.some(p => p.id === newIndexEntry.id)) {
                return prev.map(p => p.id === newIndexEntry.id ? newIndexEntry : p);
            }
            return [newIndexEntry, ...prev];
        });
    }, []);

    const onDeleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));

        if (activeProject?.id === projectId) {
            if (projects.length > 1) {
                 // Find the project that is NOT the one being deleted to select next
                const nextProjectIndex = projects.findIndex(p => p.id !== projectId);
                const nextProject = projects[nextProjectIndex];
                setActiveProject(nextProject ? { ...nextProject, history: [] } : null); // Load stub for now, full load is handled by onSelectProject
            } else {
                setActiveProject(null);
            }
        }
    };
    
    const onSelectProject = (projectId: string) => {
        // Since we are not storing full projects in a list, we can assume the activeProject holds the full data.
        // Selecting from the list is more about switching the view context if multiple projects were loaded.
        // For this local-first model, we assume only the activeProject is fully in memory.
        // A more complex implementation might keep all loaded projects in memory.
        if (activeProject?.id !== projectId) {
             // This case is tricky in a pure local-first model without keeping all opened projects in memory.
             // For now, we assume the user will re-open the file to switch contexts if needed.
             // This function will effectively just change the highlighted item in the UI.
             const projectIndex = projects.find(p => p.id === projectId);
             if (projectIndex) {
                 // To prevent errors, we create a temporary active project.
                 // The user needs to re-open the file for full history.
                 setActiveProject({ ...projectIndex, history: [] });
                 console.warn("To view the full history of another project, please open its file.");
             }
        }
    };
    
    const updateProjectAndIndex = useCallback((updatedProject: Project) => {
        setActiveProject(updatedProject);

        const { history, ...indexData } = updatedProject;
        const searchKeywords = getProjectKeywords(history);
        const newIndexEntry: ProjectIndexEntry = { ...indexData, searchKeywords };

        setProjects(prev => {
            const updatedIndex = prev.map(p => p.id === updatedProject.id ? newIndexEntry : p)
            // Move updated project to the top of the list
            const projectIndex = updatedIndex.findIndex(p => p.id === updatedProject.id);
            if (projectIndex > 0) {
                const [item] = updatedIndex.splice(projectIndex, 1);
                updatedIndex.unshift(item);
            }
            return updatedIndex;
        });
    }, []);
    

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
        updateProjectAndIndex(updatedProject);

    }, [activeProject, updateProjectAndIndex]);
    
    const updateVersion = useCallback((versionId: string, updates: Partial<ProjectVersion>) => {
        if (!activeProject) return;

        const newHistory = activeProject.history.map(v => 
            v.versionId === versionId ? { ...v, ...updates } : v
        );
        const updatedProject = { ...activeProject, history: newHistory };
        // This is a background update, so we just update the active project state
        setActiveProject(updatedProject);

    }, [activeProject]);

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
        updateProjectAndIndex(updatedProject);

    }, [activeProject, updateProjectAndIndex]);

    const updateProjectDetails = useCallback((projectId: string, details: Partial<{ name: string; description: string; tags: string[] }>) => {
         if (!activeProject || activeProject.id !== projectId) return;

         const updatedProject = {
             ...activeProject,
             ...details,
             updatedAt: new Date().toISOString()
         };
         updateProjectAndIndex(updatedProject);

    }, [activeProject, updateProjectAndIndex]);

    const addImageToHistory = useCallback((image: GeneratedImage) => {
        if (!activeProject) return;
        
        const history = activeProject.inspirationalImageHistory || [];
        // Avoid duplicates
        if (history.some(h => h.id === image.id)) return;
        
        const updatedProject = {
            ...activeProject,
            inspirationalImageHistory: [image, ...history] // Add to the top
        };
        updateProjectAndIndex(updatedProject);
    }, [activeProject, updateProjectAndIndex]);
    
    const deleteImageFromHistory = useCallback((imageId: string) => {
        if (!activeProject) return;
        
        const history = activeProject.inspirationalImageHistory || [];
        const updatedHistory = history.filter(h => h.id !== imageId);
        
        const updatedProject = {
            ...activeProject,
            inspirationalImageHistory: updatedHistory
        };
        updateProjectAndIndex(updatedProject);
    }, [activeProject, updateProjectAndIndex]);


    return {
        projects,
        activeProject,
        onNewProject,
        onDeleteProject,
        onSelectProject,
        saveNewVersion,
        revertToVersion,
        updateProjectDetails,
        updateVersion,
        loadProject,
        addImageToHistory,
        deleteImageFromHistory,
    };
};
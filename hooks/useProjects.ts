
import { useState, useEffect, useCallback } from 'react';
// Fix: Import FactionId to resolve type error.
import { Project, ProjectVersion, AnalysisResult, FactionId } from '../types';

// Use new keys to prevent conflicts with old, oversized data structure.
const INDEX_KEY = 'synapseforge-project-index-v4';
const PROJECT_KEY_PREFIX = 'synapseforge-project-v4-';

// Type for the flattened project metadata stored in the index
type ProjectIndexEntry = Omit<Project, 'history'> & { searchKeywords: string };

/**
 * Generates a concatenated string of all searchable keywords from a project's history.
 * @param projectHistory - The array of project versions.
 * @returns A single lowercase string of keywords.
 */
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
            ...(result.riskAssessment?.risks || []).flatMap(r => [r.risk, r.mitigation]),
            ...(result.drawingSpecification?.bill_of_materials || []).flatMap(b => [b.name, b.material, b.description]),
        );
    });
    return keywords.filter(Boolean).join(' ').toLowerCase();
};


const createNewProject = (details: {name: string; description: string; tags: string[]}): Project => {
    const timestamp = new Date().toISOString();
    const initialVersion: ProjectVersion = {
        versionId: `ver-${Date.now()}`,
        createdAt: timestamp,
        commitMessage: 'Initial Commit',
        prompt: '',
        // Fix: Use FactionId enum member instead of a string literal to match the defined type.
        factionId: FactionId.PRAGMATIC_PRODUCTION,
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
    };
};

export const useProjects = () => {
    const [projects, setProjects] = useState<ProjectIndexEntry[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    const saveIndexToStorage = useCallback((updatedIndex: ProjectIndexEntry[]) => {
        try {
            localStorage.setItem(INDEX_KEY, JSON.stringify(updatedIndex));
        } catch (error) {
            console.error("Failed to save project index to localStorage:", error);
        }
    }, []);
    
    const saveFullProjectToStorage = useCallback((project: Project) => {
        try {
            localStorage.setItem(`${PROJECT_KEY_PREFIX}${project.id}`, JSON.stringify(project));
        } catch (error) {
            console.error(`Failed to save project ${project.id} to localStorage:`, error);
        }
    }, []);

    const loadFullProject = useCallback((projectId: string): Project | null => {
        try {
            const storedProject = localStorage.getItem(`${PROJECT_KEY_PREFIX}${projectId}`);
            if (storedProject) {
                return JSON.parse(storedProject);
            }
        } catch (error) {
            console.error(`Failed to load project ${projectId} from localStorage:`, error);
        }
        return null;
    }, []);

    useEffect(() => {
        let initialIndex: ProjectIndexEntry[] = [];
        try {
            const storedIndex = localStorage.getItem(INDEX_KEY);
            if (storedIndex) {
                initialIndex = JSON.parse(storedIndex);
            }
        } catch (error) {
            console.error("Failed to load project index from localStorage:", error);
        }

        if (initialIndex.length === 0) {
            const initialProject = createNewProject({ name: 'My First Project', description: 'An example project to get you started.', tags: ["example"] });
            const { history, ...indexEntry } = initialProject;
            const keywords = getProjectKeywords(history);
            const newIndexEntry = { ...indexEntry, searchKeywords: keywords };
            
            initialIndex = [newIndexEntry];
            setProjects(initialIndex);
            saveIndexToStorage(initialIndex);
            saveFullProjectToStorage(initialProject);
            setActiveProject(initialProject);
        } else {
            setProjects(initialIndex);
            const firstProject = loadFullProject(initialIndex[0].id);
            setActiveProject(firstProject);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const onNewProject = (details: {name: string; description: string; tags: string[]}) => {
        const newProject = createNewProject(details);
        saveFullProjectToStorage(newProject);
        
        const { history, ...indexEntry } = newProject;
        const newIndexEntry: ProjectIndexEntry = { ...indexEntry, searchKeywords: '' };

        const updatedIndex = [newIndexEntry, ...projects];
        setProjects(updatedIndex);
        saveIndexToStorage(updatedIndex);
        setActiveProject(newProject);
    };

    const onDeleteProject = (projectId: string) => {
        const updatedIndex = projects.filter(p => p.id !== projectId);
        setProjects(updatedIndex);
        saveIndexToStorage(updatedIndex);
        try {
            localStorage.removeItem(`${PROJECT_KEY_PREFIX}${projectId}`);
        } catch (error) {
             console.error(`Failed to remove project ${projectId} from localStorage:`, error);
        }

        if (activeProject?.id === projectId) {
            if (updatedIndex.length > 0) {
                setActiveProject(loadFullProject(updatedIndex[0].id));
            } else {
                onNewProject({name: 'My First Project', description: '', tags: []});
            }
        }
    };
    
    const onSelectProject = (projectId: string) => {
        const fullProject = loadFullProject(projectId);
        if (fullProject) {
            setActiveProject(fullProject);
        } else {
            // Handle case where full project data is missing
            console.warn(`Could not load full project data for ${projectId}. Removing from index.`);
            const updatedIndex = projects.filter(p => p.id !== projectId);
            setProjects(updatedIndex);
            saveIndexToStorage(updatedIndex);
            if (updatedIndex.length > 0) {
                setActiveProject(loadFullProject(updatedIndex[0].id));
            } else {
                setActiveProject(null);
            }
        }
    };
    
    const updateProjectAndIndex = useCallback((updatedProject: Project) => {
        setActiveProject(updatedProject);
        saveFullProjectToStorage(updatedProject);

        const { history, ...indexData } = updatedProject;
        const searchKeywords = getProjectKeywords(history);
        const newIndexEntry: ProjectIndexEntry = { ...indexData, searchKeywords };

        const updatedIndex = projects.map(p => p.id === updatedProject.id ? newIndexEntry : p);
        
        // Move updated project to the top of the list
        const projectIndex = updatedIndex.findIndex(p => p.id === updatedProject.id);
        if (projectIndex > 0) {
            const [item] = updatedIndex.splice(projectIndex, 1);
            updatedIndex.unshift(item);
        }

        setProjects(updatedIndex);
        saveIndexToStorage(updatedIndex);
    }, [projects, saveFullProjectToStorage, saveIndexToStorage]);
    

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
        // Note: This doesn't update search keywords or 'updatedAt' as it's a minor background update
        setActiveProject(updatedProject);
        saveFullProjectToStorage(updatedProject);

    }, [activeProject, saveFullProjectToStorage]);

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
    };
};

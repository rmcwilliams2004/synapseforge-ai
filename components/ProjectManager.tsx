import React, { useState, useMemo, useRef } from 'react';
import { Project, User, Role, ProjectIndexEntry } from '../types';
import { Modal } from './Modal';

interface ProjectManagerProps {
    projects: ProjectIndexEntry[];
    activeProject: Project | null;
    activeVersionIndex: number;
    onSelectProject: (projectId: string) => void;
    onNewProject: () => void;
    onOpenFile: (file: File) => void;
    onSaveProject: () => void;
    hasUnsavedChanges: boolean;
    onCommitVersion: () => void;
    onStartWithDeVinci: () => void;
    onStartFromImage: (file: File) => void;
    isParsingImage: boolean;
    onStartFromPdf: (file: File) => void;
    isParsingPdf: boolean;
    onStartBrainstormFromPdf: (file: File) => void;
    isParsingForBrainstorm: boolean;
    onIdentifyImage: (file: File) => void;
    isIdentifyingImage: boolean;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onLoadVersion: (index: number) => void;
    onRevertVersion: (index: number) => void;
    onCompareVersions: (project: Project, newVersionIndex: number) => void;
    disabled: boolean;
    authenticatedUser: User;
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
};

const Icons = {
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>,
    Revert: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
    Edit: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>,
    Commit: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
};


export const ProjectManager = ({ projects, activeProject, activeVersionIndex, onSelectProject, onNewProject, onOpenFile, onSaveProject, hasUnsavedChanges, onCommitVersion, onStartWithDeVinci, onStartFromImage, isParsingImage, onStartFromPdf, isParsingPdf, onStartBrainstormFromPdf, isParsingForBrainstorm, onIdentifyImage, isIdentifyingImage, onEditProject, onDeleteProject, onLoadVersion, onRevertVersion, onCompareVersions, disabled, authenticatedUser }: ProjectManagerProps) => {
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<'last-updated' | 'name-asc' | 'name-desc' | 'date-created-desc' | 'date-created-asc'>('last-updated');
    const openFileInputRef = useRef<HTMLInputElement>(null);
    const createImageInputRef = useRef<HTMLInputElement>(null);
    const createPdfInputRef = useRef<HTMLInputElement>(null);
    const brainstormPdfInputRef = useRef<HTMLInputElement>(null);
    const identifyImageInputRef = useRef<HTMLInputElement>(null);
    
    const handleOpenFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { onOpenFile(file); }
        if (e.target) { e.target.value = ''; }
    };

    const handleCreateImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { onStartFromImage(file); }
        if (e.target) { e.target.value = ''; }
    };

    const handleCreateFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { onStartFromPdf(file); }
        if (e.target) { e.target.value = ''; }
    };

    const handleBrainstormFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { onStartBrainstormFromPdf(file); }
        if (e.target) { e.target.value = ''; }
    };

    const handleIdentifyImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { onIdentifyImage(file); }
        if (e.target) { e.target.value = ''; }
    };

    const processedProjects = useMemo(() => {
        // 1. Filtering
        const filtered = searchTerm
            ? projects.filter(project => {
                const lowercasedFilter = searchTerm.toLowerCase();
                // Expanded search corpus to include all relevant fields
                const searchCorpus = [
                    project.name,
                    project.description,
                    ...(project.tags || []),
                    project.searchKeywords || ''
                ].join(' ').toLowerCase();
                
                return searchCorpus.includes(lowercasedFilter);
            })
            : projects;

        // 2. Sorting
        return [...filtered].sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'date-created-desc':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'date-created-asc':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'last-updated':
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });
    }, [projects, searchTerm, sortOption]);

    const handleDeleteClick = (e: React.MouseEvent, project: ProjectIndexEntry) => {
        e.stopPropagation();
        const projectForModal = activeProject?.id === project.id ? activeProject : { ...project, history: [] };
        setProjectToDelete(projectForModal);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
        }
    };

    const isViewer = authenticatedUser.role === Role.Viewer;

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-brand-light">Project Management</h2>
                </div>
                {!isViewer && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="file" ref={openFileInputRef} onChange={handleOpenFileSelected} accept=".sfp.json" className="hidden" disabled={disabled} />
                        <button onClick={() => openFileInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-1.5a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75Z" /></svg>
                          Open Project...
                        </button>
                         <button onClick={onNewProject} disabled={disabled} className="py-2 px-3 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                            + New Project
                        </button>
                    </div>
                 )}
                 {activeProject && !isViewer && (
                    <button onClick={onSaveProject} disabled={disabled} className={`w-full py-2 px-3 text-white font-bold rounded-lg border transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mb-3 ${hasUnsavedChanges ? 'bg-cyan-600 border-cyan-500 hover:bg-cyan-500 animate-pulse' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Save & Export Project
                        {hasUnsavedChanges && <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>}
                    </button>
                 )}
                <h3 className="text-lg font-semibold text-brand-light mb-2">Session Projects</h3>
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-grow">
                        <Icons.Search />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan"
                        />
                    </div>
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="bg-gray-800 border-2 border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-brand-cyan focus:border-brand-cyan"
                        aria-label="Sort projects by"
                    >
                        <option value="last-updated">Sort: Updated</option>
                        <option value="name-asc">Sort: Name (A-Z)</option>
                        <option value="name-desc">Sort: Name (Z-A)</option>
                        <option value="date-created-desc">Sort: Created (Newest)</option>
                        <option value="date-created-asc">Sort: Created (Oldest)</option>
                    </select>
                </div>
                <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-2">
                    {processedProjects.length === 0 ? (
                        <p className="text-gray-500 text-center p-4">{searchTerm ? 'No projects match your search.' : 'No projects opened in this session. Create or open a project file.'}</p>
                    ) : (
                        <ul className="space-y-1">
                            {processedProjects.map((project, index) => (
                                <li
                                    key={project.id}
                                    onClick={() => !disabled && onSelectProject(project.id)}
                                    className={`p-2 rounded-md transition-all duration-200 animate-stagger-in ${activeProject?.id === project.id ? 'bg-brand-cyan/20' : 'hover:bg-gray-700/50'}`}
                                    style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                                    title={project.description}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 truncate">
                                            <p className={`font-semibold truncate ${activeProject?.id === project.id ? 'text-brand-cyan' : 'text-brand-light'}`}>{project.name || 'Untitled'}</p>
                                             <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                {(project.tags || []).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-purple-600/50 text-purple-200">{tag}</span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Updated: {formatDate(project.updatedAt)}</p>
                                        </div>
                                        {authenticatedUser.role === Role.Admin && (
                                            <button onClick={(e) => handleDeleteClick(e, project)} disabled={disabled} className="p-2 text-gray-500 hover:text-red-400 transition-transform active:scale-95 rounded-full disabled:opacity-50 flex-shrink-0" title="Delete Project"><Icons.Trash /></button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {activeProject && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-brand-light">Version History</h3>
                         <div className="flex items-center gap-2">
                             {!isViewer && (
                                <button
                                    onClick={onCommitVersion}
                                    disabled={!hasUnsavedChanges || disabled}
                                    className="py-1 px-3 text-xs bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 flex items-center gap-1"
                                    title={hasUnsavedChanges ? "Save the current state as a new version" : "No changes to save"}
                                >
                                    <Icons.Commit />
                                    Save Version
                                </button>
                             )}
                            <button onClick={() => onEditProject(activeProject)} disabled={disabled || isViewer} className="py-1 px-3 text-xs bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-transform active:scale-95" title="Edit project details"><Icons.Edit /> Edit Details</button>
                         </div>
                    </div>
                    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-2">
                        <ul className="space-y-1">
                            {activeProject.history.map((version, index) => (
                                <li
                                    key={version.versionId}
                                    className={`p-2 rounded-md animate-stagger-in transition-colors duration-200 ${index === activeVersionIndex ? 'bg-cyan-900/40' : ''}`}
                                    style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-semibold text-sm ${index === activeVersionIndex ? 'text-brand-cyan' : 'text-brand-light'}`}>{version.commitMessage}</p>
                                            <p className="text-xs text-gray-400">Saved: {formatDate(version.createdAt)}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {index < activeProject.history.length - 1 && !isViewer && (
                                                <button
                                                    onClick={() => onCompareVersions(activeProject, index)}
                                                    disabled={disabled}
                                                    className="py-1 px-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 flex items-center gap-1 transition-transform active:scale-95"
                                                    title={`Compare with previous version: "${activeProject.history[index+1].commitMessage}"`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                                                    Compare
                                                </button>
                                            )}
                                            <button onClick={() => onLoadVersion(index)} disabled={disabled || index === activeVersionIndex} className="py-1 px-2 text-xs bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 transition-transform active:scale-95">View</button>
                                            {!isViewer && <button onClick={() => onRevertVersion(index)} disabled={disabled} className="py-1 px-2 text-xs bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1 transition-transform active:scale-95" title="Revert to this version"><Icons.Revert />Revert</button>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                 <h3 className="text-lg font-semibold text-brand-light mb-2">Alternative Workflows</h3>
                  {!isViewer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                        <button onClick={onStartWithDeVinci} disabled={disabled} className="py-2 px-3 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center" title="Start a new project via a conversation with the DeVinci AI">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375-3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" /></svg>
                            Start with DeVinci
                        </button>
                         <input type="file" ref={createImageInputRef} onChange={handleCreateImageSelected} accept="image/*" className="hidden" disabled={disabled} />
                        <button onClick={() => createImageInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center" title="Reverse engineer a product from an image">
                           {isParsingImage ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>}
                           {isParsingImage ? 'Analyzing...' : 'Reverse Engineer'}
                        </button>
                         <input type="file" ref={createPdfInputRef} onChange={handleCreateFileSelected} accept="application/pdf" className="hidden" disabled={disabled} />
                        <button onClick={() => createPdfInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center" title="Create a new project by extracting data from a PDF spec sheet">
                           {isParsingPdf ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12.75h4.875c.621 0 1.125-.504 1.125-1.125V11.25a2.25 2.25 0 0 0-2.25-2.25H6.375a2.25 2.25 0 0 0-2.25 2.25v6.75c0 .621.504 1.125 1.125 1.125H6.375m1.5-12.75-1.5-1.5m0 0A2.25 2.25 0 0 1 6.375 3h.625c.621 0 1.125.504 1.125 1.125v1.5m-1.5-1.5Z" /></svg>}
                           {isParsingPdf ? 'Parsing...' : 'Create from PDF'}
                        </button>
                         <input type="file" ref={brainstormPdfInputRef} onChange={handleBrainstormFileSelected} accept="application/pdf" className="hidden" disabled={disabled} />
                        <button onClick={() => brainstormPdfInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center" title="Start a brainstorming session by uploading a previous report">
                           {isParsingForBrainstorm ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.482L7 21h4m4 0-3.273-5.482M12 20.25V21" /></svg>}
                           {isParsingForBrainstorm ? 'Parsing...' : 'Brainstorm from PDF'}
                        </button>
                        <input type="file" ref={identifyImageInputRef} onChange={handleIdentifyImageSelected} accept="image/*" className="hidden" disabled={disabled} />
                        <button onClick={() => identifyImageInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-teal-600 text-white font-semibold rounded-lg border border-teal-500 hover:bg-teal-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center col-span-full" title="Upload an image to have the AI identify it and search the web for information">
                           {isIdentifyingImage ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>}
                           {isIdentifyingImage ? 'Researching...' : 'Identify & Research Image'}
                        </button>
                    </div>
                 )}
            </div>

            <Modal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={confirmDelete} title="Confirm Deletion" confirmText="Delete">
                Are you sure you want to permanently delete the project "<strong>{projectToDelete?.name}</strong>"? This action is only for the current session. The project file will remain on your computer.
            </Modal>
        </div>
    );
};
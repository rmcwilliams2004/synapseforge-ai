import React, { useState, useMemo, useRef } from 'react';
import { Project, User, Role, ProjectIndexEntry, IngestedDocument } from '../types';
import { Modal } from './Modal';
import { ingestDocument } from '../services/knowledgeService';

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
    onOpenVideoImport: () => void;
    isParsingVideo: boolean;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onLoadVersion: (index: number) => void;
    onRevertVersion: (index: number) => void;
    onCompareVersions: (project: Project, newVersionIndex: number) => void;
    disabled: boolean;
    authenticatedUser: User;
    // Google Drive Props
    onSaveToDrive?: () => void;
    onOpenFromDrive?: () => void;
    isSavingToDrive?: boolean;
    isDriveAuthenticated?: boolean;
    // Knowledge Base Props
    onAddDocument?: (doc: IngestedDocument) => void;
    onRemoveDocument?: (id: string) => void;
    addLog: (level: 'INFO' | 'WARN' | 'ERROR', message: string) => void;
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
    SaveFile: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>,
    Drive: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12.01 1.485c2.082 0 3.754.025 4.568.06C18.722 1.636 20.343 2.138 21.556 3.351c1.213 1.213 1.715 2.834 1.806 4.976.035.814.06 2.486.06 4.568 0 2.057-.025 3.696-.058 4.502-.09 2.14-.592 3.759-1.803 4.97-1.211 1.211-2.829 1.713-4.964 1.803-.807.034-2.448.06-4.508.06s-3.77-.025-4.587-.06c-2.133-.09-3.751-.592-4.963-1.803-1.21-1.211-1.712-2.83-1.802-4.965C.705 15.337.68 13.637.68 11.493c0-2.082.025-3.754.06-4.568C.832 4.783 1.333 3.162 2.546 1.95 3.759.737 5.38.235 7.522.143 8.336.108 10.008.083 12.01.083v1.402zm-1.95 16.09h8.736l-2.812-4.888h-5.88l-2.865 4.888H10.06zm-2.288-1.613l2.848-4.905L7.85 6.3H2.19l5.582 9.662zM9.518 9.23h6.428L13.12 4.3H9.518v4.93zM14.95 11.15h5.896l-2.864-4.888H12.1l2.85 4.888z" /></svg>,
    Brain: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6 6 0 1 0-6 6 6 6 0 0 0 6-6Zm0 0a6 6 0 1 1 6 6 6 6 0 0 1-6-6ZM11.25 15.75h.008v.008h-.008v-.008Zm0-3h.008v.008h-.008v-.008ZM12 11.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /></svg>
};


export const ProjectManager = ({ 
    projects, activeProject, activeVersionIndex, onSelectProject, onNewProject, onOpenFile, onSaveProject, 
    hasUnsavedChanges, onCommitVersion, onStartWithDeVinci, onStartFromImage, isParsingImage, onStartFromPdf, isParsingPdf, 
    onStartBrainstormFromPdf, isParsingForBrainstorm, onIdentifyImage, isIdentifyingImage, onOpenVideoImport, isParsingVideo, 
    onEditProject, onDeleteProject, onLoadVersion, onRevertVersion, onCompareVersions, disabled, authenticatedUser,
    onSaveToDrive, onOpenFromDrive, isSavingToDrive, isDriveAuthenticated,
    onAddDocument, onRemoveDocument, addLog
}: ProjectManagerProps) => {
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<'last-updated' | 'name-asc' | 'name-desc' | 'date-created-desc' | 'date-created-asc'>('last-updated');
    const [isKnowledgeLibraryOpen, setIsKnowledgeLibraryOpen] = useState(false);
    const [ingestingCount, setIngestingCount] = useState(0);

    const openFileInputRef = useRef<HTMLInputElement>(null);
    const createImageInputRef = useRef<HTMLInputElement>(null);
    const createPdfInputRef = useRef<HTMLInputElement>(null);
    const brainstormPdfInputRef = useRef<HTMLInputElement>(null);
    const identifyImageInputRef = useRef<HTMLInputElement>(null);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);
    
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

    const handleKnowledgeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length > 0 && onAddDocument) {
            setIngestingCount(prev => prev + files.length);
            for (const file of files) {
                try {
                    const doc = await ingestDocument(file, addLog);
                    onAddDocument(doc);
                } catch (err) {
                    console.error("Knowledge Ingestion Failed", err);
                } finally {
                    setIngestingCount(prev => Math.max(0, prev - 1));
                }
            }
        }
        if (e.target) e.target.value = '';
    };

    const processedProjects = useMemo(() => {
        const filtered = searchTerm
            ? projects.filter(project => {
                const lowercasedFilter = searchTerm.toLowerCase();
                const searchCorpus = [
                    project.name,
                    project.description,
                    ...(project.tags || []),
                    project.searchKeywords || ''
                ].join(' ').toLowerCase();
                
                return searchCorpus.includes(lowercasedFilter);
            })
            : projects;

        return [...filtered].sort((a, b) => {
            switch (sortOption) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'date-created-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'date-created-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'last-updated':
                default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });
    }, [projects, searchTerm, sortOption]);

    const handleDeleteClick = (e: React.MouseEvent, project: ProjectIndexEntry) => {
        e.stopPropagation();
        const projectForModal = activeProject?.id === project.id ? activeProject : { ...project, history: [] } as any;
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-brand-light">Project Management</h2>
                </div>
                {!isViewer && (
                    <div className="space-y-2 mb-4">
                         <div className="grid grid-cols-2 gap-2">
                            <input type="file" ref={openFileInputRef} onChange={handleOpenFileSelected} accept=".sfp.json" className="hidden" disabled={disabled} />
                            <button onClick={() => openFileInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-1.5a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75Z" /></svg>
                            Open File
                            </button>
                            <button onClick={onNewProject} disabled={disabled} className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                + New Project
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={onOpenFromDrive} 
                                disabled={disabled} 
                                className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                            >
                                <Icons.Drive />
                                Open from Drive
                            </button>
                             {activeProject && (
                                <button 
                                    onClick={onSaveToDrive} 
                                    disabled={disabled || isSavingToDrive} 
                                    className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                                >
                                    <Icons.Drive />
                                    {isSavingToDrive ? 'Saving...' : (isDriveAuthenticated ? 'Save to Drive' : 'Sign In & Save')}
                                </button>
                             )}
                        </div>
                    </div>
                 )}
                 {activeProject && !isViewer && (
                    <button 
                        onClick={onSaveProject} 
                        disabled={disabled} 
                        className={`w-full py-2 px-3 rounded-lg border transition active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mb-3 ${hasUnsavedChanges ? 'bg-green-600 text-white font-bold border-green-500 hover:bg-green-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        title="Save current project to a local JSON file"
                    >
                        <Icons.SaveFile />
                        Save Project to File
                    </button>
                 )}
                 
                {activeProject && (
                  <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
                    <button 
                        onClick={() => setIsKnowledgeLibraryOpen(!isKnowledgeLibraryOpen)}
                        className="flex items-center justify-between w-full text-sm font-bold text-gray-700 dark:text-gray-300"
                    >
                        <div className="flex items-center gap-2">
                            <Icons.Brain />
                            Project Knowledge Library
                            {activeProject.knowledgeBase && activeProject.knowledgeBase.length > 0 && (
                                <span className="bg-brand-cyan/20 text-brand-cyan text-[10px] px-1.5 rounded-full">{activeProject.knowledgeBase.length}</span>
                            )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isKnowledgeLibraryOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    
                    {isKnowledgeLibraryOpen && (
                        <div className="mt-3 space-y-3 animate-fade-in">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">Ingest technical documents to augment the AI's retrieval context.</p>
                            {!isViewer && (
                                <>
                                <input type="file" ref={knowledgeFileInputRef} onChange={handleKnowledgeFileSelected} multiple className="hidden" accept=".pdf,image/*" />
                                <button 
                                    onClick={() => knowledgeFileInputRef.current?.click()}
                                    disabled={ingestingCount > 0}
                                    className="w-full py-2 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 rounded-md text-xs font-bold transition flex items-center justify-center gap-2"
                                >
                                    {ingestingCount > 0 ? (
                                        <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Ingesting {ingestingCount} Files...</>
                                    ) : '+ Add Technical Reference'}
                                </button>
                                </>
                            )}
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {(activeProject.knowledgeBase || []).map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[11px]">
                                        <div className="flex-1 truncate">
                                            <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{doc.name}</p>
                                            <p className="text-[9px] text-gray-400 italic truncate">{doc.summary}</p>
                                        </div>
                                        {!isViewer && onRemoveDocument && (
                                            <button onClick={() => onRemoveDocument(doc.id)} className="text-gray-400 hover:text-red-400 transition"><Icons.Trash /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-light mb-2">Session Projects</h3>
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-grow">
                        <Icons.Search />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-800 dark:text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan"
                        />
                    </div>
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300 text-sm rounded-lg focus:ring-brand-cyan focus:border-brand-cyan"
                    >
                        <option value="last-updated">Updated</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="date-created-desc">Newest</option>
                    </select>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-48 overflow-y-auto">
                    {processedProjects.length === 0 ? (
                        <p className="text-gray-500 text-center p-4 text-xs">{searchTerm ? 'No matches found.' : 'No projects in session.'}</p>
                    ) : (
                        <ul className="space-y-1">
                            {processedProjects.map((project, index) => (
                                <li
                                    key={project.id}
                                    onClick={() => !disabled && onSelectProject(project.id)}
                                    className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${activeProject?.id === project.id ? 'bg-brand-cyan/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 truncate">
                                            <p className={`font-semibold truncate ${activeProject?.id === project.id ? 'text-brand-cyan' : 'text-gray-800 dark:text-brand-light'}`}>{project.name || 'Untitled'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(project.updatedAt)}</p>
                                        </div>
                                        {authenticatedUser.role === Role.Admin && (
                                            <button onClick={(e) => handleDeleteClick(e, project)} disabled={disabled} className="p-2 text-gray-500 hover:text-red-400 transition-transform active:scale-95 rounded-full disabled:opacity-50 flex-shrink-0"><Icons.Trash /></button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {activeProject && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-light">Version History</h3>
                        <button onClick={() => onEditProject(activeProject)} disabled={disabled || isViewer} className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded transition text-gray-700 dark:text-gray-300"><Icons.Edit /></button>
                    </div>
                    
                    {!isViewer && (
                        <button
                            onClick={onCommitVersion}
                            disabled={!hasUnsavedChanges || disabled}
                            className={`w-full py-2 px-3 mb-2 font-bold rounded-lg border transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 ${hasUnsavedChanges ? 'bg-green-600 text-white border-green-500 hover:bg-green-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-default'}`}
                        >
                            <Icons.Commit />
                            {hasUnsavedChanges ? "Save New Version" : "Up to Date"}
                        </button>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-2 flex-1 overflow-y-auto max-h-64">
                        <ul className="space-y-1">
                            {activeProject.history.map((version, index) => (
                                <li
                                    key={version.versionId}
                                    className={`p-2 rounded-md transition-colors duration-200 ${index === activeVersionIndex ? 'bg-cyan-900/40 border border-cyan-800' : 'border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700/30'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="cursor-pointer flex-1" onClick={() => onLoadVersion(index)}>
                                            <div className="flex items-center gap-2">
                                                <p className={`font-semibold text-sm ${index === activeVersionIndex ? 'text-brand-cyan' : 'text-gray-800 dark:text-brand-light'}`}>{version.commitMessage}</p>
                                                {index === 0 && <span className="text-[10px] bg-blue-900/50 text-blue-200 px-1.5 rounded">LATEST</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(version.createdAt)}</p>
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            {!isViewer && index < activeProject.history.length - 1 && (
                                                <button onClick={() => onCompareVersions(activeProject, index)} className="p-1.5 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                                                </button>
                                            )}
                                            {!isViewer && <button onClick={() => onRevertVersion(index)} className="py-1 px-2 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded">Revert</button>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            <div className="p-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg mt-4">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-light mb-2">Tools</h3>
                  {!isViewer && (
                    <div className="grid grid-cols-1 gap-2">
                        <button onClick={onStartWithDeVinci} disabled={disabled} className="py-2 px-3 bg-purple-600 text-white font-semibold rounded-lg border border-purple-500 hover:bg-purple-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a.375.375 0 0 1 .265-.108h3.284a3.375 3.375 0 0 0 3.375-3.375V9.75a3.375 3.375 0 0 0-3.375 3.375H5.25a3.375 3.375 0 0 0-3.375 3.375v3.01Z" /></svg>
                            DeVinci Assistant
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => createImageInputRef.current?.click()} disabled={disabled} className="py-2 px-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 text-xs flex items-center gap-2 justify-center">
                                {isParsingImage ? 'Analyzing...' : 'Image Import'}
                            </button>
                            <button onClick={() => createPdfInputRef.current?.click()} disabled={disabled} className="py-2 px-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 text-xs flex items-center gap-2 justify-center">
                                {isParsingPdf ? 'Parsing...' : 'PDF Import'}
                            </button>
                        </div>
                        <button onClick={onOpenVideoImport} disabled={disabled} className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2 justify-center">
                           {isParsingVideo ? 'Analyzing...' : 'Video Import'}
                        </button>
                         <input type="file" ref={createImageInputRef} onChange={handleCreateImageSelected} accept="image/*" className="hidden" disabled={disabled} />
                         <input type="file" ref={createPdfInputRef} onChange={handleCreateFileSelected} accept="application/pdf" className="hidden" disabled={disabled} />
                         <input type="file" ref={brainstormPdfInputRef} onChange={handleBrainstormFileSelected} accept="application/pdf" className="hidden" disabled={disabled} />
                        <button onClick={() => brainstormPdfInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95 text-sm flex items-center gap-2 justify-center">
                           {isParsingForBrainstorm ? 'Parsing...' : 'Brainstorm from PDF'}
                        </button>
                        <input type="file" ref={identifyImageInputRef} onChange={handleIdentifyImageSelected} accept="image/*" className="hidden" disabled={disabled} />
                        <button onClick={() => identifyImageInputRef.current?.click()} disabled={disabled} className="py-2 px-3 bg-teal-600 text-white font-semibold rounded-lg border border-teal-500 hover:bg-teal-500 transition active:scale-95 text-sm flex items-center gap-2 justify-center col-span-full">
                           {isIdentifyingImage ? 'Researching...' : 'Identify & Research Image'}
                        </button>
                    </div>
                 )}
            </div>

            <Modal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={confirmDelete} title="Confirm Deletion" confirmText="Delete">
                Are you sure you want to permanently delete the project "<strong>{projectToDelete?.name}</strong>"?
            </Modal>
        </div>
    );
};



import React, { useState, useMemo } from 'react';
// FIX: Import ProjectIndexEntry from central types file.
import { Project, User, Role, ProjectIndexEntry } from '../types';
import { Modal } from './Modal';

// This is a simplified version of the Project type used for the list/index.
// FIX: Removed local type definition in favor of imported ProjectIndexEntry.

interface ProjectManagerProps {
    projects: ProjectIndexEntry[];
    activeProject: Project | null;
    activeVersionIndex: number;
    onSelectProject: (projectId: string) => void;
    onNewProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onLoadVersion: (index: number) => void;
    onRevertVersion: (index: number) => void;
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
};


export const ProjectManager = ({ projects, activeProject, activeVersionIndex, onSelectProject, onNewProject, onEditProject, onDeleteProject, onLoadVersion, onRevertVersion, disabled, authenticatedUser }: ProjectManagerProps) => {
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        const lowercasedFilter = searchTerm.toLowerCase();
        return projects.filter(project => {
            const name = project.name.toLowerCase();
            const description = project.description.toLowerCase();
            const tags = (project.tags || []).join(' ').toLowerCase();
            const keywords = project.searchKeywords || '';

            return name.includes(lowercasedFilter) ||
                   description.includes(lowercasedFilter) ||
                   tags.includes(lowercasedFilter) ||
                   keywords.includes(lowercasedFilter);
        });
    }, [projects, searchTerm]);

    const handleDeleteClick = (e: React.MouseEvent, project: ProjectIndexEntry) => {
        e.stopPropagation();
        // Since we only have the index entry here, we pass the full active project if it matches,
        // otherwise we create a temporary partial project object for the modal text.
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
                    <h2 className="text-xl font-semibold text-brand-light">Projects</h2>
                    <button onClick={onNewProject} disabled={disabled || isViewer} className="py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        + New Project
                    </button>
                </div>
                <div className="relative mb-2">
                    <Icons.Search />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:ring-brand-cyan focus:border-brand-cyan"
                    />
                </div>
                <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-2 max-h-48 overflow-y-auto">
                    {filteredProjects.length === 0 ? (
                        <p className="text-gray-500 text-center p-4">{searchTerm ? 'No projects match your search.' : 'No projects yet.'}</p>
                    ) : (
                        <ul className="space-y-1">
                            {filteredProjects.map((project) => (
                                <li
                                    key={project.id}
                                    onClick={() => !disabled && onSelectProject(project.id)}
                                    className={`p-2 rounded-md transition-all duration-200 ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'} ${activeProject?.id === project.id ? 'bg-brand-cyan/20' : 'hover:bg-gray-700/50'}`}
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
                         <button onClick={() => onEditProject(activeProject)} disabled={disabled || isViewer} className="py-1 px-3 text-xs bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-transform active:scale-95" title="Edit project details"><Icons.Edit /> Edit Details</button>
                    </div>
                    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-2 max-h-48 overflow-y-auto">
                        <ul className="space-y-1">
                            {activeProject.history.map((version, index) => (
                                <li
                                    key={version.versionId}
                                    className={`p-2 rounded-md ${index === activeVersionIndex ? 'bg-cyan-900/40' : ''}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-semibold text-sm ${index === activeVersionIndex ? 'text-brand-cyan' : 'text-brand-light'}`}>{version.commitMessage}</p>
                                            <p className="text-xs text-gray-400">Saved: {formatDate(version.createdAt)}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => onLoadVersion(index)} disabled={disabled || index === activeVersionIndex} className="py-1 px-2 text-xs bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 transition-transform active:scale-95">View</button>
                                            <button onClick={() => onRevertVersion(index)} disabled={disabled || isViewer} className="py-1 px-2 text-xs bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1 transition-transform active:scale-95" title="Revert to this version"><Icons.Revert />Revert</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <Modal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={confirmDelete} title="Confirm Deletion" confirmText="Delete">
                Are you sure you want to permanently delete the project "<strong>{projectToDelete?.name}</strong>"? This action cannot be undone.
            </Modal>
        </div>
    );
};
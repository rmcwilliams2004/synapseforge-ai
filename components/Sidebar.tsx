import React from 'react';
import { ProjectManager } from './ProjectManager';
import { Project, User, ProjectIndexEntry, IngestedDocument } from '../types';

interface SidebarProps {
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
    onSaveToDrive: () => void;
    onOpenFromDrive: () => void;
    isSavingToDrive: boolean;
    isDriveAuthenticated: boolean;
    onAddDocument?: (doc: IngestedDocument) => void;
    onRemoveDocument?: (id: string) => void;
    addLog: (level: 'INFO' | 'WARN' | 'ERROR', message: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
    return (
        <div className="h-full">
            <ProjectManager {...props} />
        </div>
    );
};

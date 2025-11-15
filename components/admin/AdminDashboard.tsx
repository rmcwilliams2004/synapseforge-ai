import React, { useState } from 'react';
// FIX: Changed Project to ProjectIndexEntry to match the data passed from App.tsx.
import { User, ProjectIndexEntry, LogEntry, Role } from '../../types';
import { Sidebar } from './Sidebar';
import { DashboardView } from './DashboardView';
import { UserManagementView } from './UserManagementView';
import { AnalyticsView } from './AnalyticsView';


interface AdminDashboardProps {
    authenticatedUser: User;
    users: User[];
    // FIX: Changed projects prop to use ProjectIndexEntry to resolve type mismatch from App.tsx.
    projects: ProjectIndexEntry[];
    logs: LogEntry[];
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onOpenTechDoc: () => void;
}

export const AdminDashboard = (props: AdminDashboardProps) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'analytics'>(
        props.authenticatedUser.role === Role.Manager ? 'analytics' : 'dashboard'
    );

    const renderActiveView = () => {
        // Enforce role permissions. If a manager tries to access a different view, force them to analytics.
        if (props.authenticatedUser.role === Role.Manager && activeView !== 'analytics') {
            setActiveView('analytics');
            return <AnalyticsView logs={props.logs} projects={props.projects} />;
        }

        switch (activeView) {
            case 'dashboard':
                return <DashboardView users={props.users} projects={props.projects} logs={props.logs} />;
            case 'users':
                return <UserManagementView authenticatedUser={props.authenticatedUser} users={props.users} onUpdateUser={props.onUpdateUser} onDeleteUser={props.onDeleteUser} />;
            case 'analytics':
                 return <AnalyticsView logs={props.logs} projects={props.projects} />;
            default:
                return <DashboardView users={props.users} projects={props.projects} logs={props.logs} />;
        }
    }

    return (
        <div className="flex gap-6 animate-fade-in">
            <div className="w-64 flex-shrink-0">
                <Sidebar 
                    activeView={activeView} 
                    setActiveView={setActiveView} 
                    onOpenTechDoc={props.onOpenTechDoc}
                    authenticatedUser={props.authenticatedUser}
                />
            </div>
            <div className="flex-1">
                {renderActiveView()}
            </div>
        </div>
    );
};
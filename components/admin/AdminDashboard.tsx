import React, { useState } from 'react';
import { User, Project, LogEntry } from '../../types';
import { Sidebar } from './Sidebar';
import { DashboardView } from './DashboardView';
import { UserManagementView } from './UserManagementView';
import { AnalyticsView } from './AnalyticsView';


interface AdminDashboardProps {
    authenticatedUser: User;
    users: User[];
    projects: Project[];
    logs: LogEntry[];
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onOpenTechDoc: () => void;
}

export const AdminDashboard = (props: AdminDashboardProps) => {
    const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'analytics'>('dashboard');

    const renderActiveView = () => {
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
                <Sidebar activeView={activeView} setActiveView={setActiveView} onOpenTechDoc={props.onOpenTechDoc} />
            </div>
            <div className="flex-1">
                {renderActiveView()}
            </div>
        </div>
    );
};

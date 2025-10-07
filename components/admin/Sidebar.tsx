import React from 'react';

type AdminView = 'dashboard' | 'users' | 'analytics';

interface SidebarProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
    onOpenTechDoc: () => void;
}

const NavItem = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200 active:scale-95 ${
            isActive
                ? 'bg-purple-600 text-white font-bold'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

const Icons = {
    Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>,
    Analytics: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
    TechDoc: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
};

export const Sidebar = ({ activeView, setActiveView, onOpenTechDoc }: SidebarProps) => {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
            <nav className="space-y-2">
                <NavItem label="Dashboard" icon={<Icons.Dashboard />} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                <NavItem label="User Management" icon={<Icons.Users />} isActive={activeView === 'users'} onClick={() => setActiveView('users')} />
                <NavItem label="Analytics" icon={<Icons.Analytics />} isActive={activeView === 'analytics'} onClick={() => setActiveView('analytics')} />
                <div className="pt-2 mt-2 border-t border-gray-700">
                    <NavItem label="Technical Doc" icon={<Icons.TechDoc />} isActive={false} onClick={onOpenTechDoc} />
                </div>
            </nav>
        </div>
    );
};
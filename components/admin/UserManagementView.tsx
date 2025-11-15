import React, { useState } from 'react';
import { User, Role } from '../../types';
import { Modal } from '../Modal';

interface UserManagementViewProps {
    authenticatedUser: User;
    users: User[];
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
};

const RolePill = ({ role }: { role: Role }) => {
    const roleColors: Record<Role, string> = {
        [Role.Admin]: 'bg-purple-600 text-purple-100',
        [Role.Manager]: 'bg-teal-600 text-teal-100',
        [Role.Editor]: 'bg-blue-600 text-blue-100',
        [Role.Viewer]: 'bg-gray-600 text-gray-100',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[role]}`}>{role}</span>;
}

export const UserManagementView = ({ authenticatedUser, users, onUpdateUser, onDeleteUser }: UserManagementViewProps) => {
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleRoleChange = (userId: string, newRole: Role) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            onUpdateUser({ ...userToUpdate, role: newRole });
        }
    };
    
    const confirmDelete = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand-light">User Management</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-sm text-gray-300 uppercase">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Analyses Run</th>
                            <th className="px-6 py-3">Last Active</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-200">
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-150">
                                <td className="px-6 py-4 font-semibold">{user.name}</td>
                                <td className="px-6 py-4">
                                    {authenticatedUser.id === user.id ? (
                                        <RolePill role={user.role} />
                                    ) : (
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2"
                                        >
                                            {Object.values(Role).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className="px-6 py-4">{user.analysesRun}</td>
                                <td className="px-6 py-4">{formatDate(user.lastActive)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => setUserToDelete(user)}
                                        disabled={authenticatedUser.id === user.id}
                                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                                        title={authenticatedUser.id === user.id ? "Cannot delete yourself" : "Delete User"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} onConfirm={confirmDelete} title="Confirm Deletion" confirmText="Delete">
                Are you sure you want to permanently delete the user "<strong>{userToDelete?.name}</strong>"? This action cannot be undone.
            </Modal>
        </div>
    );
};
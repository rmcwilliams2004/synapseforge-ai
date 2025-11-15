import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => void;
}

const RolePill = ({ role }: { role: string }) => {
    const roleColors: { [key: string]: string } = {
        'Admin': 'bg-purple-600 text-purple-100',
        'Manager': 'bg-teal-600 text-teal-100',
        'Editor': 'bg-blue-600 text-blue-100',
        'Viewer': 'bg-gray-600 text-gray-100',
    };
    return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${roleColors[role]}`}>{role}</span>;
}

export const ProfileModal = ({ isOpen, onClose, user, onSave }: ProfileModalProps) => {
    const [name, setName] = useState(user.name);

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
        }
    }, [isOpen, user]);

    const handleSave = () => {
        if (!name.trim()) {
            alert('Name cannot be empty.');
            return;
        }
        onSave({ ...user, name: name.trim() });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.2s' }} onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-light">Your Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full border-4 border-gray-600" />
                    <div>
                        <h3 className="text-xl font-bold text-white">{name}</h3>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>


                <div className="space-y-4">
                    <div>
                        <label htmlFor="profileName" className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                        <input
                            id="profileName"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan"
                        />
                    </div>
                    <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-400">Role</span>
                        <RolePill role={user.role} />
                    </div>
                     <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-400">Analyses Run</span>
                        <span className="font-bold text-xl text-white">{user.analysesRun}</span>
                    </div>
                     <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-400">Last Active</span>
                        <span className="text-sm text-gray-300">{new Date(user.lastActive).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="py-2 px-4 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
import React, { useState } from 'react';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string) => void;
}

export const CommitModal = ({ isOpen, onClose, onCommit }: CommitModalProps) => {
  const [message, setMessage] = useState('');

  const handleCommit = () => {
    if (!message.trim()) {
      alert('A commit message is required to save the version.');
      return;
    }
    onCommit(message.trim());
    setMessage(''); // Reset for next time
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.2s' }} onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-light">Save New Version</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl font-bold">&times;</button>
        </div>
        <div>
            <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-300 mb-1">Commit Message <span className="text-red-500">*</span></label>
            <textarea
              id="commitMessage"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan"
              placeholder="e.g., Initial analysis of gearbox assembly"
              autoFocus
            />
             <p className="text-xs text-gray-500 mt-1">Describe the changes in this version.</p>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95">
            Cancel
          </button>
          <button onClick={handleCommit} disabled={!message.trim()} className="py-2 px-4 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50">
            Save Version
          </button>
        </div>
      </div>
    </div>
  );
};
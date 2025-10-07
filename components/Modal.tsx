

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string | null;
  onConfirm: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, confirmText = 'Confirm', cancelText, onConfirm }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    // The onConfirm callback is now responsible for closing the modal if needed.
    // This allows for modals that can stay open for multi-step interactions.
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.2s' }} onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-light">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl font-bold">&times;</button>
        </div>
        <div className="text-gray-300 mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-4">
          {cancelText !== null && (
            <button onClick={onClose} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95">
              {cancelText ?? 'Cancel'}
            </button>
          )}
          <button onClick={handleConfirm} className="py-2 px-4 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-500 transition active:scale-95">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
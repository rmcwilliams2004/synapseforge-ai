import React, { useRef, useState, useCallback } from 'react';
import { User } from '../types';

interface PromptInputProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onEngage: () => void;
  isLoading: boolean;
  onClearFiles: () => void;
  isReady: boolean;
  authenticatedUser: User;
}

const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;

export const PromptInput = ({ 
  projectName, 
  onProjectNameChange, 
  prompt, 
  onPromptChange, 
  files, 
  onFilesChange, 
  onEngage, 
  isLoading, 
  onClearFiles,
  isReady,
  authenticatedUser
}: PromptInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isViewer = authenticatedUser.role === 'Viewer';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    handleDragEvents(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [handleDragEvents]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
  }, [handleDragEvents]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles: File[] = Array.from(e.dataTransfer.files);
        onFilesChange([...files, ...droppedFiles]);
    }
  }, [handleDragEvents, files, onFilesChange]);


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-light mb-3">2. Project Name & Concept</h2>
         <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Enter a name for your project..."
          className="w-full p-3 mb-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isViewer}
        />
        <textarea
          id="tour-step-2"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g., Analyze the gear mechanism and power system of this cordless drill based on the attached images..."
          className="w-full h-48 p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isViewer}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-brand-light mb-3">3. Upload Files (Optional)</h2>
        <div
          id="tour-step-3"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          onClick={() => !(isLoading || isViewer) && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center h-48 p-4 border-2 border-dashed rounded-lg transition
            ${isDragging ? 'border-brand-cyan bg-cyan-900/30' : 'border-gray-600 bg-gray-800'}
            ${(isLoading || isViewer) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'}`
          }
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            disabled={isLoading || isViewer}
          />
          {files.length === 0 ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V8.25c0-1.121.904-2.025 2.025-2.025h13.95A2.025 2.025 0 0 1 21 8.25v9a2.025 2.025 0 0 1-2.025 2.025H5.025A2.025 2.025 0 0 1 3 17.25Z" />
              </svg>
              <p className="text-sm text-gray-400 text-center">Drag & drop files or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Images or PDFs</p>
            </>
          ) : (
            <div className="w-full text-left">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-brand-light">Attached Files:</h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); onClearFiles(); if (fileInputRef.current) fileInputRef.current.value = ''; }} 
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-50" 
                  title="Clear all files"
                  disabled={isLoading || isViewer}
                  >
                  Clear
                </button>
              </div>
              <ul className="text-xs space-y-1 max-h-36 overflow-y-auto pr-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center gap-2 p-1 bg-gray-700/50 rounded">
                    <FileIcon />
                    <span className="truncate flex-1">{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <button
        id="tour-step-4"
        onClick={onEngage}
        disabled={!isReady || isLoading || isViewer}
        className="w-full py-3 px-4 bg-brand-cyan text-white font-bold rounded-lg text-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing...</span>
          </>
        ) : (
          isViewer ? "Viewing Mode" : "Engage SynapseForge AI"
        )}
      </button>
    </div>
  );
};

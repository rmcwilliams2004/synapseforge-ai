import React, { useState, useRef } from 'react';
import { Modal } from './Modal';

interface VideoImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportFile: (file: File) => void;
    onImportUrl: (url: string) => void;
    isLoading: boolean;
}

export const VideoImportModal: React.FC<VideoImportModalProps> = ({ isOpen, onClose, onImportFile, onImportUrl, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
    const [url, setUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportFile(file);
            if (e.target) e.target.value = '';
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onImportUrl(url.trim());
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Start Project from Video"
            confirmText="Analyze"
            confirmDisabled={activeTab === 'link' && !url.trim() || isLoading}
            onConfirm={() => {
                if (activeTab === 'link' && url.trim()) onImportUrl(url.trim());
            }}
            cancelText="Cancel"
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Create a new project by analyzing a video. Upload a file for deep visual analysis (gemini-3-pro) or provide a link for context and search-based analysis (gemini-flash + Search).
                </p>
                
                <div className="flex border-b border-gray-600 mb-4">
                    <button 
                        onClick={() => setActiveTab('upload')} 
                        className={`flex-1 pb-2 font-semibold text-sm ${activeTab === 'upload' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Upload File
                    </button>
                    <button 
                        onClick={() => setActiveTab('link')} 
                        className={`flex-1 pb-2 font-semibold text-sm ${activeTab === 'link' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Paste Link
                    </button>
                </div>

                {activeTab === 'upload' ? (
                    <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition">
                         <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            accept="video/*" 
                            className="hidden" 
                            disabled={isLoading}
                        />
                        {isLoading ? (
                             <div className="flex flex-col items-center gap-2">
                                <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <p className="text-purple-300 font-semibold">Analyzing Video Frame-by-Frame...</p>
                            </div>
                        ) : (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 w-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-brand-cyan"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                <span className="text-gray-300 font-medium">Click to Select Video</span>
                                <span className="text-xs text-gray-500">Supports MP4, MOV, WEBM (Max 50MB for browser demo)</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleUrlSubmit}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Video URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-cyan mb-2"
                            disabled={isLoading}
                        />
                        {isLoading && <p className="text-sm text-purple-300 animate-pulse">Analyzing video content via web search...</p>}
                    </form>
                )}
            </div>
        </Modal>
    );
};
import React, { useEffect, useState, useRef } from 'react';
import { DeVinciState, TranscriptEntry, DeVinciVoice } from '../types';
import { RoiEditorModal } from './RoiEditorModal';

interface DeVinciModalProps {
  isOpen: boolean;
  onClose: () => void;
  startConversation: () => void;
  stopConversation: () => void;
  pauseConversation: () => void;
  resumeConversation: () => void;
  state: DeVinciState;
  transcript: TranscriptEntry[];
  isCreating?: boolean;
  onFileUpload: (file: File) => void;
  analyzableFile: File | null;
  sendImageRegion: (croppedFile: File, originalFileName: string) => void;
  simulateNewSpeaker: () => void;
  manualRetry: () => void;
  retryCount: number;
}

const VOICES: { name: string, id: DeVinciVoice }[] = [
    { name: 'Zephyr', id: 'Zephyr' },
    { name: 'Puck', id: 'Puck' },
    { name: 'Charon', id: 'Charon' },
    { name: 'Kore', id: 'Kore' },
    { name: 'Fenrir', id: 'Fenrir' },
];

const StateIndicator = ({ state, retryCount }: { state: DeVinciState; retryCount: number; }) => {
    const messages: Record<DeVinciState, string | ((retryCount: number) => string)> = {
        idle: 'Ready to start',
        connecting: 'Connecting...',
        listening: 'Listening...',
        speaking: 'DeVinci is speaking...',
        thinking: 'DeVinci is thinking...',
        error: 'An unexpected error occurred.',
        paused: 'Conversation Paused',
        reconnecting: (count) => `Connection lost. Attempting to reconnect (${count}/3)...`,
        reconnect_failed: 'Failed to reconnect. Please check your connection.',
    };

    let message = messages[state];
    if (typeof message === 'function') {
        message = message(retryCount);
    }

    return <div className="text-center text-gray-400 text-sm italic">{message}</div>;
};

const TranscriptView = ({ transcript }: { transcript: TranscriptEntry[] }) => {
    const endOfMessagesRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="flex-1 bg-gray-900/50 p-4 rounded-lg overflow-y-auto">
            {transcript.map((entry, index) => (
                <div key={index} className={`mb-4 ${entry.source === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block p-3 rounded-lg ${entry.source === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                        {entry.text}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{entry.speakerName ? entry.speakerName.split(' ')[0] : (entry.source === 'user' ? 'You' : 'DeVinci')}</p>
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};


export const DeVinciModal = ({ isOpen, onClose, startConversation, stopConversation, pauseConversation, resumeConversation, state, transcript, isCreating = false, onFileUpload, analyzableFile, sendImageRegion, simulateNewSpeaker, manualRetry, retryCount }: DeVinciModalProps) => {
    const [selectedVoice, setSelectedVoice] = useState<DeVinciVoice>('Zephyr');
    const [isRoiEditorOpen, setIsRoiEditorOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // This effect will run once when the modal opens and is ready to start.
    useEffect(() => {
        if (isOpen && state === 'idle') {
            startConversation();
        }
    }, [isOpen, state, startConversation]);

    // Ensure conversation stops when modal is closed
    useEffect(() => {
        if (!isOpen) {
            stopConversation();
        }
    }, [isOpen, stopConversation]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedFiles: File[]) => {
        // For conversational context, only send the first selected region.
        if (analyzableFile && croppedFiles.length > 0) {
            sendImageRegion(croppedFiles[0], analyzableFile.name);
        }
        setIsRoiEditorOpen(false);
    };


    if (!isOpen) return null;
    
    const title = isCreating ? "Start a New Project with DeVinci" : "Conversation with DeVinci";

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.3s' }}>
                <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col border-2 border-purple-500 animate-scale-in">
                    <header className="flex justify-between items-center p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v1.5m-6 0v-1.5a6 6 0 0 1 6-6v1.5m0 0v1.5m0-1.5a6 6 0 0 0-6 6v1.5m6-7.5a6 6 0 0 1 6 6v1.5" /></svg>
                            <h2 className="text-2xl font-bold text-brand-light">{title}</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                    </header>
                    
                    <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                        <TranscriptView transcript={transcript} />
                        <StateIndicator state={state} retryCount={retryCount} />
                    </main>

                    <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
                        {!isCreating ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={simulateNewSpeaker}
                                    className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    disabled={state === 'idle' || state === 'error' || state === 'connecting'}
                                    title="Simulate a new person joining the conversation"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
                                    + Add Speaker
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" disabled={state === 'idle' || state === 'error' || state === 'connecting'} />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    disabled={state === 'idle' || state === 'error' || state === 'connecting'}
                                    title="Upload a file for analysis in the conversation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V8.25c0-1.121.904-2.025 2.025-2.025h13.95A2.025 2.025 0 0 1 21 8.25v9a2.025 2.025 0 0 1-2.025 2.025H5.025A2.025 2.025 0 0 1 3 17.25Z" /></svg>
                                    Upload File
                                </button>
                                <button
                                    onClick={() => setIsRoiEditorOpen(true)}
                                    className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    disabled={!analyzableFile}
                                    title={analyzableFile ? "Select a region of the uploaded image" : "Upload an image first to enable ROI selection"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                                    Select Region
                                </button>
                            </div>
                        ) : <div /> /* Placeholder for alignment */}
                        <div className="flex gap-4">
                            {(state === 'error' || state === 'reconnect_failed') && (
                                <button onClick={manualRetry} className="py-2 px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition active:scale-95">Retry Connection</button>
                            )}
                            {(state === 'listening' || state === 'speaking') && (
                                <button onClick={pauseConversation} className="py-2 px-6 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition active:scale-95">Pause</button>
                            )}
                            {state === 'paused' && (
                                <button onClick={resumeConversation} className="py-2 px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition active:scale-95">Resume</button>
                            )}
                            {(state !== 'idle' && state !== 'error' && state !== 'reconnect_failed') && (
                                <button onClick={stopConversation} className="py-2 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition active:scale-95">Stop</button>
                            )}
                            <button onClick={onClose} className="py-2 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95">Close</button>
                        </div>
                    </footer>
                </div>
            </div>
            <RoiEditorModal
                isOpen={isRoiEditorOpen}
                onClose={() => setIsRoiEditorOpen(false)}
                file={analyzableFile}
                onCropComplete={handleCropComplete}
            />
        </>
    );
};
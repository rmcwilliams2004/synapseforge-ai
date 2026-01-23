import React, { useEffect, useState, useRef } from 'react';
import { DeVinciState, TranscriptEntry, DeVinciVoice } from '../types';
import { RoiEditorModal } from './RoiEditorModal';
import { AudioReactor } from './AudioReactor';

interface DeVinciModalProps {
  isOpen: boolean;
  onClose: () => void;
  startConversation: () => void;
  stopConversation: () => void;
  state: DeVinciState;
  transcript: TranscriptEntry[];
  volume: number; // Volume state from useDeVinci
  onFileUpload: (file: File) => void;
  analyzableFile: File | null;
  sendImageRegion: (croppedFile: File, originalFileName: string) => void;
  simulateNewSpeaker: () => void;
  manualRetry: () => void;
  retryCount: number;
  partnerName?: string;
  partnerColor?: string;
}

const StateIndicator = ({ state, retryCount }: { state: DeVinciState; retryCount: number; }) => {
    const messages: Record<DeVinciState, string | ((retryCount: number) => string)> = {
        idle: 'Uplink Standby',
        connecting: 'Synchronizing neural nodes...',
        listening: 'Awaiting Dialogue...',
        speaking: 'Persona Engaged...',
        thinking: 'Traversing Mental Model...',
        error: 'Uplink Error',
        paused: 'Link Suspended',
        reconnecting: (count) => `Signal Interference. Re-linking (${count}/3)...`,
        reconnect_failed: 'Link Terminated',
    };

    let message = messages[state];
    if (typeof message === 'function') {
        message = message(retryCount);
    }

    return <div className="text-center text-gray-500 text-[10px] font-mono uppercase tracking-[0.25em] py-3 border-t border-white/5">{message}</div>;
};

const TranscriptView = ({ transcript }: { transcript: TranscriptEntry[] }) => {
    const endOfMessagesRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="flex-1 bg-black/40 p-5 rounded-3xl overflow-y-auto border border-white/5 custom-scrollbar">
            {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm italic gap-4">
                    <svg className="w-16 h-16 opacity-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    Establishing Socratic context...
                </div>
            )}
            {transcript.map((entry, index) => (
                <div key={index} className={`mb-6 flex flex-col ${entry.source === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] shadow-xl ${
                        entry.source === 'user' 
                        ? 'bg-cyan-600/15 text-cyan-50 border border-cyan-500/20' 
                        : 'bg-gray-800/80 text-gray-100 border border-white/10'
                    }`}>
                        <p className="text-sm leading-relaxed font-sans">{entry.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-500 mt-2.5 uppercase tracking-[0.2em] font-mono px-1">
                        {entry.speakerName ? entry.speakerName : (entry.source === 'user' ? 'Operator' : 'AI Partner')}
                    </span>
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};


export const DeVinciModal = ({ isOpen, onClose, startConversation, stopConversation, state, transcript, volume, onFileUpload, analyzableFile, sendImageRegion, simulateNewSpeaker, manualRetry, retryCount, partnerName, partnerColor }: DeVinciModalProps) => {
    const [isRoiEditorOpen, setIsRoiEditorOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && state === 'idle') {
            startConversation();
        }
    }, [isOpen, state, startConversation]);

    useEffect(() => {
        if (!isOpen) stopConversation();
    }, [isOpen, stopConversation]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileUpload(file);
        if (e.target) e.target.value = '';
    };

    if (!isOpen) return null;
    
    const title = partnerName ? `Board Room: ${partnerName}` : "AI Engineering Partner";

    return (
        <>
            <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-[#0f172a] rounded-[2.5rem] shadow-[0_0_120px_rgba(0,0,0,1)] w-full max-w-5xl h-[85vh] flex flex-col border border-white/10 animate-scale-in overflow-hidden">
                    <header className="flex justify-between items-center px-10 py-8 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
                        <div className="flex items-center gap-6">
                            <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center rotate-6 shadow-2xl"
                                style={{ backgroundColor: `${partnerColor || '#06b6d4'}20`, border: `1px solid ${partnerColor || '#06b6d4'}40` }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" style={{ color: partnerColor || '#06b6d4' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v1.5m-6 0v-1.5a6 6 0 0 1 6-6v1.5m0 0v1.5m0-1.5a6 6 0 0 0-6 6v1.5m6-7.5a6 6 0 0 1 6 6v1.5" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
                                <p className="text-[11px] text-gray-500 uppercase tracking-[0.3em] font-mono mt-1">Direct Socratic Uplink Active</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 text-gray-500 hover:text-white transition-all hover:scale-110 active:scale-95">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>
                    
                    <main className="flex-1 p-10 flex flex-col gap-10 overflow-hidden">
                        <AudioReactor state={state} volume={volume} color={partnerColor} />
                        <TranscriptView transcript={transcript} />
                        <StateIndicator state={state} retryCount={retryCount} />
                    </main>

                    <footer className="px-10 py-8 bg-black/30 border-t border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={simulateNewSpeaker}
                                className="py-3 px-6 bg-gray-800/60 text-gray-200 font-bold rounded-2xl border border-white/10 hover:bg-gray-700 transition-all active:scale-95 text-xs flex items-center gap-3 shadow-lg"
                                disabled={state === 'connecting'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
                                SUMMON ALTERNATE NODE
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="py-3 px-6 bg-gray-800/60 text-gray-200 font-bold rounded-2xl border border-white/10 hover:bg-gray-700 transition-all active:scale-95 text-xs flex items-center gap-3 shadow-lg"
                                disabled={state === 'connecting'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V8.25c0-1.121.904-2.025 2.025-2.025h13.95A2.025 2.025 0 0 1 21 8.25v9a2.025 2.025 0 0 1-2.025 2.025H5.025A2.025 2.025 0 0 1 3 17.25Z" /></svg>
                                UPLOAD VISUAL REFERENCE
                            </button>
                        </div>
                        <div className="flex gap-5">
                            {(state === 'error' || state === 'reconnect_failed') && (
                                <button onClick={manualRetry} className="py-3 px-8 bg-green-600 text-white font-black rounded-2xl hover:bg-green-500 transition shadow-xl shadow-green-900/40 uppercase tracking-widest text-xs">RE-ESTABLISH LINK</button>
                            )}
                            <button onClick={onClose} className="py-3 px-10 bg-rose-600/10 text-rose-500 border border-rose-500/40 font-black rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 uppercase tracking-widest text-xs shadow-xl">SEVER CONNECTION</button>
                        </div>
                    </footer>
                </div>
            </div>
            <RoiEditorModal
                isOpen={isRoiEditorOpen}
                onClose={() => setIsRoiEditorOpen(false)}
                file={analyzableFile}
                onCropComplete={() => setIsRoiEditorOpen(false)}
            />
        </>
    );
};

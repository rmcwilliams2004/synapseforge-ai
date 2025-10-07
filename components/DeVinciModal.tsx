import React, { useEffect, useRef, useState } from 'react';
import { useDeVinci } from '../hooks/useDeVinci';
import { Faction, ProjectVersion, DeVinciState, TranscriptEntry, DeVinciVoice } from '../types';

interface DeVinciModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectVersion: ProjectVersion | null;
  projectName: string | null;
  faction: Faction | null;
}

const VOICES: { name: string, id: DeVinciVoice }[] = [
    { name: 'Zephyr', id: 'Zephyr' },
    { name: 'Puck', id: 'Puck' },
    { name: 'Charon', id: 'Charon' },
    { name: 'Kore', id: 'Kore' },
    { name: 'Fenrir', id: 'Fenrir' },
];

const StateIndicator = ({ state }: { state: DeVinciState }) => {
    const messages: Record<DeVinciState, string> = {
        idle: 'Ready to start',
        connecting: 'Connecting...',
        listening: 'Listening...',
        speaking: 'DeVinci is speaking...',
        thinking: 'DeVinci is thinking...',
        error: 'An error occurred',
    };
    return <div className="text-center text-gray-400 text-sm italic">{messages[state]}</div>;
};

const TranscriptView = ({ transcript }: { transcript: TranscriptEntry[] }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
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
                    <p className="text-xs text-gray-500 mt-1">{entry.source === 'user' ? 'You' : 'DeVinci'}</p>
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};


export const DeVinciModal = ({ isOpen, onClose, projectVersion, projectName, faction }: DeVinciModalProps) => {
    const { state, transcript, startConversation, stopConversation } = useDeVinci();
    const [selectedVoice, setSelectedVoice] = useState<DeVinciVoice>('Zephyr');

    const handleStart = () => {
        if (projectVersion && faction && projectName) {
            startConversation(projectName, projectVersion, faction, selectedVoice);
        }
    };

    const handleStop = () => {
        stopConversation();
    };
    
    // Ensure conversation stops when modal is closed
    useEffect(() => {
        if (!isOpen) {
            stopConversation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" style={{ animationDuration: '0.3s' }}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col border-2 border-purple-500 animate-scale-in">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v1.5m-6 0v-1.5a6 6 0 0 1 6-6v1.5m0 0v1.5m0-1.5a6 6 0 0 0-6 6v1.5m6-7.5a6 6 0 0 1 6 6v1.5" /></svg>
                        <h2 className="text-2xl font-bold text-brand-light">Conversation with <span className="text-purple-400">DeVinci</span></h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl font-bold">&times;</button>
                </header>
                
                <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                    <TranscriptView transcript={transcript} />
                    <StateIndicator state={state} />
                </main>

                <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <label htmlFor="voice-select" className="text-sm text-gray-400">Voice:</label>
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value as DeVinciVoice)}
                            disabled={state !== 'idle'}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2"
                        >
                            {VOICES.map(voice => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        {state === 'idle' && (
                             <button onClick={handleStart} className="py-2 px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition active:scale-95">Start</button>
                        )}
                        {state !== 'idle' && state !== 'error' && (
                            <button onClick={handleStop} className="py-2 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition active:scale-95">Stop</button>
                        )}
                        <button onClick={onClose} className="py-2 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition active:scale-95">Close</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
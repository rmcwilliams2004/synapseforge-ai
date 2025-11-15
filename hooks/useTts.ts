

import { useState, useRef, useCallback } from 'react';
import { generateSpeech as performTextToSpeech, parseApiError } from '../services/geminiService';
import { LogEntry } from '../types';

// --- Audio Decoding Utilities (from Live API implementation) ---
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


export const useTts = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [speakingText, setSpeakingText] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const stop = useCallback(() => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.onended = null; // Prevent onended from firing on manual stop
            sourceNodeRef.current.stop();
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        setIsPlaying(false);
        setIsLoading(false);
        setSpeakingText(null);
    }, []);

    const speak = useCallback(async (text: string, voice: string = 'Kore') => {
        const wasPlayingThisText = speakingText === text && (isPlaying || isLoading);
        
        // Always stop the current playback/loading process first.
        if (isPlaying || isLoading) {
            stop();
        }

        // If the user just clicked the button for the audio that was already playing,
        // treat it as a 'stop' action and don't restart.
        if (wasPlayingThisText) {
            return;
        }
        
        // Use a timeout to give the browser a moment to release audio resources
        // before we try to create a new AudioContext.
        await new Promise(resolve => setTimeout(resolve, 100));

        setIsLoading(true);
        setError(null);
        setSpeakingText(text);
        addLog('INFO', `TTS generation started with voice: ${voice}.`);

        try {
            const base64Audio = await performTextToSpeech(text, voice);
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContextRef.current,
                24000,
                1
            );

            sourceNodeRef.current = audioContextRef.current.createBufferSource();
            sourceNodeRef.current.buffer = audioBuffer;
            sourceNodeRef.current.connect(audioContextRef.current.destination);
            
            sourceNodeRef.current.onended = () => {
                stop();
                addLog('INFO', 'TTS playback finished.');
            };

            setIsLoading(false);
            setIsPlaying(true);
            sourceNodeRef.current.start();
            addLog('INFO', 'TTS playback started.');

        } catch (e) {
            const errorMessage = parseApiError(e);
            setError(errorMessage);
            addLog('ERROR', `TTS failed: ${errorMessage}`);
            stop();
        }

    }, [addLog, isLoading, isPlaying, stop, speakingText]);

    return { speak, stop, isLoading, isPlaying, error, speakingText };
};
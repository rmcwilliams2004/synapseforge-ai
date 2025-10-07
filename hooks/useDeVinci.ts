import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Faction, ProjectVersion, DeVinciState, TranscriptEntry, DeVinciVoice } from '../types';
import { buildDeVinciSystemInstruction } from '../services/geminiService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Audio Encoding/Decoding Utilities ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

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

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}


export const useDeVinci = () => {
    const [state, setState] = useState<DeVinciState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const audioRefs = useRef<{
        inputAudioContext?: AudioContext,
        outputAudioContext?: AudioContext,
        scriptProcessor?: ScriptProcessorNode,
        mediaStream?: MediaStream,
        source?: MediaStreamAudioSourceNode,
        nextStartTime: number,
        sources: Set<AudioBufferSourceNode>
    }>({ nextStartTime: 0, sources: new Set() });

    const stopConversation = useCallback(() => {
        if (sessionPromise.current) {
            sessionPromise.current.then(session => session.close());
            sessionPromise.current = null;
        }
        audioRefs.current.mediaStream?.getTracks().forEach(track => track.stop());
        if (audioRefs.current.scriptProcessor) {
            audioRefs.current.scriptProcessor.disconnect();
        }
        if (audioRefs.current.source) {
            audioRefs.current.source.disconnect();
        }
        audioRefs.current.inputAudioContext?.close();
        audioRefs.current.outputAudioContext?.close();
        setState('idle');
    }, []);

    const startConversation = useCallback(async (projectName: string, projectVersion: ProjectVersion, faction: Faction, voice: DeVinciVoice) => {
        if (state !== 'idle') return;

        setState('connecting');
        setTranscript([]);
        
        audioRefs.current = { nextStartTime: 0, sources: new Set() };
        audioRefs.current.inputAudioContext = new (window.AudioContext)({ sampleRate: 16000 });
        audioRefs.current.outputAudioContext = new (window.AudioContext)({ sampleRate: 24000 });

        const outputNode = audioRefs.current.outputAudioContext.createGain();
        outputNode.connect(audioRefs.current.outputAudioContext.destination);

        try {
            audioRefs.current.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error('Microphone access denied:', err);
            setState('error');
            return;
        }

        const systemInstruction = buildDeVinciSystemInstruction(projectName, projectVersion, faction);

        sessionPromise.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
                },
                systemInstruction: systemInstruction,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    const inputCtx = audioRefs.current.inputAudioContext!;
                    const stream = audioRefs.current.mediaStream!;
                    audioRefs.current.source = inputCtx.createMediaStreamSource(stream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    audioRefs.current.scriptProcessor = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromise.current) {
                            sessionPromise.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    audioRefs.current.source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                    setState('listening');
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Transcription
                    if (message.serverContent?.inputTranscription) {
                        const { text, isFinal } = message.serverContent.inputTranscription;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.source === 'user' && !last.isFinal) {
                                return [...prev.slice(0, -1), { source: 'user', text: last.text + text, isFinal }];
                            }
                            return [...prev, { source: 'user', text, isFinal }];
                        });
                         if (isFinal) {
                            setState('thinking');
                        }
                    } else if (message.serverContent?.outputTranscription) {
                        const { text, isFinal } = message.serverContent.outputTranscription;
                         // FIX: Removed condition `if (state !== 'speaking')` to fix a stale closure bug.
                         // The `state` variable was not up-to-date inside this callback, causing the condition to be unreliable.
                         // Setting state unconditionally correctly transitions to 'speaking' when the model starts talking.
                        setState('speaking');
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.source === 'devinci' && !last.isFinal) {
                                return [...prev.slice(0, -1), { source: 'devinci', text: last.text + text, isFinal }];
                            }
                            return [...prev, { source: 'devinci', text, isFinal }];
                        });
                        if (isFinal) {
                            setState('listening');
                        }
                    }
                    
                    // Handle Audio Playback
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        const outputCtx = audioRefs.current.outputAudioContext!;
                        audioRefs.current.nextStartTime = Math.max(audioRefs.current.nextStartTime, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                        const sourceNode = outputCtx.createBufferSource();
                        sourceNode.buffer = audioBuffer;
                        sourceNode.connect(outputNode);
                        sourceNode.addEventListener('ended', () => audioRefs.current.sources.delete(sourceNode));
                        sourceNode.start(audioRefs.current.nextStartTime);
                        audioRefs.current.nextStartTime += audioBuffer.duration;
                        audioRefs.current.sources.add(sourceNode);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    setState('error');
                    stopConversation();
                },
                onclose: () => {
                    setState('idle');
                },
            },
        });

    }, [state, stopConversation]);
    
    useEffect(() => {
        return () => {
            stopConversation();
        }
    }, [stopConversation]);

    return { state, transcript, startConversation, stopConversation };
};
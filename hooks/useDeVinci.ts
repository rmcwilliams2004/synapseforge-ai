import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration } from '@google/genai';
import { Faction, ProjectVersion, DeVinciState, TranscriptEntry, DeVinciVoice, User } from '../types';
import { MOCK_USERS } from '../constants';

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

/**
 * Calculates the Root Mean Square (RMS) volume of a Float32Array with smoothing potential.
 */
const calculateRMS = (data: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    // Amplify slightly for visualization sensitivity and cap at 1
    return Math.min(1, rms * 6); 
};

interface StartConversationConfig {
    systemInstruction: string;
    voice: DeVinciVoice;
    tools?: { functionDeclarations: FunctionDeclaration[] }[];
    onFunctionCall?: (fc: { name: string, args: any, id: string }) => Promise<any>;
    authenticatedUser: User;
}

export const useDeVinci = () => {
    const [state, setState] = useState<DeVinciState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [analyzableFile, setAnalyzableFile] = useState<File | null>(null);
    const [knownSpeakers, setKnownSpeakers] = useState<User[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const [volume, setVolume] = useState(0); // Real-time volume (0 to 1)
    
    const sessionPromise = useRef<ReturnType<typeof ai.live.connect> | null>(null);
    const audioRefs = useRef<{
        inputAudioContext?: AudioContext,
        outputAudioContext?: AudioContext,
        scriptProcessor?: ScriptProcessorNode,
        mediaStream?: MediaStream,
        source?: MediaStreamAudioSourceNode,
        nextStartTime: number,
        sources: Set<AudioBufferSourceNode>
    }>({ nextStartTime: 0, sources: new Set() });
    
    const previousStateRef = useRef<DeVinciState>('listening');
    const configRef = useRef<StartConversationConfig | null>(null);

    const stopConversation = useCallback(() => {
        audioRefs.current.mediaStream?.getTracks().forEach(track => track.stop());
        if (audioRefs.current.scriptProcessor) {
            audioRefs.current.scriptProcessor.disconnect();
            audioRefs.current.scriptProcessor = undefined;
        }
        if (audioRefs.current.source) {
            audioRefs.current.source.disconnect();
            audioRefs.current.source = undefined;
        }

        if (sessionPromise.current) {
            sessionPromise.current.then(session => {
                session?.close();
            });
            sessionPromise.current = null;
        }
        
        audioRefs.current.sources.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        audioRefs.current.sources.clear();
        
        if (audioRefs.current.inputAudioContext && audioRefs.current.inputAudioContext.state !== 'closed') {
            audioRefs.current.inputAudioContext.close().catch(console.error);
        }
        if (audioRefs.current.outputAudioContext && audioRefs.current.outputAudioContext.state !== 'closed') {
            audioRefs.current.outputAudioContext.close().catch(console.error);
        }
        
        setAnalyzableFile(null);
        setKnownSpeakers([]);
        setState('idle');
        setVolume(0);
    }, []);

    const pauseConversation = useCallback(() => {
        if (state === 'listening' || state === 'speaking') {
            previousStateRef.current = state;
            setState('paused');
            audioRefs.current.outputAudioContext?.suspend();
        }
    }, [state]);

    const resumeConversation = useCallback(() => {
        if (state === 'paused') {
            setState(previousStateRef.current);
            audioRefs.current.outputAudioContext?.resume();
        }
    }, [state]);

    const startConversation = useCallback(async (config: StartConversationConfig) => {
        if (state !== 'idle' && state !== 'error' && state !== 'reconnect_failed') {
            stopConversation();
        }
        
        configRef.current = config;

        const connect = async (currentConfig: StartConversationConfig, attempt: number) => {
            if (attempt === 1) {
                setState('connecting');
                setTranscript([]);
                setAnalyzableFile(null);
                setKnownSpeakers([currentConfig.authenticatedUser]);
                audioRefs.current = { nextStartTime: 0, sources: new Set() };
            }

            if (!audioRefs.current.inputAudioContext || audioRefs.current.inputAudioContext.state === 'closed') {
                audioRefs.current.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (!audioRefs.current.outputAudioContext || audioRefs.current.outputAudioContext.state === 'closed') {
                audioRefs.current.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const outputNode = audioRefs.current.outputAudioContext.createGain();
            outputNode.connect(audioRefs.current.outputAudioContext.destination);

            try {
                audioRefs.current.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
                setState('error');
                return;
            }

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: currentConfig.voice } } },
                    systemInstruction: currentConfig.systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: currentConfig.tools,
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
                            
                            // Capture input volume for visualizer
                            const rms = calculateRMS(inputData);
                            setVolume(v => {
                                // If listening, use mic input; if speaking, use model output (handled in onmessage)
                                if (state === 'listening') return rms;
                                return v;
                            });

                            const pcmBlob = createBlob(inputData);
                            sessionPromise.current?.then((session) => {
                               session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        audioRefs.current.source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                        setState('listening');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of audioRefs.current.sources.values()) {
                                try { source.stop(); } catch (e) {}
                            }
                            audioRefs.current.sources.clear();
                            audioRefs.current.nextStartTime = 0;
                            setVolume(0);
                        }

                        if (message.toolCall && currentConfig.onFunctionCall) {
                            setState('thinking');
                            for (const fc of message.toolCall.functionCalls) {
                                const result = await currentConfig.onFunctionCall(fc);
                                sessionPromise.current?.then(session => {
                                    session?.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: JSON.stringify(result) } }
                                    });
                                });
                            }
                        }
                        
                        if (message.serverContent?.outputTranscription) {
                            setState('speaking');
                        }

                        if (message.serverContent?.turnComplete) {
                            setState('listening');
                            setVolume(0);
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = audioRefs.current.outputAudioContext!;
                            audioRefs.current.nextStartTime = Math.max(audioRefs.current.nextStartTime, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            
                            // Measure output volume for speaker visualizer
                            const outputData = audioBuffer.getChannelData(0);
                            setVolume(calculateRMS(outputData));

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
                        stopConversation();
                        setState('error');
                    },
                    onclose: () => {
                        if (state !== 'error') setState('idle');
                    },
                },
            });
        };
        
        connect(config, 1);
    }, [state, stopConversation]);

    const sendFile = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            sessionPromise.current?.then((session) => {
                session.sendRealtimeInput({
                    media: {
                        data: base64Data,
                        mimeType: file.type,
                    }
                });
            });
            setAnalyzableFile(file);
        };
    }, []);

    const simulateNewSpeaker = useCallback(() => {
        const otherUsers = MOCK_USERS.filter(u => !knownSpeakers.some(ks => ks.id === u.id));
        if (otherUsers.length > 0) {
            const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            setKnownSpeakers(prev => [...prev, randomUser]);
        }
    }, [knownSpeakers]);

    return { state, transcript, startConversation, stopConversation, volume, analyzableFile, retryCount, sendFile, simulateNewSpeaker };
};

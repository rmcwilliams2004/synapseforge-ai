import { useState, useRef, useCallback, useEffect } from 'react';
// @google/genai guidelines do not export LiveSession. It will be inferred.
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

// Helper function to convert file to the required Blob format for the session
const fileToSessionBlob = async (file: File): Promise<Blob> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return {
        data: base64Data,
        mimeType: file.type,
    };
};


interface StartConversationConfig {
    systemInstruction: string;
    voice: DeVinciVoice;
    tools?: { functionDeclarations: FunctionDeclaration[] }[];
    onFunctionCall?: (fc: { name: string, args: any, id: string }) => Promise<any>;
    authenticatedUser: User; // Add user for speaker tracking
}

export const useDeVinci = () => {
    const [state, setState] = useState<DeVinciState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [analyzableFile, setAnalyzableFile] = useState<File | null>(null);
    const [knownSpeakers, setKnownSpeakers] = useState<User[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    // FIX: The LiveSession type is not exported. Infer it from the return type of ai.live.connect.
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
    const retryAttemptRef = useRef(1);
    const transcriptRef = useRef(transcript);
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);


    const stopConversation = useCallback(() => {
        // Disconnect audio processing first to prevent further onaudioprocess events
        audioRefs.current.mediaStream?.getTracks().forEach(track => track.stop());
        if (audioRefs.current.scriptProcessor) {
            audioRefs.current.scriptProcessor.disconnect();
            audioRefs.current.scriptProcessor = undefined;
        }
        if (audioRefs.current.source) {
            audioRefs.current.source.disconnect();
            audioRefs.current.source = undefined;
        }

        // Now, safely close the session
        if (sessionPromise.current) {
            sessionPromise.current.then(session => {
                session?.close();
            });
            sessionPromise.current = null;
        }
        
        // Stop any currently playing/scheduled audio buffers
        audioRefs.current.sources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Ignore errors if it's already stopped
            }
        });
        audioRefs.current.sources.clear();
        
        // Finally, close the audio contexts
        if (audioRefs.current.inputAudioContext && audioRefs.current.inputAudioContext.state !== 'closed') {
            audioRefs.current.inputAudioContext.close().catch(console.error);
        }
        if (audioRefs.current.outputAudioContext && audioRefs.current.outputAudioContext.state !== 'closed') {
            audioRefs.current.outputAudioContext.close().catch(console.error);
        }
        
        setAnalyzableFile(null);
        setKnownSpeakers([]);
        setState('idle');
    }, []);

    const pauseConversation = useCallback(() => {
        if (state === 'listening' || state === 'speaking') {
            previousStateRef.current = state;
            setState('paused');
            audioRefs.current.source?.disconnect(audioRefs.current.scriptProcessor!);
            audioRefs.current.outputAudioContext?.suspend();
        }
    }, [state]);

    const resumeConversation = useCallback(() => {
        if (state === 'paused') {
            setState(previousStateRef.current);
            audioRefs.current.source?.connect(audioRefs.current.scriptProcessor!);
            audioRefs.current.outputAudioContext?.resume();
        }
    }, [state]);

    const sendFile = useCallback(async (file: File) => {
        if (!sessionPromise.current) {
            console.error("DeVinci session is not active to send a file.");
            return;
        }

        if (file.type.startsWith('image/')) {
            setAnalyzableFile(file);
        } else {
            setAnalyzableFile(null);
        }

        const session = await sessionPromise.current;

        // Manually add user prompt to transcript to give immediate feedback
        const userPromptText = `(Uploaded file: ${file.name}) Please analyze this file and provide a detailed description.`;
        setTranscript(prev => {
            const last = prev[prev.length - 1];
            const speakerName = knownSpeakers[0]?.name;
            // Finalize previous user turn if it's still in-progress
            if (last?.source === 'user' && !last.isFinal) {
                const finalLast = { ...last, isFinal: true };
                return [...prev.slice(0, -1), finalLast, { source: 'user', text: userPromptText, isFinal: true, speakerName }];
            }
            return [...prev, { source: 'user', text: userPromptText, isFinal: true, speakerName }];
        });
        
        // Convert file and send both the media and a text prompt
        const mediaBlob = await fileToSessionBlob(file);
        session.sendRealtimeInput({ media: mediaBlob });
        session.sendRealtimeInput({ text: "Please analyze the file I just uploaded and provide a detailed description." });
    }, [knownSpeakers]);

    const sendImageRegion = useCallback(async (croppedFile: File, originalFileName: string) => {
        if (!sessionPromise.current) {
            console.error("DeVinci session is not active to send an image region.");
            return;
        }

        const session = await sessionPromise.current;
        const userPromptText = `(Selected a region from ${originalFileName}) Analyze this specific part.`;
        
        setTranscript(prev => {
            const last = prev[prev.length - 1];
            const speakerName = knownSpeakers[0]?.name;
            if (last?.source === 'user' && !last.isFinal) {
                const finalLast = { ...last, isFinal: true };
                return [...prev.slice(0, -1), finalLast, { source: 'user', text: userPromptText, isFinal: true, speakerName }];
            }
            return [...prev, { source: 'user', text: userPromptText, isFinal: true, speakerName }];
        });

        const mediaBlob = await fileToSessionBlob(croppedFile);
        session.sendRealtimeInput({ media: mediaBlob });
        session.sendRealtimeInput({ text: "Please analyze the selected region of the image I just sent." });

    }, [knownSpeakers]);

    const simulateNewSpeaker = useCallback(() => {
        const unintroducedUsers = MOCK_USERS.filter(mockUser => !knownSpeakers.some(known => known.id === mockUser.id));
        if (unintroducedUsers.length === 0) {
            // No new users to add, maybe show a message
            return;
        }
        const newSpeaker = unintroducedUsers[Math.floor(Math.random() * unintroducedUsers.length)];

        setTranscript(prev => [
            ...prev,
            { source: 'devinci', text: "I'm detecting a new voice in the conversation. Could you please introduce yourself?", isFinal: true },
            { source: 'user', text: `Hi DeVinci, this is ${newSpeaker.name.split(' ')[0]}.`, isFinal: true, speakerName: newSpeaker.name },
            { source: 'devinci', text: `Welcome, ${newSpeaker.name.split(' ')[0]}! Glad to have you in the discussion.`, isFinal: true },
        ]);
        setKnownSpeakers(prev => [...prev, newSpeaker]);
    }, [knownSpeakers]);

    const startConversation = useCallback(async (config: StartConversationConfig) => {
        if (state !== 'idle' && state !== 'error' && state !== 'reconnect_failed') {
            stopConversation();
        }
        
        configRef.current = config;
        retryAttemptRef.current = 1;

        // This inner function handles the actual connection and can be called for retries.
        const connect = async (currentConfig: StartConversationConfig, attempt: number) => {
            if (attempt === 1) { // This is a fresh start
                setState('connecting');
                setTranscript([]);
                setAnalyzableFile(null);
                setKnownSpeakers([currentConfig.authenticatedUser]);
                audioRefs.current = { nextStartTime: 0, sources: new Set() };
                setRetryCount(0);
            } else {
                setState('reconnecting');
            }

            // Clean up any previous session/audio processors before connecting/reconnecting
            audioRefs.current.scriptProcessor?.disconnect();
            audioRefs.current.source?.disconnect();
            if(sessionPromise.current) await sessionPromise.current.then(s => s.close());

            // Initialize audio contexts if they don't exist or are closed
            if (!audioRefs.current.inputAudioContext || audioRefs.current.inputAudioContext.state === 'closed') {
                audioRefs.current.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (!audioRefs.current.outputAudioContext || audioRefs.current.outputAudioContext.state === 'closed') {
                audioRefs.current.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const outputNode = audioRefs.current.outputAudioContext.createGain();
            outputNode.connect(audioRefs.current.outputAudioContext.destination);

            // Re-acquire microphone stream if needed
            if (!audioRefs.current.mediaStream || audioRefs.current.mediaStream.getTracks().every(t => t.readyState === 'ended')) {
                try {
                    audioRefs.current.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (err) {
                    console.error('Microphone access denied:', err);
                    setState('error');
                    stopConversation();
                    return;
                }
            }

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
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
                        retryAttemptRef.current = 1; // Reset on successful connection
                        const inputCtx = audioRefs.current.inputAudioContext!;
                        const stream = audioRefs.current.mediaStream!;
                        audioRefs.current.source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        audioRefs.current.scriptProcessor = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
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
                        retryAttemptRef.current = 1; // Reset on successful message
                        if (message.toolCall && currentConfig.onFunctionCall) {
                            setState('thinking');
                            for (const fc of message.toolCall.functionCalls) {
                                const result = await currentConfig.onFunctionCall(fc);
                                sessionPromise.current?.then(session => {
                                    if (session) {
                                        session.sendToolResponse({
                                            functionResponses: { id: fc.id, name: fc.name, response: { result: JSON.stringify(result) } }
                                        });
                                    }
                                });
                            }
                        }
                        if (message.serverContent?.inputTranscription) {
                            const { text } = message.serverContent.inputTranscription;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                const speakerName = knownSpeakers[0]?.name;
                                if (last?.source === 'user' && !last.isFinal) {
                                    return [...prev.slice(0, -1), { source: 'user', text: last.text + text, isFinal: false, speakerName }];
                                }
                                return [...prev, { source: 'user', text, isFinal: false, speakerName }];
                            });
                        } else if (message.serverContent?.outputTranscription) {
                            setState('speaking'); 
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.source === 'user' && !last.isFinal) {
                                    return [...prev.slice(0, -1), { ...last, isFinal: true }];
                                }
                                return prev;
                            });
                            const { text } = message.serverContent.outputTranscription;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.source === 'devinci' && !last.isFinal) {
                                    return [...prev.slice(0, -1), { source: 'devinci', text: last.text + text, isFinal: false }];
                                }
                                return [...prev, { source: 'devinci', text, isFinal: false }];
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last && !last.isFinal) {
                                    return [...prev.slice(0, -1), { ...last, isFinal: true }];
                                }
                                return prev;
                            });
                            setState('listening');
                        }
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
                        const errorMessage = (e as any).message || '';
                        const isServiceUnavailable = errorMessage.includes('The service is currently unavailable.');
                        
                        if (isServiceUnavailable && attempt < 4) {
                            console.warn(`DeVinci session unavailable (attempt ${attempt}), retrying...`);
                            setRetryCount(attempt);
                            const delay = Math.min(1000 * (2 ** (attempt - 1)), 8000); // 1s, 2s, 4s
                            setTimeout(() => {
                                const originalConfig = configRef.current;
                                if (!originalConfig) {
                                    setState('error');
                                    stopConversation();
                                    return;
                                }
                                const transcriptHistory = transcriptRef.current.map(t => `${t.speakerName || (t.source === 'user' ? originalConfig.authenticatedUser.name.split(' ')[0] : 'DeVinci')}: ${t.text}`).join('\n');
                                const augmentedSystemInstruction = `${originalConfig.systemInstruction}\n\n--- CONVERSATION RECOVERY ---\nYour previous session was interrupted. You are now reconnected. Please continue the conversation based on the history provided below. Do not mention the interruption.\n\nTRANSCRIPT:\n${transcriptHistory}`;
                                connect({ ...originalConfig, systemInstruction: augmentedSystemInstruction }, attempt + 1);
                            }, delay);
                        } else {
                            console.error('Session error:', e);
                            stopConversation(); // Cleans up and sets state to 'idle'
                            if (isServiceUnavailable) { // We've exhausted retries
                                setState('reconnect_failed');
                            } else {
                                setState('error');
                            }
                        }
                    },
                    onclose: (e: CloseEvent) => {
                        if (state !== 'reconnecting' && state !== 'error' && state !== 'reconnect_failed') {
                           setState('idle');
                        }
                    },
                },
            });
        };
        
        connect(config, 1);
    }, [state, stopConversation]);
    
    useEffect(() => {
        return () => {
            stopConversation();
        }
    }, [stopConversation]);

    const manualRetry = useCallback(() => {
        if (configRef.current) {
            startConversation(configRef.current);
        }
    }, [startConversation]);

    return { state, transcript, startConversation, stopConversation, sendFile, pauseConversation, resumeConversation, analyzableFile, sendImageRegion, simulateNewSpeaker, manualRetry, retryCount };
};
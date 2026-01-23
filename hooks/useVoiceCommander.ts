import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { VoiceCommanderState } from '../types';
import { showSectionFunctionDeclaration, downloadDrawingsFunctionDeclaration, generateVideoFunctionDeclaration } from '../services/geminiService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Audio Encoding/Decoding Utilities (from Live API implementation) ---
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

interface VoiceCommanderCallbacks {
    onNavigate: (sectionId: string) => void;
    onDownloadDrawings: () => void;
    onGenerateVideo: (prompt: string, useUploadedImage: boolean) => void;
}

export const useVoiceCommander = ({ onNavigate, onDownloadDrawings, onGenerateVideo }: VoiceCommanderCallbacks) => {
    const [state, setState] = useState<VoiceCommanderState>('idle');
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

    const stopListening = useCallback(() => {
        audioRefs.current.mediaStream?.getTracks().forEach(track => track.stop());
        audioRefs.current.scriptProcessor?.disconnect();
        audioRefs.current.source?.disconnect();

        if (sessionPromise.current) {
            sessionPromise.current.then(session => session?.close());
            sessionPromise.current = null;
        }
        
        audioRefs.current.sources.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        audioRefs.current.sources.clear();
        
        audioRefs.current.inputAudioContext?.close().catch(console.error);
        audioRefs.current.outputAudioContext?.close().catch(console.error);
        
        setState('idle');
    }, []);

    const startListening = useCallback(async () => {
        if (state !== 'idle') return;

        setState('listening');
        audioRefs.current = { nextStartTime: 0, sources: new Set() };
        
        try {
            audioRefs.current.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error('Microphone access denied:', err);
            setState('error');
            return;
        }

        audioRefs.current.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioRefs.current.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = audioRefs.current.outputAudioContext.createGain();
        outputNode.connect(audioRefs.current.outputAudioContext.destination);

        sessionPromise.current = ai.live.connect({
            // Model updated to the latest 12-2025 version for better real-time audio performance
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                systemInstruction: "You are a voice command assistant for a web application. Your job is to listen for user commands and call the appropriate function. You can navigate to sections using 'show_section', download all drawings as a zip file using 'download_drawings', or generate a video using 'generate_video'. Be concise in your audio responses, like 'Okay', 'Navigating', or 'Starting video generation'.",
                tools: [{ functionDeclarations: [showSectionFunctionDeclaration, downloadDrawingsFunctionDeclaration, generateVideoFunctionDeclaration] }],
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
                        sessionPromise.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    audioRefs.current.source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle model interruption: stop all currently playing audio chunks
                    const interrupted = message.serverContent?.interrupted;
                    if (interrupted) {
                        for (const source of audioRefs.current.sources.values()) {
                            try { source.stop(); } catch (e) {}
                        }
                        audioRefs.current.sources.clear();
                        audioRefs.current.nextStartTime = 0;
                    }

                    if (message.toolCall) {
                        setState('thinking');
                        for (const fc of message.toolCall.functionCalls) {
                            let responseResult = 'ok';
                            if (fc.name === 'show_section' && fc.args.sectionId) {
                                onNavigate(fc.args.sectionId);
                            } else if (fc.name === 'download_drawings') {
                                onDownloadDrawings();
                                responseResult = 'download started';
                            } else if (fc.name === 'generate_video' && fc.args.prompt) {
                                onGenerateVideo(fc.args.prompt, fc.args.useUploadedImage || false);
                                responseResult = 'video generation started';
                            }
                            
                            sessionPromise.current?.then(session => {
                                session.sendToolResponse({
                                    functionResponses: { id: fc.id, name: fc.name, response: { result: responseResult } }
                                });
                            });
                        }
                    }
                    if (message.serverContent?.turnComplete) {
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
                    console.error('Voice Commander Error:', e);
                    setState('error');
                    stopListening();
                },
                onclose: () => {
                     if (state !== 'error') {
                        setState('idle');
                     }
                },
            },
        });
    }, [state, onNavigate, stopListening, onDownloadDrawings, onGenerateVideo]);

    useEffect(() => {
        return () => {
            stopListening();
        }
    }, [stopListening]);

    return { state, startListening, stopListening };
};
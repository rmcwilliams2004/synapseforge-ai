
import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceInterfaceMode, VoiceTranscriptEntry, FactionId } from '../types';
import { useTts } from './useTts';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface ForgeVoiceCallbacks {
    onSwitchLens: (factionId: FactionId) => void;
    onSetMaterial: (materialName: string) => void;
    onUpdateParam: (param: string, delta: number) => void;
    onGenerateCertificate: () => void;
    onSealBundle: () => void;
    onAddLog: (level: 'INFO' | 'WARN' | 'ERROR', message: string) => void;
    onStartAnalysis: () => void;
    onOpenManual: () => void;
    onOpenTechDoc: () => void;
    onSwitchView: (view: 'app' | 'admin' | 'suite' | 'pricing' | 'account') => void;
    onNavigateSection: (sectionId: string) => void;
}

export const useForgeVoice = (
    mode: VoiceInterfaceMode, 
    tts: ReturnType<typeof useTts>,
    callbacks: ForgeVoiceCallbacks
) => {
    const [isListening, setIsListening] = useState(false);
    const [transcripts, setTranscripts] = useState<VoiceTranscriptEntry[]>([]);
    const recognitionRef = useRef<any>(null);
    const isProcessingRef = useRef(false);

    const addTranscript = (text: string, intent?: string, status: VoiceTranscriptEntry['status'] = 'PENDING') => {
        const entry: VoiceTranscriptEntry = {
            id: `vt-${Date.now()}`,
            text,
            intent,
            timestamp: new Date().toISOString(),
            status
        };
        setTranscripts(prev => [entry, ...prev].slice(0, 10));
        return entry;
    };

    const handleIntent = useCallback((text: string) => {
        const command = text.toLowerCase();
        // Wake word requirement: "Forge"
        if (!command.includes("forge")) return;

        isProcessingRef.current = true;
        window.dispatchEvent(new CustomEvent('forge-log', { detail: `[VOICE_HUD]: Captured intent: "${text}"` }));

        // 1. Lens Change
        if (command.includes("switch to") && (command.includes("lens") || command.includes("philosophy") || command.includes("perspective"))) {
            if (command.includes("advanced") || command.includes("materials")) {
                callbacks.onSwitchLens(FactionId.ADVANCED_MATERIALS);
                tts.speak("Switching to Advanced Materials and Processes lens. Calibrating physics mesh.", "Zephyr");
                addTranscript(text, "LENS_CHANGE", "EXECUTED");
            } else if (command.includes("pragmatic") || command.includes("production")) {
                callbacks.onSwitchLens(FactionId.PRAGMATIC_PRODUCTION);
                tts.speak("Switching to Pragmatic and Production-Oriented lens. Optimizing for supply chain.", "Zephyr");
                addTranscript(text, "LENS_CHANGE", "EXECUTED");
            } else if (command.includes("systems") || command.includes("automation")) {
                callbacks.onSwitchLens(FactionId.SYSTEMS_AUTOMATION);
                tts.speak("Switching to Systems and Automation lens. Mapping recursive logic gates.", "Zephyr");
                addTranscript(text, "LENS_CHANGE", "EXECUTED");
            }
        }
        // 2. Navigation - Views
        else if (command.includes("go to") || command.includes("open") || command.includes("switch to")) {
            if (command.includes("admin") || command.includes("dashboard") || command.includes("console")) {
                callbacks.onSwitchView('admin');
                tts.speak("Opening Administration Dashboard.", "Zephyr");
                addTranscript(text, "VIEW_NAV", "EXECUTED");
            } else if (command.includes("suite") || command.includes("tool") || command.includes("engineering tools")) {
                callbacks.onSwitchView('suite');
                tts.speak("Initializing Engineering Tool Suite.", "Zephyr");
                addTranscript(text, "VIEW_NAV", "EXECUTED");
            } else if (command.includes("workspace") || command.includes("main") || command.includes("forge")) {
                callbacks.onSwitchView('app');
                tts.speak("Returning to the main Workspace.", "Zephyr");
                addTranscript(text, "VIEW_NAV", "EXECUTED");
            } else if (command.includes("account") || command.includes("profile") || command.includes("identity")) {
                callbacks.onSwitchView('account');
                tts.speak("Opening Identity and Account settings.", "Zephyr");
                addTranscript(text, "VIEW_NAV", "EXECUTED");
            } else if (command.includes("pricing") || command.includes("billing") || command.includes("license")) {
                callbacks.onSwitchView('pricing');
                tts.speak("Opening Licensing and Pricing options.", "Zephyr");
                addTranscript(text, "VIEW_NAV", "EXECUTED");
            }
            // Documentation sub-cases
            else if (command.includes("manual") || command.includes("guide")) {
                callbacks.onOpenManual();
                tts.speak("Opening User Manual.", "Zephyr");
                addTranscript(text, "DOC_OPEN", "EXECUTED");
            } else if (command.includes("technical documentation") || command.includes("tech doc")) {
                callbacks.onOpenTechDoc();
                tts.speak("Opening Technical Documentation.", "Zephyr");
                addTranscript(text, "DOC_OPEN", "EXECUTED");
            }
            // Section Navigation sub-cases
            else if (command.includes("summary") || command.includes("executive")) {
                callbacks.onNavigateSection('executive_summary');
                addTranscript(text, "SECTION_NAV", "EXECUTED");
            } else if (command.includes("bom") || command.includes("materials list")) {
                callbacks.onNavigateSection('bom');
                addTranscript(text, "SECTION_NAV", "EXECUTED");
            } else if (command.includes("cost") || command.includes("pricing")) {
                callbacks.onNavigateSection('live_costing');
                addTranscript(text, "SECTION_NAV", "EXECUTED");
            } else if (command.includes("patent") || command.includes("intellectual property")) {
                callbacks.onNavigateSection('patent_application');
                addTranscript(text, "SECTION_NAV", "EXECUTED");
            }
        }
        // 3. Analysis Control
        else if (command.includes("start analysis") || command.includes("begin analysis") || command.includes("engage")) {
            callbacks.onStartAnalysis();
            tts.speak("Analysis sequence initiated. Engaging SynapseForge AI.", "Zephyr");
            addTranscript(text, "ANALYSIS_START", "EXECUTED");
        }
        // 4. Material Control
        else if (command.includes("set material to") || command.includes("change material to")) {
            const matName = text.split(/to /i)[1];
            if (matName) {
                callbacks.onSetMaterial(matName.trim());
                tts.speak(`Awaiting NAL confirmation for ${matName} properties. Adjusting stress HUD.`, "Zephyr");
                addTranscript(text, "MATERIAL_CHANGE", "EXECUTED");
            }
        }
        // 5. Param Tuning
        else if (command.includes("increase thickness") || command.includes("make it thicker")) {
             callbacks.onUpdateParam("Thickness", 10);
             tts.speak("Increasing wall thickness. Recalculating safety factor.", "Zephyr");
             addTranscript(text, "PARAM_UPDATE", "EXECUTED");
        }
        // 6. IP & Bundle
        else if (command.includes("generate") && (command.includes("certificate") || command.includes("patent"))) {
            callbacks.onGenerateCertificate();
            tts.speak("Synthesizing Innovation Certificate.", "Zephyr");
            addTranscript(text, "TRIGGER_IP", "EXECUTED");
        }
        else if (command.includes("seal") && (command.includes("bundle") || command.includes("vault"))) {
            callbacks.onSealBundle();
            addTranscript(text, "SEAL_BUNDLE", "EXECUTED");
        }
        else {
            addTranscript(text, "UNKNOWN", "REJECTED");
            tts.speak("Command not recognized. Please consult the User Manual for supported voice protocols.", "Zephyr");
        }

        setTimeout(() => { isProcessingRef.current = false; }, 2000);
    }, [callbacks, tts]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            // Auto-restart if in ALWAYS_ON mode
            if (mode === 'ALWAYS_ON') {
                try {
                    recognition.start();
                } catch(e) {
                    console.error("Failed to restart speech recognition", e);
                }
            }
        };

        recognition.onresult = (event: any) => {
            const text = event.results[event.results.length - 1][0].transcript;
            handleIntent(text);
        };

        recognitionRef.current = recognition;

        if (mode === 'ALWAYS_ON') {
            recognition.start();
        }

        return () => {
            recognition.stop();
        };
    }, [mode, handleIntent]);

    const toggleManual = () => {
        if (mode === 'MANUAL') {
            if (isListening) recognitionRef.current?.stop();
            else recognitionRef.current?.start();
        }
    };

    return { isListening, transcripts, toggleManual };
};

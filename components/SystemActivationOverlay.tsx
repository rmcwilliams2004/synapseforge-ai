import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, SystemState, IoStatus, ExportStatus, VoiceInterfaceMode, VoiceTranscriptEntry, NalPrecision } from '../types';
import { useTts } from '../hooks/useTts';

const LOG_LINES = [
    "[INFO] NAL_CORE::Initialization sequence synchronized.",
    "[INFO] DISCIPLINARY_AGENT_GRID::Standby mode active.",
    "[INFO] MULTI_TENANT_VAULT::Isolation layer established.",
    "[INFO] IP_SOVEREIGNTY_LEDGER::Integrity check: 100%",
    "[DEBUG] AES_256_ENCRYPTION::Handshake successful.",
    "[INFO] SIMULATION_ENGINE::Mesh accuracy calibrated.",
    "[INFO] SYNTHESIS_ORCHESTRATOR::Awaiting disciplinary ore.",
    "[SUCCESS] Sovereign environment primed for forging."
];

export const SystemStatusIndicator: React.FC<{ isVoiceActive?: boolean }> = ({ isVoiceActive }) => {
    return (
        <div className="fixed bottom-8 left-8 z-[60] flex items-center gap-3 animate-fade-in pointer-events-none select-none group">
            <div className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${isVoiceActive ? 'bg-red-500' : 'bg-brand-cyan'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px] ${isVoiceActive ? 'bg-red-500 shadow-red-500' : 'bg-brand-cyan shadow-brand-cyan'}`}></span>
            </div>
            <span className="text-[9px] font-black text-brand-cyan uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {isVoiceActive ? 'Voice Monitoring Active' : 'Forge Ready'}
            </span>
        </div>
    );
};

interface DiagnosticsPanelProps {
    isOpen: boolean;
    user: User | null;
    tts: ReturnType<typeof useTts>;
    onUpdateUser?: (updates: Partial<User>) => void;
    systemState: SystemState;
    ioStatus: IoStatus;
    exportStatus: ExportStatus;
    voiceMode: VoiceInterfaceMode;
    setVoiceMode: (mode: VoiceInterfaceMode) => void;
    voiceTranscripts: VoiceTranscriptEntry[];
    nalPrecision: NalPrecision;
    targetPrecision: NalPrecision;
    setTargetPrecision: (precision: NalPrecision) => void;
    onForceFlush: () => void;
    onForceStable: () => void;
    onDefrost: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ 
    isOpen, user, tts, onUpdateUser, systemState, ioStatus, exportStatus, 
    voiceMode, setVoiceMode, voiceTranscripts, nalPrecision, targetPrecision, setTargetPrecision,
    onForceFlush, onForceStable, onDefrost 
}) => {
    const [lines, setLines] = useState<string[]>([]);
    const [ioDetails, setIoDetails] = useState<{status: IoStatus, progress: number}>({ status: 'IDLE', progress: 0 });
    const isAdmin = user?.role === Role.Admin;
    
    const [telemetry, setTelemetry] = useState({
        heartbeat: 1240,
        latency: 12,
        cpu: 24,
        mem: 1.2,
        nalLoad: 5
    });

    useEffect(() => {
        const handleIo = (e: any) => setIoDetails(e.detail);
        window.addEventListener('forge-io', handleIo);
        return () => window.removeEventListener('forge-io', handleIo);
    }, []);

    useEffect(() => {
        if (!isOpen || !isAdmin) return;
        
        const logInterval = setInterval(() => {
            setLines(prev => {
                const nextLines = [...prev, LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)]];
                if (nextLines.length > 20) nextLines.shift();
                return nextLines;
            });
            
            setTelemetry(prev => ({
                heartbeat: 1200 + Math.floor(Math.random() * 100),
                latency: 8 + Math.floor(Math.random() * 10),
                cpu: (nalPrecision === NalPrecision.FOUNDRY ? 85 : nalPrecision === NalPrecision.ANALYSIS ? 40 : 15) + Math.floor(Math.random() * 10),
                mem: 1.1 + (Math.random() * 0.4),
                nalLoad: nalPrecision === NalPrecision.FOUNDRY ? 98 : nalPrecision === NalPrecision.ANALYSIS ? 45 : 12
            }));
        }, 150).valueOf();

        const handleForgeLog = (e: any) => {
            const msg = e.detail;
            setLines(prev => [...prev, `[EVENT] ${msg}`].slice(-25));
        };
        window.addEventListener('forge-log', handleForgeLog);

        return () => {
            clearInterval(logInterval);
            window.removeEventListener('forge-log', handleForgeLog);
        };
    }, [isOpen, isAdmin, nalPrecision]);

    if (!isOpen || !isAdmin) return null;

    const precisionLabel = targetPrecision === NalPrecision.DRAFT ? 'DRAFT' : targetPrecision === NalPrecision.ANALYSIS ? 'ANALYSIS' : 'FOUNDRY';

    return (
        <div className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl p-12 flex flex-col justify-between pointer-events-auto animate-fade-in border-[12px] border-brand-cyan/5 overflow-y-auto">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-brand-cyan uppercase tracking-[0.4em] italic leading-none">Admin Telemetry HUD</h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">NAL v12.1.2 // Secure Session: {user?.id.slice(-12)}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">State:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                systemState === SystemState.STABLE ? 'bg-green-900/40 text-green-400 border-green-500/30' :
                                systemState === SystemState.DEEP_SOLVE ? 'bg-purple-900/40 text-purple-400 border-purple-500/30 animate-pulse' :
                                systemState === SystemState.CALIBRATING ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' :
                                'bg-gray-800 text-gray-400 border-gray-700'
                            }`}>
                                {systemState}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">I/O Bus:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                ioDetails.status === 'IDLE' ? 'bg-gray-800 text-gray-400' :
                                ioDetails.status === 'JAMMED' ? 'bg-red-900/40 text-red-400 border-red-500/30 animate-pulse' :
                                'bg-blue-900/40 text-blue-400 border-blue-500/30'
                            }`}>
                                {ioDetails.status} ({ioDetails.progress}%)
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    {/* NAL Precision Controller */}
                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl w-64 shadow-xl">
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">NAL Precision</span>
                            <span className={`text-[10px] font-black uppercase ${nalPrecision === NalPrecision.FOUNDRY ? 'text-purple-400' : 'text-cyan-400'}`}>{precisionLabel}</span>
                        </div>
                        <div className="space-y-4">
                            <input 
                                type="range"
                                min="0"
                                max="2"
                                step="1"
                                value={targetPrecision === NalPrecision.DRAFT ? 0 : targetPrecision === NalPrecision.ANALYSIS ? 1 : 2}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTargetPrecision(val === 0 ? NalPrecision.DRAFT : val === 1 ? NalPrecision.ANALYSIS : NalPrecision.FOUNDRY);
                                }}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                            />
                            <div className="flex justify-between px-1">
                                <span className="text-[8px] font-black text-gray-600 uppercase">Speed</span>
                                <span className="text-[8px] font-black text-gray-600 uppercase">Balance</span>
                                <span className="text-[8px] font-black text-gray-600 uppercase">IP-Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Voice Controller */}
                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl w-64 shadow-xl">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Voice Listener</span>
                            <div className={`w-2 h-2 rounded-full ${voiceMode === 'ALWAYS_ON' ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button 
                                onClick={() => setVoiceMode('ALWAYS_ON')}
                                className={`py-1 text-[8px] font-black uppercase tracking-tighter border rounded-lg transition-all ${voiceMode === 'ALWAYS_ON' ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-900 text-gray-500 border-gray-700'}`}
                            >
                                Active Monitor
                            </button>
                            <button 
                                onClick={() => setVoiceMode('MANUAL')}
                                className={`py-1 text-[8px] font-black uppercase tracking-tighter border rounded-lg transition-all ${voiceMode === 'MANUAL' ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-900 text-gray-500 border-gray-700'}`}
                            >
                                Manual Only
                            </button>
                        </div>
                    </div>

                    {/* Logic Controller */}
                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl w-64 shadow-xl">
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Logic Interlock</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                         </div>
                         <div className="grid grid-cols-1 gap-2">
                             <button 
                                onClick={onForceFlush}
                                className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-lg text-[9px] font-black text-red-500 uppercase tracking-widest transition-all active:scale-95"
                             >
                                Flush Inference
                             </button>
                             <button 
                                onClick={onForceStable}
                                className="w-full py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 rounded-lg text-[9px] font-black text-green-500 uppercase tracking-widest transition-all active:scale-95"
                             >
                                Force Converge
                             </button>
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 my-12 grid grid-cols-12 gap-8 overflow-hidden">
                <div className="col-span-8 flex flex-col justify-end pointer-events-none">
                    <div className="font-mono text-[11px] text-brand-cyan/80 space-y-1 w-full overflow-hidden">
                        <div className="text-white text-[10px] uppercase font-black tracking-widest mb-4">Live Bus Telemetry</div>
                        {lines.map((line, i) => (
                            <div key={i} className="animate-slide-in-up whitespace-nowrap overflow-hidden flex gap-4">
                                <span className="text-gray-600 w-24">[{new Date().toLocaleTimeString()}]</span>
                                <span className="truncate">{line}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="col-span-4 flex flex-col gap-4">
                    <div className="bg-black/40 border border-gray-800 p-6 rounded-2xl flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Speech-to-Intent Monitor</span>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {voiceTranscripts.length === 0 ? (
                                        <p className="text-[10px] text-gray-600 italic">No voice commands detected.</p>
                                    ) : (
                                        voiceTranscripts.map(entry => (
                                            <div key={entry.id} className="p-2 bg-gray-900 rounded-lg border border-gray-700/50">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                                        entry.status === 'EXECUTED' ? 'bg-green-900/40 text-green-400' : 
                                                        entry.status === 'REJECTED' ? 'bg-red-900/40 text-red-400' : 'bg-gray-700 text-gray-300'
                                                    }`}>
                                                        {entry.intent || 'VOICE_INTAKE'}
                                                    </span>
                                                    <span className="text-[8px] text-gray-600">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-300 leading-tight">"{entry.text}"</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">NAL Computational Load</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-brand-cyan italic">{telemetry.nalLoad}%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-brand-cyan transition-all duration-300" style={{ width: `${telemetry.nalLoad}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">System Resource Drain</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white italic">{telemetry.cpu}%</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${telemetry.cpu}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-800 pt-12">
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">NAL Heartbeat</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-brand-cyan italic">{telemetry.heartbeat}</span>
                        <span className="text-[10px] text-gray-500">ops/sec</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Precision Tier</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-green-400 italic uppercase tracking-tighter">{nalPrecision.toFixed(3)} SEN</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Export Queue</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-indigo-400 italic leading-none uppercase tracking-tighter">{exportStatus}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
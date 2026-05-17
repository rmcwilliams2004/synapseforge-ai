import React, { useState } from 'react';
import { Section } from './Section';
import { PhysicsViewport } from './PhysicsViewport';
import { VideoCadViewer, CadOperation } from './VideoCadViewer';
import { CadData, PhysicsValidationResult, GeneratedDrawing, AnalysisResult } from '../../types';
import { Video, Upload } from 'lucide-react';

interface CadSynthesisSectionProps {
    cadData: CadData | null;
    physicsResult: PhysicsValidationResult | null;
    isPhysicsActive: boolean;
    onOpenCadViewer: () => void;
    onGenerateCad: (drawings: GeneratedDrawing[], result: AnalysisResult) => Promise<CadData | null>;
    isCadLoading: boolean;
    drawings: GeneratedDrawing[];
    result: AnalysisResult;
    onAddLocalSnapshot?: (dataUrl: string, prompt: string) => void;
    onRunAudit: () => void;
    onAutoCorrect?: () => void;
}

export const CadSynthesisSection: React.FC<CadSynthesisSectionProps> = ({
    cadData,
    physicsResult,
    isPhysicsActive,
    onOpenCadViewer,
    onGenerateCad,
    isCadLoading,
    drawings,
    result,
    onAddLocalSnapshot,
    onRunAudit,
    onAutoCorrect
}) => {
    const [isVideoCadActive, setIsVideoCadActive] = useState(false);
    const [videoOperations, setVideoOperations] = useState<CadOperation[]>([]);
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsVideoLoading(true);
        window.dispatchEvent(new CustomEvent('run-video-to-foundry', { detail: { file } }));
        
        // Simulate API call to /api/foundry/video-to-cad
        setTimeout(() => {
            setVideoOperations([
                {
                    type: "sketch_circle",
                    parameters: { radius: 150.0, plane: "XY" }
                },
                {
                    type: "extrude_hull",
                    parameters: {
                        depth: 300.0,
                        material: "Hydro-Heliogel",
                        density: 0.08,
                        wall_thickness: 2.5,
                        lattice_spacing: 15.0
                    }
                },
                {
                    type: "verify_displacement",
                    parameters: {
                        target_lift: "15% increase",
                        status: "Verified via VideoCAD VQA"
                    }
                }
            ]);
            setIsVideoLoading(false);
            setIsVideoCadActive(true);
        }, 2000);
    };

    return (
        <Section id="physics_visualization" title="3D CAD Synthesis" actions={cadData ? <button onClick={onOpenCadViewer} className="text-xs font-bold text-brand-cyan hover:underline focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded">Launch Advanced Viewer</button> : null}>
            {!cadData && !isVideoCadActive ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center space-y-4 flex flex-col items-center justify-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Synthesize a 3D model based on technical deconstruction.</p>
                        <button 
                            onClick={() => onGenerateCad(drawings, result)}
                            disabled={isCadLoading || isVideoLoading}
                            className="px-6 py-2 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 dark:focus:ring-offset-slate-800 active:scale-95"
                        >
                            {isCadLoading ? 'Generating CAD...' : 'Generate 3D Model'}
                        </button>
                    </div>
                    
                    <div className="bg-slate-900 p-10 rounded-xl border border-slate-700 text-center space-y-4 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Video className="w-8 h-8 text-brand-cyan mb-2" />
                        <p className="text-sm text-slate-300 font-medium">Video-to-Foundry Pipeline</p>
                        <p className="text-xs text-slate-500">Upload craft footage to extract CAD operations via VideoCADFormer.</p>
                        
                        <label className={`mt-4 px-6 py-2 bg-slate-800 text-brand-cyan font-bold rounded-lg border border-brand-cyan/30 hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand-cyan focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 active:scale-95 ${isVideoLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-4 h-4" />
                            {isVideoLoading ? 'Processing Video...' : 'Upload .MP4'}
                            <input type="file" accept="video/mp4" className="hidden" onChange={handleVideoUpload} />
                        </label>
                    </div>
                </div>
            ) : isVideoCadActive ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Video className="w-4 h-4 text-brand-cyan" />
                            VideoCAD Extracted Operations
                        </h3>
                        <button 
                            onClick={() => setIsVideoCadActive(false)}
                            className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded"
                        >
                            Return to Standard Synthesis
                        </button>
                    </div>
                    <VideoCadViewer 
                        operations={videoOperations} 
                        onComplete={() => console.log('VideoCAD playback complete')} 
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <PhysicsViewport 
                        cadData={cadData!} 
                        physicsResult={physicsResult} 
                        isPhysicsActive={isPhysicsActive} 
                        onAddSnapshot={onAddLocalSnapshot} 
                        onRunAudit={onRunAudit}
                        onAutoCorrect={onAutoCorrect}
                    />
                </div>
            )}
        </Section>
    );
};

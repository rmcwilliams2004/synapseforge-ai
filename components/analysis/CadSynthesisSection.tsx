import React from 'react';
import { Section } from './Section';
import { PhysicsViewport } from './PhysicsViewport';
import { CadData, PhysicsValidationResult, GeneratedDrawing, AnalysisResult } from '../../types';

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
    return (
        <Section id="physics_visualization" title="3D CAD Synthesis" actions={cadData ? <button onClick={onOpenCadViewer} className="text-xs font-bold text-brand-cyan hover:underline">Launch Advanced Viewer</button> : null}>
            {!cadData ? (
                <div className="bg-gray-50 dark:bg-slate-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Synthesize a 3D model based on technical deconstruction.</p>
                    <button 
                        onClick={() => onGenerateCad(drawings, result)}
                        disabled={isCadLoading}
                        className="px-6 py-2 bg-brand-cyan text-white font-bold rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50"
                    >
                        {isCadLoading ? 'Generating CAD...' : 'Generate 3D Model'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <PhysicsViewport 
                        cadData={cadData} 
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

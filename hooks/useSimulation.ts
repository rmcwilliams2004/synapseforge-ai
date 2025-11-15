import { useState, useCallback } from 'react';
import { generateSimulationResult, generateInspirationalImage, parseApiError } from '../services/geminiService';
import { SimulationResult, SimulationType, LogEntry } from '../types';

export const useSimulation = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

    const runSimulation = useCallback(async (type: SimulationType, componentNames: string[], productContext: string) => {
        const componentName = componentNames.join(', ');
        const simulationId = Date.now();
        setSimulationResult({ 
            type, 
            componentName, 
            summary: '', 
            keyFindings: [], 
            imageUrl: null, 
            imagePrompt: '', 
            isLoading: true, 
            error: null 
        });

        addLog('INFO', `Starting ${type} simulation for "${componentName}".`);

        try {
            // Step 1: Generate the textual result and the image prompt
            addLog('INFO', `[${type}] Generating simulation summary...`);
            const textResult = await generateSimulationResult(type, componentName, productContext);

            // Update state with text result while image generates
            setSimulationResult(prev => prev ? { ...prev, summary: textResult.summary, keyFindings: textResult.keyFindings, imagePrompt: textResult.imagePrompt } : prev);

            // Step 2: Generate the visualization
            addLog('INFO', `[${type}] Generating visualization...`);
            const imageUrl = await generateInspirationalImage(textResult.imagePrompt, '16:9');
            
            // Final update with the image
            setSimulationResult(prev => prev ? { ...prev, imageUrl, isLoading: false } : null);
            addLog('INFO', `[${type}] Simulation for "${componentName}" completed successfully.`);

        } catch (e) {
            const errorMessage = parseApiError(e);
            setSimulationResult(prev => prev ? { ...prev, error: errorMessage, isLoading: false } : null);
            addLog('ERROR', `[${type}] Simulation for "${componentName}" failed: ${errorMessage}`);
        }
    }, [addLog]);

    const clearSimulation = useCallback(() => {
        setSimulationResult(null);
    }, []);

    return { simulationResult, runSimulation, clearSimulation };
};

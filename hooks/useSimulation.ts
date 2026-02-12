
import { useState, useCallback, useRef } from 'react';
import { generateSimulationResult, generateInspirationalImage, parseApiError } from '../services/geminiService';
import { SimulationResult, SimulationType, LogEntry, CadData } from '../types';

export const useSimulation = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const [isPhysicsActive, setIsPhysicsActive] = useState(false);
    const [physicsResult, setPhysicsResult] = useState<any>(null);
    const pollingRef = useRef<number | null>(null);

    const runSimulation = useCallback(async (type: SimulationType, componentNames: string[], productContext: string) => {
        const componentName = componentNames.join(', ');
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
            const textResult = await generateSimulationResult(type, componentName, productContext);
            setSimulationResult(prev => prev ? { ...prev, summary: textResult.summary, keyFindings: textResult.keyFindings, imagePrompt: textResult.imagePrompt } : prev);

            const imageUrl = await generateInspirationalImage(textResult.imagePrompt, '16:9');
            setSimulationResult(prev => prev ? { ...prev, imageUrl, isLoading: false } : null);
            addLog('INFO', `[${type}] Simulation for "${componentName}" completed successfully.`);
        } catch (e) {
            const errorMessage = parseApiError(e);
            setSimulationResult(prev => prev ? { ...prev, error: errorMessage, isLoading: false } : null);
            addLog('ERROR', `[${type}] Simulation for "${componentName}" failed: ${errorMessage}`);
        }
    }, [addLog]);

    /**
     * HOLODECK: Step 4 - The Reality Handshake
     * Bridges CAD geometry to the Genesis 4D Solver via the PLaaS backend endpoints.
     */
    const runGenesisVerification = useCallback(async (cadData: CadData, environmentId: string = 'SAA_LEO_ORBIT') => {
        setIsPhysicsActive(true);
        setPhysicsResult(null);
        addLog('INFO', `[HOLODECK]: Initiating Genesis Handshake [Domain: ${environmentId}].`);

        try {
            // 1. Initial Job Submission (POST)
            const response = await fetch('/api/foundry/physics/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mesh_path: cadData.assemblyName, // In real world, would be the mesh path
                    material_params: { youngs_modulus: 1.2e12, density: 2100 }, 
                    environment_id: environmentId
                })
            });

            if (!response.ok) throw new Error("Genesis Engine Handshake Rejected.");
            const { job_id } = await response.json();
            
            addLog('INFO', `[HOLODECK]: Job ${job_id.slice(0, 8)} accepted. Polling for Physical Truth...`);

            // 2. Status Polling (GET)
            if (pollingRef.current) clearInterval(pollingRef.current);
            
            pollingRef.current = window.setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/foundry/physics/status/${job_id}`);
                    const data = await statusRes.json();
                    
                    if (data.status === 'COMPLETED') {
                        setPhysicsResult(data.result);
                        setIsPhysicsActive(false);
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        
                        addLog('INFO', `[GENESIS]: Simulation sequence finalized. Status: ${data.result.status}.`);
                        window.dispatchEvent(new CustomEvent('forge-status', { 
                            detail: data.result.status === 'VERIFIED' ? 'SOLVED' : 'THROTTLED' 
                        }));
                    } else if (data.status === 'FAILED') {
                        setIsPhysicsActive(false);
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        addLog('ERROR', `[GENESIS]: Solver crashed: ${data.error}`);
                    } else {
                        addLog('INFO', `[GENESIS]: Solving nodal mesh... (Status: ${data.status})`);
                    }
                } catch (pollErr) {
                    console.error("Polling error:", pollErr);
                }
            }, 2000);

        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Uplink Failed';
            addLog('ERROR', `[HOLODECK]: Validation aborted: ${msg}`);
            setIsPhysicsActive(false);
        }
    }, [addLog]);

    const clearSimulation = useCallback(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setSimulationResult(null);
        setIsPhysicsActive(false);
        setPhysicsResult(null);
    }, []);

    return { simulationResult, isPhysicsActive, physicsResult, runSimulation, runGenesisVerification, clearSimulation };
};

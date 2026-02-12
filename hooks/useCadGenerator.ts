import { useState, useCallback } from 'react';
import { generateCadData, generateFoundryCad, parseApiError } from '../services/geminiService';
import { AnalysisResult, CadData, LogEntry, GeneratedDrawing, FoundryCadResult } from '../types';

export const useCadGenerator = (addLog: (level: LogEntry['level'], message: string) => void) => {
  const [cadData, setCadData] = useState<CadData | null>(null);
  const [foundryResult, setFoundryResult] = useState<FoundryCadResult | null>(null);
  const [isCadLoading, setIsCadLoading] = useState<boolean>(false);
  const [cadError, setCadError] = useState<string | null>(null);

  const generateCad = useCallback(async (drawings: GeneratedDrawing[], result: AnalysisResult): Promise<CadData | null> => {
    setIsCadLoading(true);
    setCadError(null);
    setCadData(null);
    setFoundryResult(null);
    addLog('INFO', `Initializing CADAM Plugin for "${result.product_name}"...`);

    try {
      // Step 1: High-fidelity reasoning for parametric geometry & SCAD
      const material = result.material_suggestions[0]?.name || 'Aluminum 6061-T6';
      const prompt = `Synthesize parametric CAD for: ${result.executive_summary}`;
      
      addLog('INFO', `Orchestrating Sovereign Foundry Architect for ${material} lattice...`);
      const foundryRes = await generateFoundryCad(result.product_name, prompt, material, 'SF-CURRENT');
      setFoundryResult(foundryRes);

      // Step 2: Convert parametric JSON to viewing structure (Simulated Plugin Action)
      const data = await generateCadData(drawings, result);
      setCadData(data);
      
      addLog('INFO', `CAD synthesis complete. Deterministic OpenSCAD code cached in ledger.`);
      return data;
    } catch (e) {
      const errorMessage = parseApiError(e);
      setCadError(errorMessage);
      addLog('ERROR', `CAD synthesis failed: ${errorMessage}`);
      return null;
    } finally {
      setIsCadLoading(false);
    }
  }, [addLog]);

  const clearCad = useCallback(() => {
    setCadData(null);
    setFoundryResult(null);
    setCadError(null);
  }, []);

  return { cadData, foundryResult, isCadLoading, cadError, generateCad, clearCad };
};
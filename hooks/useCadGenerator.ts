import { useState, useCallback } from 'react';
import { generateCadData as performCadGeneration, parseApiError } from '../services/geminiService';
import { AnalysisResult, CadData, LogEntry, GeneratedDrawing } from '../types';

export const useCadGenerator = (addLog: (level: LogEntry['level'], message: string) => void) => {
  const [cadData, setCadData] = useState<CadData | null>(null);
  const [isCadLoading, setIsCadLoading] = useState<boolean>(false);
  const [cadError, setCadError] = useState<string | null>(null);

  const generateCad = useCallback(async (drawings: GeneratedDrawing[], result: AnalysisResult): Promise<CadData | null> => {
    setIsCadLoading(true);
    setCadError(null);
    setCadData(null);
    addLog('INFO', `Generating simulated CAD data for "${result.product_name}" from ${drawings.length} drawings...`);

    try {
      const data = await performCadGeneration(drawings, result);
      setCadData(data);
      addLog('INFO', 'Simulated CAD data generated successfully.');
      return data;
    } catch (e) {
      const errorMessage = parseApiError(e);
      setCadError(errorMessage);
      addLog('ERROR', `CAD data generation failed: ${errorMessage}`);
      return null;
    } finally {
      setIsCadLoading(false);
    }
  }, [addLog]);

  const clearCad = useCallback(() => {
    setCadData(null);
    setCadError(null);
  }, []);

  return { cadData, isCadLoading, cadError, generateCad, clearCad };
};
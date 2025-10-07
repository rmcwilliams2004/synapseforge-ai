import { useState, useCallback } from 'react';
import { generateTechnicalDrawingImage, parseApiError } from '../services/geminiService';
import { GeneratedDrawing, LogEntry } from '../types';

export const useDrawingGenerator = (basePrompt: string | null, addLog: (level: LogEntry['level'], message: string) => void) => {
  const [drawings, setDrawings] = useState<GeneratedDrawing[]>([]);

  const requestDrawing = useCallback(async (specificPrompt: string) => {
    if (!basePrompt) {
        // This case should ideally be prevented by the UI
        addLog('ERROR', 'Drawing generation failed: No base product context available.');
        return;
    }

    const newDrawing: GeneratedDrawing = {
        id: `drawing-${Date.now()}`,
        prompt: specificPrompt,
        url: null,
        isLoading: true,
        error: null,
    };

    setDrawings(prev => [...prev, newDrawing]);
    addLog('INFO', `Starting 2D drawing generation for "${specificPrompt}".`);

    try {
      const url = await generateTechnicalDrawingImage(basePrompt, specificPrompt);
      setDrawings(prev => prev.map(d => d.id === newDrawing.id ? { ...d, url, isLoading: false } : d));
      addLog('INFO', `2D drawing generation for "${specificPrompt}" succeeded.`);
    } catch (e) {
      const errorMessage = parseApiError(e);
      setDrawings(prev => prev.map(d => d.id === newDrawing.id ? { ...d, error: errorMessage, isLoading: false } : d));
      addLog('ERROR', `2D drawing generation for "${specificPrompt}" failed: ${errorMessage}`);
    }
  }, [basePrompt, addLog]);
  
  const removeDrawing = useCallback((id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
  }, []);
  
  const clearAllDrawings = useCallback(() => {
    setDrawings([]);
  }, []);

  return { drawings, requestDrawing, removeDrawing, setDrawings, clearAllDrawings };
};
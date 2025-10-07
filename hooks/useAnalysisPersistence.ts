import { useCallback } from 'react';
import { AnalysisResult, FactionId } from '../types';

const LOCAL_STORAGE_KEY = 'synapseforge-in-progress-analysis';

export interface InProgressState {
  projectName: string;
  prompt: string;
  factionId: FactionId;
  result: AnalysisResult;
}

export const useAnalysisPersistence = () => {
  const saveInProgressAnalysis = useCallback((state: InProgressState) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save in-progress analysis to localStorage:", error);
    }
  }, []);

  const loadInProgressAnalysis = useCallback((): InProgressState | null => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error("Failed to load in-progress analysis from localStorage:", error);
      return null;
    }
  }, []);

  const clearInProgressAnalysis = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear in-progress analysis from localStorage:", error);
    }
  }, []);

  return {
    saveInProgressAnalysis,
    loadInProgressAnalysis,
    clearInProgressAnalysis,
  };
};

import { useCallback } from 'react';
import { InProgressState } from '../types';

const LOCAL_STORAGE_KEY = 'synapseforge-in-progress-analysis';

export const useAnalysisPersistence = () => {
  const saveInProgressAnalysis = useCallback((state: InProgressState) => {
    try {
      // Create a lightweight version of the state for localStorage by omitting
      // the large base64 data from drawings and inspirational images.
      // The core analysis result is the most important part to save for session recovery.
      const { drawings, inspirationalImages, ...lightweightState } = state;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweightState));
    } catch (error) {
      // This catch block is important to handle the quota exceeded error gracefully.
      // We will log it, but the app will continue to function.
      console.error("Failed to save in-progress analysis to localStorage:", error);
    }
  }, []);

  const loadInProgressAnalysis = useCallback((): InProgressState | null => {
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!savedStateJSON) {
        return null;
      }
      
      const savedState = JSON.parse(savedStateJSON);

      // Rehydrate the state with empty arrays for drawings and images,
      // as they were not saved. This ensures the app state is consistent.
      const rehydratedState: InProgressState = {
        ...savedState,
        drawings: [],
        inspirationalImages: [],
      };

      return rehydratedState;
    } catch (error) {
      console.error("Failed to load in-progress analysis from localStorage:", error);
      // If loading fails (e.g., corrupted data), clear it to prevent future errors on load.
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (removeError) {
        console.error("Failed to clear corrupted localStorage data:", removeError);
      }
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
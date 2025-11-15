import { useState, useCallback } from 'react';
import { generateInspirationalImage, parseApiError } from '../services/geminiService';
import { GeneratedImage, LogEntry } from '../types';

export const useInspirationalImageGenerator = (addLog: (level: LogEntry['level'], message: string) => void) => {
  const [inspirationalImages, setInspirationalImages] = useState<GeneratedImage[]>([]);

  const requestInspirationalImage = useCallback(async (prompt: string, aspectRatio: string = '16:9'): Promise<GeneratedImage | null> => {
    const imageId = `insp-img-${Date.now()}`;
    addLog('INFO', `Starting inspirational image generation for "${prompt}".`);

    const newImage: GeneratedImage = {
        id: imageId,
        prompt: prompt,
        url: null,
        isLoading: true,
        error: null,
        aspectRatio: aspectRatio,
        includeInReport: true,
        isCoverImage: false,
    };
    setInspirationalImages(prev => [...prev, newImage]);

    try {
      const url = await generateInspirationalImage(prompt, aspectRatio);
      const successfulImage = { ...newImage, url, isLoading: false };
      setInspirationalImages(prev => prev.map(img => img.id === imageId ? successfulImage : img));
      addLog('INFO', `Inspirational image generation for "${prompt}" succeeded.`);
      return successfulImage;
    } catch (e) {
      const errorMessage = parseApiError(e);
      setInspirationalImages(prev => prev.map(img => img.id === imageId ? { ...img, error: errorMessage, isLoading: false } : img));
      addLog('ERROR', `Inspirational image generation for "${prompt}" failed: ${errorMessage}`);
      return null;
    }
  }, [addLog]);
  
  const removeInspirationalImage = useCallback((id: string) => {
    setInspirationalImages(prev => prev.filter(img => img.id !== id));
  }, []);
  
  const clearAllInspirationalImages = useCallback(() => {
    setInspirationalImages([]);
  }, []);
  
  const toggleImageReportInclusion = useCallback((id: string) => {
    setInspirationalImages(prev => prev.map(img => img.id === id ? { ...img, includeInReport: !img.includeInReport } : img));
  }, []);

  return { inspirationalImages, requestInspirationalImage, removeInspirationalImage, setInspirationalImages, clearAllInspirationalImages, toggleImageReportInclusion };
};
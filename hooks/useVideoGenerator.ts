import { useState } from 'react';
import { generateExplodedViewVideo, parseApiError } from '../services/geminiService';
import { LogEntry } from '../types';

export const useVideoGenerator = (prompt: string | null, addLog: (level: LogEntry['level'], message: string) => void) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const generateVideo = async () => {
    if (!prompt) {
      setVideoError("Cannot generate video without a successful prior analysis.");
      return;
    }

    setIsVideoLoading(true);
    setVideoError(null);
    setVideoUrl(null);
    addLog('INFO', `Starting video generation for "${prompt}".`);

    try {
      const url = await generateExplodedViewVideo(prompt);
      setVideoUrl(url);
      addLog('INFO', `Video generation for "${prompt}" succeeded.`);
    } catch (e) {
      const errorMessage = parseApiError(e);
      setVideoError(errorMessage);
      addLog('ERROR', `Video generation for "${prompt}" failed: ${errorMessage}`);
    } finally {
      setIsVideoLoading(false);
    }
  };
  
  const clearVideo = () => {
    if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoError(null);
  }

  return { videoUrl, isVideoLoading, videoError, generateVideo, clearVideo };
};

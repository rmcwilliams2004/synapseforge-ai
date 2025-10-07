import { useState } from 'react';
import { generateAnalysis as performAnalysis, parseApiError } from '../services/geminiService';
import { AnalysisResult, Faction, LogEntry } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  return {
    inlineData: {
      data: base64,
      mimeType: file.type,
    },
  };
};

const dataUrlToGenerativePart = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    if (!header || !data) {
        throw new Error("Invalid data URL format");
    }
    const mimeTypeMatch = header.match(/data:(.*);base64/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        throw new Error("Could not extract MIME type from data URL");
    }
    const mimeType = mimeTypeMatch[1];

    return {
        inlineData: {
            data,
            mimeType
        }
    };
};

interface FileSource {
    files: File[];
    fileUrls?: string[];
}

export const useAnalysis = (addLog: (level: LogEntry['level'], message: string) => void) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async (prompt: string, faction: Faction, source: FileSource): Promise<AnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileParts = [];
      // Prioritize newly uploaded files over saved project files
      if (source.files.length > 0) {
        for(const file of source.files) {
            if (!file.type.startsWith('image/') && !file.type.endsWith('pdf')) {
                throw new Error('Only image and PDF files are supported for analysis.');
            }
            fileParts.push(await fileToGenerativePart(file));
        }
      } else if (source.fileUrls && source.fileUrls.length > 0) {
        for(const url of source.fileUrls) {
            fileParts.push(dataUrlToGenerativePart(url));
        }
      }
      
      const analysisResult = await performAnalysis(prompt, faction, fileParts.length > 0 ? fileParts : null);
      setResult(analysisResult);
      return analysisResult;
    } catch (e) {
      const errorMessage = parseApiError(e);
      setError(errorMessage);
      addLog('ERROR', `Core Analysis Failed: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearAnalysis = () => {
    setResult(null);
    setError(null);
  }

  return { result, isLoading, error, generateAnalysis, clearAnalysis, setResult };
};
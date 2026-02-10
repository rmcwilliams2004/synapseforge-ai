
import { useState, useCallback } from 'react';
import { generatePatentDraft, parseApiError } from '../services/geminiService';
import { PatentApplication, AnalysisResult, LogEntry } from '../types';

export const usePatentGenerator = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [patent, setPatent] = useState<PatentApplication | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const draftPatent = useCallback(async (result: AnalysisResult) => {
        setIsGenerating(true);
        addLog('INFO', `Generating patent application draft for "${result.product_name}"...`);
        try {
            const data = await generatePatentDraft(result);
            setPatent(data);
            addLog('INFO', 'Patent draft generated successfully.');
        } catch (e) {
            const error = parseApiError(e);
            addLog('ERROR', `Patent generation failed: ${error}`);
        } finally {
            setIsGenerating(false);
        }
    }, [addLog]);

    const clearPatent = useCallback(() => setPatent(null), []);

    return { patent, isGenerating, draftPatent, clearPatent };
};

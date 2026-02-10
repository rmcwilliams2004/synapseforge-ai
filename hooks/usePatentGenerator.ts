import { useState, useCallback } from 'react';
import { generatePatentDraft, parseApiError } from '../services/geminiService';
import { PatentApplication, AnalysisResult, LogEntry, IngestedDocument, User, ProtectionTypePref } from '../types';

export const usePatentGenerator = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [patent, setPatent] = useState<PatentApplication | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const draftPatent = useCallback(async (result: AnalysisResult, user: User, protectionType: ProtectionTypePref, knowledgeBase: IngestedDocument[] = []) => {
        setIsGenerating(true);
        addLog('INFO', `Commencing Intellectual Property analysis for "${result.product_name}"... (Requested Strategy: ${protectionType})`);
        try {
            const data = await generatePatentDraft(result, user, protectionType, knowledgeBase);
            setPatent(data);
            addLog('INFO', `Intellectual Property analysis and ${data.protection_type} Draft successfully generated.`);
        } catch (e) {
            const error = parseApiError(e);
            addLog('ERROR', `IP Analysis Failed: ${error}`);
        } finally {
            setIsGenerating(false);
        }
    }, [addLog]);

    const clearPatent = useCallback(() => setPatent(null), []);

    return { patent, isGenerating, draftPatent, clearPatent };
};
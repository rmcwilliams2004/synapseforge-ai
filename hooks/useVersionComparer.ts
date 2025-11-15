import { useState, useCallback } from 'react';
import { generateCadData, compareCadData, parseApiError } from '../services/geminiService';
import { Project, CadData, CadComparisonResult, LogEntry } from '../types';

export interface ComparisonData {
    baseCad: CadData;
    newCad: CadData;
    diff: CadComparisonResult;
    baseVersionCommit: string;
    newVersionCommit: string;
}

export const useVersionComparer = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [isComparing, setIsComparing] = useState<boolean>(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    const runComparison = useCallback(async (project: Project, newVersionIndex: number) => {
        const baseVersionIndex = newVersionIndex + 1;
        if (!project.history[newVersionIndex] || !project.history[baseVersionIndex]) {
            setComparisonError("Cannot compare; a base version is missing.");
            return;
        }

        const newVersion = project.history[newVersionIndex];
        const baseVersion = project.history[baseVersionIndex];

        setIsComparing(true);
        setComparisonError(null);
        setComparisonData(null);
        addLog('INFO', `Starting CAD comparison between "${newVersion.commitMessage}" and "${baseVersion.commitMessage}".`);

        try {
            if (!newVersion.result || !baseVersion.result) {
                throw new Error("One or both versions are missing analysis results needed to generate CAD data.");
            }
            
            // Generate CAD data for both versions in parallel
            addLog('INFO', 'Generating CAD data for comparison...');
            // FIX: Pass both the drawings and the result to the generateCadData function.
            const [baseCad, newCad] = await Promise.all([
                generateCadData(baseVersion.drawings || [], baseVersion.result),
                generateCadData(newVersion.drawings || [], newVersion.result)
            ]);

            addLog('INFO', 'Comparing CAD data using AI...');
            const diff = await compareCadData(baseCad, newCad);

            setComparisonData({
                baseCad,
                newCad,
                diff,
                baseVersionCommit: baseVersion.commitMessage,
                newVersionCommit: newVersion.commitMessage,
            });
            addLog('INFO', 'CAD comparison successful.');

        } catch (e) {
            const errorMessage = parseApiError(e);
            setComparisonError(errorMessage);
            addLog('ERROR', `CAD comparison failed: ${errorMessage}`);
        } finally {
            setIsComparing(false);
        }

    }, [addLog]);

    const clearComparison = useCallback(() => {
        setComparisonData(null);
        setComparisonError(null);
        setIsComparing(false);
    }, []);

    return { comparisonData, isComparing, comparisonError, runComparison, clearComparison };
};

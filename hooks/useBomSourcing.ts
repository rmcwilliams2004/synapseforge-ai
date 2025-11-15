import { useState, useCallback } from 'react';
import { sourceBomItem, parseApiError } from '../services/geminiService';
import { BillOfMaterialsItem, ProcurementInfo, LogEntry } from '../types';

export const useBomSourcing = (addLog: (level: LogEntry['level'], message: string) => void) => {
    const [sourcingResults, setSourcingResults] = useState<Map<number, ProcurementInfo[]>>(new Map());
    const [loadingStates, setLoadingStates] = useState<Map<number, boolean>>(new Map());
    const [errorStates, setErrorStates] = useState<Map<number, string | null>>(new Map());

    const sourceItem = useCallback(async (item: BillOfMaterialsItem) => {
        const partNumber = item.part_number;
        
        setLoadingStates(prev => new Map(prev).set(partNumber, true));
        setErrorStates(prev => {
            const newMap = new Map(prev);
            newMap.delete(partNumber);
            return newMap;
        });
        addLog('INFO', `Sourcing component: "${item.name}"`);

        try {
            const results = await sourceBomItem(item);
            setSourcingResults(prev => new Map(prev).set(partNumber, results));
            addLog('INFO', `Successfully sourced component: "${item.name}"`);
        } catch (e) {
            const errorMessage = parseApiError(e);
            setErrorStates(prev => new Map(prev).set(partNumber, errorMessage));
            addLog('ERROR', `Failed to source component "${item.name}": ${errorMessage}`);
        } finally {
            setLoadingStates(prev => new Map(prev).set(partNumber, false));
        }
    }, [addLog]);

    const clearSourcing = useCallback(() => {
        setSourcingResults(new Map());
        setLoadingStates(new Map());
        setErrorStates(new Map());
    }, []);

    return { sourcingResults, loadingStates, errorStates, sourceItem, clearSourcing };
};
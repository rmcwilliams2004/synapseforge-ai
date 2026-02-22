import { HISTORICAL_PERSONAS } from '../constants';

export const getActivePortrait = (personaId: string) => {
    const persona = HISTORICAL_PERSONAS.find(p => p.id === personaId);
    return persona?.avatar || "/placeholders/default-council.png";
};

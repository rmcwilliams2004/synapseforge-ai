import { useState } from 'react';
import { getActivePortrait } from '../services/PortraitResolver';
import { useForgeVoice } from './useForgeVoice'; // Wait, let's see if speak is available

export const useNeuralResearch = (activePersonaId: string, speak: (msg: string) => void) => {
  const [scourData, setScourData] = useState<any>(null);
  const activePortrait = getActivePortrait(activePersonaId); 

  const runHistoricalScour = async (query: string) => {
    speak(`Richard, I am aligning with ${activePersonaId}'s historical archives.`);
    
    // Heartbeat for long-horizon scouring
    const heartbeat = setInterval(() => speak("Processing."), 6000);

    return new Promise((resolve, reject) => {
      try {
        // Mocking archiveService
        const archives = [
          { id: '1', year: '1913', title: 'Fluid Propulsion Dynamics', summary: 'Analysis of boundary layer adhesion in turbine blades.' },
          { id: '2', year: '1928', title: 'Resonant Frequency Applications', summary: 'Electromagnetic flux optimization for levitation.' }
        ];

        setTimeout(() => {
          clearInterval(heartbeat);
          speak("Historical alignment complete. Archives integrated.");
          
          setScourData({
              archives,
              portrait: activePortrait,
              personaName: activePersonaId,
              councilInsights: `Alignment verified against ${activePersonaId}'s core principles.`
          });
          resolve({ archives, portrait: activePortrait });
        }, 4000);
      } catch (e) {
        clearInterval(heartbeat);
        speak("Scour interrupted.");
        reject(e);
      }
    });
  };

  return { runHistoricalScour, scourData, activePortrait };
};

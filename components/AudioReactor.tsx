import React, { useMemo } from 'react';
import { DeVinciState } from '../types';

interface AudioReactorProps {
  state: DeVinciState;
  volume: number; // 0 to 1
  color?: string;
}

export const AudioReactor: React.FC<AudioReactorProps> = ({ state, volume, color = '#06b6d4' }) => {
  // Number of bars in the visualizer for a detailed waveform
  const barCount = 64;
  
  // Create a symmetric sensitivity map (Gaussian-like)
  const barData = useMemo(() => {
    return [...Array(barCount)].map((_, i) => {
      const center = (barCount - 1) / 2;
      const distFromCenter = Math.abs(i - center) / center;
      // Parabolic sensitivity: higher in the middle
      const sensitivity = 1 - Math.pow(distFromCenter, 2);
      return {
        seed: Math.random(),
        sensitivity
      };
    });
  }, [barCount]);

  return (
    <div className="flex items-center justify-center h-60 w-full relative overflow-hidden bg-black/80 rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
      {/* High-fidelity scanning noise background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Waveform Container */}
      <div className="flex items-center justify-center gap-1 h-48 w-full max-w-3xl px-16 z-10">
        {barData.map((data, i) => {
          let h = 3; // minimum height
          let opacity = 0.15;

          if (state === 'listening' || state === 'speaking') {
            // Highly reactive volume-based height
            const jitter = 0.8 + (data.seed * 0.4);
            const reactiveHeight = volume * 100 * data.sensitivity * jitter;
            h = Math.max(3, reactiveHeight);
            opacity = Math.max(0.2, volume * 1.8);
          } else if (state === 'thinking') {
            // Chaotic rhythmic pulse for processing
            h = 10 + (Math.sin(Date.now() * 0.02 + i * 0.5) * 25 * data.sensitivity);
            opacity = 0.5 + (Math.sin(Date.now() * 0.01 + i) * 0.1);
          } else if (state === 'idle' || state === 'connecting') {
            // Standby breathing mode
            h = 3 + (Math.sin(Date.now() * 0.003 + i * 0.15) * 4 * data.sensitivity);
            opacity = 0.1 + (Math.sin(Date.now() * 0.003 + i * 0.15) * 0.1);
          }

          return (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-75 ease-out"
              style={{
                backgroundColor: color,
                height: `${h}%`,
                opacity: opacity,
                boxShadow: (state === 'speaking' || state === 'listening') && volume > 0.05 
                    ? `0 0 15px ${color}99` 
                    : 'none',
              }}
            />
          );
        })}
      </div>
      
      {/* Dynamic Aura Glow */}
      <div 
        className="absolute inset-0 opacity-0 blur-[180px] transition-opacity duration-500 pointer-events-none"
        style={{ 
            backgroundColor: color, 
            opacity: (state === 'listening' || state === 'speaking') ? Math.min(0.4, volume * 1.3) : (state === 'thinking' ? 0.12 : 0) 
        }}
      />

      {/* Lab Interface HUD Labels */}
      <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center gap-2">
        <div className="px-5 py-2 bg-black/60 rounded-full border border-white/10 backdrop-blur-3xl shadow-2xl">
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.5em] text-white/80">
              {state === 'listening' ? 'Capturing Socratic Stimulus' : 
               state === 'speaking' ? 'Modulating Persona Frequency' : 
               state === 'thinking' ? 'Deep Heuristic Synthesis' : 
               state === 'connecting' ? 'Establishing Neural Uplink' :
               'Interactive Lab Session Ready'}
            </span>
        </div>
        
        {/* Signal Confidence Indicators */}
        <div className="flex gap-1.5 opacity-40">
            {[...Array(8)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${volume > (i * 0.1) ? '' : 'bg-white/10 scale-75'}`}
                    style={{ backgroundColor: volume > (i * 0.1) ? color : undefined, boxShadow: volume > (i * 0.1) ? `0 0 8px ${color}` : 'none' }}
                />
            ))}
        </div>
      </div>

      {/* Geometric Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
    </div>
  );
};

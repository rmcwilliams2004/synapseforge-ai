import React, { useState, useRef } from 'react';
import { Mic, Send, X } from 'lucide-react';

interface AnnotationCanvasProps {
  onAnnotate: (data: { spatialPoints: {x: number, y: number}[], command: string }) => void;
  onClose: () => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ onAnnotate, onClose }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);
  const [showCommandInput, setShowCommandInput] = useState(false);
  const [command, setCommand] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showCommandInput) return;
    setIsDrawing(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || showCommandInput) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setPoints(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (points.length > 5) {
      setShowCommandInput(true);
      window.dispatchEvent(new CustomEvent('forge-speak', { detail: "Richard, I've marked the ROI. What is your instruction?" }));
    } else {
      setPoints([]);
    }
  };

  const handleSubmit = () => {
    if (command.trim()) {
      onAnnotate({ spatialPoints: points, command });
      setShowCommandInput(false);
      setPoints([]);
      setCommand("");
    }
  };

  const pathData = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div className="absolute inset-0 z-50">
      <svg
        ref={svgRef}
        className={`w-full h-full ${showCommandInput ? 'cursor-default' : 'cursor-crosshair'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <path
          d={pathData}
          fill="none"
          stroke="#ff0000"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-md"
        />
      </svg>
      
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-red-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {showCommandInput && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-xl border border-brand-cyan/50 p-6 rounded-2xl shadow-2xl w-96 animate-fade-in">
          <h3 className="text-brand-cyan font-bold uppercase tracking-widest text-xs mb-4">Semantic Override</h3>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., Increase structural ribbing thickness by 15%..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-none h-24 mb-4"
            autoFocus
          />
          <div className="flex justify-between items-center">
            <button className="p-2 text-slate-400 hover:text-brand-cyan transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowCommandInput(false); setPoints([]); }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleSubmit}
                className="px-4 py-2 bg-brand-cyan text-slate-900 text-xs font-bold rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2"
              >
                APPLY <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

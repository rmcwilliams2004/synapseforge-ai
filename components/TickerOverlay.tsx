import React from 'react';

export type VerdictType = 'positive' | 'negative' | 'caution' | 'info';

interface TickerOverlayProps {
  verdicts: {
    type: VerdictType;
    message: string;
  }[];
  title?: string;
}

const VerdictIcon = ({ type }: { type: VerdictType }) => {
  switch (type) {
    case 'positive':
      return (
        <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
      );
    case 'negative':
      return (
        <div className="bg-rose-500/20 p-1.5 rounded-lg border border-rose-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-rose-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case 'caution':
      return (
        <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-amber-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
      );
    case 'info':
    default:
      return (
        <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
        </div>
      );
  }
};

export const TickerOverlay: React.FC<TickerOverlayProps> = ({ verdicts, title = "Design Verdicts" }) => {
  if (!verdicts || verdicts.length === 0) return null;

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 overflow-hidden">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</h4>
      <div className="space-y-3">
        {verdicts.map((v, i) => (
          <div key={i} className="flex items-center gap-3 animate-fade-in group" style={{ animationDelay: `${i * 100}ms` }}>
            <VerdictIcon type={v.type} />
            <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-1">{v.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
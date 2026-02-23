import React from 'react';
import { useForgeCredits } from '../../hooks/useForgeCredits';

interface CreditGateProps {
  cost: number;
  actionName: string;
  children: React.ReactNode;
}

export const CreditGate = ({ cost, actionName, children }: CreditGateProps) => {
  const { credits, openPricing } = useForgeCredits();

  const isLocked = credits < cost;

  if (isLocked) {
    return (
      <div className="relative group cursor-not-allowed">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <button 
          onClick={openPricing}
          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase">
            Unlock {actionName} (${cost} CR)
          </span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

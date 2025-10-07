

import React from 'react';
import { Faction, User } from '../types';
import { ENGINEERING_PHILOSOPHIES } from '../constants';

interface FactionSelectorProps {
  selectedFaction: Faction | null;
  onSelectFaction: (faction: Faction) => void;
  disabled: boolean;
  authenticatedUser: User;
}

// Fix: Define props interface and type component as React.FC to handle 'key' prop correctly.
interface FactionCardProps {
  faction: Faction;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

const FactionCard: React.FC<FactionCardProps> = ({ faction, isSelected, onSelect, disabled }) => {
  const Icon = faction.icon;
  return (
    <div
      onClick={() => !disabled && onSelect()}
      className={`p-4 border-2 rounded-lg transition-all duration-300 ${
        isSelected
          ? 'border-brand-cyan bg-cyan-900/40 shadow-lg shadow-cyan-900/50'
          : 'border-gray-700 bg-gray-800 hover:border-gray-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
    >
      <div className="flex items-center mb-2">
        <Icon className="w-8 h-8 mr-3 text-brand-cyan" />
        <h3 className="text-lg font-bold text-brand-light">{faction.name}</h3>
      </div>
      <p className="text-sm text-gray-400 font-mono mb-2">
        <strong>Focus:</strong> {faction.focus}
      </p>
      <p className="text-sm text-gray-300">{faction.philosophy}</p>
    </div>
  );
};

export const FactionSelector = ({ selectedFaction, onSelectFaction, disabled, authenticatedUser }: FactionSelectorProps) => {
  const isViewer = authenticatedUser.role === 'Viewer';
  return (
    <div id="tour-step-1">
      <h2 className="text-xl font-semibold text-brand-light mb-3">1. Select an Analytical Lens</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ENGINEERING_PHILOSOPHIES.map((faction) => (
          <FactionCard
            key={faction.id}
            faction={faction}
            isSelected={selectedFaction?.id === faction.id}
            onSelect={() => onSelectFaction(faction)}
            disabled={disabled || isViewer}
          />
        ))}
      </div>
    </div>
  );
};

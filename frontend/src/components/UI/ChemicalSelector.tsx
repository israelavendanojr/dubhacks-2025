import React from 'react';
import type { ChemicalConfig } from '../../config/chemicals';

interface ChemicalSelectorProps {
  chemicals: ChemicalConfig[];
  selected: string;
  onChange: (chemicalId: string) => void;
}

export function ChemicalSelector({ chemicals, selected, onChange }: ChemicalSelectorProps) {
  if (chemicals.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-md rounded-xl p-4 border border-gray-800 shadow-2xl">
      <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wide">
        Select Chemical
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {chemicals.map((chemical) => (
          <button
            key={chemical.id}
            onClick={() => onChange(chemical.id)}
            className={`
              px-4 py-3 rounded-lg text-left transition-all duration-200
              ${selected === chemical.id
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <div className="font-bold text-lg">{chemical.displayName}</div>
            <div className="text-xs opacity-75">{chemical.name}</div>
          </button>
        ))}
      </div>
      
      {/* Currently selected info */}
      {chemicals.find(c => c.id === selected) && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-400">
            {chemicals.find(c => c.id === selected)?.description}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Danger threshold: {chemicals.find(c => c.id === selected)?.dangerThreshold} 
            {' '}{chemicals.find(c => c.id === selected)?.unit}
          </div>
        </div>
      )}
    </div>
  );
}

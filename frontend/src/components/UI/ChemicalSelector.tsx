import type { ChemicalConfig } from '../../config/chemicals';

interface ChemicalSelectorProps {
  chemicals: ChemicalConfig[];
  selected: string;
  onChange: (chemicalId: string) => void;
}

export function ChemicalSelector({ chemicals, selected, onChange }: ChemicalSelectorProps) {
  if (chemicals.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {/* All Chemicals Option */}
      <button
        onClick={() => onChange('all')}
        className={`
          px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200
          ${selected === 'all'
            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/50'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }
        `}
      >
        All
      </button>
      
      {/* Individual Chemical Options */}
      {chemicals.map((chemical) => (
        <button
          key={chemical.id}
          onClick={() => onChange(chemical.id)}
          className={`
            px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200
            ${selected === chemical.id
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          {chemical.displayName}
        </button>
      ))}
    </div>
  );
}

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PollutionToggleProps {
  showPollution: boolean;
  onToggle: (show: boolean) => void;
  disabled?: boolean;
}

export function PollutionToggle({ showPollution, onToggle, disabled = false }: PollutionToggleProps) {
  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-xl z-30">
      <button
        onClick={() => onToggle(!showPollution)}
        disabled={disabled}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          showPollution 
            ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={showPollution ? 'Hide pollution data' : 'Show pollution data'}
      >
        {showPollution ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {showPollution ? 'Hide CO Data' : 'Show CO Data'}
        </span>
      </button>
    </div>
  );
}

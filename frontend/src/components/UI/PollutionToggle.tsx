
interface PollutionToggleProps {
  showPollution: boolean;
  onToggle: (show: boolean) => void;
  disabled?: boolean;
}

export function PollutionToggle({ showPollution, onToggle, disabled = false }: PollutionToggleProps) {
  return (
    <button
      onClick={() => onToggle(!showPollution)}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${showPollution 
          ? 'bg-cyan-500 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {showPollution ? '● Pollution ON' : '○ Pollution OFF'}
    </button>
  );
}


interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
}

export function GenerateButton({ onClick, isGenerating }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isGenerating}
      className={`
        w-full py-4 px-6 rounded-lg font-semibold uppercase tracking-wide
        transition-all duration-200 transform
        ${isGenerating 
          ? 'bg-cyan-500 cursor-not-allowed' 
          : 'bg-cyan-400 hover:bg-cyan-500 hover:scale-105 active:scale-95'
        }
        shadow-lg hover:shadow-xl
        text-white
      `}
    >
      {isGenerating ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>GENERATING...</span>
        </div>
      ) : (
        'GENERATE 3D RISKSCAPE'
      )}
    </button>
  );
}

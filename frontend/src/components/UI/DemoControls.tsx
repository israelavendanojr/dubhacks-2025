import { Play, Target, RotateCcw } from 'lucide-react';

interface DemoControlsProps {
  onFlyToHighestRisk: () => void;
  onFlyThroughTour: () => void;
  onResetView: () => void;
  isAnimating: boolean;
}

export function DemoControls({ 
  onFlyToHighestRisk, 
  onFlyThroughTour, 
  onResetView, 
  isAnimating 
}: DemoControlsProps) {
  return (
    <div className="absolute top-6 right-6 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl z-20">
      <div className="text-white text-sm font-semibold mb-3">Demo Controls</div>
      
      <div className="space-y-2">
        <button
          onClick={onFlyToHighestRisk}
          disabled={isAnimating}
          className="w-full flex items-center space-x-2 px-3 py-2 bg-cyan-400 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
        >
          <Target size={16} />
          <span>Focus on Highest Risk</span>
        </button>
        
        <button
          onClick={onFlyThroughTour}
          disabled={isAnimating}
          className="w-full flex items-center space-x-2 px-3 py-2 bg-cyan-400 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
        >
          <Play size={16} />
          <span>Fly-Through Tour</span>
        </button>
        
        <button
          onClick={onResetView}
          disabled={isAnimating}
          className="w-full flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-white text-sm font-medium transition-colors"
        >
          <RotateCcw size={16} />
          <span>Reset View</span>
        </button>
      </div>
      
      {isAnimating && (
        <div className="mt-3 text-xs text-cyan-400 flex items-center space-x-1">
          <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Animating...</span>
        </div>
      )}
    </div>
  );
}

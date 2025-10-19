// components/InfoPanel.tsx
import { CircularGauge } from './CircularGauge';

interface InfoPanelProps {
  countyName: string | null;
  riskScore: number;
  riskLevel: string;
  predictedValue: number;
  unit: string;
  metric: string;
}

export function InfoPanel({
  countyName,
  riskScore,
  riskLevel,
  predictedValue,
  unit,
  metric
}: InfoPanelProps) {
  return (
    <div className="w-[280px] h-full bg-[#1a1a1a] border-r border-white/10 flex flex-col">
      {/* Risk Radar - Top Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <CircularGauge 
          value={riskScore} 
          size={160}
        />
      </div>
      
      {/* County Info - Bottom Section */}
      <div className="p-6 space-y-6 border-t border-white/10">
        {/* County Name */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            County
          </div>
          <div className="text-xl font-bold text-white">
            {countyName || 'Hover over map'}
          </div>
        </div>
        
        {/* Risk Level */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Risk Level
          </div>
          <div className={`text-lg font-semibold ${getRiskLevelColor(riskLevel)}`}>
            {riskLevel || '—'}
          </div>
        </div>
        
        {/* Risk Value (Percentage) */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Risk Score
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {riskScore ? `${(riskScore * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
        
        {/* Direct Predicted Value */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {metric} Predicted
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {predictedValue !== null ? `${predictedValue.toFixed(1)} ${unit}` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for risk level colors
function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'Very Low': return 'text-green-400';
    case 'Low': return 'text-green-300';
    case 'Moderate': return 'text-yellow-400';
    case 'High': return 'text-orange-400';
    case 'Very High': return 'text-red-400';
    case 'Extreme': return 'text-red-600';
    default: return 'text-gray-400';
  }
}

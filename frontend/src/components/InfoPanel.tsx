// components/InfoPanel.tsx
import { CircularGauge } from './CircularGauge';

interface InfoPanelProps {
  countyName: string | null;
  riskScore: number;
  riskLevel: string;
  predictedValue: number;
  unit: string;
  metric: string;
  insight: string | null;
  isLoading: boolean;
}

export function InfoPanel({
  countyName,
  riskScore,
  riskLevel,
  predictedValue,
  unit,
  metric,
  insight,
  isLoading
}: InfoPanelProps) {
  return (
    <div className="w-[280px] h-full bg-[#1a1a1a] border-r border-white/10 flex flex-col">
      {/* Heading */}
      <div className="info-header min-h-[50px] pt-24 pb-24 border-b border-white/10 text-center flex flex-col justify-center" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
        <div className="text-sm text-gray-500 uppercase tracking-wider mb-2 font-semibold">
          County Analysis
        </div>
        <div className="text-gray-500 text-sm">
        {countyName || '(Hover over a county)'}</div>
      </div>

      {/* Spacer */}
      <div style={{ height: '20px' }}></div>

      {/* Risk Circle */}
      <section className="info-gauge p-6 flex items-center justify-center">
        <CircularGauge 
          value={riskScore} 
          size={160}
          className=""
        />
      </section>

      {/* Spacer */}
        <div style={{ height: '20px' }}></div>

      {/* Insight */}
      <div className="info-insight pt-0" style={{ paddingLeft: '12px', paddingRight: '12px', paddingBottom: '10px' }}>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Insight:
        </div>
        {/* Spacer */}
        <div style={{ height: '3px' }}></div>
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-400 text-sm">Generating insights...</span>
            </div>
          </div>
        ) : insight ? (
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {insight}
          </div>
        ) : (
          <div className="text-gray-600 text-xs">
            Hover over a county to see an environmental analysis
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="info-stats space-y-6 border-t border-white/10 mt-auto" style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px' }}>
        {/* County Name */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Statistics:
          </div>
          {/* Spacer */}
        <div style={{ height: '5px' }}></div>
        </div>
        
        {/* Risk Level */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 tracking-wider">
            Risk Level
          </div>
          <div className={`text-lg font-semibold ${getRiskLevelColor(riskLevel)}`}>
            {riskLevel || '—'}
          </div>
        </div>
        
        {/* Spacer */}
        <div style={{ height: '3px' }}></div>

        {/* Direct Predicted Value */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 tracking-wider">
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

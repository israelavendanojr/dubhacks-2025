import { useState, useEffect } from 'react';

interface InsightsPanelProps {
  countyName: string | null;
  insight: string | null;
  isLoading: boolean;
}

export function InsightsPanel({
  countyName,
  insight,
  isLoading
}: InsightsPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedInsight, setDisplayedInsight] = useState<string | null>(null);

  // Handle smooth transitions when insight changes
  useEffect(() => {
    if (insight && countyName) {
      // Start fade out
      setIsVisible(false);
      
      // After fade out completes, update content and fade in
      const timer = setTimeout(() => {
        setDisplayedInsight(insight);
        setIsVisible(true);
      }, 150); // Half of transition duration
      
      return () => clearTimeout(timer);
    } else {
      // Fade out when no county is hovered
      setIsVisible(false);
      setDisplayedInsight(null);
    }
  }, [insight, countyName]);

  return (
    <div className="w-[280px] h-full bg-[#1a1a1a] border-l border-white/10 flex flex-col">
      {/* County Name Header */}
      <div className="p-6 border-b border-white/10">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          County Analysis
        </div>
        <div className="text-xl font-bold text-white">
          {countyName || 'Hover over map'}
        </div>
      </div>
      
      {/* Insights Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-400 text-sm">Generating insights...</span>
            </div>
          </div>
        ) : displayedInsight ? (
          <div 
            className={`transition-all duration-300 ease-in-out ${
              isVisible 
                ? 'opacity-100 transform translate-x-0' 
                : 'opacity-0 transform translate-x-4'
            }`}
          >
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {displayedInsight}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-2">
                No insights available
              </div>
              <div className="text-gray-600 text-xs">
                Hover over a county to see environmental analysis
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

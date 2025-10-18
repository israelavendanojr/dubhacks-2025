import React from 'react';
import { getPollutionColor, getPollutionLevel } from '../../utils/pollutionColorScale';

interface PollutionLegendProps {
  visible: boolean;
}

export function PollutionLegend({ visible }: PollutionLegendProps) {
  if (!visible) return null;

  const pollutionLevels = [
    { level: 0.1, label: 'Good' },
    { level: 0.3, label: 'Moderate' },
    { level: 0.5, label: 'Unhealthy' },
    { level: 0.7, label: 'Very Unhealthy' },
    { level: 0.9, label: 'Hazardous' }
  ];

  return (
    <div className="absolute bottom-32 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30">
      <div className="text-white text-sm">
        <div className="font-semibold mb-3">CO Pollution Levels</div>
        <div className="space-y-2">
          {pollutionLevels.map(({ level, label }) => {
            const color = getPollutionColor(level);
            const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            
            return (
              <div key={level} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: rgbColor }}
                />
                <span className="text-xs">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Circle size indicates pollution amount
          </div>
        </div>
      </div>
    </div>
  );
}

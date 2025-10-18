import React from 'react';
import { getRiskColorHex, getRiskLevel } from '../../utils/colorMapping';

export function Legend() {
  const riskLevels = [
    { score: 0, label: '0%' },
    { score: 0.25, label: '25%' },
    { score: 0.5, label: '50%' },
    { score: 0.75, label: '75%' },
    { score: 1, label: '100%' }
  ];

  return (
    <div className="absolute bottom-6 right-6 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl">
      <div className="text-white text-sm font-semibold mb-3">Risk Level</div>
      
      {/* Gradient Bar */}
      <div className="relative w-8 h-48 mb-3">
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: `linear-gradient(to top, 
              ${getRiskColorHex(0)} 0%,
              ${getRiskColorHex(0.15)} 15%,
              ${getRiskColorHex(0.35)} 35%,
              ${getRiskColorHex(0.5)} 50%,
              ${getRiskColorHex(0.65)} 65%,
              ${getRiskColorHex(0.85)} 85%,
              ${getRiskColorHex(1)} 100%
            )`
          }}
        />
      </div>
      
      {/* Labels */}
      <div className="space-y-1">
        {riskLevels.map((level, index) => (
          <div key={index} className="flex items-center justify-between text-xs text-gray-300">
            <span>{level.label}</span>
            <div 
              className="w-3 h-3 rounded-full ml-2"
              style={{ backgroundColor: getRiskColorHex(level.score) }}
            />
          </div>
        ))}
      </div>
      
      {/* Risk Level Names */}
      <div className="mt-3 text-xs text-gray-400">
        <div>🟢 Very Low (0-15%)</div>
        <div>🟡 Low (15-35%)</div>
        <div>🟠 Moderate (35-50%)</div>
        <div>🔴 High (50-65%)</div>
        <div>🟤 Very High (65-85%)</div>
        <div>⚫ Extreme (85-100%)</div>
      </div>
    </div>
  );
}

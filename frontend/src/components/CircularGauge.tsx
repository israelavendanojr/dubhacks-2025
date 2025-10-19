// components/CircularGauge.tsx
interface CircularGaugeProps {
  value: number; // 0-1
  size?: number;
}

export function CircularGauge({ value, size = 160 }: CircularGaugeProps) {
  const percentage = value * 100;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Get color based on risk level
  const getColor = () => {
    if (percentage < 15) return '#10b981'; // Green
    if (percentage < 35) return '#22c55e'; // Light green
    if (percentage < 50) return '#eab308'; // Yellow
    if (percentage < 65) return '#f97316'; // Orange
    if (percentage < 85) return '#ef4444'; // Red
    return '#b91c1c'; // Dark red
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-mono font-bold text-white">
          {percentage.toFixed(0)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          RISK
        </div>
      </div>
    </div>
  );
}

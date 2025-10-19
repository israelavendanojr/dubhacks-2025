// components/CircularGauge.tsx
interface CircularGaugeProps {
  value: number; // 0-1
  size?: number;
  className?: string;
}

export function CircularGauge({ value, size = 160, className }: CircularGaugeProps) {
  const percentage = value * 100;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage < 15) return '#10b981'; // Green
    if (percentage < 35) return '#22c55e'; // Light green
    if (percentage < 50) return '#eab308'; // Yellow
    if (percentage < 65) return '#f97316'; // Orange
    if (percentage < 85) return '#ef4444'; // Red
    return '#b91c1c'; // Dark red
  };

  return (
    <div
      className={`relative flex items-center justify-center${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
    >
      {/* Circular SVG */}
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress ring */}
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
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            filter: `drop-shadow(0 0 8px ${getColor()}40)`,
          }}
        />
      </svg>

      {/* Centered text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className="text-sm text-gray-400 mb-1 font-medium tracking-wider">
          RISK
        </div>
        <div className="text-3xl font-bold text-white">
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

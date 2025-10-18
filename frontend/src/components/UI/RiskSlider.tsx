import type { LucideIcon } from 'lucide-react';

interface RiskSliderProps {
  icon: LucideIcon;
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
}

export function RiskSlider({ icon: Icon, label, value, onChange, color = 'cyan' }: RiskSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="flex items-center space-x-4 mb-6">
      {/* Icon */}
      <div className={`text-${color}-400 flex-shrink-0`}>
        <Icon size={24} />
      </div>
      
      {/* Slider Container */}
      <div className="flex-1">
        <div className="text-white text-sm font-medium mb-2">{label}</div>
        
        {/* Vertical Slider */}
        <div className="relative h-32 flex items-center">
          {/* Track */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-700 rounded-full">
            {/* Fill */}
            <div 
              className="absolute bottom-0 w-full bg-cyan-400 rounded-full transition-all duration-200"
              style={{ height: `${value}%` }}
            />
          </div>
          
          {/* Handle */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-cyan-400 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
            style={{ bottom: `${value}%` }}
          />
          
          {/* Input (hidden) */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={value}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ writingMode: 'vertical-lr' as any }}
          />
        </div>
        
        {/* Value Display */}
        <div className="text-center mt-2">
          <span className="text-white text-2xl font-bold">{value}%</span>
        </div>
      </div>
    </div>
  );
}

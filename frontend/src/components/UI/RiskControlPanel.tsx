import { Wind, Volume2, Droplets } from 'lucide-react';
import type { RiskWeights } from '../../types/terrain.types';
import { RiskSlider } from './RiskSlider';
import { GenerateButton } from './GenerateButton';

interface RiskControlPanelProps {
  weights: RiskWeights;
  onWeightsChange: (weights: RiskWeights) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function RiskControlPanel({ 
  weights, 
  onWeightsChange, 
  onGenerate, 
  isGenerating 
}: RiskControlPanelProps) {
  
  const handleWeightChange = (factor: keyof RiskWeights, value: number) => {
    const newWeights = {
      ...weights,
      [factor]: value / 100 // Convert percentage to decimal
    };
    onWeightsChange(newWeights);
  };

  return (
    <div className="absolute left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-sm rounded-r-2xl shadow-2xl z-10">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            RiskScape 3D:
          </h1>
          <p className="text-cyan-400 text-lg">
            Seattle's King County
          </p>
        </div>

        {/* Risk Sliders */}
        <div className="flex-1">
          <RiskSlider
            icon={Wind}
            label="Air Quality"
            value={Math.round(weights.airQuality * 100)}
            onChange={(value) => handleWeightChange('airQuality', value)}
            color="cyan"
          />
          
          <RiskSlider
            icon={Volume2}
            label="Noise Pollution"
            value={Math.round(weights.noisePollution * 100)}
            onChange={(value) => handleWeightChange('noisePollution', value)}
            color="cyan"
          />
          
          <RiskSlider
            icon={Droplets}
            label="Flood/Climate"
            value={Math.round(weights.floodClimate * 100)}
            onChange={(value) => handleWeightChange('floodClimate', value)}
            color="cyan"
          />
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <GenerateButton 
            onClick={onGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Stats */}
        <div className="mt-4 text-xs text-gray-400">
          <div>Total Weight: {Math.round((weights.airQuality + weights.noisePollution + weights.floodClimate) * 100)}%</div>
          <div>Grid Points: 10,000</div>
          <div>Coverage: King County</div>
        </div>
      </div>
    </div>
  );
}

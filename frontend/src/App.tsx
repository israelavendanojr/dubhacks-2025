import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { InfoPanel } from './components/InfoPanel';
import { PromptBar } from './components/PromptBar';
import { useRiskTerrain } from './hooks/useRiskTerrain';
import { useState } from 'react';

function App() {
  const { enrichedGeoJson, isGenerating, loadTerrainFromAPI, currentData } = useRiskTerrain();
  
  // Track hovered county for info panel
  const [hoveredCounty, setHoveredCounty] = useState<{
    name: string;
    riskScore: number;
    riskLevel: string;
    predictedValue: number;
  } | null>(null);

  return (
    <div className="w-full h-screen bg-black flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Info Panel */}
        <InfoPanel
          countyName={hoveredCounty?.name || null}
          riskScore={hoveredCounty?.riskScore || 0}
          riskLevel={hoveredCounty?.riskLevel || ''}
          predictedValue={hoveredCounty?.predictedValue || 0}
          unit={currentData?.unit || ''}
          metric={currentData?.metric || ''}
        />
        
        {/* 3D Map Visualization */}
        <div className="flex-1">
          <RiskTerrainMap 
            enrichedGeoJson={enrichedGeoJson}
            isGenerating={isGenerating}
            onCountyHover={setHoveredCounty}
          />
        </div>
      </div>
      
      {/* Bottom Prompt Bar */}
      <PromptBar onTerrainGenerated={loadTerrainFromAPI} />
    </div>
  );
}

export default App;

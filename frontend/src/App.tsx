import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { InfoPanel } from './components/InfoPanel';
// Removed InsightsPanel in favor of consolidating into left InfoPanel
import { PromptBar } from './components/PromptBar';
import { useRiskTerrain } from './hooks/useRiskTerrain';
import { useState } from 'react';

function App() {
  const { 
    enrichedGeoJson, 
    isGenerating, 
    loadTerrainFromAPI, 
    currentData, 
    countyInsights, 
    insightsLoading 
  } = useRiskTerrain();
  
  // Track hovered county for info panel
  const [hoveredCounty, setHoveredCounty] = useState<{
    name: string;
    riskScore: number;
    riskLevel: string;
    predictedValue: number;
  } | null>(null);

  // Get current insight for hovered county
  const currentInsight = hoveredCounty?.name ? countyInsights[hoveredCounty.name] || null : null;

  return (
    <div className="w-full h-screen bg-black flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden border-t border-l border-white/10">
        {/* Left Info Panel */}
        <InfoPanel
          countyName={hoveredCounty?.name || null}
          riskScore={hoveredCounty?.riskScore || 0}
          riskLevel={hoveredCounty?.riskLevel || ''}
          predictedValue={hoveredCounty?.predictedValue || 0}
          unit={currentData?.unit || ''}
          metric={currentData?.metric || ''}
          insight={currentInsight}
          isLoading={insightsLoading}
        />
        
        {/* 3D Map Visualization */}
        <div className="flex-1 border-t border-r border-white/10">
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

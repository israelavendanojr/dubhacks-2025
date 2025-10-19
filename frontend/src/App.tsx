import React from 'react';
import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { PromptInterface } from './components/PromptInterface';
import { useRiskTerrain } from './hooks/useRiskTerrain';

function App() {
  const { terrainData, isGenerating } = useRiskTerrain();

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-row">
      {/* Left Panel - 3D Terrain Map (70%) */}
      <div className="w-[70%] h-full">
        <RiskTerrainMap 
          terrainData={terrainData}
          isGenerating={isGenerating}
        />
      </div>
      
      {/* Right Panel - Control Panel (30%) */}
      <div className="w-[30%] h-full border-l border-gray-700">
        <PromptInterface />
      </div>
    </div>
  );
}

export default App;

import React from 'react';
import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { useRiskTerrain } from './hooks/useRiskTerrain';

function App() {
  const { terrainData, isGenerating } = useRiskTerrain();

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* 3D Terrain Map */}
      <RiskTerrainMap 
        terrainData={terrainData}
        isGenerating={isGenerating}
      />
    </div>
  );
}

export default App;

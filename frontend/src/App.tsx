import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { PromptInterface } from './components/PromptInterface';
import { useRiskTerrain } from './hooks/useRiskTerrain';

function App() {
  const { enrichedGeoJson, isGenerating, loadTerrainFromAPI } = useRiskTerrain();

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-row">
      {/* Left Panel - 3D Terrain Map (70%) */}
      <div className="w-[70%] h-full">
        <RiskTerrainMap 
          enrichedGeoJson={enrichedGeoJson} // New - enriched GeoJSON data
          isGenerating={isGenerating}
        />
      </div>
      
      {/* Right Panel - Control Panel (30%) */}
      <div className="w-[30%] h-full border-l border-gray-700">
        <PromptInterface onTerrainGenerated={loadTerrainFromAPI} />
      </div>
    </div>
  );
}

export default App;

import { useState, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ViewState } from '../../types/terrain.types';
import type { AggregatedDataPoint } from '../../types/pollution.types';
import { createPollutionLayer } from './PollutionLayer';
import { getPollutionLevel, getPollutionDescription } from '../../utils/pollutionColorScale';
import type { ChemicalConfig } from '../../config/chemicals';

interface RiskTerrainMapProps {
  // Remove: terrainData, isGenerating
  pollutionData?: AggregatedDataPoint[];
  showPollution?: boolean;
  currentMonth?: string;
  chemicalConfig?: ChemicalConfig;
  onViewStateChange?: (viewState: ViewState) => void;
}

// King County view configuration
const KING_COUNTY_VIEW: ViewState = {
  longitude: -122.2015,    // Center of King County
  latitude: 47.4668,
  zoom: 9.5,               // Shows full county
  pitch: 60,               // Dramatic 3D angle
  bearing: -20             // Slight rotation
};



export function RiskTerrainMap({ 
  pollutionData = [],
  showPollution = false,
  currentMonth,
  chemicalConfig,
  onViewStateChange
}: RiskTerrainMapProps) {
  const [viewState, setViewState] = useState<ViewState>(KING_COUNTY_VIEW);
  const [hoveredPollution, setHoveredPollution] = useState<AggregatedDataPoint | null>(null);

  const handleViewStateChange = useCallback((params: any) => {
    const { viewState } = params;
    setViewState(viewState);
    onViewStateChange?.(viewState);
  }, [onViewStateChange]);


  // REMOVE: all terrain layer code, keep only pollution layer
  
  const layers = [
    // Pollution layer
    ...(showPollution && pollutionData.length > 0 ? [
      createPollutionLayer({
        data: pollutionData,
        visible: true,
        opacity: 0.8,
        radiusScale: 50,
        chemicalConfig,
        onHover: (data) => setHoveredPollution(data),
        onClick: (data) => setHoveredPollution(data)
      })
    ] : [])
  ];

  console.log('RiskTerrainMap render:', {
    showPollution,
    dataPointCount: pollutionData.length,
    currentMonth,
    chemical: chemicalConfig?.id
  });

  return (
    <div className="w-full h-full relative">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={handleViewStateChange}
      >
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
          antialias={true}
          preserveDrawingBuffer={true}
          reuseMaps={true}
        />
      </DeckGL>
      


      {/* Pollution Data Tooltip */}
      {hoveredPollution && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30 pointer-events-none">
          <div className="text-white text-sm">
            <div className="font-semibold mb-2">{chemicalConfig?.name} Data</div>
            <div className="space-y-1">
              <div>
                Location: <span className="text-cyan-400">
                  ({hoveredPollution.coordinates[1].toFixed(4)}, {hoveredPollution.coordinates[0].toFixed(4)})
                </span>
              </div>
              {currentMonth && (
                <div>Month: <span className="text-cyan-400">{currentMonth}</span></div>
              )}
              <div>
                Amount: <span className="text-cyan-400 font-bold">
                  {hoveredPollution.averageAmount.toFixed(3)} {chemicalConfig?.unit}
                </span>
              </div>
              <div>Readings: <span className="text-cyan-400">{hoveredPollution.readingCount}</span></div>
              <div>Level: <span className="text-cyan-400">{getPollutionLevel(hoveredPollution.normalizedAmount)}</span></div>
              <div className="text-xs text-gray-400 mt-2">{getPollutionDescription(hoveredPollution.normalizedAmount)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

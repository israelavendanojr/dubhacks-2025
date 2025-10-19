import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { TerrainPoint, ViewState } from '../../types/terrain.types';
import { getRiskColor, getRiskLevel } from '../../utils/colorMapping';

interface RiskTerrainMapProps {
  terrainData: TerrainPoint[];
  isGenerating: boolean;
}

// King County view configuration
const KING_COUNTY_VIEW = {
  longitude: -122.2015,    // Center of King County
  latitude: 47.4668,
  zoom: 9.5,               // Shows full county
  pitch: 60,               // Dramatic 3D angle
  bearing: -20,            // Slight rotation
  minZoom: 8,              // Prevent zooming out too far
  maxZoom: 16,             // Prevent zooming in too close
  maxPitch: 85,            // Allow steep angles
  minPitch: 0              // Allow flat 2D view
};



export function RiskTerrainMap({ 
  terrainData, 
  isGenerating
}: RiskTerrainMapProps) {
  const [viewState, setViewState] = useState<ViewState>(KING_COUNTY_VIEW);
  const [hoveredObject, setHoveredObject] = useState<TerrainPoint | null>(null);

  // Debug: Log terrain data to verify it has proper risk scores
  useMemo(() => {
    if (terrainData.length > 0) {
      console.log('Terrain data debug:', {
        pointCount: terrainData.length,
        samplePoints: terrainData.slice(0, 5).map(p => ({
          lon: p.lon,
          lat: p.lat,
          riskScore: p.riskScore,
          elevation: p.riskScore * 8000
        })),
        riskScoreRange: {
          min: Math.min(...terrainData.map(p => p.riskScore)),
          max: Math.max(...terrainData.map(p => p.riskScore))
        }
      });
    }
  }, [terrainData]);

  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);

  const handleMapLoad = useCallback(() => {
    // Strip non-data layers: no DEM, sky, hillshade, 3D buildings
  }, []);

  // No lighting effects when using flat scatter plot



  const layers = useMemo(() => {
    if (!terrainData || terrainData.length === 0) return [] as any[];

    const points = new ScatterplotLayer<TerrainPoint>({
      id: 'risk-points',
      data: terrainData,
      getPosition: d => [d.lon, d.lat],
      getRadius: () => 100,
      radiusMinPixels: 2,
      radiusMaxPixels: 10,
      filled: true,
      stroked: false,
      getFillColor: d => getRiskColor(d.riskScore) as any,
      pickable: true,
      onHover: info => setHoveredObject(info.object as TerrainPoint || null),
      onClick: info => setHoveredObject(info.object as TerrainPoint || null),
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT
    });

    return [points];
  }, [terrainData]);

  return (
    <div className="w-full h-full relative">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        effects={[]}
        onViewStateChange={handleViewStateChange}
      >
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          style={{ width: '100%', height: '100%' }}
          antialias={true}
          onLoad={handleMapLoad}
          preserveDrawingBuffer={true}
          reuseMaps={true}
        />
      </DeckGL>
      
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-gray-900 rounded-lg p-6 flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-semibold">Generating 3D Terrain...</span>
          </div>
        </div>
      )}

      {/* Risk Terrain Tooltip */}
      {hoveredObject && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30 pointer-events-none">
          <div className="text-white text-sm">
            <div className="font-semibold mb-2">Risk Analysis</div>
            <div className="space-y-1">
              <div>Overall Risk: <span className="text-cyan-400 font-bold">{Math.round(hoveredObject.riskScore * 100)}%</span></div>
              <div>Risk Level: <span className="text-cyan-400">{getRiskLevel(hoveredObject.riskScore)}</span></div>
              <div className="text-xs text-gray-400 mt-2">Breakdown:</div>
              <div className="text-xs">Air Quality: {Math.round(hoveredObject.breakdown.airQuality * 100)}%</div>
              <div className="text-xs">Noise: {Math.round(hoveredObject.breakdown.noisePollution * 100)}%</div>
              <div className="text-xs">Flood/Climate: {Math.round(hoveredObject.breakdown.floodClimate * 100)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

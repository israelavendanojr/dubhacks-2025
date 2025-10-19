import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { TerrainPoint, ViewState } from '../../types/terrain.types';
import { getRiskColor, getRiskLevel, getExaggeratedHeight } from '../../utils/colorMapping';

interface RiskTerrainMapProps {
  terrainData: TerrainPoint[];
  isGenerating: boolean;
}

// King County view configuration
const KING_COUNTY_VIEW = {
  longitude: -122.2015,    // Center of King County
  latitude: 47.4668,
  zoom: 10.5,               // Shows full county
  pitch: 60,               // Dramatic 3D angle
  bearing: -20,            // Slight rotation
  minZoom: 6,              // Allow zooming out much farther
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
          elevation: getExaggeratedHeight(p.riskScore)
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

  // Create solid lighting effects for 3D terrain visualization
  const lightingEffect = useMemo(() => {
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 0.6 // Higher ambient for more solid appearance
    });

    const directionalLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: 1.2, // Good intensity for solid lighting
      direction: [-0.5, -0.5, -1] // Angled light for better terrain definition
    });

    return new LightingEffect({ ambientLight, directionalLight });
  }, []);



  const layers = useMemo(() => {
    console.log('=== LAYER CREATION ===');
    console.log('Terrain data length:', terrainData?.length || 0);
    console.log('Terrain data exists:', !!terrainData);
    
    if (!terrainData || terrainData.length === 0) {
      console.log('No terrain data - returning empty layers');
      return [] as any[];
    }

    console.log('Building column layer for', terrainData.length, 'data points');
    console.log('Sample terrain data:', terrainData.slice(0, 3));


    console.log('Creating ColumnLayer with terrain data');
    console.log('Sample terrain data for columns:', terrainData.slice(0, 3).map(d => ({
      position: [d.lon, d.lat],
      elevation: getExaggeratedHeight(d.riskScore),
      color: getRiskColor(d.riskScore),
      riskScore: d.riskScore
    })));

    const columnLayer = new ColumnLayer({
      id: 'risk-columns',
      data: terrainData,
      getPosition: (d: TerrainPoint) => [d.lon, d.lat],
      getFillColor: (d: TerrainPoint) => {
        const [r, g, b] = getRiskColor(d.riskScore);
        return [r, g, b, 255];
      },
      getLineColor: [0, 0, 0, 255],
      getElevation: (d: TerrainPoint) => getExaggeratedHeight(d.riskScore),
      radius: 3000, // radius in meters - increased for fuller coverage
      pickable: true,
      opacity: 0.8,
      onHover: ({ object }) => {
        if (object) setHoveredObject(object);
      },
      onClick: ({ object }) => {
        if (object) setHoveredObject(object);
      }
    });

    console.log('Column layer created:', columnLayer);
    console.log('Returning layers array with', 1, 'layer');
    return [columnLayer];
  }, [terrainData]);

  return (
    <div className="w-full h-full relative">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        onViewStateChange={handleViewStateChange}
        onError={(error) => {
          console.error('DeckGL Error:', error);
        }}
      >
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
          antialias={true}
          preserveDrawingBuffer={true}
          reuseMaps={true}
          onError={(error) => {
            console.warn('Mapbox Error (non-critical):', error);
          }}
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

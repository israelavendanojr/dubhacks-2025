import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer } from '@deck.gl/layers';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { TerrainPoint, ViewState } from '../../types/terrain.types';
import type { AggregatedDataPoint } from '../../types/pollution.types';
import { getRiskColor, getRiskLevel } from '../../utils/colorMapping';
import { createPollutionLayer } from './PollutionLayer';
import { getPollutionLevel, getPollutionDescription } from '../../utils/pollutionColorScale';
import type { ChemicalConfig } from '../../config/chemicals';

interface RiskTerrainMapProps {
  terrainData: TerrainPoint[];
  isGenerating: boolean;
  onViewStateChange?: (viewState: ViewState) => void;
  // Pollution data props
  pollutionData?: AggregatedDataPoint[];
  showPollution?: boolean;
  currentMonth?: string;
  chemicalConfig?: ChemicalConfig;
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

// Camera presets for different views
const CAMERA_PRESETS = {
  overview: {
    longitude: -122.2015,
    latitude: 47.4668,
    zoom: 9.5,
    pitch: 60,
    bearing: 0
  },
  seattle: {
    longitude: -122.3321,
    latitude: 47.6062,
    zoom: 12,
    pitch: 60,
    bearing: 30
  },
  bellevue: {
    longitude: -122.2015,
    latitude: 47.6101,
    zoom: 12,
    pitch: 60,
    bearing: -30
  }
};

// Major landmarks in King County
const LANDMARKS = [
  { name: 'Seattle', coordinates: [-122.3321, 47.6062] },
  { name: 'Bellevue', coordinates: [-122.2015, 47.6101] },
  { name: 'Renton', coordinates: [-122.2171, 47.4829] },
  { name: 'Kent', coordinates: [-122.2348, 47.3809] },
  { name: 'Auburn', coordinates: [-122.2285, 47.3073] },
  { name: 'Redmond', coordinates: [-122.1215, 47.6740] },
  { name: 'Lake Washington', coordinates: [-122.2401, 47.6205] },
  { name: 'Puget Sound', coordinates: [-122.4284, 47.6062] }
];

// Simplified water bodies for King County
const WATER_BODIES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Lake Washington' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.3, 47.5], [-122.2, 47.5], [-122.2, 47.7], [-122.3, 47.7], [-122.3, 47.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Puget Sound' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 47.4], [-122.3, 47.4], [-122.3, 47.8], [-122.5, 47.8], [-122.5, 47.4]
        ]]
      }
    }
  ]
};

export function RiskTerrainMap({ 
  terrainData, 
  isGenerating, 
  onViewStateChange,
  pollutionData = [],
  showPollution = false,
  currentMonth,
  chemicalConfig
}: RiskTerrainMapProps) {
  const [viewState, setViewState] = useState<ViewState>(KING_COUNTY_VIEW);
  const [hoveredObject, setHoveredObject] = useState<TerrainPoint | null>(null);
  const [hoveredPollution, setHoveredPollution] = useState<AggregatedDataPoint | null>(null);

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
    onViewStateChange?.(viewState);
  }, [onViewStateChange]);

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

  // Create geographic layers
  const waterLayer = new GeoJsonLayer({
    id: 'water-bodies',
    data: WATER_BODIES as any,
    filled: true,
    getFillColor: [30, 96, 145, 180], // Blue water color
    getLineColor: [40, 120, 180, 255],
    lineWidthMinPixels: 1,
    extruded: false, // Keep flat at elevation 0
    pickable: false
  });

  const landmarkLayer = new TextLayer({
    id: 'landmarks',
    data: LANDMARKS,
    pickable: false,
    getPosition: (d: any) => d.coordinates,
    getText: (d: any) => d.name,
    getSize: 16,
    getColor: [255, 255, 255, 200],
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    outlineWidth: 2,
    outlineColor: [0, 0, 0, 255],
    fontSettings: {
      sdf: true
    }
  });

  const layers = [
    // 1. Water bodies (bottom layer)
    waterLayer,
    
    // 2. Risk terrain layer - Thicker columns for better visibility
    new ColumnLayer({
      id: 'risk-terrain',
      data: terrainData,
      diskResolution: 12, // Good resolution for smooth appearance
      radius: 60, // Thicker radius for better visibility
      extruded: true,
      pickable: true,
      elevationScale: 1,
      getPosition: (d: TerrainPoint) => [d.lon, d.lat],
      getElevation: (d: TerrainPoint) => d.riskScore * 8000, // Much higher elevation for dramatic effect
      getFillColor: (d: TerrainPoint) => getRiskColor(d.riskScore),
      material: {
        ambient: 0.6,
        diffuse: 1.0,
        shininess: 32,
        specularColor: [50, 50, 50]
      },
      parameters: {
        depthTest: true,
        blend: false
      },
      onHover: ({ object }) => setHoveredObject(object as TerrainPoint),
      onClick: ({ object }) => setHoveredObject(object as TerrainPoint)
    }),
    
    // 3. Pollution layer
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
    ] : []),
    
    // 4. Landmarks (top layer)
    landmarkLayer
  ];

  return (
    <div className="w-full h-full relative">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        onViewStateChange={handleViewStateChange}
        parameters={{
          clearColor: [0, 0, 0, 1]
        }}
        glOptions={{
          preserveDrawingBuffer: true,
          antialias: true,
          depth: true,
          stencil: false
        }}
      >
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
          antialias={true}
          preserveDrawingBuffer={true}
          reuseMaps={true}
          glOptions={{
            preserveDrawingBuffer: true,
            antialias: true,
            depth: true
          }}
        />
      </DeckGL>
      
      {/* Camera Preset Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
        <button
          onClick={() => setViewState(CAMERA_PRESETS.overview)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          King County Overview
        </button>
        <button
          onClick={() => setViewState(CAMERA_PRESETS.seattle)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          Seattle
        </button>
        <button
          onClick={() => setViewState(CAMERA_PRESETS.bellevue)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          Bellevue
        </button>
      </div>

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
      {hoveredObject && !hoveredPollution && (
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

      {/* Pollution Data Tooltip */}
      {hoveredPollution && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30 pointer-events-none">
          <div className="text-white text-sm">
            <div className="font-semibold mb-2">CO Pollution Data</div>
            <div className="space-y-1">
              <div>Location: <span className="text-cyan-400">({hoveredPollution.coordinates[1].toFixed(4)}, {hoveredPollution.coordinates[0].toFixed(4)})</span></div>
              {currentMonth && <div>Month: <span className="text-cyan-400">{currentMonth}</span></div>}
              <div>CO Amount: <span className="text-cyan-400 font-bold">{hoveredPollution.averageAmount.toFixed(3)}</span></div>
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

import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { AmbientLight, DirectionalLight, LightingEffect, COORDINATE_SYSTEM } from '@deck.gl/core';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { TerrainPoint, ViewState } from '../../types/terrain.types';
import { getRiskColor, getRiskLevel } from '../../utils/colorMapping';
import { buildHeightfieldMesh, gaussianSmoothGrid } from '../../utils/heightfield';

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
    if (!terrainData || terrainData.length === 0) return [] as any[];

    // Infer grid dimensions from generator: GRID_RESOLUTION x GRID_RESOLUTION
    const gridSize = Math.round(Math.sqrt(terrainData.length));
    const gridWidth = gridSize;
    const gridHeight = gridSize;

    // Prepare risk value grid and smooth it
    const rawValues = new Float32Array(terrainData.length);
    for (let i = 0; i < terrainData.length; i++) rawValues[i] = terrainData[i].riskScore;
    const smoothedValues = gaussianSmoothGrid(rawValues, gridWidth, gridHeight, 1.8, 2);

    const mesh = buildHeightfieldMesh(
      // inject smoothed heights while keeping other props for picking
      terrainData.map((p, i) => ({ ...p, riskScore: smoothedValues[i] })),
      gridWidth,
      gridHeight,
      8000
    );

    // Build a color texture canvas 0..1 uv mapping using risk colors
    const canvas = document.createElement('canvas');
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imageData = ctx.createImageData(gridWidth, gridHeight);
      const brightness = 1.35; // increase to make colors brighter
      const boost = (c: number) => Math.min(255, Math.round(c * brightness));
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const idx = y * gridWidth + x;
          const [r, g, b, a] = getRiskColor(smoothedValues[idx]);
          const base = (y * gridWidth + x) * 4;
          imageData.data[base + 0] = boost(r);
          imageData.data[base + 1] = boost(g);
          imageData.data[base + 2] = boost(b);
          imageData.data[base + 3] = a;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // Helper to find nearest grid cell for picking
    function getNearestPointFromCoordinate(lon: number, lat: number): TerrainPoint | null {
      const x = Math.round((lon - mesh.originLon) / mesh.cellSizeLngDeg);
      const y = Math.round((lat - mesh.originLat) / mesh.cellSizeLatDeg);
      if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) return null;
      return terrainData[y * gridWidth + x];
    }

    const surface = new SimpleMeshLayer({
      id: 'risk-surface',
      data: [0], // single mesh instance
      mesh: {
        attributes: {
          positions: { value: mesh.positions, size: 3 },
          texCoords: { value: mesh.texCoords, size: 2 }
        },
        indices: mesh.indices
      } as any,
      texture: canvas,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      coordinateOrigin: [mesh.originLon, mesh.originLat, 0],
      pickable: true,
      opacity: 0.25,
      parameters: {
        depthTest: true,
        blend: true
      },
      onHover: ({ coordinate }) => {
        if (!coordinate) return;
        const [lon, lat] = coordinate as [number, number];
        const nearest = getNearestPointFromCoordinate(lon, lat);
        // Show smoothed risk while preserving original factor breakdown
        if (nearest) setHoveredObject({ ...nearest, riskScore: smoothedValues[terrainData.indexOf(nearest)] });
      },
      onClick: ({ coordinate }) => {
        if (!coordinate) return;
        const [lon, lat] = coordinate as [number, number];
        const nearest = getNearestPointFromCoordinate(lon, lat);
        if (nearest) setHoveredObject({ ...nearest, riskScore: smoothedValues[terrainData.indexOf(nearest)] });
      }
    });

    return [surface];
  }, [terrainData]);

  return (
    <div className="w-full h-full relative">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
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

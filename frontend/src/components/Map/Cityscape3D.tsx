import React, { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Cityscape3DProps {
  onViewStateChange?: (viewState: any) => void;
}

// Seattle downtown view configuration
const SEATTLE_VIEW = {
  longitude: -122.3321,
  latitude: 47.6062,
  zoom: 15,
  pitch: 60,
  bearing: 0,
  minZoom: 10,
  maxZoom: 20,
  maxPitch: 85,
  minPitch: 0
};

// Camera presets for different cityscape views
const CAMERA_PRESETS = {
  downtown: {
    longitude: -122.3321,
    latitude: 47.6062,
    zoom: 15,
    pitch: 60,
    bearing: 0
  },
  spaceNeedle: {
    longitude: -122.3485,
    latitude: 47.6205,
    zoom: 16,
    pitch: 70,
    bearing: 45
  },
  waterfront: {
    longitude: -122.3400,
    latitude: 47.6100,
    zoom: 15,
    pitch: 50,
    bearing: -30
  },
  bellevue: {
    longitude: -122.2015,
    latitude: 47.6101,
    zoom: 15,
    pitch: 60,
    bearing: 0
  }
};

// Sample 3D data points for demonstration
const SAMPLE_3D_DATA = [
  // Downtown Seattle area
  { id: 1, coordinates: [-122.3321, 47.6062, 0], value: 85, color: [255, 100, 100] },
  { id: 2, coordinates: [-122.3300, 47.6050, 0], value: 72, color: [255, 150, 100] },
  { id: 3, coordinates: [-122.3340, 47.6070, 0], value: 90, color: [255, 80, 80] },
  { id: 4, coordinates: [-122.3280, 47.6080, 0], value: 65, color: [255, 180, 100] },
  { id: 5, coordinates: [-122.3360, 47.6040, 0], value: 78, color: [255, 120, 100] },
  
  // Space Needle area
  { id: 6, coordinates: [-122.3485, 47.6205, 0], value: 95, color: [255, 60, 60] },
  { id: 7, coordinates: [-122.3460, 47.6190, 0], value: 88, color: [255, 90, 90] },
  { id: 8, coordinates: [-122.3510, 47.6220, 0], value: 82, color: [255, 110, 110] },
  
  // Waterfront area
  { id: 9, coordinates: [-122.3400, 47.6100, 0], value: 70, color: [255, 160, 100] },
  { id: 10, coordinates: [-122.3380, 47.6115, 0], value: 75, color: [255, 140, 100] },
  
  // Bellevue area
  { id: 11, coordinates: [-122.2015, 47.6101, 0], value: 68, color: [255, 170, 100] },
  { id: 12, coordinates: [-122.1990, 47.6085, 0], value: 73, color: [255, 130, 100] },
  { id: 13, coordinates: [-122.2040, 47.6115, 0], value: 80, color: [255, 100, 100] }
];

export function Cityscape3D({ onViewStateChange }: Cityscape3DProps) {
  const [viewState, setViewState] = useState(SEATTLE_VIEW);
  const [hoveredObject, setHoveredObject] = useState<any>(null);

  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
    onViewStateChange?.(viewState);
  }, [onViewStateChange]);

  // Create dramatic lighting effects for 3D cityscape
  const lightingEffect = useMemo(() => {
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 0.4
    });

    const directionalLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: 1.2,
      direction: [-0.5, -0.5, -1]
    });

    return new LightingEffect({ ambientLight, directionalLight });
  }, []);

  // Create 3D data visualization layers
  const layers = [
    // 3D columns for data visualization
    new ColumnLayer({
      id: '3d-data-columns',
      data: SAMPLE_3D_DATA,
      diskResolution: 12,
      radius: 30,
      extruded: true,
      pickable: true,
      elevationScale: 1,
      getPosition: (d: any) => [d.coordinates[0], d.coordinates[1]],
      getElevation: (d: any) => d.value * 10, // Scale for visibility
      getFillColor: (d: any) => [...d.color, 200],
      material: {
        ambient: 0.6,
        diffuse: 0.8,
        shininess: 32,
        specularColor: [50, 50, 50]
      },
      parameters: {
        depthTest: true,
        blend: false
      },
      onHover: ({ object }) => setHoveredObject(object),
      onClick: ({ object }) => setHoveredObject(object)
    }),

    // Scatter points for additional data
    new ScatterplotLayer({
      id: '3d-data-points',
      data: SAMPLE_3D_DATA,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 3,
      radiusMaxPixels: 20,
      lineWidthMinPixels: 1,
      getPosition: (d: any) => [d.coordinates[0], d.coordinates[1]],
      getRadius: (d: any) => d.value / 10,
      getFillColor: (d: any) => [...d.color, 150],
      getLineColor: [255, 255, 255, 100],
      onHover: ({ object }) => setHoveredObject(object),
      onClick: ({ object }) => setHoveredObject(object)
    }),

    // Text labels for landmarks
    new TextLayer({
      id: 'landmark-labels',
      data: [
        { coordinates: [-122.3321, 47.6062], text: 'Downtown' },
        { coordinates: [-122.3485, 47.6205], text: 'Space Needle' },
        { coordinates: [-122.3400, 47.6100], text: 'Waterfront' },
        { coordinates: [-122.2015, 47.6101], text: 'Bellevue' }
      ],
      pickable: false,
      getPosition: (d: any) => d.coordinates,
      getText: (d: any) => d.text,
      getSize: 20,
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
    })
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
          onLoad={(event) => {
            const map = event.target;
            
            // Add enhanced 3D buildings layer
            map.addLayer({
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 10,
              'paint': {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0, '#444',    // Very dark for short buildings
                  50, '#555',   // Dark for mid-height
                  100, '#666',  // Medium for tall buildings
                  200, '#777',  // Light for very tall buildings
                  300, '#888'   // Lightest for skyscrapers
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10,
                  0,
                  10.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10,
                  0,
                  10.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.9,
                'fill-extrusion-vertical-gradient': true
              }
            });

            // Add building outlines for better definition
            map.addLayer({
              'id': 'building-outlines',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'line',
              'minzoom': 10,
              'paint': {
                'line-color': '#333',
                'line-width': 1,
                'line-opacity': 0.6
              }
            });
          }}
        />
      </DeckGL>
      
      {/* Camera Preset Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
        <button
          onClick={() => setViewState(CAMERA_PRESETS.downtown)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          Downtown
        </button>
        <button
          onClick={() => setViewState(CAMERA_PRESETS.spaceNeedle)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          Space Needle
        </button>
        <button
          onClick={() => setViewState(CAMERA_PRESETS.waterfront)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          Waterfront
        </button>
        <button
          onClick={() => setViewState(CAMERA_PRESETS.bellevue)}
          className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/90 transition-colors"
        >
          Bellevue
        </button>
      </div>

      {/* Data Tooltip */}
      {hoveredObject && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30 pointer-events-none">
          <div className="text-white text-sm">
            <div className="font-semibold mb-2">3D Data Point</div>
            <div className="space-y-1">
              <div>Value: <span className="text-cyan-400 font-bold">{hoveredObject.value}</span></div>
              <div>Location: <span className="text-cyan-400">({hoveredObject.coordinates[1].toFixed(4)}, {hoveredObject.coordinates[0].toFixed(4)})</span></div>
              <div>Elevation: <span className="text-cyan-400">{hoveredObject.value * 10}m</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 z-20 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl">
        <div className="text-white text-sm">
          <div className="font-semibold mb-2">3D Cityscape</div>
          <div className="space-y-1 text-xs text-gray-300">
            <div>• Dark buildings: Real 3D cityscape</div>
            <div>• Colored columns: Data visualization</div>
            <div>• Interactive: Hover and click data points</div>
            <div>• Camera: Use presets or drag to explore</div>
          </div>
        </div>
      </div>
    </div>
  );
}

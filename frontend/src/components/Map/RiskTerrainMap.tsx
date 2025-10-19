import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ViewState } from '../../types/terrain.types';
import type { FeatureCollection, Feature } from 'geojson';
import { getRiskColor, getRiskLevel, getExaggeratedHeight } from '../../utils/colorMapping';

interface RiskTerrainMapProps {
  enrichedGeoJson: FeatureCollection | null; // New - enriched GeoJSON data
  isGenerating: boolean;
}

// Washington State view configuration - optimized for county boundary visualization
const WASHINGTON_STATE_VIEW = {
  longitude: -120.0,       // Center of Washington State (adjusted for better county view)
  latitude: 47.5,          // Slightly adjusted for better coverage
  zoom: 5.5,               // Shows full state with good county detail
  pitch: 45,               // Good angle for viewing 3D extrusions
  bearing: 0,              // North-up orientation
  minZoom: 4,              // Allow zooming out to see full state
  maxZoom: 16,             // Prevent zooming in too close
  maxPitch: 85,            // Allow steep angles
  minPitch: 0              // Allow flat 2D view
};



export function RiskTerrainMap({ 
  enrichedGeoJson, // New - enriched GeoJSON data
  isGenerating
}: RiskTerrainMapProps) {
  const [viewState, setViewState] = useState<ViewState>(WASHINGTON_STATE_VIEW);
  const [hoveredObject, setHoveredObject] = useState<Feature | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Debug: Log enriched GeoJSON data to verify it has proper risk scores
  useMemo(() => {
    if (enrichedGeoJson && enrichedGeoJson.features.length > 0) {
      console.log('Enriched GeoJSON debug:', {
        featureCount: enrichedGeoJson.features.length,
        sampleFeatures: enrichedGeoJson.features.slice(0, 5).map(f => ({
          county: f.properties?.CNTY || f.properties?.COUNTY || f.properties?.NAME || f.properties?.COUNTY_NAME || f.properties?.CNTY_NM || f.properties?.COUNTY_NM || 'Unknown',
          riskScore: f.properties?.riskScore,
          predictedValue: f.properties?.predictedValue,
          elevation: f.properties?.riskScore ? getExaggeratedHeight(f.properties.riskScore) : 0
        })),
        riskScoreRange: {
          min: Math.min(...enrichedGeoJson.features.map(f => f.properties?.riskScore || 0)),
          max: Math.max(...enrichedGeoJson.features.map(f => f.properties?.riskScore || 0))
        }
      });
    }
  }, [enrichedGeoJson]);

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
    console.log('=== GEOJSON LAYER CREATION ===');
    console.log('Enriched GeoJSON exists:', !!enrichedGeoJson);
    console.log('Feature count:', enrichedGeoJson?.features?.length || 0);
    
    if (!enrichedGeoJson || enrichedGeoJson.features.length === 0) {
      console.log('No enriched GeoJSON data - returning empty layers');
      return [] as any[];
    }

    console.log('Building GeoJsonLayer for', enrichedGeoJson.features.length, 'county features');
    console.log('Sample features:', enrichedGeoJson.features.slice(0, 3).map(f => ({
      county: f.properties?.CNTY || f.properties?.COUNTY || f.properties?.NAME || f.properties?.COUNTY_NAME || f.properties?.CNTY_NM || f.properties?.COUNTY_NM || 'Unknown',
      riskScore: f.properties?.riskScore,
      predictedValue: f.properties?.predictedValue
    })));

    const geoJsonLayer = new GeoJsonLayer({
      id: 'wa-county-extrusions',
      data: enrichedGeoJson as any, // Type assertion to work around Deck.gl type issues
      
      // *** 3D Extrusion Configuration ***
      extruded: true,
      wireframe: false, // Set to true for skeletal view if desired
      
      // Height Mapping: Use the riskScore property with dramatic scaling
      getElevation: (f: any) => {
        const riskScore = f.properties?.riskScore || 0;
        return getExaggeratedHeight(riskScore);
      },
      
      // Color Mapping: Use the riskScore property for color gradient
      getFillColor: (f: any) => {
        const riskScore = f.properties?.riskScore || 0;
        return getRiskColor(riskScore);
      },
      
      // Border styling
      getLineColor: [0, 0, 0, 100], // Dark, semi-transparent border
      getLineWidth: 200, // Border width
      
      // Interactivity
      pickable: true,
      opacity: 0.8,
      onHover: ({ object }) => {
        if (object) setHoveredObject(object as Feature);
      },
      onClick: ({ object }) => {
        if (object) setHoveredObject(object as Feature);
      }
    });

    console.log('GeoJsonLayer created:', geoJsonLayer);
    console.log('Returning layers array with', 1, 'layer');
    return [geoJsonLayer];
  }, [enrichedGeoJson]);

  // Show fallback UI if WebGL fails
  if (webglError) {
    return (
      <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-600 text-lg font-semibold mb-4">WebGL Rendering Error</div>
          <div className="text-gray-700 mb-4">{webglError}</div>
          <button 
            onClick={() => setWebglError(null)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          setWebglError(error.message || 'WebGL rendering error');
          // Don't crash the app on WebGL errors, just log them
        }}
      >
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
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
            <div className="font-semibold mb-2">County Risk Analysis</div>
            <div className="space-y-1">
              <div>County: <span className="text-cyan-400 font-bold">
                {hoveredObject.properties?.CNTY || 
                 hoveredObject.properties?.COUNTY || 
                 hoveredObject.properties?.NAME || 
                 hoveredObject.properties?.COUNTY_NAME ||
                 hoveredObject.properties?.CNTY_NM ||
                 hoveredObject.properties?.COUNTY_NM ||
                 'Unknown'}
              </span></div>
              <div>Overall Risk: <span className="text-cyan-400 font-bold">{Math.round((hoveredObject.properties?.riskScore || 0) * 100)}%</span></div>
              <div>Risk Level: <span className="text-cyan-400">{getRiskLevel(hoveredObject.properties?.riskScore || 0)}</span></div>
              {hoveredObject.properties?.predictedValue !== undefined && (
                <div>Predicted Value: <span className="text-cyan-400">{hoveredObject.properties.predictedValue.toFixed(2)}</span></div>
              )}
              {hoveredObject.properties?.apiData && (
                <>
                  <div className="text-xs text-gray-400 mt-2">Additional Data:</div>
                  <div className="text-xs">Density: {hoveredObject.properties.apiData.density?.toFixed(2) || 'N/A'}</div>
                  <div className="text-xs">Ground Truth: {hoveredObject.properties.apiData.ground_truth_value?.toFixed(2) || 'N/A'}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

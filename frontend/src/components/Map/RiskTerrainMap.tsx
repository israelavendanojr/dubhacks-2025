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
  onCountyHover?: (countyData: {
    name: string;
    riskScore: number;
    riskLevel: string;
    predictedValue: number;
  } | null) => void;
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
  isGenerating,
  onCountyHover
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
        const baseHeight = getExaggeratedHeight(riskScore);
        // Add 10% height on hover for subtle feedback
        return hoveredObject?.properties?.CNTY === f.properties?.CNTY 
          ? baseHeight * 1.1 
          : baseHeight;
      },
      
      // Color Mapping: Use the riskScore property for color gradient
      getFillColor: (f: any) => {
        const riskScore = f.properties?.riskScore || 0;
        const baseColor = getRiskColor(riskScore);
        // Brighten on hover
        if (hoveredObject?.properties?.CNTY === f.properties?.CNTY) {
          return [
            Math.min(255, baseColor[0] * 1.2),
            Math.min(255, baseColor[1] * 1.2),
            Math.min(255, baseColor[2] * 1.2),
            255
          ];
        }
        return baseColor;
      },
      
      // Border styling
      getLineColor: [0, 0, 0, 100], // Dark, semi-transparent border
      getLineWidth: 200, // Border width
      
      // Interactivity
      pickable: true,
      opacity: 0.8,
      onHover: ({ object }) => {
        setHoveredObject(object as Feature);
        
        // Send data to info panel
        if (object && onCountyHover) {
          const props = object.properties;
          onCountyHover({
            name: props?.CNTY || props?.COUNTY || props?.NAME || 'Unknown',
            riskScore: props?.riskScore || 0,
            riskLevel: getRiskLevel(props?.riskScore || 0),
            predictedValue: props?.predictedValue || 0,
          });
        } else if (!object && onCountyHover) {
          onCountyHover(null);
        }
      },
      onClick: ({ object }) => {
        if (object) setHoveredObject(object as Feature);
      }
    });

    console.log('GeoJsonLayer created:', geoJsonLayer);
    console.log('Returning layers array with', 1, 'layer');
    return [geoJsonLayer];
  }, [enrichedGeoJson, hoveredObject, onCountyHover]);

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
      
      {/* Simple loading overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-semibold">Generating Terrain...</span>
          </div>
        </div>
      )}
    </div>
  );
}

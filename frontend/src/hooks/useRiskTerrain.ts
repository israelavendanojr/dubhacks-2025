import { useState, useCallback } from 'react';
import type { TerrainPoint } from '../types/terrain.types';
import type { SimulationResponse } from '../utils/apiClient';
import { fetchGeoJsonData, enrichGeoJsonWithRisk, createFallbackCountyGeoJson } from '../utils/geojsonFetcher';
import { convertCountyDataToColumns } from '../utils/dataInterpolation';

export function useRiskTerrain() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [terrainData, setTerrainData] = useState<TerrainPoint[]>([]);
  const [enrichedGeoJson, setEnrichedGeoJson] = useState<any>(null);
  
  // Function to generate enriched GeoJSON from API county data
  const loadTerrainFromAPI = useCallback(async (apiResponse: SimulationResponse) => {
    setIsGenerating(true);
    
    try {
      console.log('=== LOADING ENRICHED GEOJSON FROM API ===');
      console.log('Full API Response:', JSON.stringify(apiResponse, null, 2));
      console.log('Data Points Count:', apiResponse.data.dataPoints.length);
      console.log('Sample Data Points:', apiResponse.data.dataPoints.slice(0, 3));
      console.log('Baseline Data:', apiResponse.data.baseline);
      console.log('Metric:', apiResponse.data.metric);
      
      // Step 1: Fetch Washington State county boundaries
      console.log('=== FETCHING COUNTY BOUNDARIES ===');
      let countyGeoJson;
      try {
        countyGeoJson = await fetchGeoJsonData();
        if (!countyGeoJson) {
          throw new Error('Failed to fetch county boundaries - no data returned');
        }
      } catch (error) {
        console.error('Failed to fetch county boundaries:', error);
        // For now, we'll fall back to the legacy terrain system
        // In the future, we could implement a fallback with simplified county shapes
        throw new Error(`Failed to fetch county boundaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Step 2: Enrich GeoJSON with risk data
      console.log('=== ENRICHING GEOJSON WITH RISK DATA ===');
      const enriched = enrichGeoJsonWithRisk(countyGeoJson, apiResponse.data.dataPoints);
      
      if (enriched && enriched.features.length > 0) {
        const featuresWithData = enriched.features.filter(f => (f.properties?.riskScore ?? 0) > 0);
        
        if (featuresWithData.length > 0) {
          console.log('=== GEOJSON ENRICHMENT COMPLETE ===');
          console.log('Total Features:', enriched.features.length);
          console.log('Features with Risk Data:', featuresWithData.length);
          console.log('Risk Score Range:', {
            min: Math.min(...enriched.features.map(f => f.properties?.riskScore ?? 0)),
            max: Math.max(...enriched.features.map(f => f.properties?.riskScore ?? 0))
          });
          console.log('Sample Enriched Features:', enriched.features.slice(0, 3).map(f => ({
            county: f.properties?.CNTY,
            riskScore: f.properties?.riskScore,
            predictedValue: f.properties?.predictedValue
          })));
          
          // Set the enriched GeoJSON data
          setEnrichedGeoJson(enriched);
        } else {
          console.warn('No features with risk data found - using fallback county boundaries');
          const fallbackGeoJson = createFallbackCountyGeoJson(apiResponse.data.dataPoints);
          setEnrichedGeoJson(fallbackGeoJson);
        }
      } else {
        console.warn('GeoJSON enrichment failed - using fallback county boundaries');
        const fallbackGeoJson = createFallbackCountyGeoJson(apiResponse.data.dataPoints);
        setEnrichedGeoJson(fallbackGeoJson);
      }
      
      // For backward compatibility, also convert to terrain points (will be removed in next phase)
      const columnData = convertCountyDataToColumns(apiResponse.data.dataPoints, false, 39);
      setTerrainData(columnData);
      
      console.log('Enriched GeoJSON data set successfully!');
    } catch (error) {
      console.error('Error loading enriched GeoJSON from API:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  return {
    terrainData, // Legacy - will be removed
    enrichedGeoJson, // New - enriched GeoJSON data
    isGenerating,
    loadTerrainFromAPI  // Expose this to PromptInterface
  };
}

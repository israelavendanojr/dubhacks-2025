import { useState, useCallback } from 'react';
import type { TerrainPoint } from '../types/terrain.types';
import type { SimulationResponse } from '../utils/apiClient';
import { convertCountyDataToColumns } from '../utils/dataInterpolation';

export function useRiskTerrain() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [terrainData, setTerrainData] = useState<TerrainPoint[]>([]);
  
  // Function to generate terrain from API county data
  const loadTerrainFromAPI = useCallback(async (apiResponse: SimulationResponse) => {
    setIsGenerating(true);
    
    try {
      console.log('=== LOADING TERRAIN FROM API ===');
      console.log('Full API Response:', JSON.stringify(apiResponse, null, 2));
      console.log('Data Points Count:', apiResponse.data.dataPoints.length);
      console.log('Sample Data Points:', apiResponse.data.dataPoints.slice(0, 3));
      console.log('Baseline Data:', apiResponse.data.baseline);
      console.log('Metric:', apiResponse.data.metric);
      
      // Convert 39 county points to column data
      // Option 1: Use 39 points directly (sparse but accurate)
      // Option 2: Interpolate to ~100-200 points for visual density
      const columnData = convertCountyDataToColumns(apiResponse.data.dataPoints, false, 39);
      
      console.log('=== TERRAIN CONVERSION ===');
      console.log('Original County Count:', apiResponse.data.dataPoints.length);
      console.log('Final Terrain Points:', columnData.length);
      console.log('Sample Terrain Points:', columnData.slice(0, 5));
      console.log('Risk Score Range:', {
        min: Math.min(...columnData.map(p => p.riskScore)),
        max: Math.max(...columnData.map(p => p.riskScore))
      });
      
      setTerrainData(columnData);
      console.log('Terrain data set successfully!');
    } catch (error) {
      console.error('Error loading terrain from API:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  return {
    terrainData,
    isGenerating,
    loadTerrainFromAPI  // Expose this to PromptInterface
  };
}

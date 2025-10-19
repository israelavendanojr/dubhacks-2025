import { useState, useCallback, useEffect } from 'react';
import type { TerrainPoint } from '../types/terrain.types';
import { loadSimulatedTerrain } from '../utils/simulatedLoader';

export function useRiskTerrain() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [terrainData, setTerrainData] = useState<TerrainPoint[]>([]);
  
  // Generate terrain data from simulated dataset
  const generateTerrain = useCallback(async () => {
    setIsGenerating(true);
    try {
      const newTerrainData = await loadSimulatedTerrain();
      setTerrainData(newTerrainData || []);
    } catch (error) {
      console.error('Error generating terrain:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  // Load once on mount
  useEffect(() => {
    generateTerrain();
  }, [generateTerrain]);
  
  
  return {
    terrainData,
    isGenerating
  };
}

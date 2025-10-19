import { useState, useCallback, useMemo } from 'react';
import type { TerrainPoint } from '../types/terrain.types';
import { generateRiskTerrain, getDefaultRiskWeights } from '../utils/terrainGenerator';

export function useRiskTerrain() {
  const weights = useMemo(() => getDefaultRiskWeights(), []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [terrainData, setTerrainData] = useState<TerrainPoint[]>([]);
  
  // Generate terrain data when weights change
  const generateTerrain = useCallback(async () => {
    setIsGenerating(true);
    
    // Simulate async operation for better UX
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const newTerrainData = generateRiskTerrain(weights);
      setTerrainData(newTerrainData);
    } catch (error) {
      console.error('Error generating terrain:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [weights]);
  
  // Auto-generate terrain when weights change (debounced)
  useMemo(() => {
    const timeoutId = setTimeout(() => {
      generateTerrain();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [weights, generateTerrain]);
  
  
  return {
    terrainData,
    isGenerating
  };
}

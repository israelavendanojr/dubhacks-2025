import { useState, useCallback, useMemo } from 'react';
import type { RiskWeights, TerrainPoint } from '../types/terrain.types';
import { generateRiskTerrain } from '../utils/terrainGenerator';

export function useRiskTerrain(weights: RiskWeights) {
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
  
  // Get terrain statistics
  const terrainStats = useMemo(() => {
    if (terrainData.length === 0) return null;
    
    const riskScores = terrainData.map(point => point.riskScore);
    const min = Math.min(...riskScores);
    const max = Math.max(...riskScores);
    const avg = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    return { min, max, avg, count: terrainData.length };
  }, [terrainData]);
  
  return {
    terrainData,
    isGenerating,
    generateTerrain,
    terrainStats
  };
}

import { useState, useCallback } from 'react';
import type { RiskWeights } from '../types/terrain.types';
import { getDefaultRiskWeights } from '../utils/terrainGenerator';

export function useRiskWeights() {
  const [weights, setWeights] = useState<RiskWeights>(getDefaultRiskWeights());
  
  const updateWeight = useCallback((factor: keyof RiskWeights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [factor]: value / 100 // Convert percentage to decimal
    }));
  }, []);
  
  const resetWeights = useCallback(() => {
    setWeights(getDefaultRiskWeights());
  }, []);
  
  return {
    weights,
    updateWeight,
    resetWeights,
    setWeights
  };
}

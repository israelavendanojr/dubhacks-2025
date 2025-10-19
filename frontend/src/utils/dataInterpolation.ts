import type { CountyDataPoint } from './apiClient';
import type { TerrainPoint } from '../types/terrain.types';

/**
 * Convert county data points to column/pole visualization data
 * Can optionally interpolate intermediate points for visual density
 */
export function convertCountyDataToColumns(
  countyData: CountyDataPoint[],
  interpolate: boolean = true,
  targetDensity: number = 150 // Interpolate to ~150 points if needed
): TerrainPoint[] {
  
  console.log('=== CONVERTING COUNTY DATA ===');
  console.log('Input county data:', countyData.length, 'points');
  console.log('Sample county data:', countyData.slice(0, 3));
  console.log('Interpolate:', interpolate, 'Target density:', targetDensity);
  
  if (!interpolate) {
    // Direct mapping: 39 county points → 39 columns
    const directData = countyData.map(county => ({
      lon: county.lon,
      lat: county.lat,
      riskScore: county.normalized,
      breakdown: {
        airQuality: county.normalized,
        noisePollution: county.normalized,
        floodClimate: county.normalized
      }
    }));
    console.log('Direct conversion result:', directData.length, 'points');
    return directData;
  }
  
  // Interpolate intermediate points for visual density
  const interpolatedData = interpolateCountyDataToColumns(countyData, targetDensity);
  console.log('Interpolated conversion result:', interpolatedData.length, 'points');
  return interpolatedData;
}

/**
 * Interpolate additional points between counties using IDW
 * Creates a denser grid of columns while preserving data accuracy
 */
function interpolateCountyDataToColumns(
  countyData: CountyDataPoint[],
  targetPoints: number = 150
): TerrainPoint[] {
  const BOUNDS = {
    north: 49.0,
    south: 45.5,
    west: -124.8,
    east: -116.9
  };
  
  const columns: TerrainPoint[] = [];
  
  // Start with original 39 county centers (exact data)
  for (const county of countyData) {
    columns.push({
      lon: county.lon,
      lat: county.lat,
      riskScore: county.normalized,
      breakdown: {
        airQuality: county.normalized,
        noisePollution: county.normalized,
        floodClimate: county.normalized
      }
    });
  }
  
  // Add interpolated points to reach target density
  const additionalPoints = targetPoints - countyData.length;
  const gridSize = Math.ceil(Math.sqrt(additionalPoints));
  
  const latStep = (BOUNDS.north - BOUNDS.south) / gridSize;
  const lonStep = (BOUNDS.east - BOUNDS.west) / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = BOUNDS.south + i * latStep;
      const lon = BOUNDS.west + j * lonStep;
      
      // Skip if too close to an existing county center
      const tooClose = countyData.some(county => 
        Math.abs(county.lat - lat) < 0.1 && Math.abs(county.lon - lon) < 0.1
      );
      
      if (!tooClose) {
        const riskScore = idwInterpolation(lat, lon, countyData);
        columns.push({
          lon,
          lat,
          riskScore,
          breakdown: {
            airQuality: riskScore,
            noisePollution: riskScore,
            floodClimate: riskScore
          }
        });
      }
    }
  }
  
  return columns;
}

/**
 * Inverse Distance Weighting interpolation
 */
function idwInterpolation(
  lat: number,
  lon: number,
  counties: CountyDataPoint[],
  power: number = 2
): number {
  let weightedSum = 0;
  let weightSum = 0;
  
  for (const county of counties) {
    const distance = haversineDistance(lat, lon, county.lat, county.lon);
    
    if (distance < 0.01) return county.normalized;
    
    const weight = 1 / Math.pow(distance, power);
    weightedSum += county.normalized * weight;
    weightSum += weight;
  }
  
  return weightSum > 0 ? weightedSum / weightSum : 0;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

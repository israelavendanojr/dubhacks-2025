import type { CountyDataPoint } from './apiClient';
import type { TerrainPoint } from '../types/terrain.types';

/**
 * Convert county data points to column/pole visualization data
 * Can optionally interpolate intermediate points for visual density
 */
export function convertCountyDataToColumns(
  countyData: CountyDataPoint[],
  interpolate: boolean = true,
  targetDensity: number = 2000 // Interpolate to ~200 points for better visual density
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
 * Creates a dense grid of columns to fill the entire state
 */
function interpolateCountyDataToColumns(
  countyData: CountyDataPoint[],
  targetPoints: number = 2000
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
  
  // Calculate optimal grid size for dense coverage
  const additionalPoints = targetPoints - countyData.length;
  const aspectRatio = (BOUNDS.east - BOUNDS.west) / (BOUNDS.north - BOUNDS.south);
  const gridCols = Math.ceil(Math.sqrt(additionalPoints * aspectRatio));
  const gridRows = Math.ceil(additionalPoints / gridCols);
  
  console.log(`Creating dense grid: ${gridCols} x ${gridRows} = ${gridCols * gridRows} points`);
  
  const latStep = (BOUNDS.north - BOUNDS.south) / gridRows;
  const lonStep = (BOUNDS.east - BOUNDS.west) / gridCols;
  
  // Create dense grid with much smaller spacing
  // Process in batches for better performance
  const batchSize = 1000;
  let processedCount = 0;
  
  for (let i = 0; i < gridRows; i++) {
    for (let j = 0; j < gridCols; j++) {
      const lat = BOUNDS.south + i * latStep;
      const lon = BOUNDS.west + j * lonStep;
      
      // Only skip if extremely close to county center (much smaller threshold)
      const tooClose = countyData.some(county => 
        Math.abs(county.lat - lat) < 0.01 && Math.abs(county.lon - lon) < 0.01
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
        
        processedCount++;
        
        // Log progress for large datasets
        if (processedCount % batchSize === 0) {
          console.log(`Processed ${processedCount} interpolated points...`);
        }
      }
    }
  }
  
  console.log(`Generated ${columns.length} total data points (${columns.length - countyData.length} interpolated)`);
  return columns;
}

/**
 * Inverse Distance Weighting interpolation optimized for high density
 * Creates smooth transitions between county data points
 */
function idwInterpolation(
  lat: number,
  lon: number,
  counties: CountyDataPoint[],
  power: number = 1.2 // Even smoother transitions for dense grid
): number {
  let weightedSum = 0;
  let weightSum = 0;
  
  for (const county of counties) {
    const distance = haversineDistance(lat, lon, county.lat, county.lon);
    
    // If very close to a county center, return exact value
    if (distance < 0.002) return county.normalized;
    
    // Use inverse distance weighting with smoothing
    const weight = 1 / Math.pow(distance + 0.005, power); // Smaller constant for denser grid
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

import type { CountyDataPoint } from './apiClient';
import type { TerrainPoint } from '../types/terrain.types';

/**
 * Check if a point is within Washington state boundaries
 */
function isWithinWashingtonState(lat: number, lon: number): boolean {
  // Washington State boundaries (approximate)
  const WASHINGTON_BOUNDS = {
    north: 49.0,    // Canadian border
    south: 45.5,    // Oregon border  
    west: -124.8,   // Pacific coast
    east: -116.9    // Idaho border
  };
  
  return lat >= WASHINGTON_BOUNDS.south && 
         lat <= WASHINGTON_BOUNDS.north && 
         lon >= WASHINGTON_BOUNDS.west && 
         lon <= WASHINGTON_BOUNDS.east;
}

/**
 * Convert county data points to column/pole visualization data
 * Can optionally interpolate intermediate points for visual density
 */
export function convertCountyDataToColumns(
  countyData: CountyDataPoint[],
  interpolate: boolean = true,
  targetDensity: number = 15000 // Interpolate to ~15,000 points for logical, dense coverage
): TerrainPoint[] {
  
  console.log('=== CONVERTING COUNTY DATA ===');
  console.log('Input county data:', countyData.length, 'points');
  console.log('Sample county data:', countyData.slice(0, 3));
  console.log('Interpolate:', interpolate, 'Target density:', targetDensity);
  
  if (!interpolate) {
    // Direct mapping: county points → columns (only Washington counties)
    const directData = countyData
      .filter(county => isWithinWashingtonState(county.lat, county.lon))
      .map(county => ({
        lon: county.lon,
        lat: county.lat,
        riskScore: county.normalized,
        breakdown: {
          airQuality: county.normalized,
          noisePollution: county.normalized,
          floodClimate: county.normalized
        }
      }));
    console.log('Direct conversion result:', directData.length, 'points (Washington only)');
    return directData;
  }
  
  // Interpolate intermediate points for visual density
  const interpolatedData = interpolateCountyDataToColumns(countyData, targetDensity);
  console.log('Interpolated conversion result:', interpolatedData.length, 'points');
  return interpolatedData;
}

/**
 * Create logical interpolation between counties using adaptive density
 * Places points strategically to create smooth transitions
 */
function interpolateCountyDataToColumns(
  countyData: CountyDataPoint[],
  targetPoints: number = 15000
): TerrainPoint[] {
  const columns: TerrainPoint[] = [];
  
  // Start with original county centers (exact data) - only Washington counties
  const washingtonCounties = countyData.filter(county => isWithinWashingtonState(county.lat, county.lon));
  
  for (const county of washingtonCounties) {
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
  
  console.log(`Starting with ${washingtonCounties.length} Washington counties`);
  
  // Create adaptive interpolation based on county density and spacing
  const interpolatedPoints = createAdaptiveInterpolation(washingtonCounties, targetPoints - washingtonCounties.length);
  columns.push(...interpolatedPoints);
  
  console.log(`Generated ${columns.length} total data points (${interpolatedPoints.length} interpolated)`);
  return columns;
}

/**
 * Create adaptive interpolation that places points logically between counties
 */
function createAdaptiveInterpolation(
  counties: CountyDataPoint[],
  targetAdditionalPoints: number
): TerrainPoint[] {
  const interpolatedPoints: TerrainPoint[] = [];
  
  // Calculate average distance between counties to determine interpolation density
  let totalDistance = 0;
  let pairCount = 0;
  
  for (let i = 0; i < counties.length; i++) {
    for (let j = i + 1; j < counties.length; j++) {
      const distance = haversineDistance(counties[i].lat, counties[i].lon, counties[j].lat, counties[j].lon);
      totalDistance += distance;
      pairCount++;
    }
  }
  
  const avgDistance = totalDistance / pairCount;
  const interpolationDensity = Math.min(avgDistance / 8, 0.05); // Adaptive density based on county spacing
  
  console.log(`Average county distance: ${avgDistance.toFixed(4)}°, using density: ${interpolationDensity.toFixed(4)}°`);
  
  // Create a fine grid within Washington state bounds
  const BOUNDS = {
    north: 49.0,    // Canadian border
    south: 45.5,    // Oregon border  
    west: -124.8,   // Pacific coast
    east: -116.9    // Idaho border
  };
  
  const latStep = interpolationDensity;
  const lonStep = interpolationDensity;
  
  let processedCount = 0;
  const batchSize = 2000;
  
  // Generate points in a fine grid
  for (let lat = BOUNDS.south; lat <= BOUNDS.north; lat += latStep) {
    for (let lon = BOUNDS.west; lon <= BOUNDS.east; lon += lonStep) {
      // Skip if too close to any county center
      const tooClose = counties.some(county => 
        Math.abs(county.lat - lat) < interpolationDensity * 0.5 && 
        Math.abs(county.lon - lon) < interpolationDensity * 0.5
      );
      
      if (!tooClose && isWithinWashingtonState(lat, lon)) {
        const riskScore = idwInterpolation(lat, lon, counties);
        
        // Only add points that have meaningful interpolation (not just noise)
        if (riskScore > 0.01) {
          interpolatedPoints.push({
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
          
          if (processedCount % batchSize === 0) {
            console.log(`Processed ${processedCount} interpolated points...`);
          }
          
          // Stop if we've reached our target
          if (interpolatedPoints.length >= targetAdditionalPoints) {
            break;
          }
        }
      }
    }
    
    if (interpolatedPoints.length >= targetAdditionalPoints) {
      break;
    }
  }
  
  return interpolatedPoints;
}

/**
 * Improved IDW interpolation that creates logical, smooth transitions
 * Uses adaptive weighting based on distance and county influence
 */
function idwInterpolation(
  lat: number,
  lon: number,
  counties: CountyDataPoint[],
  power: number = 2.0 // Higher power for more localized influence
): number {
  let weightedSum = 0;
  let weightSum = 0;
  
  // Find the closest county for immediate return if very close
  let minDistance = Infinity;
  let closestCounty: CountyDataPoint | null = null;
  
  for (const county of counties) {
    const distance = haversineDistance(lat, lon, county.lat, county.lon);
    if (distance < minDistance) {
      minDistance = distance;
      closestCounty = county;
    }
  }
  
  // If very close to a county center, return exact value with slight smoothing
  if (minDistance < 0.01 && closestCounty) {
    return closestCounty.normalized;
  }
  
  // Use improved IDW with adaptive influence radius
  const maxInfluenceRadius = 0.3; // Maximum distance for meaningful influence
  
  for (const county of counties) {
    const distance = haversineDistance(lat, lon, county.lat, county.lon);
    
    // Only consider counties within influence radius
    if (distance <= maxInfluenceRadius) {
      // Use improved weighting function
      const normalizedDistance = distance / maxInfluenceRadius;
      const weight = Math.pow(1 - normalizedDistance, power) / (distance + 0.01);
      
      weightedSum += county.normalized * weight;
      weightSum += weight;
    }
  }
  
  // If no nearby counties, use a fallback based on closest county
  if (weightSum === 0 && closestCounty) {
    const fallbackWeight = 1 / (minDistance + 0.1);
    return closestCounty.normalized * Math.min(1, fallbackWeight);
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

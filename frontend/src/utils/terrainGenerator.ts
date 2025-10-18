import type { RiskWeights, TerrainPoint, GridCell } from '../types/terrain.types';

// King County bounds
const KING_COUNTY_BOUNDS = {
  north: 47.7776,  // Shoreline
  south: 47.1556,  // Auburn
  west: -122.5413, // Puget Sound
  east: -121.0630  // Snoqualmie Pass
};

const GRID_RESOLUTION = 100; // 100x100 grid = 10,000 data points

/**
 * Generate a 2D Gaussian distribution for risk hotspots
 */
function gaussian2D(x: number, y: number, centerX: number, centerY: number, sigma: number): number {
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

/**
 * Generate synthetic air quality risk data
 * Higher risk near highways and industrial areas
 */
function getAirQualityRisk(lat: number, lon: number): number {
  // I-5 corridor (major highway)
  const i5Risk = gaussian2D(lon, lat, -122.3321, 47.6062, 0.05) * 0.8;
  
  // I-405 corridor
  const i405Risk = gaussian2D(lon, lat, -122.2, 47.6, 0.04) * 0.7;
  
  // Industrial areas (South Seattle, Georgetown)
  const industrialRisk = gaussian2D(lon, lat, -122.3, 47.5, 0.06) * 0.6;
  
  // Add some noise to make it more realistic
  const noise = (Math.random() - 0.5) * 0.1;
  
  return Math.min(1, Math.max(0, i5Risk + i405Risk + industrialRisk + noise));
}

/**
 * Generate synthetic noise pollution risk data
 * Higher risk near highways, airports, and busy areas
 */
function getNoiseRisk(lat: number, lon: number): number {
  // SeaTac Airport approach paths
  const airportRisk = gaussian2D(lon, lat, -122.3, 47.45, 0.08) * 0.9;
  
  // I-5 highway noise
  const highwayRisk = gaussian2D(lon, lat, -122.3321, 47.6062, 0.06) * 0.7;
  
  // Downtown Seattle (busy urban area)
  const downtownRisk = gaussian2D(lon, lat, -122.3321, 47.6062, 0.03) * 0.8;
  
  // Boeing Field
  const boeingRisk = gaussian2D(lon, lat, -122.3, 47.53, 0.04) * 0.6;
  
  const noise = (Math.random() - 0.5) * 0.1;
  
  return Math.min(1, Math.max(0, airportRisk + highwayRisk + downtownRisk + boeingRisk + noise));
}

/**
 * Generate synthetic flood/climate risk data
 * Higher risk near water bodies and low-lying areas
 */
function getFloodRisk(lat: number, lon: number): number {
  // Puget Sound coastline
  const pugetSoundRisk = gaussian2D(lon, lat, -122.4, 47.6, 0.1) * 0.8;
  
  // Duwamish River
  const duwamishRisk = gaussian2D(lon, lat, -122.3, 47.5, 0.05) * 0.7;
  
  // Lake Washington shoreline
  const lakeWashingtonRisk = gaussian2D(lon, lat, -122.25, 47.6, 0.08) * 0.6;
  
  // Green River valley (Auburn/Kent area)
  const greenRiverRisk = gaussian2D(lon, lat, -122.2, 47.3, 0.06) * 0.5;
  
  const noise = (Math.random() - 0.5) * 0.1;
  
  return Math.min(1, Math.max(0, pugetSoundRisk + duwamishRisk + lakeWashingtonRisk + greenRiverRisk + noise));
}

/**
 * Calculate composite risk score for a grid cell
 */
function calculateRiskScore(cell: GridCell, weights: RiskWeights): number {
  // Normalize weights to sum to 1
  const total = weights.airQuality + weights.noisePollution + weights.floodClimate;
  const w1 = weights.airQuality / total;
  const w2 = weights.noisePollution / total;
  const w3 = weights.floodClimate / total;
  
  // Get individual factor scores (0-1) for this location
  const airScore = getAirQualityRisk(cell.lat, cell.lon);
  const noiseScore = getNoiseRisk(cell.lat, cell.lon);
  const floodScore = getFloodRisk(cell.lat, cell.lon);
  
  // Composite risk (weighted average)
  return (w1 * airScore + w2 * noiseScore + w3 * floodScore);
}

/**
 * Generate the complete terrain data for King County
 */
export function generateRiskTerrain(weights: RiskWeights): TerrainPoint[] {
  const terrainData: TerrainPoint[] = [];
  
  const latStep = (KING_COUNTY_BOUNDS.north - KING_COUNTY_BOUNDS.south) / GRID_RESOLUTION;
  const lonStep = (KING_COUNTY_BOUNDS.east - KING_COUNTY_BOUNDS.west) / GRID_RESOLUTION;
  
  for (let y = 0; y < GRID_RESOLUTION; y++) {
    for (let x = 0; x < GRID_RESOLUTION; x++) {
      const lat = KING_COUNTY_BOUNDS.south + y * latStep;
      const lon = KING_COUNTY_BOUNDS.west + x * lonStep;
      
      const cell: GridCell = { lat, lon, x, y };
      
      // Get individual risk factors
      const airScore = getAirQualityRisk(lat, lon);
      const noiseScore = getNoiseRisk(lat, lon);
      const floodScore = getFloodRisk(lat, lon);
      
      // Calculate composite risk
      const riskScore = calculateRiskScore(cell, weights);
      
      terrainData.push({
        lon,
        lat,
        riskScore,
        breakdown: {
          airQuality: airScore,
          noisePollution: noiseScore,
          floodClimate: floodScore
        }
      });
    }
  }
  
  return terrainData;
}

/**
 * Get default risk weights for initial state
 */
export function getDefaultRiskWeights(): RiskWeights {
  return {
    airQuality: 0.4,
    noisePollution: 0.35,
    floodClimate: 0.25
  };
}

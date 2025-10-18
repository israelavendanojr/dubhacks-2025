export interface RiskWeights {
  airQuality: number;
  noisePollution: number;
  floodClimate: number;
}

export interface TerrainPoint {
  lon: number;
  lat: number;
  riskScore: number;
  breakdown: {
    airQuality: number;
    noisePollution: number;
    floodClimate: number;
  };
}

export interface GridCell {
  lat: number;
  lon: number;
  x: number;
  y: number;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface RiskFactor {
  name: string;
  weight: number;
  color: string;
  icon: string;
}

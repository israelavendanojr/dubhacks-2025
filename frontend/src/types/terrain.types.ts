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

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}


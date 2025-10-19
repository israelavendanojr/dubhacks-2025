import type { TerrainPoint } from '../types/terrain.types';

interface SimRow {
  Latitude: number;
  Longitude: number;
  Year: number;
  Month: number;
  PollutantAmount: number;
}

function uniqueSorted(values: number[]): number[] {
  const seen = new Set<string>();
  for (const v of values) seen.add(v.toFixed(6));
  return Array.from(seen).map(Number).sort((a, b) => a - b);
}

export async function loadSimulatedTerrain(): Promise<TerrainPoint[]> {
  const res = await fetch('/simulated_data.json');
  if (!res.ok) throw new Error('Failed to load simulated_data.json');
  const raw: SimRow[] = await res.json();

  if (!Array.isArray(raw) || raw.length === 0) return [];

  let minAmt = Infinity;
  let maxAmt = -Infinity;
  for (const r of raw) {
    if (typeof r.PollutantAmount !== 'number') continue;
    if (r.PollutantAmount < minAmt) minAmt = r.PollutantAmount;
    if (r.PollutantAmount > maxAmt) maxAmt = r.PollutantAmount;
  }
  const denom = maxAmt - minAmt || 1;

  // Map for fast lookup
  const key = (lat: number, lon: number) => `${lat.toFixed(6)},${lon.toFixed(6)}`;
  const amountByCoord = new Map<string, number>();
  for (const r of raw) amountByCoord.set(key(r.Latitude, r.Longitude), r.PollutantAmount);

  // Build grid in row-major (lat ascending as rows, lon ascending as cols)
  const lats = uniqueSorted(raw.map(r => r.Latitude));
  const lons = uniqueSorted(raw.map(r => r.Longitude));

  const data: TerrainPoint[] = [];
  for (let yi = 0; yi < lats.length; yi++) {
    for (let xi = 0; xi < lons.length; xi++) {
      const lat = lats[yi];
      const lon = lons[xi];
      const amt = amountByCoord.get(key(lat, lon));
      const risk = amt == null ? 0 : (amt - minAmt) / denom; // 0..1
      data.push({
        lon,
        lat,
        riskScore: risk,
        breakdown: {
          airQuality: risk,
          noisePollution: risk,
          floodClimate: risk
        }
      });
    }
  }

  return data;
}



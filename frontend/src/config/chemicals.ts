export interface ChemicalConfig {
  id: string;
  name: string;
  displayName: string;
  fileName: string;
  unit: string;
  description: string;
  color: [number, number, number]; // Primary color for this chemical
  dangerThreshold: number; // What level is considered dangerous
}

export const CHEMICALS: ChemicalConfig[] = [
  {
    id: 'co',
    name: 'Carbon Monoxide',
    displayName: 'CO',
    fileName: 'co_data_by_month.csv',
    unit: 'ppm',
    description: 'Colorless, odorless gas from combustion',
    color: [239, 68, 68], // Red
    dangerThreshold: 0.4  // Updated based on actual data range (0-0.5 ppm)
  },
  {
    id: 'so2',
    name: 'Sulfur Dioxide',
    displayName: 'SO₂',
    fileName: 'so2_data_by_month.csv',
    unit: 'ppb',
    description: 'Produced by volcanoes and industrial processes',
    color: [234, 179, 8], // Yellow
    dangerThreshold: 0.05  // Updated based on actual data range (0-0.1 ppb)
  },
  {
    id: 'no2',
    name: 'Nitrogen Dioxide',
    displayName: 'NO₂',
    fileName: 'no2_data_by_month.csv',
    unit: 'ppb',
    description: 'Reddish-brown gas from vehicle emissions',
    color: [249, 115, 22], // Orange
    dangerThreshold: 25  // Updated based on actual data range (0-50 ppb)
  }
  // REMOVED: PM2.5 and O3 - no data files available
];

// Helper to get available chemicals (only ones with CSV files in public/data)
export async function getAvailableChemicals(): Promise<ChemicalConfig[]> {
  const available: ChemicalConfig[] = [];
  
  for (const chemical of CHEMICALS) {
    try {
      const response = await fetch(`/data/${chemical.fileName}`);
      if (response.ok) {
        available.push(chemical);
        console.log(`✓ Found ${chemical.name} data file`);
      }
    } catch {
      console.log(`⚠ ${chemical.fileName} not available yet`);
    }
  }
  
  return available;
}

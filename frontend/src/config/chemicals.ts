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
    dangerThreshold: 9.0
  },
  {
    id: 'so2',
    name: 'Sulfur Dioxide',
    displayName: 'SO₂',
    fileName: 'so2_data_by_month.csv',
    unit: 'ppb',
    description: 'Produced by volcanoes and industrial processes',
    color: [234, 179, 8], // Yellow
    dangerThreshold: 75
  },
  {
    id: 'no2',
    name: 'Nitrogen Dioxide',
    displayName: 'NO₂',
    fileName: 'no2_data_by_month.csv',
    unit: 'ppb',
    description: 'Reddish-brown gas from vehicle emissions',
    color: [249, 115, 22], // Orange
    dangerThreshold: 100
  },
  {
    id: 'pm25',
    name: 'Particulate Matter 2.5',
    displayName: 'PM2.5',
    fileName: 'pm25_data_by_month.csv',
    unit: 'μg/m³',
    description: 'Fine particles that can penetrate lungs',
    color: [168, 85, 247], // Purple
    dangerThreshold: 35
  },
  {
    id: 'o3',
    name: 'Ozone',
    displayName: 'O₃',
    fileName: 'o3_data_by_month.csv',
    unit: 'ppb',
    description: 'Ground-level ozone from pollution reactions',
    color: [59, 130, 246], // Blue
    dangerThreshold: 70
  }
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

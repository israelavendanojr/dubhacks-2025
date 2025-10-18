import Papa from 'papaparse';
import type { PollutionReading, AggregatedMonthlyData, AggregatedDataPoint } from '../types/pollution.types';

interface CSVParsedData {
  Year: string;
  Month: string;
  Latitude?: string;
  Longitude?: string;
  Lat?: string;
  Lon?: string;
  Amount: string;
}

/**
 * Loads and parses CSV data from the data folder for any chemical
 */
export async function loadChemicalData(fileName: string): Promise<AggregatedMonthlyData[]> {
  try {
    // Load CSV file from public data folder
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<CSVParsedData>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const aggregatedData = processCSVData(results.data);
            resolve(aggregatedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function loadCOData(): Promise<AggregatedMonthlyData[]> {
  return loadChemicalData('co_data_by_month.csv');
}

/**
 * Processes raw CSV data into aggregated monthly data
 */
function processCSVData(rawData: CSVParsedData[]): AggregatedMonthlyData[] {
  // Parse and validate data
  const readings: PollutionReading[] = rawData
    .map(row => {
      // Handle both column name formats: Latitude/Longitude vs Lat/Lon
      const latitude = parseFloat(row.Latitude || row.Lat || '');
      const longitude = parseFloat(row.Longitude || row.Lon || '');
      
      return {
        year: parseInt(row.Year),
        month: parseInt(row.Month),
        latitude,
        longitude,
        amount: parseFloat(row.Amount)
      };
    })
    .filter(reading => 
      !isNaN(reading.year) && 
      !isNaN(reading.month) && 
      !isNaN(reading.latitude) && 
      !isNaN(reading.longitude) && 
      !isNaN(reading.amount)
    );

  // Group by year-month
  const monthlyGroups = new Map<string, PollutionReading[]>();
  
  readings.forEach(reading => {
    const yearMonth = `${reading.year}-${reading.month.toString().padStart(2, '0')}`;
    if (!monthlyGroups.has(yearMonth)) {
      monthlyGroups.set(yearMonth, []);
    }
    monthlyGroups.get(yearMonth)!.push(reading);
  });

  // Calculate global max for normalization
  const globalMax = Math.max(...readings.map(r => r.amount));
  
  // Aggregate data for each month
  const aggregatedData: AggregatedMonthlyData[] = [];
  
  for (const [yearMonth, monthReadings] of monthlyGroups) {
    // Group by location (lat, lon) within the month
    const locationGroups = new Map<string, PollutionReading[]>();
    
    monthReadings.forEach(reading => {
      const locationKey = `${reading.latitude},${reading.longitude}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(reading);
    });

    // Calculate aggregated data points for this month
    const dataPoints: AggregatedDataPoint[] = [];
    let totalReadings = 0;
    let sumAmount = 0;
    let maxAmount = 0;
    let minAmount = Infinity;

    for (const [locationKey, locationReadings] of locationGroups) {
      const [lat, lon] = locationKey.split(',').map(Number);
      const averageAmount = locationReadings.reduce((sum, r) => sum + r.amount, 0) / locationReadings.length;
      const readingCount = locationReadings.length;
      
      dataPoints.push({
        coordinates: [lon, lat], // [longitude, latitude] for deck.gl
        averageAmount,
        readingCount,
        normalizedAmount: averageAmount / globalMax
      });

      totalReadings += readingCount;
      sumAmount += averageAmount * readingCount;
      maxAmount = Math.max(maxAmount, averageAmount);
      minAmount = Math.min(minAmount, averageAmount);
    }

    const [year, month] = yearMonth.split('-').map(Number);
    
    aggregatedData.push({
      yearMonth,
      year,
      month,
      dataPoints,
      totalReadings,
      averageAmount: sumAmount / totalReadings,
      maxAmount,
      minAmount: minAmount === Infinity ? 0 : minAmount
    });
  }

  // Sort chronologically
  return aggregatedData.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

/**
 * Format year-month string for display
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${getMonthName(parseInt(month))} ${year}`;
}

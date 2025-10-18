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
    console.log(`📊 Loading ${fileName}...`);
    
    // Load CSV file from public data folder
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // ADD DEBUGGING: Log first 500 characters of CSV
    console.log(`📊 Loading ${fileName}`);
    console.log(`First 500 chars:`, csvText.substring(0, 500));
    
    return new Promise((resolve, reject) => {
      Papa.parse<CSVParsedData>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // IMPORTANT: Auto-convert numbers
        complete: (results) => {
          try {
            console.log(`✓ Parsed ${results.data.length} rows from ${fileName}`);
            console.log(`Sample row:`, results.data[0]);
            
            const aggregatedData = processCSVData(results.data);
            console.log(`✓ Aggregated into ${aggregatedData.length} months`);
            
            resolve(aggregatedData);
          } catch (error) {
            console.error(`❌ Error processing ${fileName}:`, error);
            reject(error);
          }
        },
        error: (error: any) => {
          console.error(`❌ CSV parsing error for ${fileName}:`, error);
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`❌ Error loading ${fileName}:`, error);
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
function processCSVData(rawData: any[]): AggregatedMonthlyData[] {
  // Parse and validate data with flexible column name handling
  const readings: PollutionReading[] = rawData
    .map(row => {
      // Try multiple column name variations
      const year = row.Year || row.year || row.YEAR;
      const month = row.Month || row.month || row.MONTH;
      const latitude = row.Latitude || row.latitude || row.Lat || row.lat || row.LAT;
      const longitude = row.Longitude || row.longitude || row.Lon || row.lon || row.LON;
      const amount = row.Amount || row.amount || row.AMOUNT || row.Value || row.value;
      
      return {
        year: parseInt(String(year)),
        month: parseInt(String(month)),
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        amount: parseFloat(String(amount))
      };
    })
    .filter(reading => {
      // Validate all fields are valid numbers
      const isValid = 
        !isNaN(reading.year) && 
        !isNaN(reading.month) && 
        !isNaN(reading.latitude) && 
        !isNaN(reading.longitude) && 
        !isNaN(reading.amount) &&
        reading.month >= 1 && reading.month <= 12;
      
      if (!isValid) {
        console.warn('⚠️ Skipping invalid reading:', reading);
      }
      
      return isValid;
    });

  console.log(`✓ Filtered to ${readings.length} valid readings`);
  
  if (readings.length === 0) {
    console.error('❌ No valid readings found after filtering!');
    return [];
  }

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

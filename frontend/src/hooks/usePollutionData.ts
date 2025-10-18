import { useState, useEffect, useCallback } from 'react';
import { loadChemicalData } from '../utils/csvLoader';
import { getAvailableChemicals } from '../config/chemicals';
import type { ChemicalConfig } from '../config/chemicals';
import type { AggregatedMonthlyData } from '../types/pollution.types';

interface MultiChemicalData {
  [chemicalId: string]: AggregatedMonthlyData[];
}

interface UsePollutionDataReturn {
  // All chemical data
  allData: MultiChemicalData;
  
  // Currently selected chemical data (for backward compatibility)
  monthlyData: AggregatedMonthlyData[];
  
  // Chemical selection
  selectedChemical: string;
  setSelectedChemical: (chemicalId: string) => void;
  availableChemicals: ChemicalConfig[];
  
  // Current chemical config
  currentChemicalConfig: ChemicalConfig | undefined;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Statistics for current chemical
  totalReadings: number;
  dateRange: { start: string; end: string } | null;
  averageAmount: number;
  maxAmount: number;
  
  // Utility
  hasData: boolean;
}

/**
 * Hook for loading and managing multi-chemical pollution data
 */
export function usePollutionData(): UsePollutionDataReturn {
  const [allData, setAllData] = useState<MultiChemicalData>({});
  const [availableChemicals, setAvailableChemicals] = useState<ChemicalConfig[]>([]);
  const [selectedChemical, setSelectedChemical] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ADD: Log when chemical changes
  useEffect(() => {
    const currentData = allData[selectedChemical];
    console.log('Chemical changed to:', {
      chemical: selectedChemical,
      availableMonths: currentData?.length || 0,
      totalDataPoints: currentData?.reduce((sum, m) => sum + m.dataPoints.length, 0) || 0
    });
  }, [selectedChemical, allData]);
  
  const loadAllChemicals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Loading chemical data...');
      
      // Get list of available chemicals
      const chemicals = await getAvailableChemicals();
      console.log(`✓ Found ${chemicals.length} available chemicals:`, chemicals.map(c => c.id));
      
      setAvailableChemicals(chemicals);
      
      // Load data for all available chemicals
      const data: MultiChemicalData = {};
      
      for (const chemical of chemicals) {
        try {
          console.log(`📥 Loading ${chemical.name} from ${chemical.fileName}...`);
          const chemicalData = await loadChemicalData(chemical.fileName);
          data[chemical.id] = chemicalData;
          
          console.log(`✅ ${chemical.name}:`, {
            months: chemicalData.length,
            totalReadings: chemicalData.reduce((sum, m) => sum + m.totalReadings, 0),
            dateRange: chemicalData.length > 0 
              ? `${chemicalData[0].yearMonth} to ${chemicalData[chemicalData.length - 1].yearMonth}`
              : 'No data',
            avgAmount: chemicalData.length > 0
              ? (chemicalData.reduce((sum, m) => sum + m.averageAmount, 0) / chemicalData.length).toFixed(3)
              : 'N/A',
            maxAmount: chemicalData.length > 0
              ? Math.max(...chemicalData.map(m => m.maxAmount)).toFixed(3)
              : 'N/A',
            minAmount: chemicalData.length > 0
              ? Math.min(...chemicalData.map(m => m.minAmount)).toFixed(3)
              : 'N/A'
          });
          
        } catch (err) {
          console.error(`❌ Failed to load ${chemical.name}:`, err);
        }
      }
      
      console.log('✅ All chemical data loaded:', Object.keys(data));
      setAllData(data);
      
      // Set default to "all" if available, otherwise first chemical
      if (chemicals.length > 0 && selectedChemical !== 'all' && !chemicals.find(c => c.id === selectedChemical)) {
        console.log(`Setting default chemical to: all`);
        setSelectedChemical('all');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pollution data';
      console.error('❌ Error loading pollution data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChemical]);
  
  // Load data on mount
  useEffect(() => {
    loadAllChemicals();
  }, [loadAllChemicals]);
  
  // Function to combine data from all chemicals
  const combineAllChemicalData = useCallback((): AggregatedMonthlyData[] => {
    if (Object.keys(allData).length === 0) return [];
    
    // Get all unique year-month combinations
    const allYearMonths = new Set<string>();
    Object.values(allData).forEach(chemicalData => {
      chemicalData.forEach(month => allYearMonths.add(month.yearMonth));
    });
    
    // Combine data for each month
    const combinedData: AggregatedMonthlyData[] = [];
    
    for (const yearMonth of allYearMonths) {
      const [year, month] = yearMonth.split('-').map(Number);
      const combinedDataPoints: any[] = [];
      let totalReadings = 0;
      let sumAmount = 0;
      let maxAmount = 0;
      let minAmount = Infinity;
      
      // Collect data points from all chemicals for this month
      Object.entries(allData).forEach(([chemicalId, chemicalData]) => {
        const monthData = chemicalData.find(m => m.yearMonth === yearMonth);
        if (monthData) {
          // Add chemical ID to each data point for identification
          const dataPointsWithChemical = monthData.dataPoints.map(point => ({
            ...point,
            chemicalId,
            chemicalName: availableChemicals.find(c => c.id === chemicalId)?.displayName || chemicalId
          }));
          combinedDataPoints.push(...dataPointsWithChemical);
          totalReadings += monthData.totalReadings;
          sumAmount += monthData.averageAmount * monthData.totalReadings;
          maxAmount = Math.max(maxAmount, monthData.maxAmount);
          minAmount = Math.min(minAmount, monthData.minAmount);
        }
      });
      
      if (combinedDataPoints.length > 0) {
        combinedData.push({
          yearMonth,
          year,
          month,
          dataPoints: combinedDataPoints,
          totalReadings,
          averageAmount: sumAmount / totalReadings,
          maxAmount,
          minAmount: minAmount === Infinity ? 0 : minAmount
        });
      }
    }
    
    // Sort chronologically
    return combinedData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [allData, availableChemicals]);

  // Get current chemical data
  const monthlyData = selectedChemical === 'all' 
    ? combineAllChemicalData() 
    : allData[selectedChemical] || [];
  const currentChemicalConfig = selectedChemical === 'all' 
    ? { id: 'all', name: 'All Chemicals', displayName: 'All', unit: 'mixed' } as ChemicalConfig
    : availableChemicals.find(c => c.id === selectedChemical);
  
  // Calculate statistics for current chemical
  const totalReadings = monthlyData.reduce((sum, month) => sum + month.totalReadings, 0);
  
  const dateRange = monthlyData.length > 0 ? {
    start: monthlyData[0].yearMonth,
    end: monthlyData[monthlyData.length - 1].yearMonth
  } : null;
  
  const averageAmount = monthlyData.length > 0 
    ? monthlyData.reduce((sum, month) => sum + month.averageAmount, 0) / monthlyData.length
    : 0;
    
  const maxAmount = monthlyData.length > 0
    ? Math.max(...monthlyData.map(month => month.maxAmount))
    : 0;
  
  return {
    // All chemical data
    allData,
    
    // Currently selected chemical data (for backward compatibility)
    monthlyData,
    
    // Chemical selection
    selectedChemical,
    setSelectedChemical,
    availableChemicals,
    
    // Current chemical config
    currentChemicalConfig,
    
    // Loading states
    isLoading,
    error,
    refetch: loadAllChemicals,
    
    // Statistics for current chemical
    totalReadings,
    dateRange,
    averageAmount,
    maxAmount,
    
    // Utility
    hasData: Object.keys(allData).length > 0
  };
}

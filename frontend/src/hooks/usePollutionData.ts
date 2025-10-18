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
  const [selectedChemical, setSelectedChemical] = useState<string>('co');
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
      
      // Set first available chemical as selected if current selection is not available
      if (chemicals.length > 0 && !chemicals.find(c => c.id === selectedChemical)) {
        console.log(`Setting default chemical to: ${chemicals[0].id}`);
        setSelectedChemical(chemicals[0].id);
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
  
  // Get current chemical data
  const monthlyData = allData[selectedChemical] || [];
  const currentChemicalConfig = availableChemicals.find(c => c.id === selectedChemical);
  
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

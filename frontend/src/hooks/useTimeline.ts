import { useState, useEffect, useCallback, useRef } from 'react';
import type { AggregatedMonthlyData, TimelineState, TimelineControls } from '../types/pollution.types';

interface UseTimelineOptions {
  autoPlayDelay?: number; // milliseconds between auto-advance
  loop?: boolean; // whether to loop back to start when reaching end
}

interface UseTimelineReturn extends TimelineState, TimelineControls {
  // Additional utility methods
  canGoPrevious: boolean;
  canGoNext: boolean;
  progress: number; // 0-1 progress through timeline
}

/**
 * Hook for managing timeline state and controls
 */
export function useTimeline(
  monthlyData: AggregatedMonthlyData[],
  options: UseTimelineOptions = {}
): UseTimelineReturn {
  const { autoPlayDelay = 1500, loop = true } = options;
  
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const totalMonths = monthlyData.length;
  const availableMonths = monthlyData.map(d => d.yearMonth);
  const currentMonth = monthlyData[currentMonthIndex] || null;
  
  // ADD: Log when current month changes
  useEffect(() => {
    if (currentMonth) {
      console.log('Timeline changed to:', {
        index: currentMonthIndex,
        yearMonth: currentMonth.yearMonth,
        dataPoints: currentMonth.dataPoints.length,
        totalReadings: currentMonth.totalReadings,
        avgAmount: currentMonth.averageAmount.toFixed(3)
      });
    }
  }, [currentMonthIndex, currentMonth]);
  
  // Auto-advance logic
  useEffect(() => {
    if (isPlaying && totalMonths > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentMonthIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= totalMonths) {
            if (loop) {
              return 0; // Loop back to start
            } else {
              setIsPlaying(false); // Stop at end
              return prevIndex;
            }
          }
          return nextIndex;
        });
      }, autoPlayDelay);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, totalMonths, autoPlayDelay, loop]);
  
  // Navigation controls
  const goToPrevious = useCallback(() => {
    setCurrentMonthIndex(prevIndex => {
      const newIndex = prevIndex - 1;
      return newIndex < 0 ? (loop ? totalMonths - 1 : 0) : newIndex;
    });
  }, [totalMonths, loop]);
  
  const goToNext = useCallback(() => {
    setCurrentMonthIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      return newIndex >= totalMonths ? (loop ? 0 : prevIndex) : newIndex;
    });
  }, [totalMonths, loop]);
  
  const goToMonth = useCallback((monthIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(totalMonths - 1, monthIndex));
    setCurrentMonthIndex(clampedIndex);
  }, [totalMonths]);
  
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  const setPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);
  
  // Utility properties
  const canGoPrevious = currentMonthIndex > 0 || loop;
  const canGoNext = currentMonthIndex < totalMonths - 1 || loop;
  const progress = totalMonths > 0 ? currentMonthIndex / (totalMonths - 1) : 0;
  
  return {
    // State
    currentMonthIndex,
    totalMonths,
    isPlaying,
    availableMonths,
    currentMonth,
    
    // Controls
    goToPrevious,
    goToNext,
    goToMonth,
    togglePlay,
    setPlaying,
    
    // Utilities
    canGoPrevious,
    canGoNext,
    progress
  };
}

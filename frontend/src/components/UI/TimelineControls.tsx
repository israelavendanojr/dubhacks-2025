import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { formatYearMonth } from '../../utils/csvLoader';

interface TimelineControlsProps {
  currentMonthIndex: number;
  totalMonths: number;
  isPlaying: boolean;
  availableMonths: string[];
  goToPrevious: () => void;
  goToNext: () => void;
  goToMonth: (monthIndex: number) => void;
  togglePlay: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  progress: number;
}

export function TimelineControls({
  currentMonthIndex,
  totalMonths,
  isPlaying,
  availableMonths,
  goToPrevious,
  goToNext,
  goToMonth,
  togglePlay,
  canGoPrevious,
  canGoNext,
  progress
}: TimelineControlsProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const currentMonth = availableMonths[currentMonthIndex];
  
  // Handle slider click
  const handleSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const sliderWidth = rect.width;
    const clickRatio = clickX / sliderWidth;
    const newIndex = Math.round(clickRatio * (totalMonths - 1));
    
    goToMonth(newIndex);
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing
      }
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (canGoPrevious) goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (canGoNext) goToNext();
          break;
        case 'Home':
          event.preventDefault();
          goToMonth(0);
          break;
        case 'End':
          event.preventDefault();
          goToMonth(totalMonths - 1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, goToPrevious, goToNext, goToMonth, canGoPrevious, canGoNext, totalMonths]);
  
  if (totalMonths === 0) {
    return null;
  }
  
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <div 
          ref={sliderRef}
          className="flex-1 relative h-2 bg-gray-700 rounded-full cursor-pointer" 
          onClick={handleSliderClick}
        >
          <div
            className="absolute h-full bg-cyan-400 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        <button
          onClick={goToNext}
          disabled={!canGoNext}
          className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={togglePlay}
          className="p-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="text-center">
        <div className="text-xl font-bold text-white">
          {currentMonth ? formatYearMonth(currentMonth) : 'No Data'}
        </div>
        <div className="text-sm text-gray-400">
          Month {currentMonthIndex + 1} of {totalMonths}
        </div>
      </div>
    </div>
  );
}

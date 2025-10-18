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
  const firstMonth = availableMonths[0];
  const lastMonth = availableMonths[availableMonths.length - 1];
  
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
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl z-50">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-xl px-6 py-4 shadow-2xl border border-gray-800">
        {/* Main Timeline Slider */}
        <div className="flex items-center space-x-4 mb-3">
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg bg-gray-800 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous month (←)"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          {/* Timeline Slider */}
          <div className="flex-1 relative">
            <div
              ref={sliderRef}
              className="h-2 bg-gray-700 rounded-full cursor-pointer relative"
              onClick={handleSliderClick}
            >
              {/* Slider Track */}
              <div className="absolute inset-0 bg-gray-700 rounded-full" />
              
              {/* Progress Fill */}
              <div
                className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
              
              {/* Current Position Indicator */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-lg transition-all duration-200"
                style={{ left: `${progress * 100}%`, marginLeft: '-8px' }}
              />
              
              {/* Month Markers */}
              {availableMonths.map((month, index) => {
                const position = (index / (totalMonths - 1)) * 100;
                return (
                  <div
                    key={month}
                    className="absolute top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gray-500 rounded-full"
                    style={{ left: `${position}%`, marginLeft: '-2px' }}
                  />
                );
              })}
            </div>
            
            {/* Date Range Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{firstMonth ? formatYearMonth(firstMonth) : ''}</span>
              <span>{lastMonth ? formatYearMonth(lastMonth) : ''}</span>
            </div>
          </div>
          
          {/* Next Button */}
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className="p-2 rounded-lg bg-gray-800 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next month (→)"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors"
            title={`${isPlaying ? 'Pause' : 'Play'} (Space)`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        
        {/* Current Month Display */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {currentMonth ? formatYearMonth(currentMonth) : 'No Data'}
          </div>
          <div className="text-sm text-gray-400">
            Month {currentMonthIndex + 1} of {totalMonths}
            {isPlaying && <span className="ml-2 text-cyan-400">● Playing</span>}
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          <span>Space: Play/Pause</span>
          <span className="mx-2">•</span>
          <span>← →: Navigate</span>
          <span className="mx-2">•</span>
          <span>Home/End: Jump to start/end</span>
        </div>
      </div>
    </div>
  );
}

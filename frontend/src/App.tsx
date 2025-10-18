import { useCallback, useEffect } from 'react';
import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { TimelineControls } from './components/UI/TimelineControls';
import { ChemicalSelector } from './components/UI/ChemicalSelector';
import { PollutionLegend } from './components/UI/PollutionLegend';
import { usePollutionData } from './hooks/usePollutionData';
import { useTimeline } from './hooks/useTimeline';
import type { ViewState } from './types/terrain.types';

function App() {
  // Pollution data and timeline
  const pollution = usePollutionData();
  const timeline = useTimeline(pollution.monthlyData);

  const handleViewStateChange = useCallback((viewState: ViewState) => {
    // Optional: track view state if needed
  }, []);

  // ADD: Log when timeline.currentMonth changes
  useEffect(() => {
    console.log('App received timeline update:', {
      currentMonth: timeline.currentMonth?.yearMonth,
      dataPoints: timeline.currentMonth?.dataPoints.length
    });
  }, [timeline.currentMonth]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      
      {/* TOP BAR */}
      <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-700 px-6 py-4 z-50">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div>
            <h1 className="text-2xl font-bold text-white">Risk3D</h1>
            <p className="text-sm text-cyan-400">Environmental Analysis Across King County</p>
          </div>
          
          {/* Chemical Selector */}
          {pollution.availableChemicals.length > 1 && (
            <ChemicalSelector
              chemicals={pollution.availableChemicals}
              selected={pollution.selectedChemical}
              onChange={pollution.setSelectedChemical}
            />
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {/* MAP CONTAINER - Centered and Bordered */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <div className="w-full h-full max-w-7xl bg-gray-900 rounded-2xl border-2 border-gray-700 shadow-2xl overflow-hidden relative">
            
            {/* The Map */}
            <RiskTerrainMap 
              pollutionData={timeline.currentMonth?.dataPoints || []}
              showPollution={true}
              currentMonth={timeline.currentMonth?.yearMonth}
              chemicalConfig={pollution.currentChemicalConfig}
              onViewStateChange={handleViewStateChange}
            />
            
            {/* Data Stats - Inside map, top-left */}
            {pollution.currentChemicalConfig && timeline.currentMonth && (
              <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-4 border border-gray-700 shadow-xl z-30">
                <div className="text-white text-sm">
                  <div className="font-semibold text-lg mb-2">
                    {pollution.currentChemicalConfig.name}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-gray-400">
                      <span className="font-medium">Data Points:</span>{' '}
                      <span className="text-cyan-400">{timeline.currentMonth.dataPoints.length}</span>
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium">Readings:</span>{' '}
                      <span className="text-cyan-400">{timeline.currentMonth.totalReadings}</span>
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium">Average:</span>{' '}
                      <span className="text-cyan-400">
                        {timeline.currentMonth.averageAmount.toFixed(2)} {pollution.currentChemicalConfig.unit}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium">Max:</span>{' '}
                      <span className="text-red-400">
                        {timeline.currentMonth.maxAmount.toFixed(2)} {pollution.currentChemicalConfig.unit}
                      </span>
                    </div>
                    <div className="text-gray-400 mt-2 pt-2 border-t border-gray-600">
                      Danger threshold: {pollution.currentChemicalConfig.dangerThreshold}{' '}
                      {pollution.currentChemicalConfig.unit}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading Overlay */}
            {pollution.isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
                <div className="bg-gray-900/90 rounded-lg p-6 flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-semibold">Loading pollution data...</span>
                </div>
              </div>
            )}
            
            {/* Error Display */}
            {pollution.error && (
              <div className="absolute top-4 right-4 bg-red-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30">
                <div className="text-red-200 text-sm">
                  <div className="font-semibold mb-1">Error loading data</div>
                  <div className="text-xs">{pollution.error}</div>
                </div>
              </div>
            )}
            
            {/* Pollution Legend - Inside map, bottom-left */}
            <PollutionLegend 
              visible={!pollution.isLoading && !pollution.error}
              chemicalConfig={pollution.currentChemicalConfig}
            />
          </div>
        </div>

        {/* BOTTOM CONTROL PANEL - Timeline Only */}
        {!pollution.isLoading && !pollution.error && pollution.monthlyData.length > 0 && (
          <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Timeline</h3>
            </div>
            
            <TimelineControls
              currentMonthIndex={timeline.currentMonthIndex}
              totalMonths={timeline.totalMonths}
              isPlaying={timeline.isPlaying}
              availableMonths={timeline.availableMonths}
              goToPrevious={timeline.goToPrevious}
              goToNext={timeline.goToNext}
              goToMonth={timeline.goToMonth}
              togglePlay={timeline.togglePlay}
              canGoPrevious={timeline.canGoPrevious}
              canGoNext={timeline.canGoNext}
              progress={timeline.progress}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

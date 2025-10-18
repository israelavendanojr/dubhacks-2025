import React, { useState, useCallback } from 'react';
import { RiskTerrainMap } from './components/Map/RiskTerrainMap';
import { Cityscape3D } from './components/Map/Cityscape3D';
import { RiskControlPanel } from './components/UI/RiskControlPanel';
import { Legend } from './components/UI/Legend';
import { DemoControls } from './components/UI/DemoControls';
import { TimelineControls } from './components/UI/TimelineControls';
import { PollutionToggle } from './components/UI/PollutionToggle';
import { PollutionLegend } from './components/UI/PollutionLegend';
import { ChemicalSelector } from './components/UI/ChemicalSelector';
import { useRiskWeights } from './hooks/useRiskWeights';
import { useRiskTerrain } from './hooks/useRiskTerrain';
import { useCameraAnimation } from './hooks/useCameraAnimation';
import { usePollutionData } from './hooks/usePollutionData';
import { useTimeline } from './hooks/useTimeline';
import type { ViewState } from './types/terrain.types';

function App() {
  const { weights, updateWeight } = useRiskWeights();
  const { terrainData, isGenerating, generateTerrain } = useRiskTerrain(weights);
  const { isAnimating, flyToHighestRisk, flyThroughTour } = useCameraAnimation();
  const [currentViewState, setCurrentViewState] = useState<ViewState | null>(null);
  
  // Pollution data and timeline
  const pollution = usePollutionData();
  const timeline = useTimeline(pollution.monthlyData);
  const [showPollution, setShowPollution] = useState(true);
  
  // View mode toggle
  const [viewMode, setViewMode] = useState<'risk' | 'cityscape'>('risk');

  const handleWeightsChange = (newWeights: typeof weights) => {
    // Update individual weights
    Object.entries(newWeights).forEach(([key, value]) => {
      updateWeight(key as keyof typeof weights, value * 100);
    });
  };

  const handleViewStateChange = useCallback((viewState: ViewState) => {
    setCurrentViewState(viewState);
  }, []);

  const handleFlyToHighestRisk = useCallback(() => {
    flyToHighestRisk(terrainData, handleViewStateChange);
  }, [flyToHighestRisk, terrainData, handleViewStateChange]);

  const handleFlyThroughTour = useCallback(() => {
    flyThroughTour(handleViewStateChange);
  }, [flyThroughTour, handleViewStateChange]);

  const handleResetView = useCallback(() => {
    const initialViewState: ViewState = {
      longitude: -122.3321,
      latitude: 47.6062,
      zoom: 12,
      pitch: 60,
      bearing: -20
    };
    handleViewStateChange(initialViewState);
  }, [handleViewStateChange]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* View Mode Toggle */}
      <div className="absolute top-4 left-4 z-50 flex bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden">
        <button
          onClick={() => setViewMode('risk')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === 'risk' 
              ? 'bg-cyan-600 text-white' 
              : 'bg-transparent text-gray-300 hover:text-white'
          }`}
        >
          Risk Terrain
        </button>
        <button
          onClick={() => setViewMode('cityscape')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === 'cityscape' 
              ? 'bg-cyan-600 text-white' 
              : 'bg-transparent text-gray-300 hover:text-white'
          }`}
        >
          3D Cityscape
        </button>
      </div>

      {/* Conditional Rendering */}
      {viewMode === 'risk' ? (
        <RiskTerrainMap 
          terrainData={terrainData}
          isGenerating={isGenerating}
          onViewStateChange={handleViewStateChange}
          pollutionData={timeline.currentMonth?.dataPoints || []}
          showPollution={showPollution}
          currentMonth={timeline.currentMonth?.yearMonth}
          chemicalConfig={pollution.currentChemicalConfig}
        />
      ) : (
        <Cityscape3D 
          onViewStateChange={handleViewStateChange}
        />
      )}
      
      {/* Control Panel - Only for Risk Terrain */}
      {viewMode === 'risk' && (
        <>
          <RiskControlPanel
            weights={weights}
            onWeightsChange={handleWeightsChange}
            onGenerate={generateTerrain}
            isGenerating={isGenerating}
          />
          
          {/* Demo Controls */}
          <DemoControls
            onFlyToHighestRisk={handleFlyToHighestRisk}
            onFlyThroughTour={handleFlyThroughTour}
            onResetView={handleResetView}
            isAnimating={isAnimating}
          />
          
          {/* Legend */}
          <Legend />
        </>
      )}
      
      {/* Chemical Selector - Top Right - Only for Risk Terrain */}
      {viewMode === 'risk' && pollution.availableChemicals.length > 1 && (
        <div className="absolute top-4 right-4 z-50 w-80">
          <ChemicalSelector
            chemicals={pollution.availableChemicals}
            selected={pollution.selectedChemical}
            onChange={pollution.setSelectedChemical}
          />
        </div>
      )}

      {/* Pollution Legend - Only for Risk Terrain */}
      {viewMode === 'risk' && (
        <PollutionLegend visible={showPollution && !pollution.isLoading && !pollution.error} />
      )}
      
      {/* Timeline Controls - Only for Risk Terrain */}
      {viewMode === 'risk' && !pollution.isLoading && !pollution.error && pollution.monthlyData.length > 0 && (
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
      )}
      
      {/* Pollution Toggle - Only for Risk Terrain */}
      {viewMode === 'risk' && !pollution.isLoading && !pollution.error && pollution.monthlyData.length > 0 && (
        <PollutionToggle
          showPollution={showPollution}
          onToggle={setShowPollution}
          disabled={pollution.isLoading}
        />
      )}
      
      {/* Data Stats - Top Left - Only for Risk Terrain */}
      {viewMode === 'risk' && pollution.currentChemicalConfig && (
        <div className="absolute top-4 left-4 z-50 bg-gray-900/90 backdrop-blur-md rounded-xl p-4 border border-gray-800">
          <div className="text-white text-sm">
            <div className="font-semibold mb-2">
              {pollution.currentChemicalConfig.name}
            </div>
            <div className="text-gray-400 text-xs">
              {timeline.currentMonth?.dataPoints.length || 0} data points
            </div>
            <div className="text-gray-400 text-xs">
              {timeline.availableMonths.length} months available
            </div>
            <div className="text-gray-400 text-xs">
              Danger threshold: {pollution.currentChemicalConfig.dangerThreshold} {pollution.currentChemicalConfig.unit}
            </div>
          </div>
        </div>
      )}
      
      {/* Pollution Data Loading/Error States - Only for Risk Terrain */}
      {viewMode === 'risk' && pollution.isLoading && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Loading pollution data...</span>
          </div>
        </div>
      )}
      
      {viewMode === 'risk' && pollution.error && (
        <div className="absolute top-4 right-4 bg-red-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl z-30">
          <div className="text-red-200 text-sm">
            <div className="font-semibold mb-1">Error loading pollution data</div>
            <div className="text-xs">{pollution.error}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

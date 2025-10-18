import { useState, useCallback, useRef } from 'react';
import type { ViewState } from '../types/terrain.types';

export function useCameraAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  const flyToHighestRisk = useCallback((terrainData: any[], onViewStateChange: (viewState: ViewState) => void) => {
    if (terrainData.length === 0) return;

    // Find the highest risk point
    const highestRiskPoint = terrainData.reduce((max, point) => 
      point.riskScore > max.riskScore ? point : max
    );

    const targetViewState: ViewState = {
      longitude: highestRiskPoint.lon,
      latitude: highestRiskPoint.lat,
      zoom: 14,
      pitch: 60,
      bearing: -20
    };

    animateToViewState(targetViewState, onViewStateChange);
  }, []);

  const flyThroughTour = useCallback((onViewStateChange: (viewState: ViewState) => void) => {
    const tourPoints: ViewState[] = [
      { longitude: -122.3321, latitude: 47.6062, zoom: 12, pitch: 60, bearing: -20 }, // Seattle
      { longitude: -122.3, latitude: 47.5, zoom: 13, pitch: 45, bearing: 0 }, // South Seattle
      { longitude: -122.2, latitude: 47.6, zoom: 13, pitch: 30, bearing: 45 }, // Eastside
      { longitude: -122.4, latitude: 47.6, zoom: 12, pitch: 60, bearing: -45 }, // West Seattle
      { longitude: -122.3321, latitude: 47.6062, zoom: 12, pitch: 60, bearing: -20 } // Back to Seattle
    ];

    let currentIndex = 0;
    const animateTour = () => {
      if (currentIndex < tourPoints.length) {
        animateToViewState(tourPoints[currentIndex], onViewStateChange, () => {
          currentIndex++;
          setTimeout(animateTour, 2000); // Wait 2 seconds between points
        });
      } else {
        setIsAnimating(false);
      }
    };

    animateTour();
  }, []);

  const animateToViewState = useCallback((
    targetViewState: ViewState, 
    onViewStateChange: (viewState: ViewState) => void,
    onComplete?: () => void
  ) => {
    setIsAnimating(true);
    
    // This would need to be implemented with actual animation
    // For now, just set the view state directly
    onViewStateChange(targetViewState);
    
    setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 1000);
  }, []);

  return {
    isAnimating,
    flyToHighestRisk,
    flyThroughTour
  };
}

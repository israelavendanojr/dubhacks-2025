import React from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { AggregatedDataPoint } from '../../types/pollution.types';
import { getPollutionColor } from '../../utils/colorMapping';
import type { ChemicalConfig } from '../../config/chemicals';

interface PollutionLayerProps {
  data: AggregatedDataPoint[];
  visible: boolean;
  opacity?: number;
  radiusScale?: number;
  chemicalConfig?: ChemicalConfig;
  onHover?: (data: AggregatedDataPoint | null) => void;
  onClick?: (data: AggregatedDataPoint) => void;
}

/**
 * Creates a ScatterplotLayer for displaying pollution data points
 */
export function createPollutionLayer({
  data,
  visible,
  opacity = 0.8,
  radiusScale = 50,
  chemicalConfig,
  onHover,
  onClick
}: PollutionLayerProps): ScatterplotLayer {
  return new ScatterplotLayer({
    id: `${chemicalConfig?.id || 'pollution'}-points`,
    data,
    pickable: true,
    visible,
    opacity,
    stroked: true,
    filled: true,
    radiusScale,
    radiusMinPixels: 3,
    radiusMaxPixels: 80,
    lineWidthMinPixels: 1,
    getPosition: (d: AggregatedDataPoint) => d.coordinates,
    getRadius: (d: AggregatedDataPoint) => Math.max(3, d.normalizedAmount * 1000), // Scale for visibility
    getFillColor: (d: AggregatedDataPoint) => {
      const [r, g, b] = getPollutionColor(d.normalizedAmount, chemicalConfig);
      return [r, g, b, 255];
    },
    getLineColor: [255, 255, 255, 100], // White outline
    onHover: ({ object }) => onHover?.(object as AggregatedDataPoint),
    onClick: ({ object }) => onClick?.(object as AggregatedDataPoint)
  });
}

/**
 * React component wrapper for pollution layer
 */
export function PollutionLayer({ 
  data, 
  visible, 
  opacity, 
  radiusScale, 
  onHover, 
  onClick 
}: PollutionLayerProps) {
  // This component doesn't render anything directly
  // It's used to create the layer configuration
  return null;
}

// Export the layer creation function for use in DeckGL
export { createPollutionLayer as default };

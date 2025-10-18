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
  
  // Generate unique ID that includes data signature
  const layerId = `${chemicalConfig?.id || 'pollution'}-points-${data.length}-${Date.now()}`;
  
  console.log('Creating pollution layer:', {
    id: layerId,
    dataPoints: data.length,
    visible,
    chemical: chemicalConfig?.id
  });

  return new ScatterplotLayer({
    id: layerId, // Use unique ID
    data,
    pickable: true,
    visible,
    opacity,
    stroked: true,
    filled: true,
    radiusScale,
    radiusMinPixels: 5,
    radiusMaxPixels: 100,
    lineWidthMinPixels: 1,
    getPosition: (d: AggregatedDataPoint) => d.coordinates,
    getRadius: (d: AggregatedDataPoint) => Math.max(5, d.normalizedAmount * 1000),
    getFillColor: (d: AggregatedDataPoint) => {
      const [r, g, b] = getPollutionColor(d.normalizedAmount, chemicalConfig);
      return [r, g, b, 255];
    },
    getLineColor: [255, 255, 255, 100],
    onHover: ({ object }) => onHover?.(object as AggregatedDataPoint),
    onClick: ({ object }) => onClick?.(object as AggregatedDataPoint),
    updateTriggers: {
      getPosition: data,
      getRadius: data,
      getFillColor: [data, chemicalConfig?.id]
    }
  });
}

/**
 * React component wrapper for pollution layer
 */
export function PollutionLayer(_props: PollutionLayerProps) {
  // This component doesn't render anything directly
  // It's used to create the layer configuration
  return null;
}

// Export the layer creation function for use in DeckGL
export { createPollutionLayer as default };

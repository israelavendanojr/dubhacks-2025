/**
 * Color mapping for pollution data visualization
 * Uses the same color scheme as the existing risk visualization
 */

export interface PollutionColorScale {
  getColor: (normalizedAmount: number) => [number, number, number, number];
  getLevel: (normalizedAmount: number) => string;
  getDescription: (normalizedAmount: number) => string;
}

/**
 * Get pollution color based on normalized amount (0-1)
 * 0-0.2: Green (clean air)
 * 0.2-0.4: Yellow (moderate)
 * 0.4-0.6: Orange (unhealthy)
 * 0.6-0.8: Red (very unhealthy)
 * 0.8-1.0: Dark red (hazardous)
 */
export function getPollutionColor(normalizedAmount: number): [number, number, number, number] {
  // Clamp value between 0 and 1
  const amount = Math.max(0, Math.min(1, normalizedAmount));
  
  if (amount <= 0.2) {
    // Green (clean air) - interpolate from dark green to light green
    const t = amount / 0.2;
    return [
      Math.round(34 + (76 - 34) * t),   // R: 34 -> 76
      Math.round(139 + (175 - 139) * t), // G: 139 -> 175
      Math.round(34 + (76 - 34) * t),   // B: 34 -> 76
      200 // Alpha
    ];
  } else if (amount <= 0.4) {
    // Yellow (moderate) - interpolate from green to yellow
    const t = (amount - 0.2) / 0.2;
    return [
      Math.round(76 + (255 - 76) * t),   // R: 76 -> 255
      Math.round(175 + (255 - 175) * t), // G: 175 -> 255
      Math.round(76 + (0 - 76) * t),     // B: 76 -> 0
      200 // Alpha
    ];
  } else if (amount <= 0.6) {
    // Orange (unhealthy) - interpolate from yellow to orange
    const t = (amount - 0.4) / 0.2;
    return [
      255, // R: 255
      Math.round(255 + (165 - 255) * t), // G: 255 -> 165
      0,   // B: 0
      200 // Alpha
    ];
  } else if (amount <= 0.8) {
    // Red (very unhealthy) - interpolate from orange to red
    const t = (amount - 0.6) / 0.2;
    return [
      255, // R: 255
      Math.round(165 + (0 - 165) * t),   // G: 165 -> 0
      0,   // B: 0
      200 // Alpha
    ];
  } else {
    // Dark red (hazardous) - interpolate from red to dark red
    const t = (amount - 0.8) / 0.2;
    return [
      Math.round(255 + (139 - 255) * t), // R: 255 -> 139
      0,   // G: 0
      0,   // B: 0
      200 // Alpha
    ];
  }
}

/**
 * Get pollution level description
 */
export function getPollutionLevel(normalizedAmount: number): string {
  const amount = Math.max(0, Math.min(1, normalizedAmount));
  
  if (amount <= 0.2) return 'Good';
  if (amount <= 0.4) return 'Moderate';
  if (amount <= 0.6) return 'Unhealthy';
  if (amount <= 0.8) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Get detailed pollution description
 */
export function getPollutionDescription(normalizedAmount: number): string {
  const amount = Math.max(0, Math.min(1, normalizedAmount));
  
  if (amount <= 0.2) return 'Air quality is good. No health impacts expected.';
  if (amount <= 0.4) return 'Air quality is acceptable. Sensitive individuals may experience minor breathing difficulties.';
  if (amount <= 0.6) return 'Air quality is unhealthy for sensitive groups. General public may experience breathing difficulties.';
  if (amount <= 0.8) return 'Air quality is very unhealthy. Everyone may experience health effects.';
  return 'Air quality is hazardous. Emergency conditions. Everyone should avoid outdoor activities.';
}

/**
 * Get pollution level color for UI elements
 */
export function getPollutionLevelColor(normalizedAmount: number): string {
  const amount = Math.max(0, Math.min(1, normalizedAmount));
  
  if (amount <= 0.2) return 'text-green-400';
  if (amount <= 0.4) return 'text-yellow-400';
  if (amount <= 0.6) return 'text-orange-400';
  if (amount <= 0.8) return 'text-red-400';
  return 'text-red-600';
}

/**
 * Create a pollution color scale object
 */
export function createPollutionColorScale(): PollutionColorScale {
  return {
    getColor: getPollutionColor,
    getLevel: getPollutionLevel,
    getDescription: getPollutionDescription
  };
}

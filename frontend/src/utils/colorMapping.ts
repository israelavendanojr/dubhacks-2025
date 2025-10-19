/**
 * Color mapping system for risk visualization
 * Matches the dramatic color scheme from the reference image
 */

export function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number, number] {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return [r, g, b, 255];
}

export function getRiskColor(riskScore: number): [number, number, number, number] {
  // riskScore is 0-1, convert to 0-100
  const score = riskScore * 100;
  
  // Deep green valleys (0-15%)
  if (score < 15) {
    return interpolateColor([34, 197, 94], [134, 239, 172], score / 15);
  }
  
  // Light green to yellow (15-35%)
  if (score < 35) {
    return interpolateColor([134, 239, 172], [234, 179, 8], (score - 15) / 20);
  }
  
  // Yellow to orange (35-50%)
  if (score < 50) {
    return interpolateColor([234, 179, 8], [249, 115, 22], (score - 35) / 15);
  }
  
  // Orange to red-orange (50-65%)
  if (score < 65) {
    return interpolateColor([249, 115, 22], [239, 68, 68], (score - 50) / 15);
  }
  
  // Red-orange to deep red (65-85%)
  if (score < 85) {
    return interpolateColor([239, 68, 68], [185, 28, 28], (score - 65) / 20);
  }
  
  // Deep red peaks (85-100%)
  return [185, 28, 28, 255];
}

export function getRiskColorHex(riskScore: number): string {
  const [r, g, b] = getRiskColor(riskScore);
  return `rgb(${r}, ${g}, ${b})`;
}

export function getRiskLevel(riskScore: number): string {
  const score = riskScore * 100;
  
  if (score < 15) return 'Very Low';
  if (score < 35) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 65) return 'High';
  if (score < 85) return 'Very High';
  return 'Extreme';
}


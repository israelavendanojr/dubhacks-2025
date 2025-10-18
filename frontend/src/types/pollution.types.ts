export interface PollutionReading {
  year: number;
  month: number;
  latitude: number;
  longitude: number;
  amount: number;
}

export interface AggregatedDataPoint {
  coordinates: [number, number];
  averageAmount: number;
  readingCount: number;
  normalizedAmount: number; // 0-1 scale
}

export interface AggregatedMonthlyData {
  yearMonth: string; // "2024-01"
  year: number;
  month: number;
  dataPoints: AggregatedDataPoint[];
  totalReadings: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
}

export interface TimelineState {
  currentMonthIndex: number;
  totalMonths: number;
  isPlaying: boolean;
  availableMonths: string[];
  currentMonth: AggregatedMonthlyData | null;
}

export interface TimelineControls {
  goToPrevious: () => void;
  goToNext: () => void;
  goToMonth: (monthIndex: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
}

export interface ChemicalData {
  chemical: 'CO' | 'NO2' | 'PM2.5' | 'O3';
  data: AggregatedMonthlyData[];
}

export interface PollutionLayerProps {
  data: AggregatedDataPoint[];
  visible: boolean;
  opacity?: number;
  radiusScale?: number;
  onHover?: (data: AggregatedDataPoint | null) => void;
  onClick?: (data: AggregatedDataPoint) => void;
}

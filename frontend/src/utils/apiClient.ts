// Type definitions matching the backend response
export interface CountyDataPoint {
  name: string;
  lat: number;
  lon: number;
  seat: string;
  density: number;
  ground_truth_value: number;
  scenario_factor: number;
  predicted_value: number;
  normalized: number;
}

export interface SimulationResponse {
  success: boolean;
  data: {
    metric: string;
    unit: string;
    scenario_description: string;
    dataPoints: CountyDataPoint[];
    baseline: {
      min: number;
      max: number;
      average: number;
    };
  };
  director_prompt: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Function to call the backend
export async function generateSimulation(prompt: string): Promise<SimulationResponse> {
  console.log('=== API REQUEST ===');
  console.log('Prompt:', prompt);
  console.log('Timestamp:', new Date().toISOString());

  try {
    const response = await fetch('http://localhost:8000/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt
      }),
      // 120 second timeout for LLM processing
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If we can't parse the error, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data: SimulationResponse = await response.json();
    
    console.log('=== API RESPONSE ===');
    console.log('Full Response:', data);
    console.log('Metric:', data.data.metric);
    console.log('Data Points:', data.data.dataPoints.length);
    console.log('Baseline:', data.data.baseline);
    console.log('Director Spec:', JSON.parse(data.director_prompt));
    
    return data;
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Request timed out. The LLM is still processing...');
      } else if (error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend. Is the server running on port 8000?');
      } else {
        throw error;
      }
    }
    
    throw new Error('An unexpected error occurred while processing your request.');
  }
}

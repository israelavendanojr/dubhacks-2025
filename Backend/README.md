# Environmental Data Simulation API

A FastAPI backend that implements a two-stage LLM data generation pipeline for creating geo-spatial environmental datasets.

## Features

- **Two-Stage LLM Pipeline**: Director converts user prompts to technical specifications, Engineer generates data
- **Geo-Spatial Data**: Uses mandatory latitude/longitude coordinates from `unique_lat_lon.csv`
- **Data Normalization**: Automatically normalizes pollution values for 3D rendering
- **FastAPI Integration**: RESTful API with automatic documentation

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

Create a `.env` file in the backend directory:

```bash
# Google Gemini API Key
# Get your API key from: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=your_actual_api_key_here
```

### 3. Run the Application

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Usage

### POST /api/simulate

Generate simulated environmental data based on a scenario prompt.

**Request Body:**
```json
{
  "prompt": "Simulate air quality in Seattle during a heat wave in July 2024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "NO2",
    "unit": "ppb",
    "dataPoints": [
      {
        "lat": 47.597222,
        "lon": -122.319722,
        "value": 45.2,
        "normalized": 0.73
      }
    ],
    "baseline": {
      "min": 12.1,
      "max": 67.8,
      "average": 34.5
    }
  },
  "director_prompt": "Scenario Specification: ..."
}
```

## Architecture

### DirectorofDataEngineering
- Converts user prompts into structured technical specifications
- Uses Gemini 2.5 Pro to define target year/month, base statistics, and scaling rules
- Maintains the existing `directions()` method exactly as specified

### GeminiDataEngineer
- Generates geo-spatial data using the minimal JSON schema
- Performs post-processing normalization for 3D rendering
- Adds baseline statistics (min, max, average) to the response

## Data Processing

The system automatically:
1. Loads mandatory coordinates from `unique_lat_lon.csv`
2. Generates pollution values for each location
3. Normalizes values to 0-1 range for visualization
4. Calculates baseline statistics

## Error Handling

The API includes comprehensive error handling for:
- Google Gemini API errors
- Data processing errors
- Invalid requests

All errors return appropriate HTTP status codes with descriptive messages.

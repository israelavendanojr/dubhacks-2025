from google import genai
from google.genai import types
import pandas as pd
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from typing import List, Literal, Dict

# Ensure environment variables are loaded for the client initialization
load_dotenv()

# Define valid metric-unit combinations
METRIC_UNIT_MAPPING: Dict[str, str] = {
    "NO2": "ppb",
    "PM2.5": "μg/m³",
    "GWP": "kg CO2e/m²",
    "AQI": "NA"
}

# Map metric to CSV column name
METRIC_TO_CSV_COLUMN: Dict[str, str] = {
    "NO2": "NO2 Avg. (ppb)",
    "PM2.5": "PM2.5 Avg. (µg/m³)",
    "GWP": "GWP (CO2e per capita, MT/yr)",
    "AQI": "Annual Avg. AQI (0-500)"
}

class CountyDataPoint(BaseModel):
    """Schema for individual county data point output."""
    name: str = Field(description="County name")
    lat: float = Field(description="Latitude")
    lon: float = Field(description="Longitude")
    seat: str = Field(description="County seat")
    density: int = Field(description="Population density")
    ground_truth_value: float = Field(ge=0, description="Real baseline value from CSV for this county")
    scenario_factor: float = Field(description="Scenario modification factor for this county (e.g., 0.6 for 40% reduction)")
    predicted_value: float = Field(ge=0, description="Generated value: ground_truth_value * scenario_factor ± std_dev")
    normalized: float = Field(ge=0, le=1, description="Normalized value 0-1 for visualization")

class ScenarioSpecification(BaseModel):
    """Pydantic model for the Director's structured output."""
    
    target_metric: Literal[
        "NO2", "PM2.5", "GWP", "AQI"
    ] = Field(
        description="The environmental metric to simulate"
    )
    
    unit: Literal[
        "ppb", "μg/m³", "kg CO2e/m²", "NA"
    ] = Field(
        description="The appropriate unit for the metric"
    )
    
    target_timeframe: str = Field(
        description="The target year or timeframe for the simulation (e.g., '2025', 'next year')"
    )
    
    standard_deviation: float = Field(
        ge=0,
        description="Standard deviation for random variation in generated values"
    )
    
    scenario_description: str = Field(
        min_length=10,
        max_length=500,
        description="A brief description of the scenario being simulated"
    )
    
    # Scenario factor guidance for Engineer
    urban_scenario_factor: float = Field(
        description="Factor for high density areas (>500/sq mi) - e.g., 0.6 for 40% reduction"
    )
    suburban_scenario_factor: float = Field(
        description="Factor for medium density areas (100-500/sq mi) - e.g., 0.8 for 20% reduction"
    )
    rural_scenario_factor: float = Field(
        description="Factor for low density areas (<100/sq mi) - e.g., 0.95 for 5% reduction"
    )
    


class DirectorofDataEngineering:
    """
    Converts a natural language user prompt into a structured, technical 
    specification for the data generation engineer.
    """
    
    def __init__(self, unique_latitude_longitude_file):
        self.latitude_longitude_file = unique_latitude_longitude_file
        self.client = genai.Client()
        
    def directions(self, user_prompt):
        """Convert user prompt into structured scenario specification using Pydantic model."""
        
        system_instruction_text = (
            "You are a Data Simulation Director specializing in environmental data engineering. "
            "Your primary and sole task is to take a client's request (User Prompt) and convert it into "
            "a highly structured, technical specification suitable for immediate execution by a "
            "synthetic data generation system (the Data Engineer). "
            
            "You must analyze the user prompt and extract the following information:"
            "\n1. Target Metric: Choose from: NO2, PM2.5, GWP, AQI"
            "\n2. Unit: Use the standard unit for each metric:"
            "\n   - NO2: ppb"
            "\n   - PM2.5: μg/m³"
            "\n   - GWP: kg CO2e/m²"
            "\n   - AQI: NA"
            "\n3. Timeframe: Target year (assume next year if not specified)"
            "\n4. Standard Deviation: Variation amount for randomness (typically 1-5)"
            "\n5. Scenario Factors: Modification multipliers for different area types:"
            "\n   - urban_scenario_factor: For high density areas (>500/sq mi)"
            "\n   - suburban_scenario_factor: For medium density areas (100-500/sq mi)"
            "\n   - rural_scenario_factor: For low density areas (<100/sq mi)"
            "\n   Example: 'Remove all cars' -> urban=0.5 (50% reduction), suburban=0.7 (30% reduction), rural=0.9 (10% reduction)"
            "\n6. Description: Brief summary of the scenario (10-500 characters)"
            
            "Return ONLY a valid JSON object with these exact fields:"
            "\n- target_metric: string (from the list above)"
            "\n- unit: string (compatible with the metric)"
            "\n- target_timeframe: string"
            "\n- standard_deviation: number (≥ 0)"
            "\n- urban_scenario_factor: number"
            "\n- suburban_scenario_factor: number"
            "\n- rural_scenario_factor: number"
            "\n- scenario_description: string (10-500 characters)"
        )
        
        # Create JSON schema from Pydantic model
        json_schema = ScenarioSpecification.model_json_schema()
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction_text,
            response_mime_type="application/json"
        )
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[user_prompt],
            config=config
        )
        
        # Parse and validate the response using Pydantic
        try:
            specification_data = json.loads(response.text)
            validated_spec = ScenarioSpecification(**specification_data)
            return validated_spec.model_dump_json(indent=2)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback to raw text if parsing fails
            return response.text
    
    def pass_dummy_csv(self):
        """Return the path to the latitude/longitude CSV file."""
        return self.latitude_longitude_file

class GeminiDataEngineer:
    """
    Generates simulated environmental data based on technical specifications.
    """
    
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-2.5-flash-lite"
        
    def simulate(self, director_prompt, dummy_file):
        """
        Generate simulated environmental data based on director specifications.
        
        Args:
            director_prompt: Technical specification from the director
            dummy_file: Path to CSV file with location data
            
        Returns:
            Dict containing simulated data with CountyDataPoint objects
        """
        import random
        
        print(f"Generating simulated data for director prompt: {director_prompt}")
        
        # Parse the director's specification
        try:
            director_spec = json.loads(director_prompt)
            target_metric = director_spec.get('target_metric', 'NO2')
            unit = director_spec.get('unit', 'ppb')
            std_dev = director_spec.get('standard_deviation', 2.0)
            urban_factor = director_spec.get('urban_scenario_factor', 1.0)
            suburban_factor = director_spec.get('suburban_scenario_factor', 1.0)
            rural_factor = director_spec.get('rural_scenario_factor', 1.0)
            scenario_description = director_spec.get('scenario_description', 'Default scenario')
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing director specification: {e}")
            # Fallback to defaults
            target_metric = 'NO2'
            unit = 'ppb'
            std_dev = 2.0
            urban_factor = 1.0
            suburban_factor = 1.0
            rural_factor = 1.0
            scenario_description = 'Default scenario'
        
        # Load the CSV data
        df_input = pd.read_csv(dummy_file)
        
        # Get the CSV column for the target metric
        csv_column = METRIC_TO_CSV_COLUMN.get(target_metric, 'NO2 Avg. (ppb)')
        
        # Generate CountyDataPoint objects for each county
        data_points = []
        predicted_values = []
        
        for _, row in df_input.iterrows():
            # Extract county data
            name = row['County Name']
            lat = float(row['Latitude'])
            lon = float(row['Longitude'])
            seat = row['County Seat']
            density = int(row['Pop. Density'])
            ground_truth_value = float(row[csv_column])
            
            # Determine scenario factor based on population density
            if density > 500:
                scenario_factor = urban_factor
            elif density > 100:
                scenario_factor = suburban_factor
            else:
                scenario_factor = rural_factor
            
            # Calculate predicted value: ground_truth * scenario_factor ± random(std_dev)
            base_predicted = ground_truth_value * scenario_factor
            random_variation = random.gauss(0, std_dev)
            predicted_value = max(0, base_predicted + random_variation)  # Ensure non-negative
            
            predicted_values.append(predicted_value)
            
            # Create CountyDataPoint object
            data_point = CountyDataPoint(
                name=name,
                lat=lat,
                lon=lon,
                seat=seat,
                density=density,
                ground_truth_value=ground_truth_value,
                scenario_factor=scenario_factor,
                predicted_value=predicted_value,
                normalized=0.0  # Will be calculated below
            )
            data_points.append(data_point)
        
        # Calculate normalization
        if predicted_values:
            min_val = min(predicted_values)
            max_val = max(predicted_values)
            range_val = max_val - min_val
            
            # Update normalized values
            for i, data_point in enumerate(data_points):
                if range_val == 0:
                    data_point.normalized = 0.5
                else:
                    data_point.normalized = (predicted_values[i] - min_val) / range_val
        
        # Create response with CountyDataPoint objects
        simulated_data = {
            "metric": target_metric,
            "unit": unit,
            "scenario_description": scenario_description,
            "dataPoints": [point.model_dump() for point in data_points],
            "baseline": {
                "min": min(predicted_values) if predicted_values else 0,
                "max": max(predicted_values) if predicted_values else 0,
                "average": sum(predicted_values) / len(predicted_values) if predicted_values else 0
            }
        }
        
        return simulated_data
